import {
  AppState, Pocket, Transaction, Liability, FortressGoal, RecurringObligation,
  LifeCard, AdvisorMessage, HistoricalSnapshot, PocketSettings, User as UserType,
} from '../types';
import { supabase } from './supabaseClient';
import { HouseholdMemberRow } from './authService';

// Local cache key for the *current* (Supabase-backed) shape. Distinct from the
// legacy single-blob key so a stale offline cache never masquerades as synced data.
const LOCAL_CACHE_KEY = 'duo_household_cache_v1';
const LEGACY_LOCAL_KEY = 'sovereign_wealth_os_v1';
const migrationFlagKey = (householdId: string) => `duo_migrated_${householdId}`;

export interface HouseholdContext {
  householdId: string;
  memberId: string;
  members: HouseholdMemberRow[];
}

export const buildHouseholdContext = async (self: HouseholdMemberRow): Promise<HouseholdContext> => {
  const { data, error } = await supabase.from('household_members').select('*').eq('household_id', self.household_id);
  if (error) throw error;
  return { householdId: self.household_id, memberId: self.id, members: (data ?? []) as HouseholdMemberRow[] };
};

// ---------------------------------------------------------------------------
// Role-slot adapter. App.tsx (pre-Phase-2) still speaks the legacy
// 'user_her' / 'user_his' role-slot ids throughout its UI logic. This is the
// only place that translates between those slots and real household_members
// uuids, so RLS-critical owner_user_id columns always carry a real auth id.
// ---------------------------------------------------------------------------
type RoleSlot = 'user_her' | 'user_his';

const sortedByRole = (members: HouseholdMemberRow[]) =>
  [...members].sort((a, b) => (a.role === 'CFO' ? -1 : b.role === 'CFO' ? 1 : 0) || a.id.localeCompare(b.id));

const slotForMemberId = (members: HouseholdMemberRow[], id: string): RoleSlot | undefined => {
  const sorted = sortedByRole(members);
  const idx = sorted.findIndex((m) => m.id === id);
  if (idx === 0) return 'user_her';
  if (idx === 1) return 'user_his';
  return undefined;
};

const memberForSlot = (members: HouseholdMemberRow[], slot?: string): HouseholdMemberRow | undefined => {
  const sorted = sortedByRole(members);
  if (slot === 'user_her') return sorted[0];
  if (slot === 'user_his') return sorted[1];
  return undefined;
};

const slotToUuid = (members: HouseholdMemberRow[], slot?: string | null): string | null =>
  slot && slot !== 'JOINT' ? memberForSlot(members, slot)?.id ?? null : null;

const uuidToSlot = (members: HouseholdMemberRow[], uuid?: string | null): string =>
  (uuid && slotForMemberId(members, uuid)) || 'JOINT';

const toUserType = (m: HouseholdMemberRow, slot: RoleSlot): UserType => ({
  id: slot,
  name: m.display_name,
  email: m.email,
  isAuthenticated: true,
  avatar: m.avatar || m.display_name.charAt(0).toUpperCase(),
  monthlyIncome: Number(m.monthly_income),
  role: m.role,
  isPrivateMode: m.is_private_mode,
  allocationStrategy: m.allocation_strategy ?? undefined,
});

export const getUserAndPartner = (ctx: HouseholdContext): { user: UserType; partner: UserType | null } => {
  const sorted = sortedByRole(ctx.members);
  const selfIdx = sorted.findIndex((m) => m.id === ctx.memberId);
  const selfSlot: RoleSlot = selfIdx === 0 ? 'user_her' : 'user_his';
  const otherSlot: RoleSlot = selfSlot === 'user_her' ? 'user_his' : 'user_her';
  const self = sorted[selfIdx];
  const other = sorted.find((m) => m.id !== ctx.memberId);
  return {
    user: toUserType(self, selfSlot),
    partner: other ? toUserType(other, otherSlot) : null,
  };
};

// ---------------------------------------------------------------------------
// Generic diffed upsert for household-scoped collections keyed by client_id.
// ---------------------------------------------------------------------------

async function syncCollection(table: string, householdId: string, currentIds: string[], rows: Record<string, unknown>[]) {
  const { data: existing, error: readError } = await supabase.from(table).select('client_id').eq('household_id', householdId);
  if (readError) throw readError;
  const existingIds = (existing ?? []).map((r: { client_id: string }) => r.client_id);
  const toDelete = existingIds.filter((id) => !currentIds.includes(id));

  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'household_id,client_id' });
    if (error) throw error;
  }
  if (toDelete.length > 0) {
    const { error } = await supabase.from(table).delete().eq('household_id', householdId).in('client_id', toDelete);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Push: household AppState -> Postgres. Called on every state change (the
// caller should debounce). Each row's updated_at is stamped now(); since a
// row lives at one household_id+client_id, the last commit simply wins.
// ---------------------------------------------------------------------------

export const pushHouseholdState = async (ctx: HouseholdContext, state: AppState): Promise<void> => {
  const { householdId, members } = ctx;
  const now = new Date().toISOString();

  const pocketList = Object.values(state.pockets);
  await syncCollection('pockets', householdId, pocketList.map((p) => p.id), pocketList.map((p) => ({
    household_id: householdId,
    client_id: p.id,
    name: p.name,
    balance: p.balance,
    target: p.target ?? null,
    group: p.group,
    behavior: p.behavior,
    description: p.description ?? null,
    currency: p.currency ?? null,
    pact_rules: p.pactRules ?? null,
    is_shared: p.isShared ?? true,
    lead_id: p.leadId ?? null,
    allow_carryover: p.allowCarryover ?? false,
    scope: 'OURS',
    owner_user_id: null,
    updated_at: now,
  })));

  await syncCollection('transactions', householdId, state.transactions.map((t) => t.id), state.transactions.map((t) => ({
    household_id: householdId,
    client_id: t.id,
    date: t.date,
    description: t.description,
    amount: t.amount,
    original_amount: t.originalAmount ?? null,
    original_currency: t.originalCurrency ?? null,
    exchange_rate: t.exchangeRate ?? null,
    repaid_amount: t.repaidAmount ?? 0,
    net_amount: t.netAmount,
    category: t.category ?? null,
    type: t.type,
    pocket: t.pocket ?? null,
    merchant: t.merchant ?? null,
    tags: t.tags ?? null,
    split_count: t.splitCount ?? null,
    receivable_amount: t.receivableAmount ?? null,
    initial_receivable_amount: t.initialReceivableAmount ?? null,
    is_installment: t.isInstallment ?? false,
    installment_total_months: t.installmentTotalMonths ?? null,
    status: t.status ?? null,
    owner_user_id: slotToUuid(members, t.ownerId),
    payer_user_id: slotToUuid(members, t.payerId),
    manual_override: t.manualOverride ?? false,
    is_verified: t.isVerified ?? false,
    payer_notes: t.payerNotes ?? null,
    scope: t.isPrivate ? 'MINE' : 'OURS',
    updated_at: now,
  })));

  await syncCollection('liabilities', householdId, state.liabilities.map((l) => l.id), state.liabilities.map((l) => ({
    household_id: householdId,
    client_id: l.id,
    name: l.name,
    total_amount: l.totalAmount,
    remaining_amount: l.remainingAmount,
    monthly_payment: l.monthlyPayment,
    interest_rate: l.interestRate,
    category: l.category,
    currency: l.currency,
    start_date: l.startDate ?? null,
    months_total: l.monthsTotal ?? null,
    months_remaining: l.monthsRemaining ?? null,
    linked_asset_id: l.linkedAssetId ?? null,
    scope: 'OURS',
    owner_user_id: null,
    updated_at: now,
  })));

  await syncCollection('fortress_goals', householdId, state.fortressGoals.map((g) => g.id), state.fortressGoals.map((g) => ({
    household_id: householdId,
    client_id: g.id,
    name: g.name,
    category: g.category,
    target_amount: g.targetAmount,
    current_amount: g.currentAmount,
    deadline: g.deadline ?? null,
    monthly_contribution: g.monthlyContribution ?? null,
    assets: g.assets ?? [],
    is_strategic: g.isStrategic ?? false,
    assumed_inflation_rate: g.assumedInflationRate ?? null,
    expected_annual_return: g.expectedAnnualReturn ?? null,
    actuarial_future_value: g.actuarialFutureValue ?? null,
    required_monthly_velocity: g.requiredMonthlyVelocity ?? null,
    scope: 'OURS',
    owner_user_id: slotToUuid(members, g.ownerId),
    updated_at: now,
  })));

  await syncCollection('recurring_obligations', householdId, state.recurringObligations.map((r) => r.id), state.recurringObligations.map((r) => ({
    household_id: householdId,
    client_id: r.id,
    name: r.name,
    amount: r.amount,
    pocket: r.pocket ?? null,
    due_date: r.dueDate,
    merchant: r.merchant ?? null,
    category: r.category ?? null,
    scope: 'OURS',
    owner_user_id: slotToUuid(members, r.ownerId),
    updated_at: now,
  })));

  await syncCollection('life_cards', householdId, state.lifeCards.map((c) => c.id), state.lifeCards.map((c) => ({
    household_id: householdId,
    client_id: c.id,
    name: c.name,
    cost_impact: c.costImpact,
    upfront_cost: c.upfrontCost,
    icon: c.icon,
    is_active: c.isActive,
    inflation_adjusted: c.inflationAdjusted ?? false,
    updated_at: now,
  })));

  await syncCollection('advisor_messages', householdId, state.advisorChatHistory.map((m) => m.id), state.advisorChatHistory.map((m) => ({
    household_id: householdId,
    client_id: m.id,
    sender: m.sender,
    text: m.text,
    related_metric: m.relatedMetric ?? null,
    scope: 'OURS',
    owner_user_id: null,
  })));

  await syncCollection('historical_snapshots', householdId, state.history.map((s) => s.id), state.history.map((s) => ({
    household_id: householdId,
    client_id: s.id,
    month: s.month,
    total_revenue: s.totalRevenue,
    total_burn: s.totalBurn,
    net_worth: s.netWorth,
    sovereignty_days: s.sovereigntyDays,
    pockets_snapshot: s.pockets ?? {},
    transactions_snapshot: s.transactions ?? [],
  })));

  const settings = state.settings;
  const { error: settingsError } = await supabase.from('household_settings').upsert({
    household_id: householdId,
    sanctuary_allocation: settings.sanctuaryAllocation,
    daily_allocation: settings.dailyAllocation,
    play_allocation: settings.playAllocation,
    tax_rate: settings.taxRate,
    primary_currency: settings.primaryCurrency,
    secondary_currency: settings.secondaryCurrency,
    show_claims_desk: settings.showClaimsDesk ?? true,
    custom_claims_desk_title: settings.customClaimsDeskTitle ?? null,
    custom_client_claims_title: settings.customClientClaimsTitle ?? null,
    custom_shared_splits_title: settings.customSharedSplitsTitle ?? null,
    show_client_reimbursements: settings.showClientReimbursements ?? true,
    show_partner_splits: settings.showPartnerSplits ?? true,
    balance_visibility: settings.balanceVisibility ?? 'TRANSPARENT',
    settlement_balance: state.settlementBalance,
    updated_at: now,
  }, { onConflict: 'household_id' });
  if (settingsError) throw settingsError;

  // Sanctuary: only ever write the caller's own private reserve row.
  const { error: reserveError } = await supabase.from('private_reserves').upsert({
    owner_user_id: ctx.memberId,
    household_id: householdId,
    amount: state.privateReserves[uuidToSlot(members, ctx.memberId)] ?? 0,
    updated_at: now,
  }, { onConflict: 'owner_user_id' });
  if (reserveError) throw reserveError;
};

// ---------------------------------------------------------------------------
// Pull: Postgres -> AppState partial. RLS already strips MINE rows owned by
// the partner, so nothing further needs filtering here.
// ---------------------------------------------------------------------------

export const pullHouseholdState = async (ctx: HouseholdContext): Promise<Partial<AppState>> => {
  const { householdId, members } = ctx;

  const [pocketsRes, txRes, liabRes, goalsRes, recRes, cardsRes, msgRes, snapRes, settingsRes, reserveRes] = await Promise.all([
    supabase.from('pockets').select('*').eq('household_id', householdId),
    supabase.from('transactions').select('*').eq('household_id', householdId),
    supabase.from('liabilities').select('*').eq('household_id', householdId),
    supabase.from('fortress_goals').select('*').eq('household_id', householdId),
    supabase.from('recurring_obligations').select('*').eq('household_id', householdId),
    supabase.from('life_cards').select('*').eq('household_id', householdId),
    supabase.from('advisor_messages').select('*').eq('household_id', householdId).order('created_at', { ascending: true }),
    supabase.from('historical_snapshots').select('*').eq('household_id', householdId),
    supabase.from('household_settings').select('*').eq('household_id', householdId).maybeSingle(),
    supabase.from('private_reserves').select('*').eq('household_id', householdId),
  ]);

  for (const res of [pocketsRes, txRes, liabRes, goalsRes, recRes, cardsRes, msgRes, snapRes, settingsRes, reserveRes]) {
    if (res.error) throw res.error;
  }

  const pockets: Record<string, Pocket> = {};
  (pocketsRes.data ?? []).forEach((row: any) => {
    pockets[row.client_id] = {
      id: row.client_id,
      name: row.name,
      balance: Number(row.balance),
      target: row.target != null ? Number(row.target) : undefined,
      group: row.group,
      behavior: row.behavior,
      description: row.description ?? undefined,
      currency: row.currency ?? undefined,
      pactRules: row.pact_rules ?? undefined,
      isShared: row.is_shared,
      leadId: row.lead_id ?? undefined,
      allowCarryover: row.allow_carryover,
    };
  });

  const transactions: Transaction[] = (txRes.data ?? []).map((row: any) => ({
    id: row.client_id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    originalAmount: row.original_amount != null ? Number(row.original_amount) : undefined,
    originalCurrency: row.original_currency ?? undefined,
    exchangeRate: row.exchange_rate != null ? Number(row.exchange_rate) : undefined,
    repaidAmount: Number(row.repaid_amount),
    netAmount: Number(row.net_amount),
    category: row.category ?? '',
    type: row.type,
    pocket: row.pocket ?? '',
    merchant: row.merchant ?? undefined,
    tags: row.tags ?? undefined,
    splitCount: row.split_count ?? undefined,
    receivableAmount: row.receivable_amount != null ? Number(row.receivable_amount) : undefined,
    initialReceivableAmount: row.initial_receivable_amount != null ? Number(row.initial_receivable_amount) : undefined,
    isInstallment: row.is_installment,
    installmentTotalMonths: row.installment_total_months ?? undefined,
    status: row.status ?? undefined,
    ownerId: uuidToSlot(members, row.owner_user_id),
    payerId: row.payer_user_id ? uuidToSlot(members, row.payer_user_id) : undefined,
    manualOverride: row.manual_override,
    isPrivate: row.scope === 'MINE',
    isVerified: row.is_verified,
    payerNotes: row.payer_notes ?? undefined,
  }));

  const liabilities: Liability[] = (liabRes.data ?? []).map((row: any) => ({
    id: row.client_id,
    name: row.name,
    totalAmount: Number(row.total_amount),
    remainingAmount: Number(row.remaining_amount),
    monthlyPayment: Number(row.monthly_payment),
    interestRate: Number(row.interest_rate),
    category: row.category,
    currency: row.currency,
    startDate: row.start_date ?? undefined,
    monthsTotal: row.months_total ?? undefined,
    monthsRemaining: row.months_remaining ?? undefined,
    linkedAssetId: row.linked_asset_id ?? undefined,
  }));

  const fortressGoals: FortressGoal[] = (goalsRes.data ?? []).map((row: any) => ({
    id: row.client_id,
    name: row.name,
    category: row.category,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline ?? undefined,
    monthlyContribution: row.monthly_contribution != null ? Number(row.monthly_contribution) : undefined,
    assets: row.assets ?? [],
    isStrategic: row.is_strategic,
    ownerId: uuidToSlot(members, row.owner_user_id),
    assumedInflationRate: row.assumed_inflation_rate ?? undefined,
    expectedAnnualReturn: row.expected_annual_return ?? undefined,
    actuarialFutureValue: row.actuarial_future_value ?? undefined,
    requiredMonthlyVelocity: row.required_monthly_velocity ?? undefined,
  }));

  const recurringObligations: RecurringObligation[] = (recRes.data ?? []).map((row: any) => ({
    id: row.client_id,
    name: row.name,
    amount: Number(row.amount),
    pocket: row.pocket ?? '',
    dueDate: row.due_date,
    merchant: row.merchant ?? undefined,
    category: row.category ?? '',
    ownerId: uuidToSlot(members, row.owner_user_id),
  }));

  const lifeCards: LifeCard[] = (cardsRes.data ?? []).map((row: any) => ({
    id: row.client_id,
    name: row.name,
    costImpact: Number(row.cost_impact),
    upfrontCost: Number(row.upfront_cost),
    icon: row.icon,
    isActive: row.is_active,
    inflationAdjusted: row.inflation_adjusted,
  }));

  const advisorChatHistory: AdvisorMessage[] = (msgRes.data ?? []).map((row: any) => ({
    id: row.client_id,
    sender: row.sender,
    text: row.text,
    timestamp: new Date(row.created_at).getTime(),
    relatedMetric: row.related_metric ?? undefined,
  }));

  const history: HistoricalSnapshot[] = (snapRes.data ?? []).map((row: any) => ({
    id: row.client_id,
    month: row.month,
    totalRevenue: Number(row.total_revenue),
    totalBurn: Number(row.total_burn),
    netWorth: Number(row.net_worth),
    sovereigntyDays: row.sovereignty_days,
    pockets: row.pockets_snapshot ?? {},
    transactions: row.transactions_snapshot ?? [],
  }));

  const settingsRow = settingsRes.data as any;
  const settings: PocketSettings | undefined = settingsRow ? {
    sanctuaryAllocation: Number(settingsRow.sanctuary_allocation),
    dailyAllocation: Number(settingsRow.daily_allocation),
    playAllocation: Number(settingsRow.play_allocation),
    taxRate: Number(settingsRow.tax_rate),
    primaryCurrency: settingsRow.primary_currency,
    secondaryCurrency: settingsRow.secondary_currency,
    showClaimsDesk: settingsRow.show_claims_desk,
    customClaimsDeskTitle: settingsRow.custom_claims_desk_title ?? undefined,
    customClientClaimsTitle: settingsRow.custom_client_claims_title ?? undefined,
    customSharedSplitsTitle: settingsRow.custom_shared_splits_title ?? undefined,
    showClientReimbursements: settingsRow.show_client_reimbursements,
    showPartnerSplits: settingsRow.show_partner_splits,
    balanceVisibility: settingsRow.balance_visibility ?? 'TRANSPARENT',
  } : undefined;

  // RLS decides what's in reserveRes.data, not this code: in PRIVATE mode it
  // contains only the caller's own row, in TRANSPARENT mode it also contains
  // the partner's -- either way, map whatever rows actually came back. A
  // slot with no row (private mode, viewing the partner) simply stays absent
  // from the map, which the UI renders as hidden rather than a real zero.
  const privateReserves: Record<string, number> = {};
  (reserveRes.data ?? []).forEach((row: any) => {
    const slot = uuidToSlot(members, row.owner_user_id);
    privateReserves[slot] = Number(row.amount);
  });

  const { user, partner } = getUserAndPartner(ctx);

  return {
    user,
    partner,
    pockets,
    transactions,
    liabilities,
    fortressGoals,
    recurringObligations,
    lifeCards,
    advisorChatHistory,
    history,
    // Omit when absent (fresh household) so a spread-merge doesn't clobber
    // the caller's existing defaults with an explicit `undefined`.
    ...(settings ? { settings } : {}),
    ...(settingsRow ? { settlementBalance: Number(settingsRow.settlement_balance) } : {}),
    privateReserves,
  };
};

// ---------------------------------------------------------------------------
// Offline cache: local-first read, reconciled against Supabase on every
// successful pull/push. localStorage is a cache, never the source of truth.
// ---------------------------------------------------------------------------

export const saveLocalCache = (householdId: string, state: AppState) => {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ householdId, state, updatedAt: Date.now() }));
  } catch (e) {
    console.error('Failed to write offline cache', e);
  }
};

export const loadLocalCache = (householdId: string): AppState | null => {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { householdId: string; state: AppState };
    if (parsed.householdId !== householdId) return null;
    return parsed.state;
  } catch (e) {
    console.error('Failed to read offline cache', e);
    return null;
  }
};

// One-time import of the pre-auth localStorage blob into Supabase, run only
// the first time a *freshly created* household has never been migrated into.
export const migrateLegacyLocalStateIfNeeded = async (ctx: HouseholdContext, isFreshHousehold: boolean): Promise<AppState | null> => {
  const flagKey = migrationFlagKey(ctx.householdId);
  if (localStorage.getItem(flagKey)) return null;

  if (!isFreshHousehold) {
    localStorage.setItem(flagKey, 'true');
    return null;
  }

  const legacyRaw = localStorage.getItem(LEGACY_LOCAL_KEY);
  localStorage.setItem(flagKey, 'true');
  if (!legacyRaw) return null;

  try {
    const legacy = JSON.parse(legacyRaw) as AppState;
    await pushHouseholdState(ctx, legacy);
    return legacy;
  } catch (e) {
    console.error('Legacy local state migration failed', e);
    return null;
  }
};
