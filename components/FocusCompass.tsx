import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  ChevronRight, 
  Coins, 
  Cat, 
  Zap, 
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { AppState, PocketType, Transaction } from '../types';
import { getPocketName } from './PocketCard';

interface FocusCompassProps {
  state: AppState;
  onAddTransaction: (newTx: Transaction) => void;
  onNavigateTab: (tab: 'DASHBOARD' | 'COMMAND' | 'FORTRESS' | 'CHRONICLE') => void;
  language?: 'EN' | 'ID';
}

interface DynamicNudge {
  id: string;
  category: 'FINANCIAL' | 'POCKET' | 'REIMBURSEMENT' | 'MOTIVATION';
  title: string;
  description: string;
  actionLabel: string;
  solveAction: () => void;
  severity: 'URGENT' | 'RECOMMENDED' | 'DOPAMINE';
}

export const FocusCompass: React.FC<FocusCompassProps> = ({ state, onAddTransaction, onNavigateTab, language = 'EN' }) => {
  const [nudges, setNudges] = useState<DynamicNudge[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const list: DynamicNudge[] = [];
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    // 1. Check for Deficit / Critically Low Envelopes (< 15%)
    Object.values(state.pockets).forEach((pocket) => {
      const isNegative = pocket.balance < 0;
      const isCriticallyLow = pocket.target && pocket.target > 0 && pocket.balance < (pocket.target * 0.15);
      const displayName = getPocketName(pocket, language);
      
      if (isNegative) {
        list.push({
          id: `pocket-deficit-${pocket.id}`,
          category: 'POCKET',
          title: language === 'ID' ? `⚠️ Saku '${displayName}' Minus!` : `⚠️ Cash Deficit Alert: '${displayName}' Envelope`,
          description: language === 'ID'
            ? `Saldo saat ini negatif Rp ${Math.abs(pocket.balance).toLocaleString()}. Segera jalankan aliran Liquid Waterfall untuk menyeimbangkan posisi.`
            : `Envelope is currently running negative by Rp ${Math.abs(pocket.balance).toLocaleString()}. Run the Cascading Waterfall to balance this slot.`,
          actionLabel: language === 'ID' ? 'Buka Air Terjun Kas' : 'Trigger Cash Waterfall Flow',
          severity: 'URGENT',
          solveAction: () => {
            onNavigateTab('COMMAND');
            showCompassFeedback(language === 'ID' ? "Mengalihkan ke panel Liquidity Command..." : "Navigated to Command Center. Shift your balances.");
          }
        });
      } else if (isCriticallyLow) {
        list.push({
          id: `pocket-low-${pocket.id}`,
          category: 'POCKET',
          title: language === 'ID' ? `⚡ Saku '${displayName}' Hampir Habis` : `⚡ Critical Cap: Refill '${displayName}'`,
          description: language === 'ID'
            ? `Saldo Saku berada di bawah 15% dari target perlindungan bulanan.`
            : `Safe ceiling dropped below 15% of your target monthly reserve.`,
          actionLabel: language === 'ID' ? 'Alokasikan Likuiditas' : 'Go to Liquidity Command Unit',
          severity: 'RECOMMENDED',
          solveAction: () => {
            onNavigateTab('COMMAND');
            showCompassFeedback(language === 'ID' ? "Menuju Panel Aliran Kas..." : "Ready to adjust envelope distributions.");
          }
        });
      }
    });

    // 2. High Spends this week
    const recentSpends = state.transactions.filter(t => t.date.startsWith(currentMonth) && t.type === 'EXPENSE');
    const totalWeeklySpend = recentSpends.reduce((a,b)=>a+(b.amount || 0), 0);
    if(totalWeeklySpend > 5000000) {
       list.push({
          id: 'high-spend-alert',
          category: 'FINANCIAL',
          title: language === 'ID' ? "📈 Peringatan: Akselerasi Pengeluaran" : "📈 Alert: Expenditure Acceleration",
          description: language === 'ID'
            ? `Tingkat pembakaran kas Anda bulan ini melampaui rata-rata. Apakah ada pembelian tidak terduga?`
            : `Your cash burn rate is trending unusually high this period. Did an unplanned expense slip in?`,
          actionLabel: language === 'ID' ? 'Tinjau Ledger' : 'Review Statement Feed',
          severity: 'RECOMMENDED',
          solveAction: () => {
            onNavigateTab('CHRONICLE');
            showCompassFeedback(language === 'ID' ? "Menuju Ledger..." : "Navigating to Ledger statements.");
          }
        });
    }

    // 3. Outstanding Corporate Reimbursements Check
    const activeReimbursements = state.transactions.filter(t => t.status === 'PENDING_REIMBURSEMENT');
    if (activeReimbursements.length > 0) {
      const outstandingSum = activeReimbursements.reduce((acc, current) => acc + (current.receivableAmount || 0), 0);
      list.push({
        id: 'reimbursements-badge',
        category: 'REIMBURSEMENT',
        title: language === 'ID' ? "💰 Dana Talangan Kantor Mengendap!" : "💰 Unclaimed Corporate Cash Gap!",
        description: language === 'ID'
          ? `Ada dana Rp ${outstandingSum.toLocaleString()} talangan pribadi yang belum dicairkan dari kantor. Amankan likuiditas keluarga!`
          : `You have Rp ${outstandingSum.toLocaleString()} in advanced business expenses pending recovery. Claim these now.`,
        actionLabel: language === 'ID' ? 'Tutup Piutang Kantor' : 'Clear Outstanding Claims',
        severity: 'RECOMMENDED',
        solveAction: () => {
          onNavigateTab('CHRONICLE');
          showCompassFeedback(language === 'ID' ? "Menggulir ke bagian Piutang Ledger..." : "Corporate ledger entries highlighted below.");
        }
      });
    }

    // 4. Motivation check
    list.push({
      id: 'motivation-1',
      category: 'MOTIVATION',
      title: language === 'ID' ? "🌟 AI Kiko: Kejelasan Indeks Keuangan" : "🌟 AI Kiko: Financial Clarity Validated",
      description: language === 'ID'
        ? "Buku besar rapi, alokasi saku terjaga, pelacakan stabil. Manajemen aset Anda sangat luar biasa hari ini."
        : "Ledger is clean, envelopes balanced, tracking is steady. Your asset management is precise and highly organized today.",
      actionLabel: language === 'ID' ? 'Terima Tantangan' : 'Receive Clarity Point',
      severity: 'DOPAMINE',
      solveAction: () => {
        showCompassFeedback(language === 'ID' ? "✨ Lanjutkan kinerja sempurna Anda! ✨" : "✨ Perfect operational efficiency detected! ✨");
      }
    });

    setNudges(list);
    setCurrentIndex(0);
  }, [state, language]);

  const showCompassFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const handleNextNudge = () => {
    if (nudges.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % nudges.length);
  };

  if (nudges.length === 0) return null;

  const currentNudge = nudges[currentIndex] || nudges[0];
  const getSeverityStyle = (sev: 'URGENT' | 'RECOMMENDED' | 'DOPAMINE') => {
    switch(sev) {
      case 'URGENT': 
        return 'border-rose-500 bg-rose-50/50 text-rose-900 border border-dashed border-[#06402B]/20';
      case 'RECOMMENDED': 
        return 'border-[#E2D9C8] bg-sand-50 text-sand-900';
      case 'DOPAMINE': 
        return 'border-[#06402B] bg-emerald-50/50 text-emerald-950 border-emerald-800/20';
      default: 
        return 'border-[#E2D9C8] bg-white';
    }
  };

  return (
    <div className={`p-4 rounded-3xl transition-all duration-300 border shadow-sm ${getSeverityStyle(currentNudge.severity)}`}>
      <div className="flex justify-between items-start gap-2 border-b border-[#E2D9C8] pb-3 mb-3">
        <div className="flex items-center gap-2 text-[#06402B]">
          <div className="p-1.5 bg-[#06402B] text-white rounded-xl">
             <Cat size={20} />
          </div>
          <div>
            <h4 className="font-sans font-bold text-sm tracking-tight text-sand-900">
              {language === 'ID' ? 'Fokus Finansial' : 'Financial Focus'}
            </h4>
            <span className="text-[9px] font-mono text-sand-500 block uppercase tracking-wider font-extrabold mt-0.5">
              {language === 'ID' ? 'Tindakan Prioritas' : 'PRIORITY ACTIONS'}
            </span>
          </div>
        </div>
        {nudges.length > 1 && (
          <button 
            onClick={handleNextNudge}
            className="px-2.5 py-1 bg-white hover:bg-sand-100 border border-sand-200 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-sand-700 flex items-center gap-1 active:scale-95 transition"
            title="Next Alert"
          >
            <span>{language === 'ID' ? 'Selanjutnya' : 'NEXT'} ({currentIndex+1}/{nudges.length})</span>
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        <div className="space-y-1 mt-1">
          <div className="text-sm font-bold text-sand-950 flex items-center gap-2">
            {currentNudge.category === 'FINANCIAL' && <TrendingUp size={16} className="text-[#06402B]" />}
            {currentNudge.category === 'POCKET' && <AlertTriangle size={16} className="text-rose-600" />}
            {currentNudge.category === 'REIMBURSEMENT' && <Coins size={16} className="text-amber-600" />}
            {currentNudge.category === 'MOTIVATION' && <Lightbulb size={16} className="text-[#06402B]" />}
            <span>{currentNudge.title}</span>
          </div>
          <p className="text-xs text-sand-600 leading-relaxed font-sans mt-1">
            {currentNudge.description}
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap pt-2">
          <button
            onClick={() => currentNudge.solveAction()}
            className="px-4 py-2 bg-[#06402B] text-white hover:bg-[#042d1f] hover:shadow-xs rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
          >
            <Zap size={13} className="text-amber-400 shrink-0" />
            <span>{currentNudge.actionLabel}</span>
          </button>
          
          <span className="text-[8.5px] font-mono uppercase tracking-widest font-bold text-sand-400 bg-white/60 px-2 py-1 rounded-lg border border-sand-200 ml-1">
             {currentNudge.severity === 'URGENT' ? 'PRIORITY' : 'INSIGHT'}
          </span>
        </div>

        {feedback && (
          <div className="p-2.5 mt-2 bg-[#06402B]/10 text-[#06402B] border border-[#06402B]/20 rounded-xl font-mono text-[10px] font-bold animate-in slide-in-from-top-1.5 duration-300 flex gap-2 items-center">
            <Sparkles size={13} /> {feedback}
          </div>
        )}
      </div>
    </div>
  );
};

