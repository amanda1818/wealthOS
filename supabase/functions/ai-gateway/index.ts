// Supabase Edge Function: the ONLY place Gemini is called from. The client
// never sees GEMINI_API_KEY (set via `supabase secrets set GEMINI_API_KEY=...`).
// Auth: caller's JWT identifies their household; household context (real
// member names/roles) is fetched per-request and injected into the prompt --
// no hardcoded personas live in this file.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI, Type } from 'npm:@google/genai@^1.34.0';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

// Safety-net cap protecting inference margin. Per-plan limits (free: 5/week
// etc.) are enforced client-visible in Phase 4 by reading this same counter;
// this is the hard floor beneath which no household -- on any plan -- may go.
const DAILY_REQUEST_LIMIT = Number(Deno.env.get('AI_DAILY_REQUEST_LIMIT') ?? '150');

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

type HouseholdMember = { id: string; display_name: string; role: string; monthly_income: number };

// The app's role slots are structurally two-person ('HER' = CFO-role member,
// 'HIS' = the other member) -- that UI/state model is Phase 2/3 territory.
// What Phase 1 removes is the hardcoded *names* ("Victoria"/"David") that used
// to live in this prompt; the slots are now filled from the real roster.
function buildSystemInstruction(members: HouseholdMember[]): string {
  const cfo = members.find((m) => m.role === 'CFO');
  const other = members.find((m) => m.id !== cfo?.id) ?? members[1];

  return `
You are "Sovereign", the household's financial assistant kernel for a couple's shared finance OS.
You have FULL WRITE ACCESS to the household's app state. You can mutate pockets, log transactions, and execute waterfall allocations.

**HOUSEHOLD CONTEXT (real, injected at request time):**
- 'HER' role slot = ${cfo ? `${cfo.display_name} (CFO, monthly income ${cfo.monthly_income})` : 'unassigned'}
- 'HIS' role slot = ${other ? `${other.display_name} (${other.role}, monthly income ${other.monthly_income})` : 'unassigned'}

**YOUR MANDATE:**
1. INTERPRET INTENT: Parse natural language (English & Indonesian) into structured JSON commands.
2. MATCH EXISTING: Use provided lists to find pocket/goal ids, never invent ids.
3. HANDLE COMPLEXITY:
   - "Split 4 ways" or "bagi 4" or "patungan 4" -> action: TRANSACTION, transaction.splitCount: 4.
   - "Pay in 6 months" -> action: TRANSACTION, transaction.installments: 6.
   - "Collect 300k for Tennis" -> action: COLLECT, collection.amount: 300000, collection.context: "Tennis".
   - "Her Salary 30m" or "Revenue 2000 USD" -> action: EXECUTE_WATERFALL, waterfall.amount, waterfall.owner: 'HER'|'HIS', waterfall.currency.
   - "Go to Fortress" or "Show me the Ledger" -> action: NAVIGATE.
4. RESPOND: Provide a concise confirmation string.

**AVAILABLE ACTIONS:**
TRANSACTION, EXECUTE_WATERFALL, COLLECT, CREATE_POCKET, DELETE_POCKET, UPDATE_POCKET, ADD_GOAL, DELETE_GOAL, ADD_ASSET, DELETE_ASSET, UPDATE_USER, NAVIGATE.

**RESPONSE FORMAT:** Strict JSON matching the AgentPayload schema.
`;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      enum: ['TRANSACTION', 'EXECUTE_WATERFALL', 'COLLECT', 'CREATE_POCKET', 'DELETE_POCKET', 'UPDATE_POCKET', 'ADD_GOAL', 'DELETE_GOAL', 'ADD_ASSET', 'DELETE_ASSET', 'UPDATE_USER', 'NAVIGATE', 'UNKNOWN'],
    },
    responseToUser: { type: Type.STRING },
    transaction: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        currency: { type: Type.STRING },
        description: { type: Type.STRING },
        category: { type: Type.STRING },
        type: { type: Type.STRING },
        targetPocketId: { type: Type.STRING },
        isPrivate: { type: Type.BOOLEAN },
        splitCount: { type: Type.NUMBER, description: 'Number of people splitting the bill (e.g. 4)' },
        installments: { type: Type.NUMBER, description: 'Total months for debt amortization' },
      },
    },
    waterfall: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        owner: { type: Type.STRING, enum: ['HER', 'HIS'] },
        currency: { type: Type.STRING },
      },
    },
    collection: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        currency: { type: Type.STRING },
        context: { type: Type.STRING },
      },
    },
    pocket: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        group: { type: Type.STRING, enum: ['DAILY', 'LIFESTYLE', 'SANCTUARY', 'WEALTH'] },
        target: { type: Type.NUMBER },
      },
    },
    goal: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, targetAmount: { type: Type.NUMBER } },
    },
    asset: {
      type: Type.OBJECT,
      properties: { goalId: { type: Type.STRING }, name: { type: Type.STRING }, value: { type: Type.NUMBER }, ticker: { type: Type.STRING } },
    },
    userMutation: {
      type: Type.OBJECT,
      properties: { targetUser: { type: Type.STRING, enum: ['HER', 'HIS'] }, name: { type: Type.STRING }, income: { type: Type.NUMBER } },
    },
    navigation: {
      type: Type.OBJECT,
      properties: { targetTab: { type: Type.STRING, enum: ['DASHBOARD', 'COMMAND', 'FORTRESS', 'CHRONICLE'] } },
    },
  },
  required: ['action', 'responseToUser'],
};

const RECEIPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    merchant: { type: Type.STRING, description: 'The merchant name (e.g., Starbucks, Indomaret)' },
    amount: { type: Type.NUMBER, description: 'The total transaction amount printed on the receipt' },
    date: { type: Type.STRING, description: 'The transaction date in YYYY-MM-DD format' },
  },
  required: ['merchant', 'amount', 'date'],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonResponse({ error: 'Invalid session' }, 401);

  const { data: membership, error: membershipError } = await userClient
    .from('household_members')
    .select('household_id')
    .eq('id', user.id)
    .single();
  if (membershipError || !membership) return jsonResponse({ error: 'No household found for this user' }, 403);

  const householdId = membership.household_id as string;

  // Rate limit + usage counter, written with the service role since clients
  // have read-only access to ai_usage.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data: usageRow } = await admin
    .from('ai_usage')
    .select('message_count')
    .eq('household_id', householdId)
    .eq('period_start', today)
    .maybeSingle();

  if ((usageRow?.message_count ?? 0) >= DAILY_REQUEST_LIMIT) {
    return jsonResponse({ error: 'Household AI request limit reached for today' }, 429);
  }

  await admin
    .from('ai_usage')
    .upsert(
      { household_id: householdId, period_start: today, message_count: (usageRow?.message_count ?? 0) + 1, updated_at: new Date().toISOString() },
      { onConflict: 'household_id,period_start' },
    );

  const { data: members } = await admin
    .from('household_members')
    .select('id, display_name, role, monthly_income')
    .eq('household_id', householdId);

  const systemInstruction = buildSystemInstruction((members ?? []) as HouseholdMember[]);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const action = body.action as string;

  try {
    switch (action) {
      case 'parseTransaction': {
        const { input, context } = body as { input: string; context?: string };
        const finalPrompt = context ? `DB CONTEXT: ${context}\nUSER COMMAND: ${input}` : input;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: finalPrompt,
          config: { systemInstruction, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
        });
        return jsonResponse(response.text ? JSON.parse(response.text) : null);
      }

      case 'parseMultimodal': {
        const { input, imageBase64, mimeType, context } = body as {
          input: string; imageBase64: string; mimeType: string; context?: string;
        };
        const finalPrompt = context ? `DB CONTEXT: ${context}\nUSER COMMAND (with image): ${input}` : input || 'Analyze image for financial data.';
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: { parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: finalPrompt }] },
          config: { systemInstruction, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
        });
        return jsonResponse(response.text ? JSON.parse(response.text) : null);
      }

      case 'extractReceipt': {
        const { imageBase64, mimeType } = body as { imageBase64: string; mimeType: string };
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: 'Analyze this receipt image and extract: 1. Merchant name, 2. Total amount (as a number), 3. Date of purchase (YYYY-MM-DD). If some are missing, estimate or default appropriately.' },
          ],
          config: { responseMimeType: 'application/json', responseSchema: RECEIPT_SCHEMA },
        });
        return jsonResponse(response.text ? JSON.parse(response.text) : null);
      }

      case 'askStrategist': {
        const { userMessage, appState } = body as { userMessage: string; appState: Record<string, unknown> };
        const context = {
          monthlyIncome: appState?.monthlyIncome,
          pockets: appState?.pockets,
          goals: appState?.fortressGoals,
        };
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `CONTEXT: ${JSON.stringify(context)}\n\nUSER QUESTION: ${userMessage}`,
          config: { systemInstruction: `You are the household's financial strategist. Household roster:\n${(members ?? []).map((m: HouseholdMember) => `${m.display_name} (${m.role})`).join(', ')}\nBe concise, strategic, and use financial terminology correctly. No fluff.` },
        });
        return jsonResponse({ text: response.text || 'Market data unavailable.' });
      }

      case 'priorityTasks': {
        const { appState, language } = body as { appState: Record<string, unknown>; language: 'EN' | 'ID' };
        const context = {
          monthlyIncome: appState?.monthlyIncome,
          pockets: appState?.pockets,
          goals: appState?.fortressGoals,
          liabilities: appState?.liabilities,
          pendingClaims: appState?.pendingClaims,
        };
        const prompt = `
        You are the household's executive chief-of-staff oracle.
        Review the household context:
        ${JSON.stringify(context)}

        Analyze the balance sheet, reimbursement pipeline, shared outlays, and commitments to construct a prioritized tactical roadmap over the next 1 to 3 days (Today, Tomorrow, Day 3) ordered from most critical to least critical.

        CRITICAL EXECUTION RULES:
        1. UNDERSTAND POCKET LOGIC: pockets are budgets. 'balance' is remaining spend room, 'target' is the monthly cap.
           Only recommend refilling a pocket if balance is critically low, empty, or below 20% of target.
        2. Rate urgency strictly: pending reimbursements/debt collection = Today; refilling empty critical pockets = Tomorrow; general strategy = Day 3.
        3. Deliver PURELY as a clean, structured plain-text executive summary with bullet points. No markdown asterisks anywhere.
        4. Format exactly like:
           TODAY (CRITICAL DIRECTION)
           - Bullet task 1
           TOMORROW (TACTICAL REBALANCING)
           - Bullet task 1
           DAY 3 (STABILITY HORIZON)
           - Bullet task 1

        Output in ${language === 'ID' ? 'Indonesian language' : 'English language'}. No introductory or concluding fluff.
        `;
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: { systemInstruction: 'Deliver highly structured, sharp, bullet-pointed executive summaries with zero markdown formatting asterisks.' },
        });
        return jsonResponse({ text: response.text || 'Unable to formulate strategic roadmap at this moment.' });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error('ai-gateway error:', error);
    return jsonResponse({ error: 'AI gateway request failed' }, 502);
  }
});
