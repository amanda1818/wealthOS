import React, { useState } from 'react';
import { Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { AppState } from '../types';
import { getMagicPriorityTasks } from '../services/geminiService';
import { AlgorithmicTask } from './Assistant';

interface AssistantPrioritiesProps {
  state: AppState;
  language?: 'EN' | 'ID';
  algoTasks: AlgorithmicTask[];
  postponedIds: string[];
  onTogglePostpone: (taskId: string) => void;
}

// Rule-based priority engine (unchanged logic from the old standalone
// MagicAssistant) plus its optional AI-digest mode. This is the one genuinely
// non-redundant capability across the three merged components -- nothing
// else in the app looks at pockets/liabilities/receivables and tells you
// what to do about them.
const AssistantPriorities: React.FC<AssistantPrioritiesProps> = ({ state, language = 'EN', algoTasks, postponedIds, onTogglePostpone }) => {
  const [useAI, setUseAI] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
          const trimmed = line.replace(/^\s*[\-\*•]\s*/, '').replace(/\*/g, '').trim();
          if (!trimmed) return null;

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
                    onClick={() => onTogglePostpone(task.id)}
                    className="mr-2 text-[9px] font-mono font-extrabold uppercase tracking-wider text-sand-400 hover:text-sand-600 px-1 py-1 rounded"
                    title={language === 'ID' ? 'Tunda' : 'Postpone'}
                  >
                    {language === 'ID' ? 'TUNDA' : 'POSTPONE'}
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-wealth-bg">
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
          {language === 'ID' ? 'Daftar Sistem' : 'Local Priorities'}
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
          <span>{language === 'ID' ? 'Ringkasan Asisten AI' : 'Invoke AI Assistant'}</span>
        </button>
      </div>

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
  );
};

export default AssistantPriorities;
