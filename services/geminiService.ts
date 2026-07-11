
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GemniParseResult, PocketType, AppState, PocketGroup } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "Sovereign", the Universal Agent Kernel for a Family Office OS.
You have FULL WRITE ACCESS to the App State. You can mutate users, architect pockets, and log complex financial logic.

**CONTEXT:**
The user is a High Net Worth Individual.
- Pockets: 'Buckets' of money (e.g., 'Groceries', 'Ski Trip').
- Goals: 'Fortress Pillars' (e.g., 'Retirement', 'Villa Bali').
- Users: 'HER' (CFO/Victoria) and 'HIS' (David).

**YOUR MANDATE:**
1. **INTERPRET INTENT:** Parse natural language (English & Indonesian) into structured JSON commands.
2. **MATCH EXISTING:** Use provided lists to find IDs.
3. **HANDLE COMPLEXITY:**
   - "Split 4 ways" or "bagi 4" or "patungan 4" -> action: TRANSACTION, transaction.splitCount: 4.
   - "Pay in 6 months" -> action: TRANSACTION, transaction.installments: 6.
   - "Collect 300k for Tennis" -> action: COLLECT, collection.amount: 300000, collection.context: "Tennis".
   - "Her Salary 30m" or "Revenue 2000 USD" -> action: EXECUTE_WATERFALL, waterfall.amount: 30000000, waterfall.owner: 'HER', waterfall.currency: 'IDR' (or 'USD').
   - "Go to Fortress" or "Show me the Ledger" -> action: NAVIGATE, navigation.targetTab: 'FORTRESS' (or 'CHRONICLE').
4. **RESPOND:** Provide a concise confirmation string.

**AVAILABLE ACTIONS:**
- TRANSACTION: Expense, Income, Investment.
- EXECUTE_WATERFALL: Distribute income according to Pact Rules (Income/Salary only).
- COLLECT: Recover funds from a pending claim.
- CREATE_POCKET / DELETE_POCKET / UPDATE_POCKET: Architect the system.
- ADD_GOAL / DELETE_GOAL: Architect the Fortress.
- ADD_ASSET: Add stock/property to a Goal.
- UPDATE_USER: Change name or income for 'HER' or 'HIS'.
- NAVIGATE: Switch views (Cockpit/Dashboard, Flow/Command, Fortress, Ledger/Statements).

**RESPONSE FORMAT:**
Strict JSON matching the AgentPayload schema.
`;

const RESPONSE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, enum: ["TRANSACTION", "EXECUTE_WATERFALL", "COLLECT", "CREATE_POCKET", "DELETE_POCKET", "UPDATE_POCKET", "ADD_GOAL", "DELETE_GOAL", "ADD_ASSET", "DELETE_ASSET", "UPDATE_USER", "NAVIGATE", "UNKNOWN"] },
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
                splitCount: { type: Type.NUMBER, description: "Number of people splitting the bill (e.g. 4)" },
                installments: { type: Type.NUMBER, description: "Total months for debt amortization" }
            }
        },
        waterfall: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER },
                owner: { type: Type.STRING, enum: ["HER", "HIS"] },
                currency: { type: Type.STRING, description: "Currency of the income (e.g., USD, IDR)" }
            }
        },
        collection: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                context: { type: Type.STRING, description: "The name of the item/person to collect from (e.g. 'Tennis')" }
            }
        },
        pocket: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                group: { type: Type.STRING, enum: ["DAILY", "LIFESTYLE", "SANCTUARY", "WEALTH"] },
                target: { type: Type.NUMBER }
            }
        },
        goal: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                targetAmount: { type: Type.NUMBER }
            }
        },
        asset: {
            type: Type.OBJECT,
            properties: {
                goalId: { type: Type.STRING },
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                ticker: { type: Type.STRING }
            }
        },
        userMutation: {
            type: Type.OBJECT,
            properties: {
                targetUser: { type: Type.STRING, enum: ["HER", "HIS"] },
                name: { type: Type.STRING },
                income: { type: Type.NUMBER }
            }
        },
        navigation: {
            type: Type.OBJECT,
            properties: {
                targetTab: { type: Type.STRING, enum: ["DASHBOARD", "COMMAND", "FORTRESS", "CHRONICLE"] }
            }
        }
    },
    required: ["action", "responseToUser"]
};

export const parseTransactionInput = async (input: string, context?: string): Promise<GemniParseResult | null> => {
  try {
    const finalPrompt = context ? `DB CONTEXT: ${context}\nUSER COMMAND: ${input}` : input;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: finalPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as GemniParseResult;
  } catch (error) {
    console.error("Gemini parse error:", error);
    return null;
  }
};

export const parseMultimodalInput = async (input: string, imageBase64: string, mimeType: string, context?: string): Promise<GemniParseResult | null> => {
    try {
        const finalPrompt = context ? `DB CONTEXT: ${context}\nUSER COMMAND (with image): ${input}` : input || "Analyze image for financial data.";
        
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: imageBase64 } },
                    { text: finalPrompt }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as GemniParseResult;
    } catch (error) {
        console.error("Gemini multimodal parse error:", error);
        return null;
    }
};

export const askAlphaStrategist = async (userMessage: string, appState: AppState): Promise<string> => {
    try {
        const context = {
            monthlyIncome: appState.monthlyIncome,
            pockets: Object.values(appState.pockets).map(p => ({ name: p.name, balance: p.balance, target: p.target })),
            goals: appState.fortressGoals.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
        };

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `CONTEXT: ${JSON.stringify(context)}\n\nUSER QUESTION: ${userMessage}`,
            config: {
                systemInstruction: "You are the Alpha Strategist for a Family Office. Be concise, strategic, and use financial terminology correctly. No fluff.",
            }
        });

        return response.text || "Market data unavailable.";
    } catch (error) {
        return "Alpha Strategist is offline.";
    }
};

export interface ReceiptExtraction {
    merchant: string;
    amount: number;
    date: string;
}

export const extractReceiptData = async (imageBase64: string, mimeType: string): Promise<ReceiptExtraction | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
                { inlineData: { mimeType, data: imageBase64 } },
                { text: "Analyze this receipt image and extract: 1. Merchant name, 2. Total amount (as a number), 3. Date of purchase (YYYY-MM-DD). If some are missing, estimate or default appropriately." }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        merchant: { type: Type.STRING, description: "The merchant name (e.g., Starbucks, Indomaret)" },
                        amount: { type: Type.NUMBER, description: "The total transaction amount printed on the receipt" },
                        date: { type: Type.STRING, description: "The transaction date in YYYY-MM-DD format" }
                    },
                    required: ["merchant", "amount", "date"]
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as ReceiptExtraction;
    } catch (error) {
        console.error("Receipt extraction error:", error);
        return null;
    }
};

export const getMagicPriorityTasks = async (appState: AppState, language: 'EN' | 'ID'): Promise<string> => {
    try {
        const context = {
            monthlyIncome: appState.monthlyIncome,
            pockets: Object.values(appState.pockets).map(p => ({ id: p.id, name: p.name, balance: p.balance, target: p.target, group: p.group })),
            goals: appState.fortressGoals.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
            liabilities: appState.liabilities.map(l => ({ name: l.name, monthlyPayment: l.monthlyPayment, monthsRemaining: l.monthsRemaining })),
            pendingClaims: appState.transactions.filter(t => t.status === "PARTNER_RECEIVABLE" || t.status === "PENDING_REIMBURSEMENT").map(t => ({ description: t.description, amount: t.receivableAmount || t.netAmount, status: t.status, date: t.date }))
        };

        const prompt = `
        You are the "Sovereign Executive Oracle", a sharp, high-powered family office chief of staff.
        Review our entire app state context:
        ${JSON.stringify(context)}

        Analyze our entire balance sheet, corporate/client reimbursement pipeline, shared partner outlays, and commitments to construct a prioritized tactical roadmap over the next 1 to 3 days (Today, Tomorrow, Day 3) ordered from most critical to least critical.

        CRITICAL EXECUTION RULES:
        1. UNDERSTAND POCKET LOGIC: Pockets are BUDGETS. 
           - 'balance' is the remaining money available to spend in the budget.
           - 'target' is the maximum monthly allocated budget limit.
           - If the balance is close to the target (e.g., 6.7M out of 7M), the pocket is HEALTHY and has plenty of funds remaining. DO NOT ask to refill it!
           - Only recommend refilling a pocket (via 'Bagi Aliran' / Waterfall) if the balance is critically low, empty, or below 20% of its target budget.
        2. Rate urgency strictly: Pending client reimbursements and partner outstanding debt collection are high priority (Today); refilling empty critical pockets is medium priority (Tomorrow); addressing monthly passive gap/general strategy is normal priority (Day 3).
        3. Deliver the response formatted PURELY as a clean, highly structured plain-text executive summary with bullet points.
        4. DO NOT use any single asterisk (*) or double asterisks (**) or markdown star symbols anywhere in the response. Avoid adding markdown clutter.
        5. Format the summary exactly like this:
           
           TODAY (CRITICAL DIRECTION)
           - Bullet task 1 (concise sentence with values, e.g., Liquidate client reimbursement of Rp 5.9M to cash)
           - Bullet task 2
           
           TOMORROW (TACTICAL REBALANCING)
           - Bullet task 1
           
           DAY 3 (STABILITY HORIZON)
           - Bullet task 1

        Make the content incredibly sharp, professional, concise, and to-the-point without any introductory or concluding conversational fluff. Start directly with the text. Output in ${language === 'ID' ? 'Indonesian language' : 'English language'}.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are the Sovereign Executive Oracle. Deliver highly structured, sharp, bullet-pointed, executive summaries with zero markdown formatting asterisks.",
            }
        });

        return response.text || "Unable to formulate strategic roadmap at this moment.";
    } catch (error) {
        console.error("Magic Priority error:", error);
        return "Priority Oracle is busy calculating asset velocity.";
    }
};

