import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Info,
  Scale
} from 'lucide-react';
import { AppState } from '../types';

interface IntelligenceDeskProps {
  state: AppState;
  language?: 'EN' | 'ID';
}

const IntelligenceDesk: React.FC<IntelligenceDeskProps> = ({ state, language = 'EN' }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeTransactions = state.transactions.filter(t => t.date.startsWith(currentMonth));

  // Toggle state for calculation detail
  const [showRateDetail, setShowRateDetail] = useState(false);

  // --- MATH CALCULATIONS ---
  const inflowTx = activeTransactions.filter(t => t.type === 'INCOME' || t.type === 'REVENUE');
  const outflowTx = activeTransactions.filter(t => t.type === 'EXPENSE' || t.type === 'INVESTMENT' || t.type === 'DEBT_PAYMENT');

  const totalIncome = inflowTx.reduce((acc, t) => acc + t.netAmount, 0);
  const totalExpense = outflowTx.reduce((acc, t) => acc + t.netAmount, 0);

  const surplus = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { 
      maximumFractionDigits: 0 
    }).format(num);
  };

  const getSovereignRank = () => {
    if (savingsRate > 70) {
      return { 
        title: language === 'ID' ? 'Surplus Maksimal' : 'Optimal Surplus', 
        color: 'text-[#06402B] bg-[#06402B]/10 border-[#06402B]/20' 
      };
    }
    if (savingsRate >= 40) {
      return { 
        title: language === 'ID' ? 'Aman & Sehat' : 'Secure & Healthy', 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200' 
      };
    }
    if (savingsRate >= 20) {
      return { 
        title: language === 'ID' ? 'Keseimbangan Cukup' : 'Marginal Savings', 
        color: 'text-amber-700 bg-amber-50 border-amber-200' 
      };
    }
    return { 
      title: language === 'ID' ? 'Rasio Defisit/Kritis' : 'Deficit Watch', 
      color: 'text-rose-700 bg-rose-50 border-rose-200' 
    };
  };

  const rank = getSovereignRank();

  return (
    <div id="dynamic_savings_rate" className="space-y-3.5">
      {/* Dynamic Savings Rate Card */}
      <div 
        onClick={() => setShowRateDetail(!showRateDetail)}
        className={`p-5 bg-white rounded-3xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
          showRateDetail ? 'border-[#06402B] shadow-sm ring-1 ring-[#06402B]/10' : 'border-[#E2D9C8] hover:border-[#06402B]/50'
        }`}
        title={language === 'ID' ? "Klik untuk melihat analisis rumus detail" : "Click to view mathematical breakdown"}
      >
        <div className="flex justify-between items-center">
          <span className="text-[9px] uppercase tracking-wider font-mono font-black text-sand-500">
            {language === 'ID' ? 'Rasio Tabungan Dinamis' : 'Dynamic Savings Rate'}
          </span>
          <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${rank.color}`}>
            {rank.title}
          </span>
        </div>
        
        <div className="flex items-baseline gap-1.5 mt-3 mb-2">
          <span className="text-3xl font-serif font-black text-[#06402B]">{savingsRate.toFixed(1)}%</span>
          <span className="text-[10px] font-sans text-sand-600 font-bold">
            {language === 'ID' ? 'margin surplus bulan ini' : 'surplus margin this month'}
          </span>
        </div>

        <div className="w-full bg-sand-100 h-1.5 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-[#06402B] transition-all duration-700" 
            style={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between items-center text-[8.5px] font-mono text-[#06402B]/85 font-black uppercase tracking-wider">
          <span>{language === 'ID' ? "KLIK UNTUK AUDIT RUMUS MATEMATIS" : "CLICK FOR FORMULA AUDIT"}</span>
          {showRateDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </div>
      </div>

      {/* Math Audit Breakdown Disclosure */}
      {showRateDetail && (
        <div className="p-5 bg-[#FAF9F5] border border-[#E2D9C8] rounded-3xl space-y-3.5 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-1.5 border-b border-[#E2D9C8]/50 pb-2.5">
            <Scale size={13} className="text-[#06402B]" />
            <h4 className="text-[9px] uppercase font-mono font-black text-[#06402B] tracking-wider">
              {language === 'ID' ? "Metrik & Formula Surplus" : "Sovereign Savings Formula"}
            </h4>
          </div>
          
          <div className="space-y-2.5 text-[11px] text-stone-700">
            <div className="flex justify-between items-start gap-1 border-b border-dashed border-stone-200 pb-2.5">
              <div>
                <span className="font-bold text-stone-900 block">
                  {language === 'ID' ? 'Total Aliran Masuk (Inflows)' : 'Total Inflows (Incomes & Revenues)'}
                </span>
                <span className="text-[8.5px] text-stone-400 font-mono">
                  {language === 'ID' ? 'Gaji, omset bisnis aktif, deviden cair' : 'Payroll, active business draws, sales'}
                </span>
              </div>
              <span className="font-mono font-black text-[#06402B] text-right">Rp {formatIDR(totalIncome)}</span>
            </div>

            {totalIncome > 0 && (
              <div className="pl-3.5 space-y-1 max-h-24 overflow-y-auto pr-1 border-l-2 border-[#06402B]/15 text-[10px] text-stone-500 font-mono">
                {inflowTx.map((tx) => (
                  <div key={tx.id} className="flex justify-between select-none">
                    <span className="truncate">➔ {tx.description}</span>
                    <span className="font-bold text-stone-700">Rp {formatIDR(tx.netAmount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-start gap-1 border-b border-dashed border-stone-200 pb-2.5">
              <div>
                <span className="font-bold text-stone-900 block">
                  {language === 'ID' ? 'Total Aliran Keluar (Outflows)' : 'Total Outflows (Expenses & Payments)'}
                </span>
                <span className="text-[8.5px] text-stone-400 font-mono">
                  {language === 'ID' ? 'Pengeluaran operasional, pajak, belanja' : 'Opex, staff payroll, lifestyle splits'}
                </span>
              </div>
              <span className="font-mono font-black text-rose-800 text-right">- Rp {formatIDR(totalExpense)}</span>
            </div>

            {totalExpense > 0 && (
              <div className="pl-3.5 space-y-1 max-h-24 overflow-y-auto pr-1 border-l-2 border-rose-800/15 text-[10px] text-stone-500 font-mono">
                {outflowTx.map((tx) => (
                  <div key={tx.id} className="flex justify-between select-none">
                    <span className="truncate text-rose-950/80">➔ {tx.description}</span>
                    <span className="font-bold text-rose-950/80">Rp {formatIDR(tx.netAmount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 bg-white rounded-xl border border-[#E2D9C8]/60 font-mono text-[10.5px]">
              <span className="font-black text-stone-900 uppercase block text-[8.5px] mb-1.5 tracking-wider">
                {language === 'ID' ? "FORMULA TRANSPARAN" : "FORMULATION MATH"}
              </span>
              <div className="space-y-1.5 text-stone-600">
                <div className="flex justify-between">
                  <span>{language === 'ID' ? "Surplus Bersih (A - B) :" : "Net Surplus (A - B) :"}</span>
                  <span className="font-bold text-stone-900">Rp {formatIDR(surplus)}</span>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-1.5 mt-1.5 font-bold text-[#06402B]">
                  <span>{language === 'ID' ? "Rasio (Surplus / Inflow) :" : "Rate (Surplus / Inflow) :"}</span>
                  <span>
                    (Rp {formatIDR(surplus)} / Rp {formatIDR(totalIncome)}) × 100 = <span className="underline font-black text-xs">{savingsRate.toFixed(1)}%</span>
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-[9px] italic text-[#06402B]/85 font-medium text-center leading-normal">
              {language === 'ID' 
                ? "💡 Rasio ini mengukur efisiensi jatah bulanan yang tersisa untuk dialokasikan kembali ke Brankas Masa Depan." 
                : "💡 This measures exact liquid efficiency representing cash remaining for investments and reserves."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceDesk;
