import React, { useState } from 'react';
import { X, Sparkles, Droplets, Zap } from 'lucide-react';
import { Pocket } from '../types';
import { useStore } from '../state/store';
import { computeDerived } from '../state/selectors';
import ExecutiveDashboard from '../components/ExecutiveDashboard';
import ActiveTasks from '../components/ActiveTasks';

const Today: React.FC = () => {
  const state = useStore(s => s.state);
  const activeLens = useStore(s => s.activeLens);
  const language = useStore(s => s.language);
  const showHeritageGuide = useStore(s => s.showHeritageGuide);
  const setShowHeritageGuide = useStore(s => s.setShowHeritageGuide);
  const setShowRevenueModal = useStore(s => s.setShowRevenueModal);
  const switchTab = useStore(s => s.switchTab);
  const handleSettleClaim = useStore(s => s.handleSettleClaim);
  const handleUpdateTransactionNotes = useStore(s => s.handleUpdateTransactionNotes);
  const handleSettleClientReimbursement = useStore(s => s.handleSettleClientReimbursement);

  const [dashboardMonth, setDashboardMonth] = useState<string>(new Date().toISOString().substring(0, 7));

  const derived = computeDerived(state, activeLens, language);
  const pocketsList = derived.pocketsList as Pocket[];

  // Calculate Actual Spend For This Month based on dashboardMonth
  const dashboardSelectedDate = new Date(dashboardMonth + '-01');
  const currentMonthName = dashboardSelectedDate.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
  const actualSpendThisMonth = state.transactions
    .filter(t => t.date.startsWith(dashboardMonth) && (t.type === 'EXPENSE' || t.type === 'DEBT_PAYMENT'))
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalAllocatedThisMonth = pocketsList.reduce((acc, p) => acc + (p.target || 0), 0);

  return (
    <div className="space-y-6">
      {showHeritageGuide && (
        <div className="bg-[#FAF8F0] border-2 border-[#E2D9C8] rounded-2xl p-5 relative overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => { localStorage.setItem('dismissed_heritage_guide', 'true'); setShowHeritageGuide(false); }}
            className="absolute top-4 right-4 p-1 text-sand-400 hover:text-sand-700 transition"
            title={language === 'ID' ? "Tutup panduan" : "Dismiss guide"}
          >
            <X size={16} />
          </button>
          <div className="flex gap-4">
            <div className="p-3 bg-[#06402B]/5 border border-[#06402B]/10 rounded-xl h-fit shrink-0">
              <Sparkles className="text-[#06402B]" size={20} />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-serif font-black text-rose-950 font-serif text-sm">
                  {language === 'ID' ? 'Prinsip Dasar Saldo Saku / Anggaran Heritage' : 'Heritage Budget & Pocket Principles'}
                </h3>
                <p className="text-[10px] text-sand-500 font-bold font-mono uppercase tracking-wider mt-0.5">
                  {language === 'ID' ? 'Petunjuk cara membaca saldo anggaran saku & cicilan' : 'Immediate guide to reading budget remaining logs & liabilities'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed text-sand-800">
                {/* Principle 1: Pockets as Budgets */}
                <div className="space-y-1.5 p-3.5 bg-white/60 border border-[#E2D9C8]/60 rounded-xl">
                  <h4 className="font-bold text-[#06402B] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06402B]"></span>
                    {language === 'ID' ? '1. Pocket = Sisa Batas Belanja Bulanan' : '1. Pockets represent Spent Budgets'}
                  </h4>
                  <p className="leading-relaxed text-[11px] text-sand-600">
                    {language === 'ID'
                      ? 'Kantong bukanlah target tabungan yang harus selalu terisi 100%. Saldo (misal 6,7 jt dari target saku 7 jt) menunjukkan sisa dana belanja aman bulan ini. Sangat sehat! Pengisian ulang (Refill) direkomendasikan jika saldo sisa menyusut di bawah 20% limit anggaran.'
                      : 'Pockets track remaining spending budgets, not savings targets. If your available budget is high (e.g. 6.7M remaining out of 7M ceiling), it is pristine. Refilling is recommended ONLY when the balance dips below 20% of your limit.'}
                  </p>
                </div>

                {/* Principle 2: Cicilan & Pinjaman */}
                <div className="space-y-1.5 p-3.5 bg-white/60 border border-[#E2D9C8]/60 rounded-xl">
                  <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-700"></span>
                    {language === 'ID' ? '2. Cicilan & Pinjaman (Loan Service)' : '2. Cicilan & Pinjaman (Loan Service)'}
                  </h4>
                  <p className="leading-relaxed text-[11px] text-sand-600">
                    {language === 'ID'
                      ? 'Sebelumnya bernama "Debt Service", kantong ini secara otomatis menghitung total seluruh beban cicilan KPR / aset berjalan Anda (seperti Menteng Mortgage & Berlin Property, total Rp 27.000.000) agar penyediaan likuiditas Anda terkontrol aman.'
                      : 'Formerly named "Debt Service", this pocket calculates cumulative installments due for your active asset loans (Menteng Compound & Berlin Property, totaling Rp 27,000,000) to secure your leverage.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px]">
                <span className="text-sand-400 font-medium font-sans">
                  {language === 'ID' ? '💡 Ketuk saku manapun di tab "Alokasi" untuk analisis mendalam.' : '💡 Click on any pocket in the "Allocation" tab to inspect details.'}
                </span>
                <button
                  onClick={() => { localStorage.setItem('dismissed_heritage_guide', 'true'); setShowHeritageGuide(false); }}
                  className="px-4 py-1.5 bg-[#06402B] hover:bg-[#0d543b] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg font-display transition duration-200"
                >
                  {language === 'ID' ? 'Saya Mengerti' : 'I Understand'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ExecutiveDashboard
        spendableCash={derived.spendableCash}
        spendableCashLabel={derived.spendableCashLabel}
        spendableCashDescription={derived.spendableCashDescription}
        liquidCash={derived.totalPocketCash}
        privateReserve={derived.privateReserveForLens}
        householdNetWorth={derived.householdNetWorth}
        netWorthGoals={derived.netWorthGoals}
        netWorthPocketCash={derived.netWorthPocketCash}
        netWorthReceivables={derived.netWorthReceivables}
        systemBurden={derived.systemBurden}
        sovereigntyGap={derived.sovereigntyGap}
        monthlyPassive={derived.monthlyPassive}
        monthlyBurn={derived.monthlyBurn}
        actualSpendThisMonth={actualSpendThisMonth}
        totalAllocatedThisMonth={totalAllocatedThisMonth}
        currentMonthName={currentMonthName}
        dashboardMonth={dashboardMonth}
        onMonthChange={setDashboardMonth}
        language={language}
        balanceHidden={derived.isBalanceHiddenForLens}
      />

      <ActiveTasks
        language={language}
        transactions={state.transactions}
        liabilities={state.liabilities}
        onSettleClaim={handleSettleClaim}
        onUpdateTransactionNotes={handleUpdateTransactionNotes}
        onSettleClientReimbursement={handleSettleClientReimbursement}
        cfoName={(state.user?.role === 'CFO' ? state.user.name : state.partner?.role === 'CFO' ? state.partner.name : undefined) || 'Partner A'}
      />

      {/* Compact Executive Quick Actions - high density and instantly visible at the bottom of the dashboard pane */}
      <div className="grid grid-cols-2 gap-3">
        <button
          id="dashboard-inject-rev-btn"
          onClick={() => setShowRevenueModal(true)}
          className="py-3 px-4 bg-[#06402B] hover:bg-[#0d543b] text-white rounded-xl shadow-sm border border-[#0d543b] flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow"
        >
          <Droplets className="text-white/90" size={15} />
          <span className="text-[11px] font-sans font-bold uppercase tracking-widest">{language === 'ID' ? "Suntik Dana" : "Inject Capital"}</span>
        </button>
        <button
          id="dashboard-manage-flow-btn"
          onClick={() => switchTab('FLOW')}
          className="py-3 px-4 bg-white hover:bg-sand-50 text-sand-950 rounded-xl shadow-sm border border-sand-200 flex flex-center items-center justify-center gap-2 transition-all active:scale-95 hover:border-sand-300"
        >
          <Zap size={15} className="text-[#06402B]" />
          <span className="text-[11px] font-sans font-bold uppercase tracking-widest">{language === 'ID' ? "Kelola Aliran" : "Manage Flow"}</span>
        </button>
      </div>
    </div>
  );
};

export default Today;
