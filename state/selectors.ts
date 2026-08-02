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

export interface PartnershipScoreComponent {
  label: string;
  value: number; // 0-100
  description: string;
}

export interface PartnershipScoreResult {
  score: number | null; // null = not enough real data yet, never a fabricated default
  components: PartnershipScoreComponent[];
}

// PRODUCT-BRIEF.md §4 Layer 2: a real, behavior-derived score, not a quiz and
// not a hardcoded number. Each of the three inputs below is independently
// gated on having real data -- an unavailable input is dropped from the
// blend entirely rather than counted as 0 or defaulted to 100. If none of
// the three have data yet, `score` is null (an honest "not enough data"
// state), never a fabricated placeholder.
export const computePartnershipScore = (state: AppState, currentFreedomYear: number, language: 'EN' | 'ID'): PartnershipScoreResult => {
  const components: PartnershipScoreComponent[] = [];

  // 1. Joint contribution -- there's no data link between a transaction and
  // which goal it funded, so "both partners contributing to joint goals" is
  // measured via the same Pact Obligation formula already live on the Mine
  // tab (IndividualSanctuary.tsx): this month's TRANSFER transactions from a
  // partner into joint pockets, over an income-based target. Computed for
  // BOTH partners and reduced with Math.min -- one partner over-contributing
  // must never mask the other under-contributing. A partner with no income
  // set has no target and is excluded, not penalized; if neither partner has
  // income set, this component has no data at all.
  const currentMonth = new Date().toISOString().slice(0, 7);
  const computePactProgress = (user: AppState['user']): number | null => {
    if (!user || !user.monthlyIncome) return null;
    const pactTarget = user.monthlyIncome * ((user.allocationStrategy?.contribution || 50) / 100);
    if (pactTarget <= 0) return null;
    const pactContributed = state.transactions
      .filter(t => t.ownerId === user.id && t.type === 'TRANSFER' && t.date.startsWith(currentMonth) && !t.isPrivate)
      .reduce((acc, t) => acc + t.amount, 0);
    return Math.min((pactContributed / pactTarget) * 100, 100);
  };
  const contributionProgresses = [computePactProgress(state.user), computePactProgress(state.partner)]
    .filter((v): v is number => v != null);
  if (contributionProgresses.length > 0) {
    components.push({
      label: language === 'ID' ? 'Kontribusi Bersama' : 'Joint Contribution',
      value: Math.round(Math.min(...contributionProgresses)),
      description: language === 'ID'
        ? 'Kontribusi terendah dari kedua pasangan ke kantong bersama bulan ini, relatif terhadap target berbasis pendapatan mereka.'
        : "The lower of both partners' contributions to joint pockets this month, relative to their income-based targets.",
    });
  }

  // 2. Settlement currency -- scoped to inter-partner claims only
  // (initialReceivableAmount is set on PARTNER_RECEIVABLE-style claims, not
  // on client reimbursements, which are a business/solo concern rather than
  // a partnership-alignment signal). Zero claims ever created means no data
  // -- NOT assumed-perfect, which would be a small manufactured confidence.
  const claimTx = state.transactions.filter(t => t.initialReceivableAmount != null);
  const totalClaimedEver = claimTx.reduce((acc, t) => acc + (t.initialReceivableAmount ?? 0), 0);
  if (totalClaimedEver > 0) {
    const totalOutstanding = claimTx
      .filter(t => t.status === 'PARTNER_RECEIVABLE')
      .reduce((acc, t) => acc + (t.receivableAmount ?? 0), 0);
    const settlementValue = Math.max(0, Math.min(100, (1 - totalOutstanding / totalClaimedEver) * 100));
    components.push({
      label: language === 'ID' ? 'Penyelesaian Klaim' : 'Settlement Currency',
      value: Math.round(settlementValue),
      description: language === 'ID'
        ? 'Persentase klaim antar-pasangan yang telah diselesaikan, dari seluruh riwayat klaim.'
        : 'Share of inter-partner claims settled, out of everything ever claimed.',
    });
  }

  // 3. Freedom Date trend -- reuses the exact same last-check-in comparison
  // as Together Layer 1 (routes/Together.tsx), so this doesn't invent a
  // second historical mechanism. Closer or newly-in-view scores high;
  // further or newly-out-of-view scores low, shown honestly, never
  // softened; unchanged sits in between since holding steady isn't a
  // regression but isn't progress either. No check-in recorded yet means
  // no data.
  if (state.lastCheckDate != null) {
    const priorYear = state.lastCheckFreedomYear ?? -1;
    let trendValue: number;
    let trendDescription: string;
    if (priorYear === -1 && currentFreedomYear === -1) {
      trendValue = 60;
      trendDescription = language === 'ID' ? 'Masih di luar cakrawala 20 tahun, tidak berubah sejak pemeriksaan terakhir.' : 'Still beyond the 20-year horizon, unchanged since your last check-in.';
    } else if (priorYear === -1 && currentFreedomYear !== -1) {
      trendValue = 100;
      trendDescription = language === 'ID' ? 'Kini terlihat dalam cakrawala 20 tahun sejak pemeriksaan terakhir.' : 'Newly within the 20-year horizon since your last check-in.';
    } else if (priorYear !== -1 && currentFreedomYear === -1) {
      trendValue = 20;
      trendDescription = language === 'ID' ? 'Bergeser ke luar cakrawala 20 tahun sejak pemeriksaan terakhir.' : 'Moved beyond the 20-year horizon since your last check-in.';
    } else {
      const deltaYears = priorYear - currentFreedomYear;
      if (deltaYears > 0) {
        trendValue = 100;
        trendDescription = language === 'ID' ? `Freedom Date bergerak ${deltaYears} tahun lebih dekat sejak pemeriksaan terakhir.` : `Freedom Date moved ${deltaYears} year${deltaYears === 1 ? '' : 's'} closer since your last check-in.`;
      } else if (deltaYears < 0) {
        trendValue = 20;
        trendDescription = language === 'ID' ? `Freedom Date bergerak ${Math.abs(deltaYears)} tahun lebih jauh sejak pemeriksaan terakhir.` : `Freedom Date moved ${Math.abs(deltaYears)} year${Math.abs(deltaYears) === 1 ? '' : 's'} further since your last check-in.`;
      } else {
        trendValue = 60;
        trendDescription = language === 'ID' ? 'Tidak ada perubahan pada Freedom Date sejak pemeriksaan terakhir.' : 'No change in Freedom Date since your last check-in.';
      }
    }
    components.push({
      label: language === 'ID' ? 'Tren Freedom Date' : 'Freedom Date Trend',
      value: trendValue,
      description: trendDescription,
    });
  }

  const score = components.length > 0
    ? Math.round(components.reduce((acc, c) => acc + c.value, 0) / components.length)
    : null;

  return { score, components };
};

// --- Weekly Report helpers (components/WeeklyReport.tsx) ---
// "This week" is a rolling trailing 7 days from `now`, not a calendar week --
// well-defined regardless of which day the report is opened, and needs no
// stored baseline since transactions already carry real dates.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const isWithinLastWeek = (isoDate: string, now: number): boolean => {
  const t = new Date(isoDate).getTime();
  return !isNaN(t) && t <= now && (now - t) <= WEEK_MS;
};

export const daysSince = (isoDate: string, now: number): number => {
  const t = new Date(isoDate).getTime();
  if (isNaN(t)) return Infinity;
  return (now - t) / (24 * 60 * 60 * 1000);
};

// Real Pact contribution (TRANSFER into joint pockets) by one partner, last
// 7 days -- same underlying signal as the Partnership Score's contribution
// component, just windowed to a week instead of the current month.
export const computeWeeklyPactContribution = (state: AppState, user: AppState['user'], now: number): number => {
  if (!user) return 0;
  return state.transactions
    .filter(t => t.ownerId === user.id && t.type === 'TRANSFER' && !t.isPrivate && isWithinLastWeek(t.date, now))
    .reduce((acc, t) => acc + t.amount, 0);
};

export interface WeeklyClaimsSettled { count: number; amount: number; }

// Claims actually resolved this week -- handleSettleClaim/
// handleSettleClientReimbursement create a NEW transaction (category
// 'Receivable Settlement' / 'Client Refund') dated at the moment of
// settling, not the original claim date, so filtering by date here reflects
// real settlement activity, not old claims that happen to still be open.
// ownerId omitted (undefined) counts both partners combined, for "For Us".
export const computeWeeklyClaimsSettled = (state: AppState, ownerId: string | undefined, now: number): WeeklyClaimsSettled => {
  const settledTx = state.transactions.filter(t =>
    (t.category === 'Receivable Settlement' || t.category === 'Client Refund') &&
    (ownerId == null || t.ownerId === ownerId) &&
    isWithinLastWeek(t.date, now)
  );
  return { count: settledTx.length, amount: settledTx.reduce((acc, t) => acc + t.netAmount, 0) };
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
