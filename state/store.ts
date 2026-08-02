import { create } from 'zustand';
import {
  AppState, PocketType, Transaction, PocketSettings, Pocket, Currency,
  FortressGoal, User as UserType, Asset, Liability, AgentPayload, LifeCard,
} from '../types';
import { INITIAL_STATE } from './initialState';
import { formatIDR } from './selectors';
import {
  pullHouseholdState, pushHouseholdState, saveLocalCache, loadLocalCache,
  migrateLegacyLocalStateIfNeeded, HouseholdContext,
} from '../services/syncService';
import { getExchangeRates } from '../services/currencyService';

export type ViewMode = 'TODAY' | 'FLOW' | 'TOGETHER' | 'FREEDOM' | 'MINE';
export type LensType = 'HIS' | 'JOINT' | 'HER';

// Scroll position is imperative bookkeeping, not reactive state -- it lives
// outside the store as a plain module-level ref so switchTab can be called
// from anywhere (nav clicks, the AI agent kernel) without prop-drilling a
// React ref through every surface.
const scrollPositions: Record<ViewMode, number> = { TODAY: 0, FLOW: 0, TOGETHER: 0, FREEDOM: 0, MINE: 0 };
let mainEl: HTMLElement | null = null;
export const setMainScrollEl = (el: HTMLElement | null) => { mainEl = el; };

interface Toast { message: string; detail: string; type?: 'alert' | 'success'; }
interface DeficitData {
    deficit: number;
    availableJoint: number;
    required: number;
    ownerId: string;
    finalAmount: number;
    currency?: Currency;
}

interface Store {
  // --- core household state ---
  state: AppState;
  householdCtx: HouseholdContext | null;
  previousState: AppState | null;

  // --- ui state (shared across surfaces) ---
  activeTab: ViewMode;
  activeLens: LensType;
  language: 'EN' | 'ID';
  isPremium: boolean;
  privacyMode: boolean;
  toast: Toast | null;
  selectedPocket: Pocket | null;
  showControlTower: boolean;
  showHeritageGuide: boolean;
  showMobileConsole: boolean;
  isListening: boolean;
  showRevenueModal: boolean;
  revenueForm: { amount: string; desc: string; owner: string; isAuto: boolean };
  showDeficitModal: boolean;
  deficitData: DeficitData | null;

  // --- actions ---
  setActiveLens: (lens: LensType) => void;
  setIsPremium: (v: boolean) => void;
  setSelectedPocket: (p: Pocket | null) => void;
  setShowControlTower: (v: boolean) => void;
  setShowHeritageGuide: (v: boolean) => void;
  setShowRevenueModal: (v: boolean) => void;
  setRevenueForm: (f: Partial<Store['revenueForm']>) => void;
  setShowDeficitModal: (v: boolean) => void;

  switchTab: (tab: ViewMode) => void;
  scrollToTop: () => void;
  showToast: (message: string, detail: string, type?: 'alert' | 'success') => void;

  handleAuthReady: (ctx: HouseholdContext, isFreshHousehold: boolean) => Promise<void>;
  handleSignOutReset: () => void;
  handleUndo: () => void;
  togglePrivacyMode: () => void;
  handleLanguageChange: (lang: 'EN' | 'ID') => void;

  handleStateUpdate: (newTransactions: Transaction[], newPockets?: Record<string, Pocket>, newPrivateReserves?: Record<string, number>) => void;
  handleAddTransaction: (newTx: Transaction, targetGoalId?: string) => void;
  handleDeleteTransaction: (txToDelete: Transaction) => void;
  initiateWaterfall: (amountInput: number | string, ownerId: string, currency?: Currency) => void;
  executeWaterfall: (baseAmount: number, ownerId: string, currency?: Currency, isBridged?: boolean) => void;
  handleInjectRevenue: () => void;
  handleAgentAction: (payload: AgentPayload) => void;

  handleUpdateGoal: (id: string, updates: Partial<FortressGoal>) => void;
  handleDeleteGoal: (id: string) => void;
  handleAddGoal: (goal: FortressGoal) => void;
  handleSealMonth: () => void;
  handleSettleClaim: (tx: Transaction, amountToSettle?: number) => void;
  handleSettleClientReimbursement: (tx: Transaction) => void;
  handleUpdateTransactionNotes: (txId: string, notes: string) => void;
  handleCreatePocket: (pocket: Pocket) => void;
  handlePocketUpdate: (id: string, updates: Partial<Pocket>) => void;
  handleDeletePocket: (pocketId: string) => void;
  handleUpdateSettings: (updatedSettings: Partial<PocketSettings>) => void;
  handleUpdateUser: (userId: string, updates: Partial<UserType>) => void;
  handleAddLiability: (liability: Liability) => void;
  handleUpdatePostponedTaskIds: (ids: string[]) => void;
  handleToggleLifeCard: (card: LifeCard) => void;
  handleRecordCheckIn: (freedomYear: number, netWorth: number) => void;
}

const recalculateState = (transactions: Transaction[], currentPockets: Record<string, Pocket>) => {
    const newPockets: Record<string, Pocket> = JSON.parse(JSON.stringify(currentPockets));

    Object.keys(newPockets).forEach(key => {
      const p = newPockets[key];
      if (p) p.balance = 0;
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const activeTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

    activeTransactions.forEach(tx => {
        const pocket: Pocket | undefined = newPockets[tx.pocket];
        if (!pocket) return;

        if (tx.type === 'INCOME' || tx.type === 'REVENUE') {
            pocket.balance += tx.netAmount;
        } else if (tx.type === 'EXPENSE' || tx.type === 'INVESTMENT' || tx.type === 'DEBT_PAYMENT') {
            pocket.balance -= tx.netAmount;
        } else if (tx.type === 'TRANSFER') {
            pocket.balance -= tx.netAmount;
        }
    });
    return { newPockets };
};

export const useStore = create<Store>((set, get) => ({
  state: INITIAL_STATE,
  householdCtx: null,
  previousState: null,

  activeTab: 'TODAY',
  activeLens: 'JOINT',
  language: 'EN',
  isPremium: false,
  // Synchronize dynamic privacy flag on window at store creation (equivalent
  // to App.tsx's old every-render sync) so sub-components can query it
  // seamlessly from the very first render, not just after the first toggle.
  privacyMode: (() => {
    const initial = localStorage.getItem('SOVEREIGN_OS_PRIVACY_MODE') === 'true';
    (window as any).privacyShieldActive = initial;
    return initial;
  })(),
  toast: null,
  selectedPocket: null,
  showControlTower: false,
  showHeritageGuide: false,
  showMobileConsole: false,
  isListening: false,
  showRevenueModal: false,
  revenueForm: { amount: '', desc: '', owner: 'HER', isAuto: true },
  showDeficitModal: false,
  deficitData: null,

  setActiveLens: (lens) => set({ activeLens: lens }),
  setIsPremium: (v) => set({ isPremium: v }),
  setSelectedPocket: (p) => set({ selectedPocket: p }),
  setShowControlTower: (v) => set({ showControlTower: v }),
  setShowHeritageGuide: (v) => set({ showHeritageGuide: v }),
  setShowRevenueModal: (v) => set({ showRevenueModal: v }),
  setRevenueForm: (f) => set(s => ({ revenueForm: { ...s.revenueForm, ...f } })),
  setShowDeficitModal: (v) => set({ showDeficitModal: v }),

  // --- SCROLL PERSISTENCE LOGIC ---
  switchTab: (newTab) => {
      const { activeTab } = get();
      if (mainEl) scrollPositions[activeTab] = mainEl.scrollTop;

      set({ activeTab: newTab });

      setTimeout(() => {
          if (mainEl) mainEl.scrollTop = scrollPositions[newTab] || 0;
      }, 0);
  },
  scrollToTop: () => {
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  },
  showToast: (message, detail, type = 'success') => {
      set({ toast: { message, detail, type } });
      setTimeout(() => set(s => (s.toast?.message === message && s.toast?.detail === detail ? { toast: null } : {})), 4500);
  },

  handleAuthReady: async (ctx, isFreshHousehold) => {
    set({
      householdCtx: ctx,
      // Land every newly-authenticated session (creator or joining partner) on
      // the main dashboard with a clean slate, even if a stale overlay from a
      // previous session in this tab was still open.
      activeTab: 'TODAY',
      showControlTower: false,
      showRevenueModal: false,
      showDeficitModal: false,
      showHeritageGuide: false,
      showMobileConsole: false,
      selectedPocket: null,
    });
    try {
      const cached = loadLocalCache(ctx.householdId);
      if (cached) set(s => ({ state: { ...s.state, ...cached } }));

      await migrateLegacyLocalStateIfNeeded(ctx, isFreshHousehold);

      const remote = await pullHouseholdState(ctx);
      set(s => {
          const next = { ...s.state, ...remote } as AppState;
          saveLocalCache(ctx.householdId, next);
          return { state: next };
      });
    } catch (e) {
      console.error('Failed to load household state', e);
    }
  },

  // AuthGate only listens for session changes while it's mounted (i.e. before
  // householdCtx resolves); this catches sign-out once the main app is showing.
  // Resets every full-screen overlay too -- otherwise, testing two accounts in
  // the same browser tab (sign out while e.g. ControlTower is open, sign the
  // partner in) leaves that overlay stuck on top of the new session, and
  // since it covers the whole screen, the nav underneath looks unresponsive.
  handleSignOutReset: () => set({
      householdCtx: null,
      state: INITIAL_STATE,
      activeTab: 'TODAY',
      activeLens: 'JOINT',
      showControlTower: false,
      showRevenueModal: false,
      showDeficitModal: false,
      showHeritageGuide: false,
      showMobileConsole: false,
      selectedPocket: null,
      previousState: null,
      toast: null,
  }),

  handleUndo: () => {
    const { previousState } = get();
    if (previousState) {
      set({ state: previousState, previousState: null });
      get().showToast(
        "Action Reverted",
        "Successfully rolled back the last action and restored previous balances.",
        "success"
      );
    }
  },

  togglePrivacyMode: () => {
    set(s => {
      const next = !s.privacyMode;
      localStorage.setItem('SOVEREIGN_OS_PRIVACY_MODE', next ? 'true' : 'false');
      (window as any).privacyShieldActive = next;
      get().showToast(
        next ? "Privacy Shield Engaged" : "Privacy Shield Disengaged",
        next ? "All sensitive balances are now successfully masked across your displays." : "All financial indicators are now fully visible across your displays.",
        "success"
      );
      return { privacyMode: next };
    });
  },

  handleLanguageChange: (lang) => {
    set({ language: 'EN' });
    localStorage.setItem('SOVEREIGN_OS_LANGUAGE', 'EN');
  },

  handleStateUpdate: (newTransactions, newPockets, newPrivateReserves) => {
      const { state } = get();
      set({ previousState: { ...state } });
      const pockets = newPockets || state.pockets;
      const { newPockets: recalculatedPockets } = recalculateState(newTransactions, pockets);
      const totalLiquidity = (Object.values(recalculatedPockets) as Pocket[]).reduce((acc, p) => acc + Math.max(0, p.balance), 0);

      set(s => ({
          state: {
              ...s.state,
              transactions: newTransactions,
              pockets: recalculatedPockets,
              balance: totalLiquidity,
              privateReserves: newPrivateReserves || s.state.privateReserves,
          }
      }));
  },

  handleAddTransaction: (newTx, targetGoalId) => {
      const { state, handleStateUpdate } = get();
      const updatedTransactions = [newTx, ...state.transactions];

      if (targetGoalId) {
          const updatedGoals = state.fortressGoals.map(g => {
              if (g.id === targetGoalId) {
                  return { ...g, currentAmount: g.currentAmount + newTx.amount };
              }
              return g;
          });
          set(s => ({ state: { ...s.state, fortressGoals: updatedGoals } }));
      }

      handleStateUpdate(updatedTransactions, get().state.pockets);
  },

  handleDeleteTransaction: (txToDelete) => {
      const { state, handleStateUpdate } = get();
      const updatedTransactions = state.transactions.filter(t => t.id !== txToDelete.id);
      handleStateUpdate(updatedTransactions);
  },

  initiateWaterfall: (amountInput, ownerId, currency = 'IDR') => {
      const { state, showToast, executeWaterfall } = get();
      const amount = typeof amountInput === 'string' ? parseFloat(amountInput.replace(/[^\d.-]/g, '')) : amountInput;
      if (isNaN(amount) || amount <= 0) {
          showToast("Invalid Amount", "Please input a valid positive amount.", "alert");
          return;
      }

      const rate = state.exchangeRates[currency] || 1;
      const baseAmount = amount * rate;

      const taxRate = state.settings.taxRate || 20;
      const taxWithheld = baseAmount * (taxRate / 100);
      const netAmount = baseAmount - taxWithheld;

      const pocketsList = Object.values(state.pockets) as Pocket[];
      const tier1And2Pockets = pocketsList.filter(p => p.group === 'SANCTUARY' || p.group === 'DAILY');
      const totalShortage = tier1And2Pockets.reduce((acc, p) => {
          const shortage = (p.target || 0) - p.balance;
          return acc + (shortage > 0 ? shortage : 0);
      }, 0);

      if (netAmount < totalShortage) {
          set({
              deficitData: {
                  deficit: totalShortage - netAmount,
                  availableJoint: netAmount,
                  required: totalShortage,
                  ownerId,
                  finalAmount: baseAmount,
                  currency
              },
              showDeficitModal: true,
          });
      } else {
          executeWaterfall(baseAmount, ownerId, currency, false);
      }
  },

  executeWaterfall: (baseAmount, ownerId, currency, isBridged = false) => {
      const { state, showToast, handleStateUpdate } = get();
      set({ showDeficitModal: false, showRevenueModal: false });

      const taxRate = state.settings.taxRate || 20;
      const taxWithheld = baseAmount * (taxRate / 100);

      let netAmountAvailable = baseAmount - taxWithheld;
      let bridgedAmount = 0;

      const pocketsList = Object.values(state.pockets) as Pocket[];
      const tier1And2Pockets = pocketsList.filter(p => p.group === 'SANCTUARY' || p.group === 'DAILY');
      const totalShortage = tier1And2Pockets.reduce((acc, p) => {
          const shortage = (p.target || 0) - p.balance;
          return acc + (shortage > 0 ? shortage : 0);
      }, 0);

      const newPrivateReserves = { ...state.privateReserves };
      if (isBridged && netAmountAvailable < totalShortage) {
          const deficit = totalShortage - netAmountAvailable;
          const availableReserve = newPrivateReserves[ownerId] || 0;
          bridgedAmount = Math.min(deficit, availableReserve);
          newPrivateReserves[ownerId] = Math.max(0, availableReserve - bridgedAmount);
          netAmountAvailable += bridgedAmount;

          showToast("Private Reserve Bridged", `Pulled Rp ${formatIDR(get().privacyMode, get().language, bridgedAmount)} from reserve.`, "success");
      }

      const tempPockets = { ...state.pockets };
      const newTransactions: Transaction[] = [];
      const nowString = new Date().toISOString();
      const earnerName = ownerId === state.user?.id ? (state.user?.name || 'You') : (state.partner?.name || 'Partner');

      const taxPocket = tempPockets[PocketType.TAX_RESERVE];
      if (taxPocket) {
          newTransactions.push({
              id: `tax-${Date.now()}`,
              date: nowString,
              description: `Tax Withholding (PPh) on Revenue from ${earnerName}`,
              amount: taxWithheld,
              netAmount: taxWithheld,
              repaidAmount: 0,
              category: 'Tax Reserve Allocation',
              type: 'INCOME',
              pocket: PocketType.TAX_RESERVE,
              status: 'SETTLED',
              ownerId
          });
      }

      const priorityGroups = ['SANCTUARY', 'DAILY', 'LIFESTYLE'] as const;
      let remainingToDistribute = netAmountAvailable;

      priorityGroups.forEach(group => {
          const groupPockets = pocketsList.filter(p => p.group === group);
          groupPockets.forEach(p => {
              if (remainingToDistribute <= 0) return;

              const shortage = (p.target || 0) - p.balance;
              if (shortage > 0) {
                  const toAllocate = Math.min(shortage, remainingToDistribute);
                  remainingToDistribute -= toAllocate;

                  newTransactions.push({
                      id: `waterfall-${group}-${p.id}-${Date.now()}`,
                      date: nowString,
                      description: `Waterfall Feed -> ${p.name} (${earnerName})`,
                      amount: toAllocate,
                      netAmount: toAllocate,
                      repaidAmount: 0,
                      category: 'Waterfall Distribution',
                      type: 'INCOME',
                      pocket: p.id,
                      status: 'SETTLED',
                      ownerId
                  });
              }
          });
      });

      if (remainingToDistribute > 0) {
          const growthEngine = tempPockets[PocketType.GROWTH];
          const resolvedPocket = growthEngine ? PocketType.GROWTH : PocketType.UNALLOCATED;

          newTransactions.push({
              id: `overflow-${Date.now()}`,
              date: nowString,
              description: `${earnerName}'s Surplus Waterfall Overflow`,
              amount: remainingToDistribute,
              netAmount: remainingToDistribute,
              repaidAmount: 0,
              category: 'Surplus Overflow',
              type: 'INCOME',
              pocket: resolvedPocket,
              status: 'SETTLED',
              ownerId
          });
      }

      const updatedTransactions = [...newTransactions, ...state.transactions];
      handleStateUpdate(updatedTransactions, tempPockets, newPrivateReserves);

      showToast(
          "Waterfall Complete",
          `Allocated Rp ${formatIDR(get().privacyMode, get().language, baseAmount)} (Net: Rp ${formatIDR(get().privacyMode, get().language, baseAmount - taxWithheld)}) successfully.`,
          "success"
      );
  },

  handleInjectRevenue: () => {
      const { revenueForm, showToast, initiateWaterfall } = get();
      const amount = parseFloat(revenueForm.amount.replace(/[^\d.-]/g, ''));
      if (isNaN(amount) || amount <= 0) {
          showToast("Invalid Entry", "Please input a logical salary/revenue amount.", "alert");
          return;
      }
      const ownerId = revenueForm.owner === 'HER' ? 'user_her' : 'user_his';
      initiateWaterfall(amount, ownerId, 'IDR');
  },

  // --- UNIVERSAL AGENT KERNEL TYPES ---
  handleAgentAction: (payload) => {
      console.log("UNIVERSAL AGENT ACTION:", payload);
      let successMessage = payload.responseToUser;
      const {
          state, language, switchTab, handleAddTransaction, handlePocketUpdate, initiateWaterfall,
          handleUpdateUser, handleCreatePocket, handleDeletePocket,
          handleAddGoal, handleDeleteGoal, handleUpdateGoal, showToast,
      } = get() as any;

      switch (payload.action) {
          case 'NAVIGATE':
              if (payload.navigation?.targetTab) {
                  switchTab(payload.navigation.targetTab);
                  successMessage = `Navigating to ${payload.navigation.targetTab}...`;
              }
              break;

          case 'TRANSACTION':
              if (payload.transaction) {
                  const { amount, currency, description, category, type, targetPocketId, isPrivate, splitCount, installments } = payload.transaction;
                  const rate = currency ? state.exchangeRates[currency] || 1 : 1;
                  const baseAmount = amount * rate;

                  const resolvedPocketId = targetPocketId && state.pockets[targetPocketId]
                      ? targetPocketId
                      : PocketType.UNALLOCATED;

                  const isSplit = splitCount && splitCount > 1;
                  const personalShare = isSplit ? (baseAmount / splitCount) : baseAmount;
                  const receivableShare = isSplit ? (baseAmount - personalShare) : 0;

                  const newTx: Transaction = {
                      id: `ai-${Date.now()}`,
                      date: new Date().toISOString(),
                      description: description || "AI Logged Transaction",
                      amount: baseAmount,
                      netAmount: personalShare,
                      repaidAmount: 0,
                      category: category || "Smart Agent Command",
                      type: type || 'EXPENSE',
                      pocket: resolvedPocketId,
                      status: isSplit ? 'PARTNER_RECEIVABLE' : 'SETTLED',
                      ownerId: state.user?.id || 'JOINT',
                      source: isPrivate ? 'PRIVATE' : 'JOINT',
                      isPrivate: isPrivate || false,
                      splitCount: splitCount,
                      receivableAmount: isSplit ? receivableShare : undefined,
                      initialReceivableAmount: isSplit ? receivableShare : undefined,
                      isInstallment: installments && installments > 1 ? true : false,
                      installmentTotalMonths: installments
                  };

                  handleAddTransaction(newTx);
              }
              break;

          case 'UPDATE_POCKET':
              if (payload.pocket) {
                  const { id, name, group, target } = payload.pocket;
                  if (id && state.pockets[id]) {
                      const updates: Partial<Pocket> = {};
                      if (name) updates.name = name;
                      if (group) updates.group = group;
                      if (target !== undefined) updates.target = target;
                      handlePocketUpdate(id, updates);
                  }
              }
              break;

          case 'COLLECT':
              if (payload.collection) {
                  const { amount, currency, context } = payload.collection;
                  const rate = currency ? state.exchangeRates[currency] || 1 : 1;
                  const baseAmount = amount * rate;

                  const newTx: Transaction = {
                      id: `claim-${Date.now()}`,
                      date: new Date().toISOString(),
                      description: `Collect Claim: ${context}`,
                      amount: baseAmount,
                      netAmount: baseAmount,
                      repaidAmount: 0,
                      category: 'Receivable Claim',
                      type: 'INCOME',
                      pocket: PocketType.UNALLOCATED,
                      status: 'PARTNER_RECEIVABLE',
                      receivableAmount: baseAmount,
                      initialReceivableAmount: baseAmount,
                      ownerId: state.partner?.id || 'user_his'
                  };
                  handleAddTransaction(newTx);
              }
              break;

          case 'EXECUTE_WATERFALL':
              if (payload.waterfall) {
                  const { amount, owner, currency } = payload.waterfall;
                  initiateWaterfall(amount, owner === 'HER' ? 'user_her' : 'user_his', currency || 'IDR');
                  successMessage = language === 'ID' ? `Mendistribusikan Rp ${formatIDR(get().privacyMode, language, amount)} ke dalam alokasi dana...` : `Distributing Rp ${formatIDR(get().privacyMode, language, amount)} into allocations...`;
              }
              break;

          case 'UPDATE_USER':
              if (payload.userMutation) {
                  const { targetUser, name, income } = payload.userMutation;
                  const userId = targetUser === 'HER' ? 'user_her' : 'user_his';
                  const updates: Partial<UserType> = {};
                  if (name) updates.name = name;
                  if (income) updates.monthlyIncome = income;
                  handleUpdateUser(userId, updates);
                  successMessage = `Identity confirmed. ${targetUser === 'HER' ? 'Her' : 'His'} name set to ${name || 'Default'}.`;
              }
              break;

          case 'CREATE_POCKET':
              if (payload.pocket && payload.pocket.name) {
                  const { name, group, target } = payload.pocket;
                  const generatedId = `p_${Date.now()}`;
                  const newPocket: Pocket = {
                      id: generatedId,
                      name: name,
                      balance: 0,
                      target: target || 0,
                      group: group || 'DAILY',
                      behavior: 'BUDGET',
                      description: 'AI Generated Pocket',
                      isShared: true
                  };
                  handleCreatePocket(newPocket);
              }
              break;

          case 'DELETE_POCKET':
              if (payload.pocket && payload.pocket.id) {
                  handleDeletePocket(payload.pocket.id);
              }
              break;

          case 'ADD_GOAL':
              if (payload.goal) {
                  const { name, targetAmount } = payload.goal;
                  const newGoal: FortressGoal = {
                      id: `g_${Date.now()}`,
                      name: name || 'Unnamed Pillar',
                      category: 'SINKING_FUND',
                      targetAmount: targetAmount || 10000000,
                      currentAmount: 0,
                      assets: [],
                      ownerId: 'JOINT'
                  };
                  handleAddGoal(newGoal);
              }
              break;

          case 'DELETE_GOAL':
              if (payload.goal && payload.goal.id) {
                  handleDeleteGoal(payload.goal.id);
              }
              break;

          case 'ADD_ASSET':
              if (payload.asset) {
                  const { goalId, name, value, ticker } = payload.asset;
                  const targetGoal = state.fortressGoals.find((g: FortressGoal) => g.id === goalId);
                  if (targetGoal) {
                      const newAsset: Asset = {
                          type: ticker ? 'STOCK' : 'CASH',
                          name: name,
                          value: value,
                          ticker: ticker
                      };
                      const updatedAssets = [...targetGoal.assets, newAsset];
                      const updatedCurrent = targetGoal.currentAmount + value;
                      handleUpdateGoal(goalId, { assets: updatedAssets, currentAmount: updatedCurrent });
                      showToast("Asset Bound", `Registered ${name} in target goal.`, "success");
                  }
              }
              break;
      }

      showToast(language === 'ID' ? "Transaksi Dieksekusi" : "Transaction Executed", successMessage, "success");
  },

  handleUpdateGoal: (id, updates) => {
      const { state } = get();
      set({ previousState: { ...state } });
      set(s => ({ state: { ...s.state, fortressGoals: s.state.fortressGoals.map(g => g.id === id ? { ...g, ...updates } : g) } }));
  },
  handleDeleteGoal: (id) => {
      const { state, showToast } = get();
      set({ previousState: { ...state } });
      set(s => ({ state: { ...s.state, fortressGoals: s.state.fortressGoals.filter(g => g.id !== id) } }));
      showToast("Fortress Adjusted", "Goal Pillar Dissolved", "alert");
  },
  handleAddGoal: (goal) => {
      const { state, showToast } = get();
      set({ previousState: { ...state } });
      set(s => ({ state: { ...s.state, fortressGoals: [...s.state.fortressGoals, goal] } }));
      showToast("Fortress Expanded", `New goal '${goal.name}' established.`, "success");
  },
  handleSealMonth: () => { /* ... */ },
  handleSettleClaim: (tx, amountToSettle) => {
      const { state, handleStateUpdate, showToast } = get();
      const currentOutstanding = tx.receivableAmount || 0;
      const settledAmt = amountToSettle !== undefined ? amountToSettle : currentOutstanding;
      if (settledAmt <= 0) return;

      const remainingRec = Math.max(0, currentOutstanding - settledAmt);

      const newTransactions = state.transactions.map(t => {
          if (t.id === tx.id) {
              return {
                  ...t,
                  receivableAmount: remainingRec,
                  repaidAmount: (t.repaidAmount || 0) + settledAmt,
                  status: (remainingRec <= 0 ? 'SETTLED' : 'PARTNER_RECEIVABLE') as any
              };
          }
          return t;
      });

      // Income refund entry for the specific pocket
      const recollectionTx: Transaction = {
          id: `recollect-${Date.now()}`,
          date: new Date().toISOString(),
          description: `Collected Repayment for: ${tx.description}`,
          amount: settledAmt,
          netAmount: settledAmt,
          repaidAmount: 0,
          category: 'Receivable Settlement',
          type: 'INCOME',
          pocket: tx.pocket || PocketType.UNALLOCATED,
          status: 'SETTLED',
          ownerId: state.user?.id || 'JOINT'
      };

      handleStateUpdate([recollectionTx, ...newTransactions]);

      const targetPocketName = state.pockets[tx.pocket]?.name || 'Unallocated';
      showToast(
          "Receivable Restored",
          `Rp ${formatIDR(get().privacyMode, get().language, settledAmt)} received and credited back to '${targetPocketName}'.`,
          "success"
      );
  },
  handleSettleClientReimbursement: (tx) => {
      const { state, handleStateUpdate, showToast } = get();
      const outstandingAmt = tx.receivableAmount || tx.netAmount;
      const newTransactions = state.transactions.map(t => {
          if (t.id === tx.id) {
              return {
                  ...t,
                  status: 'SETTLED' as any,
                  repaidAmount: outstandingAmt
              };
          }
          return t;
      });

      const reimbursementTx: Transaction = {
          id: `client-reimb-${Date.now()}`,
          date: new Date().toISOString(),
          description: `Client Reimbursement Refund: ${tx.description}`,
          amount: outstandingAmt,
          netAmount: outstandingAmt,
          repaidAmount: 0,
          category: 'Client Refund',
          type: 'INCOME',
          pocket: tx.pocket || PocketType.UNALLOCATED,
          status: 'SETTLED',
          ownerId: 'user_her'
      };

      handleStateUpdate([reimbursementTx, ...newTransactions]);
      showToast(
          "Reimbursement Received",
          `Client refund of Rp ${formatIDR(get().privacyMode, get().language, outstandingAmt)} credited back to Victoria's balance.`,
          "success"
      );
  },
  handleUpdateTransactionNotes: (txId, notes) => {
      const { state } = get();
      const newTransactions = state.transactions.map(t => t.id === txId ? { ...t, payerNotes: notes } : t);
      set(s => ({ state: { ...s.state, transactions: newTransactions } }));
  },
  handleCreatePocket: (pocket) => {
      const { state, handleStateUpdate } = get();
      handleStateUpdate(state.transactions, { ...state.pockets, [pocket.id]: pocket });
  },
  handlePocketUpdate: (id, updates) => {
      const { state, handleStateUpdate } = get();
      handleStateUpdate(state.transactions, { ...state.pockets, [id]: { ...state.pockets[id], ...updates } });
  },
  handleUpdateSettings: (updatedSettings) => {
      set(s => ({
          state: {
              ...s.state,
              settings: {
                  ...s.state.settings,
                  ...updatedSettings
              }
          }
      }));
  },
  handleUpdateUser: (userId, updates) => {
      set(s => {
          const newUser = s.state.user?.id === userId ? { ...s.state.user, ...updates } : s.state.user;
          const newPartner = s.state.partner?.id === userId ? { ...s.state.partner, ...updates } : s.state.partner;
          return { state: { ...s.state, user: newUser as UserType, partner: newPartner as UserType } };
      });
  },
  handleAddLiability: (liability) => {
      const { state, showToast } = get();
      set({ previousState: { ...state } });
      set(s => ({ state: { ...s.state, liabilities: [...s.state.liabilities, liability] } }));
      showToast("Liability Tracked", `${liability.name} added to burden list.`, "alert");
  },
  handleDeletePocket: (pocketId) => {
      const { state, showToast, handleStateUpdate } = get();
      if (pocketId === PocketType.DEBT_SERVICE && state.liabilities.length > 0) {
          showToast("Access Denied", "Cannot delete Debt Service pocket while liabilities are active. Settle them first.", "alert");
          return;
      }
      const newPockets = { ...state.pockets };
      delete newPockets[pocketId];
      const newTx = state.transactions.map(t => t.pocket === pocketId ? { ...t, pocket: PocketType.UNALLOCATED } : t);
      handleStateUpdate(newTx, newPockets);
      showToast("Architect", "Pocket Dissolved.", "success");
      set({ selectedPocket: null });
  },

  handleUpdatePostponedTaskIds: (ids) => {
      set(s => ({ state: { ...s.state, postponedTaskIds: ids } }));
  },

  handleToggleLifeCard: (card) => {
      set(s => ({
          state: {
              ...s.state,
              lifeCards: s.state.lifeCards.some(c => c.id === card.id)
                  ? s.state.lifeCards.map(c => c.id === card.id ? card : c)
                  : [...s.state.lifeCards, card],
          }
      }));
  },

  // Idempotent per calendar day: a visit today after an earlier visit today
  // is a no-op, so the delta shown on this visit compares against the last
  // DIFFERENT day's observation, not against itself moments after roll-forward
  // (which would collapse to a trivial zero, including under React StrictMode's
  // double-invoked effects in dev).
  handleRecordCheckIn: (freedomYear, netWorth) => {
      const { state } = get();
      const today = new Date().toISOString().slice(0, 10);
      if (state.lastCheckDate === today) return;
      set(s => ({
          state: {
              ...s.state,
              lastCheckFreedomYear: freedomYear,
              lastCheckNetWorth: netWorth,
              lastCheckDate: today,
          }
      }));
  },
}));

// One-time exchange-rate bootstrap (was App.tsx's `initRates` effect, empty
// deps -- runs once per page load, not once per store instance re-render).
getExchangeRates().then(rates => {
    useStore.setState(s => ({ state: { ...s.state, exchangeRates: rates } }));
});
