import { AppState, Pocket, LifeCard } from '../types';

export type LensType = 'HIS' | 'JOINT' | 'HER';

// Independent copy of components/Freedom.tsx's runSimulation year-finding
// logic, reused by routes/Together.tsx to compute "today's real Freedom
// Date" without depending on Freedom.tsx's local scenario-toggle UI state.
// Only counts life cards the household has actually activated (real,
// persisted commitments) -- never untoggled scenario templates.
export const computeFreedomYear = (monthlyIncome: number, monthlyBurn: number, currentLiquidAssets: number, activeLifeCards: LifeCard[]): number => {
  let liquid = currentLiquidAssets;
  const baseSavings = monthlyIncome - monthlyBurn;

  let monthlyImpact = 0;
  let upfrontImpact = 0;
  activeLifeCards.forEach(c => {
      monthlyImpact += c.costImpact;
      upfrontImpact += c.upfrontCost;
  });

  const adjustedMonthlySavings = baseSavings - monthlyImpact;
  liquid -= upfrontImpact;

  const annualBurn = (monthlyBurn + monthlyImpact) * 12;
  const freedomNumber = annualBurn * 25; // 4% Rule
  let freedomYear = -1;

  for (let year = 0; year <= 20; year++) {
      liquid = (liquid * 1.07) + (adjustedMonthlySavings * 12);
      if (freedomYear === -1 && liquid >= freedomNumber) {
          freedomYear = year;
      }
  }

  return freedomYear;
};

export const formatIDR = (privacyMode: boolean, language: 'EN' | 'ID', num: number) => {
    if (privacyMode) return "••••••";
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
};
export const formatCompact = (privacyMode: boolean, language: 'EN' | 'ID', num: number) => {
    if (privacyMode) return "••••••";
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

// Lens labels are resolved per-viewer, not per-string: 'HER' is always the
// slot the household's CFO/creator occupies, 'HIS' the other member's slot
// (see services/syncService.ts). Depending on who is logged in, "HER" can
// mean state.user OR state.partner -- so we match by id, not by literal.
export const getLensLabel = (state: AppState, language: 'EN' | 'ID', lens: LensType): string => {
    if (lens === 'JOINT') return language === 'ID' ? 'Bersama' : 'Together';
    const slot = lens === 'HER' ? 'user_her' : 'user_his';
    if (state.user?.id === slot) return state.user?.name || (language === 'ID' ? 'Anda' : 'You');
    if (state.partner?.id === slot) return state.partner?.name || (language === 'ID' ? 'Pasangan' : 'Partner');
    return slot === 'user_her' ? 'Partner A' : 'Partner B';
};

// --- TRINARY LENS CALCULATIONS ---
// lensSlot is null for JOINT (no filter -- everything counts once, combined).
// For HER/HIS it's the fixed household slot ('user_her' = CFO/creator,
// 'user_his' = the other member) that scopes every figure below to that
// one person's own pockets/goals/receivables/reserve.
export const computeDerived = (state: AppState, activeLens: LensType, language: 'EN' | 'ID') => {
  const pocketsList = Object.values(state.pockets) as Pocket[];
  const lensSlot: 'user_her' | 'user_his' | null = activeLens === 'JOINT' ? null : activeLens === 'HER' ? 'user_her' : 'user_his';

  // Which pockets has each partner actually put money through (any INCOME/
  // EXPENSE transaction with their owner_user_id), ever? This -- not
  // pocket.leadId -- decides what counts toward "your" cash. leadId is a
  // manually-set "who manages this envelope" label (still used for the
  // guardian badge/ghosting on the Flow tab); it defaults to whoever created
  // the pocket and says nothing about whose income actually funds it, so a
  // partner's own income could fund a pocket that never shows up in their
  // own lens. Ownership here is derived from the transactions themselves.
  const pocketOwnersById = new Map<string, Set<'user_her' | 'user_his'>>();
  state.transactions.forEach(t => {
      if (t.ownerId !== 'user_her' && t.ownerId !== 'user_his') return;
      if (!pocketOwnersById.has(t.pocket)) pocketOwnersById.set(t.pocket, new Set());
      pocketOwnersById.get(t.pocket)!.add(t.ownerId);
  });
  const filterPocketsByLens = (pockets: Pocket[]) => {
      if (!lensSlot) return pockets;
      return pockets.filter(p => pocketOwnersById.get(p.id)?.has(lensSlot));
  };
  const getPrivateReserve = (lens: LensType) => {
      if (lens === 'JOINT') return 0;
      const userId = lens === 'HER' ? 'user_her' : 'user_his';
      return state.privateReserves[userId] || 0;
  };

  const visiblePockets = filterPocketsByLens(pocketsList);
  const privateReserveForLens = getPrivateReserve(activeLens);
  const sharedLiquidity = visiblePockets.filter(p => p.group === 'DAILY' || p.group === 'LIFESTYLE').reduce((acc, p) => acc + Math.max(0, p.balance), 0);
  const monthlyCommitments = visiblePockets.filter(p => p.group === 'SANCTUARY').reduce((acc, p) => acc + (p.target || 0), 0);

  const filteredGoals = state.fortressGoals.filter(g => {
      if (!lensSlot) return true;
      return g.ownerId === 'JOINT' || g.ownerId === lensSlot;
  });
  const totalGoalAssets = filteredGoals.reduce((acc, g) => acc + g.currentAmount, 0);
  // Every visible pocket's balance counts exactly once, in every group --
  // previously WEALTH-group pockets other than INVESTMENT_CASH (e.g.
  // TAX_RESERVE) were silently excluded from the headline figure entirely.
  const totalPocketCash = visiblePockets.reduce((acc, p) => acc + p.balance, 0);
  // Liabilities carry no per-partner owner in the data model -- shared debt
  // reduces heritage the same way in every lens rather than being split.
  const systemBurden = state.liabilities.reduce((acc, l) => acc + l.remainingAmount, 0);
  const totalReceivables = state.transactions
      .filter(t => t.status === 'PARTNER_RECEIVABLE' && (!lensSlot || t.ownerId === lensSlot))
      .reduce((acc, t) => acc + (t.receivableAmount || 0), 0);
  const dailyOpsTarget = visiblePockets.filter(p => p.group === 'DAILY').reduce((acc, p) => acc + (p.target || 0), 0);
  const monthlyBurn = monthlyCommitments + dailyOpsTarget;
  const monthlyPassive = (totalGoalAssets * 0.04) / 12;
  const sovereigntyGap = monthlyBurn - monthlyPassive;

  // --- HERO: "Spendable Cash" -- pockets you actually fund (lens-aware, via
  // pocketOwnersById above) + your private reserve. Deliberately excludes
  // goals/liabilities/receivables so the three lenses show three genuinely
  // different, meaningful cash figures instead of a net-worth number that's
  // 99% household-wide and barely moves when the lens changes.
  const spendableCash = totalPocketCash + privateReserveForLens;
  const spendableCashLabel = language === 'ID' ? `Uang Cair ${getLensLabel(state, language, activeLens)}` : `${getLensLabel(state, language, activeLens)}'s Spendable Cash`;
  const spendableCashDescription = !lensSlot
      ? (language === 'ID' ? 'Semua kantong, digabungkan' : 'All pockets, combined')
      : (language === 'ID' ? 'Kantong yang Anda danai + Dana Pribadi Anda' : 'Pockets you fund + your Private Reserve');

  // --- SECONDARY: household net worth. Always Joint-wide, never filtered by
  // lens -- goals and liabilities have no per-partner owner in this data
  // model, so splitting them by lens would be fabricated, not real.
  const netWorthGoals = state.fortressGoals.reduce((acc, g) => acc + g.currentAmount, 0);
  const netWorthPocketCash = pocketsList.reduce((acc, p) => acc + p.balance, 0);
  const netWorthReceivables = state.transactions
      .filter(t => t.status === 'PARTNER_RECEIVABLE')
      .reduce((acc, t) => acc + (t.receivableAmount || 0), 0);
  const householdNetWorth = netWorthGoals + netWorthPocketCash + netWorthReceivables - systemBurden;

  // Personal-balance privacy: household_settings.balanceVisibility. In
  // PRIVATE mode, the partner's own private_reserves row is already absent
  // at the RLS layer (see migration 0003) -- this additionally masks the
  // lens-scoped Spendable Cash / Liquid Cash / Private Reserve figures while
  // viewing their lens, rather than showing a partial number. Household Net
  // Worth and Liabilities are never masked -- they're the same figure
  // regardless of whose lens is active, so there's nothing partner-private
  // in them to hide. Never hides your own lens or the Joint view.
  const isViewingPartnerLens = !!lensSlot && lensSlot !== state.user?.id;
  const isBalanceHiddenForLens = isViewingPartnerLens && state.settings.balanceVisibility === 'PRIVATE';

  return {
    pocketsList, lensSlot, visiblePockets, privateReserveForLens, sharedLiquidity, monthlyCommitments,
    filteredGoals, totalGoalAssets, totalPocketCash, systemBurden, totalReceivables, dailyOpsTarget,
    monthlyBurn, monthlyPassive, sovereigntyGap, spendableCash, spendableCashLabel, spendableCashDescription,
    netWorthGoals, netWorthPocketCash, netWorthReceivables, householdNetWorth, isViewingPartnerLens, isBalanceHiddenForLens,
  };
};
