
import React from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Share2, Users, Globe, Lock } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  activeProfile?: 'ME' | 'PARTNER' | 'JOINT';
  currentUserId?: string;
  language?: 'EN' | 'ID';
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, activeProfile, currentUserId, language = 'EN' }) => {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
  };

  const formatOriginal = (t: Transaction) => {
      // If original currency exists and is NOT IDR, show it
      if (!t.originalCurrency || t.originalCurrency === 'IDR') return null;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: t.originalCurrency, maximumFractionDigits: 0 }).format(t.originalAmount || 0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-wealth-muted uppercase tracking-widest border-b border-wealth-border pb-2">Heritage Ledger</h3>
      {transactions.slice(0, 10).map((t) => {
        // Sovereign Shield Logic
        const isMasked = activeProfile === 'JOINT' && t.isPrivate && t.ownerId !== currentUserId;
        const isReceivable = t.status === 'PARTNER_RECEIVABLE';

        return (
          <div key={t.id} className="flex items-center justify-between py-3 px-2 hover:bg-white rounded-lg transition-colors group border-b border-dashed border-wealth-border last:border-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full border ${isReceivable ? 'bg-purple-50 border-purple-100 text-purple-700' : (t.type === 'INCOME' || t.type === 'REVENUE' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700')}`}>
                {isMasked ? <Lock size={14} /> : (t.type === 'INCOME' || t.type === 'REVENUE' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />)}
              </div>
              <div>
                <div className={`font-semibold text-sm font-serif ${isMasked ? 'text-wealth-muted italic' : 'text-wealth-text'}`}>
                    {isMasked ? 'Private Allocation' : t.description}
                </div>
                <div className="text-[10px] text-wealth-muted flex items-center gap-2 uppercase tracking-wider">
                  <span>{isMasked ? 'Confidential' : t.category}</span>
                  
                  {/* Status Indicators */}
                  {!isMasked && isReceivable && (
                      <span className="flex items-center text-purple-600 font-bold bg-purple-50 px-1.5 rounded-sm">
                          <Users size={10} className="mr-1" />
                          Receivable
                      </span>
                  )}
                  {!isMasked && t.category === 'Settlement' && (
                       <span className="flex items-center text-emerald-600 font-bold">
                         <Share2 size={10} className="mr-0.5" />
                         Settled
                       </span>
                  )}
                  {t.originalCurrency && t.originalCurrency !== 'IDR' && (
                      <span className="flex items-center text-blue-600 bg-blue-50 px-1.5 rounded-sm font-bold">
                          <Globe size={10} className="mr-0.5" />
                          {t.originalCurrency}
                      </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className={`font-serif font-medium text-sm ${t.type === 'INCOME' || t.type === 'REVENUE' ? 'text-wealth-emerald' : 'text-wealth-text'} ${isMasked ? 'blur-[2px]' : ''}`}>
                  {(t.type === 'INCOME' || t.type === 'REVENUE') ? '+' : '-'} {formatIDR(t.netAmount)}
                </div>
                {formatOriginal(t) && !isMasked && (
                    <div className="text-[10px] text-wealth-muted font-mono font-bold">
                        ({formatOriginal(t)})
                    </div>
                )}
            </div>
          </div>
        );
      })}
      {transactions.length === 0 && (
        <div className="text-center py-12 text-wealth-muted text-sm font-serif italic">
          The heritage ledger is pristine. Awaiting input.
        </div>
      )}
    </div>
  );
};

export default TransactionList;
