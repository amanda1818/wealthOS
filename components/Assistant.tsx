import React, { useState, useEffect } from 'react';
import { Bot, X, Sparkles, MessageSquare, ListChecks, Lock } from 'lucide-react';
import { AppState, Pocket, PocketType, AdvisorMessage } from '../types';
import { getPocketName } from './PocketCard';
import AssistantChat from './AssistantChat';
import AssistantPriorities from './AssistantPriorities';

export interface AlgorithmicTask {
  id: string;
  title: string;
  description: string;
  urgency: 'TODAY' | 'TOMORROW' | 'DAY_3' | 'POSTPONED';
  category: 'REIMBURSEMENT' | 'CLAIM' | 'LIABILITY' | 'POCKET_LOW' | 'INDEPENDENCE_GAP';
  actionLabel: string;
  onAction: () => void;
}

interface AssistantProps {
  state: AppState;
  language?: 'EN' | 'ID';
  switchTab: (tab: 'DASHBOARD' | 'COMMAND' | 'FORTRESS' | 'CHRONICLE') => void;
  onUpdateChatHistory: (msgs: AdvisorMessage[]) => void;
  postponedTaskIds: string[];
  onUpdatePostponedTaskIds: (ids: string[]) => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

// The one floating Assistant (REVAMP.md), merging what used to be three
// separate components:
// - AlphaConcierge's "nudge" alerts turned out to be a hardcoded, never-
//   updated duplicate of the REIMBURSEMENT/CLAIM categories the priority
//   engine below already computes live from real transactions -- so its
//   concept survives as the badge count on the trigger button, not as a
//   separate alert system.
// - MagicAssistant's rule-based priority engine (the one genuinely
//   non-redundant capability) becomes the Priorities mode.
// - AdvisorChat's panel shell and free-form chat becomes the Chat mode.
const Assistant: React.FC<AssistantProps> = ({
  state, language = 'EN', switchTab, onUpdateChatHistory,
  postponedTaskIds, onUpdatePostponedTaskIds, isPremium, onUpgrade,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'PRIORITIES' | 'CHAT'>('PRIORITIES');
  const [algoTasks, setAlgoTasks] = useState<AlgorithmicTask[]>([]);

  const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);

  useEffect(() => {
    const tasks: AlgorithmicTask[] = [];

    // 1. Pending Reimbursements
    const pendingReimbursements = state.transactions.filter(t => t.status === 'PENDING_REIMBURSEMENT');
    pendingReimbursements.forEach((t, index) => {
      const taskId = `reimb-${t.id}-${index}`;
      tasks.push({
        id: taskId,
        title: language === 'ID'
          ? `Cairkan Reimbursement Klien: Rp ${formatIDR(t.netAmount)}`
          : `Liquidate Client Reimbursement: Rp ${formatIDR(t.netAmount)}`,
        description: language === 'ID'
          ? `Operasional '${t.description}' menganggur di klaim korporat. Selesaikan hari ini.`
          : `Client fees for '${t.description}' pending clearance. Settle today to recover cash.`,
        urgency: postponedTaskIds.includes(taskId) ? 'POSTPONED' : 'TODAY',
        category: 'REIMBURSEMENT',
        actionLabel: language === 'ID' ? 'Klaim' : 'Settle',
        onAction: () => switchTab('DASHBOARD'),
      });
    });

    // 2. Outstanding Partner Receivables
    const pendingClaims = state.transactions.filter(t => t.status === 'PARTNER_RECEIVABLE');
    pendingClaims.forEach((t, index) => {
      const current = t.receivableAmount || 0;
      const taskId = `claim-${t.id}-${index}`;
      tasks.push({
        id: taskId,
        title: language === 'ID'
          ? `Tarik Sisa Patungan: Rp ${formatIDR(current)}`
          : `Collect Cost-Share Claim: Rp ${formatIDR(current)}`,
        description: language === 'ID'
          ? `Selesaikan tagihan bersama '${t.description}'. Swipe atau bayar hari ini.`
          : `Unsettled shared outlay for '${t.description}'. Swipe or settle today.`,
        urgency: postponedTaskIds.includes(taskId) ? 'POSTPONED' : 'TODAY',
        category: 'CLAIM',
        actionLabel: language === 'ID' ? 'Tagih' : 'Collect',
        onAction: () => switchTab('DASHBOARD'),
      });
    });

    // 3. Consumptive Liabilities
    state.liabilities.forEach((l) => {
      if (l.category === 'CONSUMPTIVE') {
        const isUrgent = l.monthsRemaining <= 3;
        const taskId = `liab-${l.id}`;
        tasks.push({
          id: taskId,
          title: language === 'ID'
            ? `Bayar Amortisasi Bulanan: ${l.name}`
            : `Pay Monthly Liability: ${l.name}`,
          description: language === 'ID'
            ? `Besar Rp ${formatIDR(l.monthlyPayment)} (${l.monthsRemaining} bulan tersisa).`
            : `Secure Rp ${formatIDR(l.monthlyPayment)} (${l.monthsRemaining} installments remaining).`,
          urgency: postponedTaskIds.includes(taskId) ? 'POSTPONED' : (isUrgent ? 'TOMORROW' : 'DAY_3'),
          category: 'LIABILITY',
          actionLabel: language === 'ID' ? 'Arus Kas' : 'Refill',
          onAction: () => switchTab('COMMAND'),
        });
      }
    });

    // 4. Critically Empty Pockets
    Object.values(state.pockets).forEach((p) => {
      const pocket = p as Pocket;
      if (pocket.target && pocket.balance < pocket.target * 0.2 && pocket.id !== PocketType.UNALLOCATED) {
        const pktName = getPocketName(pocket, language);
        const taskId = `pocket-${pocket.id}`;
        tasks.push({
          id: taskId,
          title: language === 'ID'
            ? `Refill Kantong Kritis: ${pktName}`
            : `Refill Critical Pocket: ${pktName}`,
          description: language === 'ID'
            ? `Dana Rp ${formatIDR(pocket.balance)} di bawah batas aman 20% (Target Rp ${formatIDR(pocket.target)}).`
            : `Balance Rp ${formatIDR(pocket.balance)} is below safe 20% threshold (Target Rp ${formatIDR(pocket.target)}).`,
          urgency: postponedTaskIds.includes(taskId) ? 'POSTPONED' : 'TOMORROW',
          category: 'POCKET_LOW',
          actionLabel: language === 'ID' ? 'Bagi Aliran' : 'Waterfall',
          onAction: () => switchTab('COMMAND'),
        });
      }
    });

    // 5. Independence Gap Shortfall
    const activeTransactions = state.transactions.filter(t => t.date.startsWith(new Date().toISOString().slice(0, 7)));
    const totalIncome = activeTransactions.filter(t => t.type === 'INCOME' || t.type === 'REVENUE').reduce((acc, t) => acc + t.netAmount, 0);
    const totalExpense = activeTransactions.filter(t => t.type === 'EXPENSE' || t.type === 'INVESTMENT').reduce((acc, t) => acc + t.netAmount, 0);
    const gapShortfall = totalExpense - totalIncome;

    if (gapShortfall > 1000000) {
      const taskId = 'sov-gap-shortfall';
      tasks.push({
        id: taskId,
        title: language === 'ID' ? 'Atasi Defisit Arus Kas Bulanan' : 'Mitigate Monthly Cash Shortfall',
        description: language === 'ID'
          ? `Defisit aktif bulan ini Rp ${formatIDR(gapShortfall)}. Suntik dana untuk keseimbangan sistem.`
          : `We record a net negative burn of Rp ${formatIDR(gapShortfall)} this month. Conduct capital injection.`,
        urgency: postponedTaskIds.includes(taskId) ? 'POSTPONED' : 'DAY_3',
        category: 'INDEPENDENCE_GAP',
        actionLabel: language === 'ID' ? 'Suntik' : 'Inject',
        onAction: () => switchTab('COMMAND'),
      });
    }

    const priorityWeight = { TODAY: 1, TOMORROW: 2, DAY_3: 3, POSTPONED: 4 };
    tasks.sort((a, b) => priorityWeight[a.urgency] - priorityWeight[b.urgency]);

    setAlgoTasks(tasks);
  }, [state, language, postponedTaskIds, switchTab]);

  const togglePostpone = (taskId: string) => {
    if (!postponedTaskIds.includes(taskId)) onUpdatePostponedTaskIds([...postponedTaskIds, taskId]);
  };

  const todayCount = algoTasks.filter(t => t.urgency === 'TODAY').length;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-5 z-[980] p-4 bg-[#06402B] text-white rounded-full shadow-xl hover:bg-[#0d543b] transition-all active:scale-95 flex items-center justify-center"
        title={language === 'ID' ? 'Asisten' : 'Assistant'}
      >
        <Bot size={22} />
        {!isOpen && todayCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {todayCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 w-[90%] max-w-sm h-[560px] bg-wealth-panel border border-wealth-gold rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[970] animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-wealth-emerald p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-full border border-white/20">
                <Sparkles size={18} className="text-wealth-gold" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg leading-none">{language === 'ID' ? 'Asisten' : 'Assistant'}</h3>
                <p className="text-[10px] uppercase tracking-widest text-emerald-200">{language === 'ID' ? 'Penasihat Kekayaan' : 'Neural Wealth Advisor'}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-wealth-border bg-white shrink-0">
            <button
              onClick={() => setActiveMode('PRIORITIES')}
              className={`flex-1 py-2.5 text-[10px] font-mono font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeMode === 'PRIORITIES' ? 'border-wealth-emerald text-wealth-emerald' : 'border-transparent text-wealth-muted hover:text-wealth-text'}`}
            >
              <ListChecks size={13} /> {language === 'ID' ? 'Prioritas' : 'Priorities'}
              {todayCount > 0 && <span className="ml-0.5 text-rose-600">({todayCount})</span>}
            </button>
            <button
              onClick={() => setActiveMode('CHAT')}
              className={`flex-1 py-2.5 text-[10px] font-mono font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeMode === 'CHAT' ? 'border-wealth-emerald text-wealth-emerald' : 'border-transparent text-wealth-muted hover:text-wealth-text'}`}
            >
              <MessageSquare size={13} /> {language === 'ID' ? 'Obrolan' : 'Chat'}
            </button>
          </div>

          {/* Paywall seam -- UI slot only; real weekly-message metering against
              the ai_usage counter is Phase 4, not wired here. */}
          {!isPremium && (
            <button
              onClick={onUpgrade}
              className="flex items-center justify-between gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 hover:bg-amber-100 transition-colors"
            >
              <span className="flex items-center gap-1.5"><Lock size={11} /> {language === 'ID' ? 'Gratis: Terbatas / minggu' : 'Free: limited / week'}</span>
              <span className="underline">{language === 'ID' ? 'Naik Plus · Rp 79rb/bln' : 'Go Plus · Rp 79k/mo'}</span>
            </button>
          )}

          {activeMode === 'PRIORITIES' ? (
            <AssistantPriorities
              state={state}
              language={language}
              algoTasks={algoTasks}
              postponedIds={postponedTaskIds}
              onTogglePostpone={togglePostpone}
            />
          ) : (
            <AssistantChat appState={state} onUpdateHistory={onUpdateChatHistory} />
          )}
        </div>
      )}
    </>
  );
};

export default Assistant;
