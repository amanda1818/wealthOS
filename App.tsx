import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { PocketType } from './types';
import { useStore, setMainScrollEl } from './state/store';
import { formatCompact } from './state/selectors';
import AuthGate from './components/Auth';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import Assistant from './components/Assistant';
import PocketDetail from './components/PocketDetail';
import ControlTower from './components/ControlTower';
import WeeklyReport from './components/WeeklyReport';
import Today from './routes/Today';
import Flow from './routes/Flow';
import FreedomRoute from './routes/Freedom';
import Mine from './routes/Mine';
import Together from './routes/Together';
import { onAuthStateChange } from './services/authService';
import { saveLocalCache, pushHouseholdState } from './services/syncService';

const App: React.FC = () => {
  const householdCtx = useStore(s => s.householdCtx);
  const state = useStore(s => s.state);
  const activeTab = useStore(s => s.activeTab);
  const activeLens = useStore(s => s.activeLens);
  const language = useStore(s => s.language);
  const privacyMode = useStore(s => s.privacyMode);
  const toast = useStore(s => s.toast);
  const showControlTower = useStore(s => s.showControlTower);
  const setShowControlTower = useStore(s => s.setShowControlTower);
  const showWeeklyReport = useStore(s => s.showWeeklyReport);
  const setShowWeeklyReport = useStore(s => s.setShowWeeklyReport);

  const showRevenueModal = useStore(s => s.showRevenueModal);
  const setShowRevenueModal = useStore(s => s.setShowRevenueModal);
  const revenueForm = useStore(s => s.revenueForm);
  const setRevenueForm = useStore(s => s.setRevenueForm);
  const handleInjectRevenue = useStore(s => s.handleInjectRevenue);

  const showDeficitModal = useStore(s => s.showDeficitModal);
  const setShowDeficitModal = useStore(s => s.setShowDeficitModal);
  const deficitData = useStore(s => s.deficitData);
  const executeWaterfall = useStore(s => s.executeWaterfall);

  const selectedPocket = useStore(s => s.selectedPocket);
  const setSelectedPocket = useStore(s => s.setSelectedPocket);
  const handlePocketUpdate = useStore(s => s.handlePocketUpdate);
  const handleDeletePocket = useStore(s => s.handleDeletePocket);
  const handleAddTransaction = useStore(s => s.handleAddTransaction);
  const handleDeleteTransaction = useStore(s => s.handleDeleteTransaction);

  const isPremium = useStore(s => s.isPremium);
  const setIsPremium = useStore(s => s.setIsPremium);
  const switchTab = useStore(s => s.switchTab);
  const handleUpdatePostponedTaskIds = useStore(s => s.handleUpdatePostponedTaskIds);
  const handleUpdateChatHistory = (h: typeof state.advisorChatHistory) => useStore.setState(s => ({ state: { ...s.state, advisorChatHistory: h } }));

  const handleAuthReady = useStore(s => s.handleAuthReady);
  const handleSignOutReset = useStore(s => s.handleSignOutReset);
  const handleUpdateUser = useStore(s => s.handleUpdateUser);
  const handleUpdateSettings = useStore(s => s.handleUpdateSettings);
  const handleCreatePocket = useStore(s => s.handleCreatePocket);
  const handleAddGoal = useStore(s => s.handleAddGoal);
  const handleDeleteGoal = useStore(s => s.handleDeleteGoal);
  const handleAddLiability = useStore(s => s.handleAddLiability);
  const handleSealMonth = useStore(s => s.handleSealMonth);
  const handleLanguageChange = useStore(s => s.handleLanguageChange);

  // Persistence is driven by handleAuthReady (Supabase pull on sign-in) and
  // this debounced push on state change -- see services/syncService.ts.
  // localStorage survives only as its offline cache.
  useEffect(() => {
      if (!householdCtx) return;

      saveLocalCache(householdCtx.householdId, state);
      const timeout = setTimeout(() => {
          pushHouseholdState(householdCtx, state).catch(e => console.error('Household sync push failed', e));
      }, 800);

      // AUTO-CALCULATE DEBT SERVICE TARGET. Only touches the pocket if it
      // already exists -- a fresh household has no pockets yet, and
      // handlePocketUpdate spreads `state.pockets[id]` verbatim, so calling
      // it on a missing id would silently create a malformed pocket with no
      // id/name/group (which then crashes anything that renders it).
      const debtServicePocket = state.pockets[PocketType.DEBT_SERVICE];
      const monthlyDebtService = state.liabilities.reduce((acc, l) => acc + l.monthlyPayment, 0);
      if (debtServicePocket && debtServicePocket.target !== monthlyDebtService) {
          handlePocketUpdate(PocketType.DEBT_SERVICE, { target: monthlyDebtService });
      }

      return () => clearTimeout(timeout);
  }, [householdCtx, state.pockets, state.transactions, state.fortressGoals, state.user, state.partner, state.liabilities, state.recurringObligations, state.lifeCards, state.advisorChatHistory, state.history, state.settings, state.settlementBalance, state.privateReserves, state.postponedTaskIds, state.lastCheckFreedomYear, state.lastCheckNetWorth, state.lastCheckDate, state.lastReportFreedomYear, state.lastReportNetWorth, state.lastReportDate]);

  // AuthGate only listens for session changes while it's mounted (i.e. before
  // householdCtx resolves); this catches sign-out once the main app is showing.
  // Resets every full-screen overlay too -- otherwise, testing two accounts in
  // the same browser tab (sign out while e.g. ControlTower is open, sign the
  // partner in) leaves that overlay stuck on top of the new session, and
  // since it covers the whole screen, the nav underneath looks unresponsive.
  useEffect(() => {
      const sub = onAuthStateChange((session) => {
          if (!session) handleSignOutReset();
      });
      return () => sub.unsubscribe();
  }, []);

  // --- HARDWARE BACK BUTTON LOGIC ---
  useEffect(() => {
      const handlePopState = () => {
          if (selectedPocket) setSelectedPocket(null);
      };

      if (selectedPocket) {
          window.history.pushState({ pocket: true }, '');
          window.addEventListener('popstate', handlePopState);
      }

      return () => {
          window.removeEventListener('popstate', handlePopState);
      };
  }, [selectedPocket]);

  const getBgClass = () => {
      if (activeLens === 'HER') return 'bg-[#F0FDF4]/30';
      if (activeLens === 'HIS') return 'bg-[#F8FAFC]/50';
      return 'bg-wealth-bg';
  };

  if (!householdCtx) return <AuthGate onReady={handleAuthReady} />;
  if (!state.user) return null;

  return (
    <div className={`h-screen w-full text-wealth-text font-sans flex flex-col transition-colors duration-1000 ${getBgClass()}`}>
      {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
              <div className={`text-white backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-wealth-gold/30 ${toast.type === 'alert' ? 'bg-rose-700/95' : 'bg-wealth-emerald/95'}`}>
                   {toast.type === 'alert' ? <AlertTriangle size={24} className="text-white" /> : <CheckCircle2 size={24} className="text-white" />}
                   <div>
                       <div className="font-serif font-bold text-lg leading-none">{toast.message}</div>
                       <div className="text-[10px] uppercase tracking-widest opacity-80 mt-1">{toast.detail}</div>
                   </div>
              </div>
          </div>
      )}
      {/* Route: the main dashboard chrome is swapped out entirely while
          Settings or the Weekly Report is open, rather than layered
          underneath it -- both are screens you navigate to, not overlays
          stacked on top. */}
      {!showControlTower && !showWeeklyReport && (
        <>
          <AppHeader />

          {/* Main Content: Responsive Fluid Page Layout */}
          <main ref={setMainScrollEl} className="flex-1 overflow-y-auto w-full bg-sand-50 relative pb-36 lg:pb-44 scroll-smooth z-0">
              <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 grid grid-cols-12 gap-8 items-start">

                  {/* Main Content Area */}
                  <div id="main-interaction-content-panel" className="col-span-12 lg:col-span-12 max-w-4xl mx-auto w-full order-2 lg:order-1 bg-white rounded-[2.5rem] border border-sand-200 shadow-sm flex flex-col overflow-hidden">
                    {/* Tab content container - expands naturally to prevent any word cutting or nested scrollbars */}
                    <div className="p-6 md:p-10 lg:p-12 space-y-8">
                        <div className={activeTab === 'TODAY' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                            <Today />
                        </div>
                        <div className={activeTab === 'FLOW' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                            <Flow />
                        </div>
                        <div className={activeTab === 'FREEDOM' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                            <FreedomRoute />
                        </div>
                        <div className={activeTab === 'MINE' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                            <Mine />
                        </div>
                        {/* Conditionally mounted, unlike the other four surfaces -- it
                            records a real check-in observation on mount (see
                            routes/Together.tsx), which needs to fire on each actual
                            visit rather than once per page load. */}
                        <div className={activeTab === 'TOGETHER' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                            {activeTab === 'TOGETHER' && <Together />}
                        </div>
                    </div>
                  </div>

              </div>
          </main>

          <BottomNav />

          {/* Inject Revenue -- bottom sheet, confirm-style single action */}
          <BottomSheet isOpen={showRevenueModal} onClose={() => setShowRevenueModal(false)} title="Inject Revenue">
              <div className="space-y-4">
                  <div>
                      <label className="text-[9px] uppercase font-bold text-wealth-muted block mb-1">Earner</label>
                      <div className="flex gap-2">
                          <button onClick={() => setRevenueForm({ owner: 'HER' })} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${revenueForm.owner === 'HER' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-white border border-wealth-border'}`}>{state.user?.name || 'You'}</button>
                          <button onClick={() => setRevenueForm({ owner: 'HIS' })} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${revenueForm.owner === 'HIS' ? 'bg-slate-50 border border-slate-200 text-slate-700' : 'bg-white border border-wealth-border'}`}>{state.partner?.name || 'Partner'}</button>
                      </div>
                  </div>
                  <div>
                      <label className="text-[9px] uppercase font-bold text-wealth-muted block mb-1">Amount</label>
                      <input type="text" value={revenueForm.amount} onChange={e => setRevenueForm({ amount: e.target.value })} className="w-full text-2xl font-serif font-bold border-b border-wealth-gold bg-transparent focus:outline-none" placeholder="0" autoFocus />
                  </div>
                  <button onClick={handleInjectRevenue} className="w-full py-3 bg-wealth-emerald text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-emerald-800 mt-4">Execute Waterfall</button>
              </div>
          </BottomSheet>

          {/* Deficit warning -- bottom sheet, custom rose-tinted header instead of
              the shared title bar so the warning stays visually distinct */}
          <BottomSheet isOpen={showDeficitModal && !!deficitData} onClose={() => setShowDeficitModal(false)}>
              {deficitData && (
                  <>
                      <div className="flex justify-between items-center mb-4 border-b border-rose-100 pb-2">
                          <div className="flex items-center gap-3 text-rose-700">
                              <AlertTriangle size={24} />
                              <h3 className="font-serif font-bold text-xl">Executive Deficit Warning</h3>
                          </div>
                          <button
                              onClick={() => setShowDeficitModal(false)}
                              className="text-sand-400 hover:text-sand-950 rounded p-1 transition-colors"
                              title="Close"
                          >
                              <X size={18} />
                          </button>
                      </div>

                      <div className="space-y-4 mb-6">
                          <p className="text-sm text-wealth-text leading-relaxed">
                              Your Joint Pact ({formatCompact(privacyMode, language, deficitData.availableJoint)}) is insufficient to cover Tier 1 & 2 leads ({formatCompact(privacyMode, language, deficitData.required)}).
                          </p>
                          <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-rose-800">Deficit</span>
                                <span className="text-xl font-serif font-bold text-rose-700">Rp {formatCompact(privacyMode, language, deficitData.deficit)}</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <button
                              onClick={() => executeWaterfall(deficitData.finalAmount, deficitData.ownerId, deficitData.currency, false)}
                              className="py-3 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-300"
                          >
                              Accept Deficit
                              <span className="block text-[8px] opacity-70 font-normal normal-case">Leave pockets partially unfunded</span>
                          </button>
                          <button
                              onClick={() => executeWaterfall(deficitData.finalAmount, deficitData.ownerId, deficitData.currency, true)}
                              className="py-3 bg-wealth-emerald text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-800 shadow-lg"
                          >
                              Bridge Gap
                              <span className="block text-[8px] opacity-80 font-normal normal-case">Pull from Private Reserve</span>
                          </button>
                      </div>
                  </>
              )}
          </BottomSheet>

          <Assistant
            state={state}
            language={language}
            switchTab={switchTab}
            onUpdateChatHistory={handleUpdateChatHistory}
            postponedTaskIds={state.postponedTaskIds}
            onUpdatePostponedTaskIds={handleUpdatePostponedTaskIds}
            isPremium={isPremium}
            onUpgrade={() => setIsPremium(true)}
          />

          {selectedPocket && (
              <PocketDetail
                pocket={selectedPocket}
                transactions={state.transactions}
                fortressGoals={state.fortressGoals}
                onClose={() => setSelectedPocket(null)}
                onUpdate={handlePocketUpdate}
                onDelete={handleDeletePocket}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                language={language}
                userName={state.user?.name}
                partnerName={state.partner?.name}
              />
          )}

        </>
      )}

      {showControlTower && (
          <ControlTower
             state={state}
             householdId={householdCtx?.householdId || ''}
             onClose={() => setShowControlTower(false)}
             onUpdatePact={(id, s) => handleUpdateUser(id, { allocationStrategy: { ...state.user?.allocationStrategy, ...s } })}
             onUpdatePocket={handlePocketUpdate}
             onUpdateSettings={handleUpdateSettings}
             onCreatePocket={handleCreatePocket}
             onDeletePocket={handleDeletePocket}
             onUpdateUser={handleUpdateUser}
             onAddGoal={handleAddGoal}
             onDeleteGoal={handleDeleteGoal}
             onAddLiability={handleAddLiability}
             onSealMonth={handleSealMonth}
             language={language}
             onLanguageChange={handleLanguageChange}
          />
      )}

      {showWeeklyReport && (
          <WeeklyReport onClose={() => setShowWeeklyReport(false)} />
      )}

    </div>
  );
};

export default App;
