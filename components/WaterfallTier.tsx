
import React, { useState } from 'react';
import { Pocket, Transaction, User } from '../types';
import { getPocketName } from './PocketCard';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ShieldCheck, Fuel, Banknote, Lock, Edit2 } from 'lucide-react';

interface WaterfallTierProps {
  level: number;
  title: string;
  subtitle: string;
  pockets: Pocket[];
  totalTarget: number;
  currentFilled: number;
  isExpanded?: boolean;
  onPocketClick?: (pocket: Pocket) => void;
  transactions: Transaction[];
  user?: User | null;
  partner?: User | null;
  activeLens: 'HIS' | 'JOINT' | 'HER';
  language?: 'EN' | 'ID';
}

const WaterfallTier: React.FC<WaterfallTierProps> = ({ level, title, subtitle, pockets, totalTarget, currentFilled, isExpanded = true, onPocketClick, transactions, user, partner, activeLens, language = 'EN' }) => {
  const [expanded, setExpanded] = useState(isExpanded);
  
  const formatIDR = (num: number) => {
      if ((window as any).privacyShieldActive) return "••••••";
      return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0, notation: "compact" }).format(num);
  };
  const formatFullIDR = (num: number) => {
      if ((window as any).privacyShieldActive) return "••••••";
      return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
  };

  const fillPercentage = totalTarget > 0 ? Math.min((currentFilled / totalTarget) * 100, 100) : (currentFilled > 0 ? 100 : 0);
  const isComplete = fillPercentage >= 100;

  // Resolve Lead Name
  const getLeadLabel = (pocket: Pocket) => {
      if (pocket.leadId === 'JOINT') return language === 'ID' ? 'Bersama' : 'Joint';
      if (pocket.leadId === 'user_his') return partner?.name || (language === 'ID' ? 'Suami' : 'His');
      if (pocket.leadId === 'user_her') return user?.name || (language === 'ID' ? 'Istri' : 'Her');
      return language === 'ID' ? 'Bersama' : 'Joint';
  };

  const getLeadColor = (pocket: Pocket) => {
      if (pocket.leadId === 'JOINT') return 'bg-emerald-600';
      if (pocket.leadId === 'user_his') return 'bg-slate-600';
      if (pocket.leadId === 'user_her') return 'bg-rose-600';
      return 'bg-wealth-gold';
  };

  const getCommitmentStatus = (pocket: Pocket) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const hasExpense = transactions.some(t => t.pocket === pocket.id && t.type === 'EXPENSE' && t.date.startsWith(currentMonth));
    const isFunded = pocket.balance >= (pocket.target || 0);

    if (pocket.balance <= (pocket.target || 0) * 0.1 && hasExpense) return 'SETTLED';
    if (isFunded) return 'FUNDED';
    return 'UNFUNDED';
  };

  const isGhosted = (pocket: Pocket) => {
      if (activeLens === 'JOINT') return false;
      if (activeLens === 'HER' && pocket.leadId === 'user_his') return true;
      if (activeLens === 'HIS' && pocket.leadId === 'user_her') return true;
      return false;
  };

  return (
    <div className={`border transition-all duration-700 rounded-3xl overflow-hidden mb-4 ${isComplete ? 'border-emerald-200 bg-emerald-50/20' : 'border-[#E2D9C8] bg-[#FDFCF7]'}`}>
      {/* Header - Toggles Expansion */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="py-3 px-4 md:py-3.5 md:px-5 flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors select-none active:bg-black/10"
      >
        <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border ${isComplete ? 'bg-[#06402B] text-white border-[#06402B] shadow-sm' : 'bg-white text-sand-500 border-[#E2D9C8]'}`}>
                {level}
            </div>
            <div>
                <h3 className="font-serif font-extrabold text-[#06402B] text-base leading-none tracking-tight">{title}</h3>
                <div className="text-[9px] text-[#06402B]/60 uppercase tracking-widest mt-1 font-mono font-bold">{subtitle}</div>
            </div>
        </div>
        <div className="text-right">
             <div className={`font-serif font-black text-sm md:text-base ${isComplete ? 'text-emerald-700' : 'text-[#06402B]/90'}`}>
                 {formatIDR(currentFilled)} <span className="text-sand-400 text-xs font-sans font-normal opacity-70">/ {formatIDR(totalTarget)}</span>
             </div>
             {expanded ? <ChevronUp size={14} className="ml-auto text-sand-400 mt-0.5"/> : <ChevronDown size={14} className="ml-auto text-sand-400 mt-0.5"/>}
        </div>
      </div>

      {/* Progress Bar (Visible when collapsed) */}
      {!expanded && (
          <div className="h-1 w-full bg-wealth-border/20">
              <div className="h-full bg-wealth-gold transition-all duration-1000" style={{ width: `${fillPercentage}%` }}></div>
          </div>
      )}

      {/* Content */}
      {expanded && (
        <div className="py-2.5 px-3.5 md:py-3.5 md:px-4.5 pt-0 border-t border-dashed border-[#E2D9C8]/50 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                {pockets.map(p => {
                    const ghost = isGhosted(p);
                    const ghostClass = ghost ? 'opacity-40 grayscale pointer-events-none bg-slate-50' : '';
                    
                    const isBudget = p.behavior === 'BUDGET';
                    
                    // --- COMMITMENT LOGIC ---
                    if (!isBudget) {
                        const status = getCommitmentStatus(p);
                        let bgColor = "bg-white border-wealth-border";
                        let icon = <ShieldCheck size={14} className="text-wealth-muted" />;
                        let statusText = language === 'ID' ? "Kekurangan Target" : "Target Shortfall";
                        let statusTextColor = "text-rose-700";

                        if (status === 'SETTLED') {
                            bgColor = "bg-emerald-50/50 border-emerald-100";
                            icon = <CheckCircle2 size={14} className="text-emerald-600" />;
                            statusText = language === 'ID' ? "Lunas Terbayar" : "Settled";
                            statusTextColor = "text-emerald-700";
                        } else if (status === 'FUNDED') {
                            bgColor = "bg-amber-50/50 border-amber-100";
                            icon = <Banknote size={14} className="text-amber-600" />;
                            statusText = language === 'ID' ? "Kecukupan Kas" : "Fully Funded";
                            statusTextColor = "text-amber-700";
                        } else {
                            bgColor = "bg-white border-rose-100";
                            icon = <AlertCircle size={14} className="text-rose-600" />;
                        }

                        if (ghost) {
                            bgColor = "bg-slate-50 border-slate-200";
                            statusText = language === 'ID' ? `Dikelola ${getLeadLabel(p)}` : `Managed by ${getLeadLabel(p)}`;
                            statusTextColor = "text-slate-500";
                        }

                        return (
                            <div 
                                key={p.id}
                                onClick={(e) => { e.stopPropagation(); if(onPocketClick && !ghost) onPocketClick(p); }}
                                className={`p-3 md:p-4 rounded-2xl border ${bgColor} flex justify-between items-center transition-all ${ghost ? '' : 'cursor-pointer hover:shadow-md hover:border-[#06402B]/40 active:scale-[0.99]'} ${ghostClass}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-xl bg-white border border-[#E2D9C8]/40 shadow-sm shrink-0">{ghost ? <Lock size={14} className="text-slate-400"/> : icon}</div>
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-extrabold text-sand-900 uppercase tracking-wide flex items-center gap-1.5">
                                            <span className="truncate">{getPocketName(p, language)}</span>
                                            {!ghost && <Edit2 size={9} className="text-sand-400 opacity-60 inline" />}
                                            <span className={`px-1 py-0.5 rounded text-[6px] shrink-0 text-white font-bold uppercase tracking-wider ${getLeadColor(p)}`}>
                                                {getLeadLabel(p)}
                                            </span>
                                        </div>
                                        <div className={`text-[8.5px] font-bold uppercase tracking-widest mt-0.5 ${statusTextColor}`}>
                                            {statusText}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-serif font-black text-xs md:text-sm text-sand-950 tracking-tight">Rp {formatIDR(p.balance)}</div>
                                    <div className="text-[7.5px] text-sand-400 font-mono font-bold uppercase opacity-85">Tgt: Rp {formatIDR(p.target || 0)}</div>
                                </div>
                            </div>
                        );
                    }

                    // --- BUDGET LOGIC (FUEL TANK) ---
                    const pFill = p.target ? Math.min((p.balance / p.target) * 100, 100) : 0;
                    const isHealthy = pFill > 50;
                    const isWarning = pFill <= 50 && pFill > 15;
                    const isBreached = p.balance < 0;

                    let barColor = "bg-emerald-500";
                    if (isWarning) barColor = "bg-amber-500";
                    if (isBreached || pFill <= 15) barColor = "bg-rose-500";

                    return (
                        <div 
                            key={p.id} 
                            onClick={(e) => { e.stopPropagation(); if(onPocketClick && !ghost) onPocketClick(p); }}
                            className={`p-3 md:p-4 rounded-2xl border bg-white border-[#E2D9C8]/60 flex justify-between items-center transition-all ${ghost ? '' : 'cursor-pointer hover:shadow-md hover:border-[#06402B]/40 active:scale-[0.99]'} ${ghostClass}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-xl bg-white border border-[#E2D9C8]/40 shadow-sm shrink-0">
                                    {ghost ? <Lock size={14} className="text-slate-400" /> : <Fuel size={14} className={isHealthy ? "text-emerald-600" : isWarning ? "text-amber-600" : "text-rose-600"} />}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-extrabold text-sand-900 uppercase tracking-wide flex items-center gap-1">
                                        <span className="truncate">{getPocketName(p, language)}</span>
                                        <span className={`px-1 py-0.5 rounded text-[6px] shrink-0 text-white font-bold uppercase tracking-wider ${getLeadColor(p)}`}>
                                            {getLeadLabel(p)}
                                        </span>
                                    </div>
                                    <div className="text-[8.5px] text-sand-400 flex items-center gap-0.5 font-mono uppercase tracking-wider font-extrabold">
                                        {language === 'ID' ? 'Atap' : 'Cap'}: Rp {formatIDR(p.target || 0)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0 w-1/3">
                                <div className={`font-serif font-black text-xs md:text-sm tracking-tight ${isBreached ? 'text-rose-700' : 'text-sand-900'}`}>
                                    Rp {formatIDR(p.balance)}
                                </div>
                                {p.target && p.target > 0 && (
                                    <div className="w-full h-1 bg-sand-100 rounded-full mt-1 overflow-hidden border border-sand-200/50">
                                        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${Math.max(0, pFill)}%` }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default WaterfallTier;
