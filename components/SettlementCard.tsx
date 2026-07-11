import React from 'react';
import { ArrowLeftRight, Check, Banknote } from 'lucide-react';

interface SettlementCardProps {
  balance: number; // Positive = Partner owes ME. Negative = I owe Partner.
  partnerName: string;
  userName: string;
  onSettle: () => void;
  language?: 'EN' | 'ID';
}

const SettlementCard: React.FC<SettlementCardProps> = ({ balance, partnerName, userName, onSettle, language = 'EN' }) => {
  if (Math.abs(balance) < 1000) return null; // Hide if negligible

  const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(Math.abs(num));
  
  const isOwed = balance > 0;
  
  return (
    <div className="bg-wealth-panel border border-wealth-border rounded-xl p-4 shadow-sm mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isOwed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
           <Banknote size={20} />
        </div>
        <div>
           <div className="text-[10px] uppercase font-bold text-wealth-muted tracking-widest">Settlement Concierge</div>
           <div className="text-sm font-serif font-bold text-wealth-text">
              {isOwed ? `${partnerName} owes Rp ${formatIDR(balance)}` : `Owe ${partnerName} Rp ${formatIDR(balance)}`}
           </div>
           <div className="text-[10px] text-wealth-muted">
              For shared OpEx reconciliation.
           </div>
        </div>
      </div>
      <button 
        onClick={onSettle}
        className="px-4 py-2 bg-wealth-text text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-900 transition-colors flex items-center gap-2 shadow-md"
      >
        <Check size={14} /> Settle
      </button>
    </div>
  );
};

export default SettlementCard;