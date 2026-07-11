import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, CheckCircle, RefreshCw, ChevronDown, ChevronRight, Zap, Target, Users } from 'lucide-react';
import { AppState, Pocket, PocketType } from '../types';
import { getMagicPriorityTasks } from '../services/geminiService';

import { getPocketName } from './PocketCard';

interface MagicAssistantProps {
  state: AppState;
  language?: 'EN' | 'ID';
  switchTab: (tab: 'DASHBOARD' | 'COMMAND' | 'FORTRESS' | 'CHRONICLE') => void;
}

interface AlgorithmicTask {
  id: string;
  title: string;
  description: string;
  urgency: 'TODAY' | 'TOMORROW' | 'DAY_3' | 'POSTPONED';
  category: 'REIMBURSEMENT' | 'CLAIM' | 'LIABILITY' | 'POCKET_LOW' | 'INDEPENDENCE_GAP';
  actionLabel: string;
  onAction: () => void;
}

const MagicAssistant: React.FC<MagicAssistantProps> = ({ state, language = 'EN', switchTab }) => {
  const [useAI, setUseAI] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [postponedIds, setPostponedIds] = useState<string[]>([]);

  const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);

  const [algoTasks, setAlgoTasks] = useState<AlgorithmicTask[]>([]);

  useEffect(() => {
    const tasks: AlgorithmicTask[] = [];

    // 1. Pending Reimbursements (Corporate client payments wait for Victoria)
    const pendingReimbursements = state.transactions.filter(t => t.status === 'PENDING_REIMBURSEMENT');
    pendingReimbursements.forEach((t, index) => {
      const taskId = `reimb-${t.id}-${index}`;
      tasks.push({
        id: taskId,
        title: language === 'ID' 
          ? `Cairkan Reimbursement Klien: Rp ${formatIDR(t.netAmount)}` 
          : `Liquidate Client Reimbursement: Rp ${formatIDR(t.netAmount)}`,
        description: language === 'ID'
          ? `Operasional '${t.description}' menganggur di klaim korporat Victoria. Selesaikan hari ini.`
          : `Client fees for '${t.description}' pending clearance. Settle today to recover cash.`,
        urgency: postponedIds.includes(taskId) ? 'POSTPONED' : 'TODAY',
        category: 'REIMBURSEMENT',
        actionLabel: language === 'ID' ? 'Klaim' : 'Settle',
        onAction: () => switchTab('DASHBOARD'),
      });
    });

    // 2. Outstanding Partner Receivables (David owes Victoria or vice versa)
    const pendingClaims = state.transactions.filter(t => t.status === 'PARTNER_RECEIVABLE');
    pendingClaims.forEach((t, index) => {
      const current = t.receivableAmount || 0;
      const taskId = `claim-${t.id}-${index}`;
      tasks.push({
        id: taskId,
        title: language === 'ID'
          ? `Tarik Sisa Patungan: Rp ${formatIDR(current)}`
          : `Collect Cost-Share Claim: Rp ${formatIDR(current)}`,
        description: language === 'ID'
          ? `Selesaikan tagihan bersama '${t.description}'. Swipe atau bayar hari ini.`
          : `Unsettled shared outlay for '${t.description}'. Swipe or settle today.`,
        urgency: postponedIds.includes(taskId) ? 'POSTPONED' : 'TODAY',
        category: 'CLAIM',
        actionLabel: language === 'ID' ? 'Tagih' : 'Collect',
        onAction: () => switchTab('DASHBOARD'),
      });
    });

    // 3. Consumptive Liabilities (Installments coming up)
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
            ? `Besar Rp ${formatIDR(l.monthlyPayment)} (${l.monthsRemaining} bulan tersisa).`
            : `Secure Rp ${formatIDR(l.monthlyPayment)} (${l.monthsRemaining} installments remaining).`,
          urgency: postponedIds.includes(taskId) ? 'POSTPONED' : (isUrgent ? 'TOMORROW' : 'DAY_3'),
          category: 'LIABILITY',
          actionLabel: language === 'ID' ? 'Arus Kas' : 'Refill',
          onAction: () => switchTab('COMMAND'),
        });
      }
    });

    // 4. Critically Empty Pockets (Pockets below 20% of target)
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
            ? `Dana Rp ${formatIDR(pocket.balance)} di bawah batas aman 20% (Target Rp ${formatIDR(pocket.target)}).`
            : `Balance Rp ${formatIDR(pocket.balance)} is below safe 20% threshold (Target Rp ${formatIDR(pocket.target)}).`,
          urgency: postponedIds.includes(taskId) ? 'POSTPONED' : 'TOMORROW',
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
          ? `Defisit aktif bulan ini Rp ${formatIDR(gapShortfall)}. Suntik dana untuk keseimbangan sistem.`
          : `We record a net negative burn of Rp ${formatIDR(gapShortfall)} this month. Conduct capital injection.`,
        urgency: postponedIds.includes(taskId) ? 'POSTPONED' : 'DAY_3',
        category: 'INDEPENDENCE_GAP',
        actionLabel: language === 'ID' ? 'Suntik' : 'Inject',
        onAction: () => switchTab('COMMAND'),
      });
    }

    // Sort by Urgency
    const priorityWeight = { TODAY: 1, TOMORROW: 2, DAY_3: 3, POSTPONED: 4 };
    tasks.sort((a, b) => priorityWeight[a.urgency] - priorityWeight[b.urgency]);

    setAlgoTasks(tasks);
  }, [state, language, postponedIds, switchTab]);

  const invokeAIPriority = async () => {
    setIsLoading(true);
    setUseAI(true);
    try {
      const data = await getMagicPriorityTasks(state, language);
      setAiOutput(data);
    } catch (err) {
      setAiOutput(language === 'ID' ? 'Gagal menghubungi Asisten.' : 'Failed to invoke Assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAIOutput = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-3 font-sans text-xs">
        {lines.map((line, idx) => {
          // Clean asterisks and leading bullet/dash markers
          const trimmed = line.replace(/^\s*[\-\*•]\s*/, '').replace(/\*/g, '').trim();
          if (!trimmed) return null;

          // Check if this line functions as a clean section header
          const isHeader = trimmed.toUpperCase() === trimmed || 
                           trimmed.startsWith('TODAY') || 
                           trimmed.startsWith('TOMORROW') || 
                           trimmed.startsWith('DAY 3') ||
                           trimmed.startsWith('HARI INI') ||
                           trimmed.startsWith('BESOK') ||
                           trimmed.startsWith('TIGA HARI');

          if (isHeader) {
            return (
              <div key={idx} className="font-mono font-black text-[#06402B] uppercase tracking-wider text-[10px] mt-4 pb-1 border-b border-[#E2D9C8]/40 first:mt-1">
                {trimmed}
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 text-sand-800 font-medium leading-relaxed pl-1.5">
              <span className="text-[#06402B] font-bold text-sm select-none shrink-0 leading-[14px]">•</span>
              <span>{trimmed}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Organize algoTasks by urgency
  const todayTasks = algoTasks.filter(t => t.urgency === 'TODAY');
  const tomorrowTasks = algoTasks.filter(t => t.urgency === 'TOMORROW');
  const day3Tasks = algoTasks.filter(t => t.urgency === 'DAY_3');
  const postponedTasksList = algoTasks.filter(t => t.urgency === 'POSTPONED');

  const renderAlgorithmicSection = (title: string, tasksToRender: AlgorithmicTask[]) => {
    if (tasksToRender.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="font-mono font-black text-[#06402B] uppercase tracking-wider text-[10px] pb-1 border-b border-[#E2D9C8]/40 mt-3">
          {title}
        </div>
        <div className="space-y-2 pl-1.5">
          {tasksToRender.map(task => (
            <div key={task.id} className="flex justify-between items-start gap-3 text-xs leading-relaxed group">
              <div className="flex items-start gap-2 text-sand-800 font-medium">
                <span className="text-[#06402B] font-bold text-sm select-none shrink-0 leading-[14px]">
                  {task.urgency === 'POSTPONED' ? <span className="opacity-50">○</span> : '•'}
                </span>
                <div>
                  <span className={`font-bold ${task.urgency === 'POSTPONED' ? 'text-sand-500' : 'text-sand-950'}`}>{task.title}</span>
                  <span className="text-sand-550 text-[10.5px] block font-semibold font-sans">{task.description}</span>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                {task.urgency !== 'POSTPONED' && (
                  <button
                    onClick={() => {
                        if (!postponedIds.includes(task.id)) setPostponedIds([...postponedIds, task.id]);
                    }}
                    className="mr-2 text-[9px] font-mono font-extrabold uppercase tracking-wider text-sand-400 hover:text-sand-600 px-1 py-1 rounded"
                    title={language === 'ID' ? 'Tunda' : 'Postpone'}
                  >
                    TUNDA
                  </button>
                )}
                <button
                  onClick={task.onAction}
                  className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-[#06402B] hover:text-[#0d543b] border border-[#E2D9C8] hover:border-[#06402B]/40 px-2.5 py-1 rounded-lg bg-white transition-all active:scale-95"
                >
                  {task.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div id="magic-priority-assistant" className="bg-[#FAF9F5] border border-[#E2D9C8] rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#06402B] text-white rounded-2xl">
            <Bot size={16} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif font-black text-xs text-sand-950 uppercase tracking-wide flex items-center gap-1.5">
              <span>{language === 'ID' ? 'Asisten Finansial' : 'Financial Assistant'}</span>
              <Sparkles size={12} className="text-amber-600" />
            </h4>
            <p className="text-[10px] text-sand-500 font-semibold font-mono">
              {language === 'ID' ? 'Ringkasan Eksekutif Prioritas Tugas' : 'Portfolio Executive Priorities Memo'}
            </p>
          </div>
        </div>
        <button className="text-sand-500 hover:text-sand-900 transition-colors p-1">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-1.5 border-t border-[#E2D9C8]/40 animate-in fade-in duration-300">
          
          {/* Main Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseAI(false)}
              className={`flex-1 py-2 text-[10px] font-mono tracking-widest uppercase font-extrabold rounded-xl border transition-all active:scale-95 ${
                !useAI 
                  ? 'bg-white border-[#06402B] text-[#06402B] shadow-xs' 
                  : 'bg-transparent border-transparent text-sand-500 hover:text-sand-900'
              }`}
            >
              📊 {language === 'ID' ? 'Daftar Sistem' : 'Local Priorities'}
            </button>
            <button
              onClick={invokeAIPriority}
              className={`flex-1 py-1.5 text-[10px] font-mono tracking-widest uppercase font-extrabold rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                useAI 
                  ? 'bg-white border-[#06402B] text-[#06402B] shadow-xs' 
                  : 'bg-[#06402B]/5 border-[#06402B]/10 text-[#06402B] hover:bg-[#06402B]/10'
              }`}
            >
              <Sparkles size={11} className={isLoading ? 'animate-spin text-amber-600' : 'text-amber-600'} />
              <span>✨ {language === 'ID' ? 'Ringkasan Asisten AI' : 'Invoke AI Assistant'}</span>
            </button>
          </div>

          {/* AI Output Mode */}
          {useAI ? (
            <div className="bg-white border border-[#E2D9C8]/60 rounded-2xl p-4 space-y-3.5 shadow-2xs">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <RefreshCw className="animate-spin text-[#06402B]" size={20} />
                  <p className="text-[10px] font-mono text-sand-500 font-extrabold uppercase tracking-widest animate-pulse">
                    {language === 'ID' ? 'Merangkum Rencana Portofolio...' : 'Synthesizing Priorities Memo...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-[#E2D9C8]/40">
                    <Sparkles size={11} className="text-amber-600" />
                    <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-wider text-sand-400">
                      {language === 'ID' ? 'Ringkasan Eksekutif Gemini' : 'Executive Digest — Gemini Engine'}
                    </span>
                  </div>
                  {renderAIOutput(aiOutput)}
                </div>
              )}
            </div>
          ) : (
            /* System Dynamic Algorithmic Priority Mode formatted as clean, executive-memo bullet list */
            <div className="bg-white border border-[#E2D9C8]/60 rounded-2xl p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-[#E2D9C8]/40">
                <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-wider text-sand-400">
                  {language === 'ID' ? 'Memo Sistem Berjalan' : 'System Operational Memo'}
                </span>
              </div>
              
              {algoTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="mx-auto text-[#06402B]/40 mb-2" size={24} />
                  <p className="text-xs font-serif italic text-sand-500">
                    {language === 'ID' 
                      ? '"Seluruh portofolio seimbang. Tidak ada tugas kritis hari ini."' 
                      : '"All financial systems in perfect layout equilibrium. No critical priorities."'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {renderAlgorithmicSection(
                    language === 'ID' ? 'HARI INI (DIREKTIF UTAMA)' : 'TODAY (CRITICAL DIRECTION)', 
                    todayTasks
                  )}
                  {renderAlgorithmicSection(
                    language === 'ID' ? 'BESOK (PENYESUAIAN)' : 'TOMORROW (TACTICAL REBALANCING)', 
                    tomorrowTasks
                  )}
                  {renderAlgorithmicSection(
                    language === 'ID' ? '3 HARI KE DEPAN (PEMANTAUAN)' : 'DAY 3 (STABILITY HORIZON)', 
                    day3Tasks
                  )}
                  {renderAlgorithmicSection(
                    language === 'ID' ? 'BISA DITUNDA' : 'POSTPONED (REVIEW REQUIRED)',
                    postponedTasksList
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MagicAssistant;
