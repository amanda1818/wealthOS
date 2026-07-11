import React, { useState, useEffect } from 'react';
import { 
  Cat, 
  Home, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Heart, 
  Zap, 
  Trash2, 
  Coins, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { AppState, PocketType, Transaction } from '../types';

interface ManorAndKikoProps {
  state: AppState;
  onAddTransaction: (newTx: Transaction) => void;
  language?: 'EN' | 'ID';
}

interface FinancialLiabilityItem {
  id: string;
  task: string;
  category: 'KIKO' | 'MANOR_HOUSE';
  isDone: boolean;
  cost: number;
  pocketId: string;
}

const KIKO_REALITY_INSIGHTS = [
  "Kiko inspected the newly delivered Rp 240.000 organic salmon kibble, sneezed, and sat inside the empty shipping box instead. Pragmatic Ragdoll logic.",
  "David ordered a Rp 350.000 auto-filtering water fountain. Kiko watched it bubble with curiosity, then drank water out of David's unattended tea mug instead.",
  "Victoria bought a silk cloud bed for Kiko for Rp 250.000. Kiko hissed gently and chose to sleep on top of the mortgage receipts pile.",
  "You spent Rp 500.000 at the high-end vet clinic. The official notes read: 'Perfect health. She is just judging your life choices very loudly.'",
  "Financing tip: Buying Kiko 5 premium wool designer toy mice is a transaction. Finding three under the refrigerator 10 minutes later is a lifestyle.",
  "Elegance and chaos: The AC servicing cost Rp 350.000. Minutes after the technicians left, Kiko slept on the warm output grill to maximize comfort."
];

const LIABILITIES_INITIAL: FinancialLiabilityItem[] = [
  { id: 'k1', task: 'Imported Premium Kibble & Jelly Food Case', category: 'KIKO', isDone: false, cost: 240000, pocketId: PocketType.GROCERIES },
  { id: 'k2', task: 'Quarterly Veterinary Wellness & Vaccines', category: 'KIKO', isDone: false, cost: 420000, pocketId: PocketType.SELF_CARE },
  { id: 'k3', task: 'Hypoallergenic Grooming & Tear Stain Care', category: 'KIKO', isDone: false, cost: 150000, pocketId: PocketType.GROCERIES },
  { id: 'h1', task: 'Quarterly Air Conditioner Care & Deep Wash', category: 'MANOR_HOUSE', isDone: false, cost: 350000, pocketId: PocketType.UTILITIES },
  { id: 'h2', task: 'Gardener & Master Security Monthly Dues', category: 'MANOR_HOUSE', isDone: false, cost: 400000, pocketId: PocketType.STAFF },
  { id: 'h3', task: 'Sanctuary Master Bathroom Drainage Siphon Settle', category: 'MANOR_HOUSE', isDone: false, cost: 180000, pocketId: PocketType.HOUSING }
];

export const ManorAndKikoDesk: React.FC<ManorAndKikoProps> = ({ state, onAddTransaction, language = 'EN' }) => {
  const [activeTab, setActiveTab] = useState<'KIKO' | 'MANOR_HOUSE'>('KIKO');
  const [items, setItems] = useState<FinancialLiabilityItem[]>(() => {
    const saved = localStorage.getItem('SOVEREIGN_KIKO_LIABILITIES_V2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return LIABILITIES_INITIAL;
      }
    }
    return LIABILITIES_INITIAL;
  });

  const [kikoMood, setKikoMood] = useState<string>("🐾 Purring softly (White coat gleaming)");
  const [dopamineBurst, setDopamineBurst] = useState<string | null>(null);
  const [insight, setInsight] = useState<string>("");

  // Sound generator
  const playSound = (type: 'chirp' | 'coin') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'chirp') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1450, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'coin') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(880, ctx.currentTime); 
        osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.06); 
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.12);
        osc2.start(ctx.currentTime + 0.06);
        osc2.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  // Determine Kiko state
  useEffect(() => {
    const kikoItems = items.filter(i => i.category === 'KIKO');
    const undoneKikoCount = kikoItems.filter(i => !i.isDone).length;
    
    if (undoneKikoCount === kikoItems.length) {
      setKikoMood(language === 'ID' ? "😿 Lapar & Bulu Kusam (Butuh belanja bulanan!)" : "😿 Needs Grocery Refill (Awaiting premium dry-salmon case)");
    } else if (undoneKikoCount > 0) {
      setKikoMood(language === 'ID' ? "😸 Penasaran (Menatap piring makannya)" : "😸 Pampered & Royal (Awaiting dental grooming update)");
    } else {
      setKikoMood(language === 'ID' ? "👑 Sangat Teduh & Sejahtera (Paws up! Purring)" : "👑 Absolutely Pristine (Paws up! Deep blue eyes glowing)");
    }
    localStorage.setItem('SOVEREIGN_KIKO_LIABILITIES_V2', JSON.stringify(items));
  }, [items, language]);

  const handleToggleItemStatus = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextDone = !item.isDone;
        if (nextDone) {
          playSound('chirp');
          triggerVisualDopamine(
            language === 'ID'
              ? `Tugas selesai ditandai! Alokasi dikoordinasikan.`
              : `Focus checkpoint reached! Obligation marked.`
          );
        }
        return { ...item, isDone: nextDone };
      }
      return item;
    }));
  };

  const triggerVisualDopamine = (message: string) => {
    setDopamineBurst(message);
    setTimeout(() => {
      setDopamineBurst(null);
    }, 3500);
  };

  const handleFundItem = (item: FinancialLiabilityItem) => {
    const isKiko = item.category === 'KIKO';

    // Append standard operational transaction item
    const newTx: Transaction = {
      id: `manor-kiko-${Date.now()}`,
      date: new Date().toISOString(),
      description: isKiko ? `🐾 Kiko Royal Care: ${item.task}` : `🏠 Manor Maintenance: ${item.task}`,
      amount: item.cost,
      netAmount: item.cost,
      repaidAmount: 0,
      category: isKiko ? 'Pet Maintenance' : 'House Upkeep',
      type: 'EXPENSE',
      pocket: item.pocketId,
      status: 'SETTLED',
      ownerId: state.user?.id || 'JOINT',
      source: 'JOINT',
      isPrivate: false,
    };

    onAddTransaction(newTx);
    playSound('coin');
    
    // Set item as completed
    setItems(prev => prev.map(c => c.id === item.id ? { ...c, isDone: true } : c));

    triggerVisualDopamine(
      language === 'ID' 
        ? `Dana ditarik dari Saku '${item.pocketId}'! Rp ${formatIDR(item.cost)} tercatat.`
        : `Envelope allocated! Pocket '${item.pocketId}' deducted by Rp ${formatIDR(item.cost)}.`
    );
  };

  const handleResetObligations = () => {
    setItems(LIABILITIES_INITIAL);
    triggerVisualDopamine(
      language === 'ID'
        ? "Jadwal outlays bulanan disetel ulang untuk bulan baru!"
        : "Sovereign monthly financial outlays reset successfully!"
    );
  };

  const handleRollInsight = () => {
    const idx = Math.floor(Math.random() * KIKO_REALITY_INSIGHTS.length);
    setInsight(KIKO_REALITY_INSIGHTS[idx]);
  };

  const formatIDR = (num: number) => {
    if ((window as any).privacyShieldActive) return "••••••";
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { 
      maximumFractionDigits: 0 
    }).format(num);
  };

  const activeItems = items.filter(c => c.category === (activeTab === 'KIKO' ? 'KIKO' : 'MANOR_HOUSE'));
  const doneCount = activeItems.filter(c => c.isDone).length;
  const progressRatio = activeItems.length > 0 ? (doneCount / activeItems.length) * 100 : 0;

  return (
    <div id="manor_kiko_financial_desk" className="bg-white border border-[#E2D9C8] rounded-3xl p-5 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#E2D9C8]/40 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Cat className="text-[#06402B] h-4.5 w-4.5" />
          <div>
            <h3 className="font-serif font-black text-xs text-sand-950 uppercase tracking-tight">
              {language === 'ID' ? 'Kiko & Rumah: Pengeluaran Prioritas' : 'Kiko & Manor Financial Desk'}
            </h3>
            <span className="text-[7.5px] font-mono text-stone-450 block uppercase tracking-wider font-extrabold -mt-0.5">
              {language === 'ID' ? 'Kelola Pengeluaran Rutin Yang Mudah Terlupakan' : 'COGNITIVE SAFETY NET FOR CRITICAL BILLS'}
            </span>
          </div>
        </div>
        <span className="text-[8px] font-mono text-emerald-800 font-bold uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-150">
          {language === 'ID' ? 'FOKUS BEBAS BISING' : 'DIRECT FLOW'}
        </span>
      </div>

      {/* Profile Bio of Kiko */}
      <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-xl shrink-0 shadow-3xs">
          🐱
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-serif font-black text-slate-900">Kiko</span>
            <span className="text-[7px] font-mono uppercase bg-slate-200 text-slate-700 px-1.5 rounded-md font-bold">
              White Ragdoll
            </span>
          </div>
          <p className="text-[10px] text-stone-500 truncate italic">
            {language === 'ID' ? "Bulu seputih tumpukan salju dengan mata biru laut jernih." : "Snow-white coat paired with crystal ocean-blue eyes."}
          </p>
        </div>
      </div>

      {/* Tabs Switch */}
      <div className="grid grid-cols-2 gap-2 bg-sand-50/80 p-1 rounded-2xl border border-sand-110">
        <button
          onClick={() => setActiveTab('KIKO')}
          className={`py-2 text-[10px] uppercase font-mono font-black tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === 'KIKO'
              ? 'bg-[#06402B] text-white shadow-3xs'
              : 'text-sand-650 hover:text-sand-900 hover:bg-sand-100/60'
          }`}
        >
          <Cat size={12} />
          <span>Kiko Box ({items.filter(i => i.category === 'KIKO' && !i.isDone).length} Left)</span>
        </button>
        <button
          onClick={() => setActiveTab('MANOR_HOUSE')}
          className={`py-2 text-[10px] uppercase font-mono font-black tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === 'MANOR_HOUSE'
              ? 'bg-[#06402B] text-white shadow-3xs'
              : 'text-sand-650 hover:text-sand-900 hover:bg-sand-100/60'
          }`}
        >
          <Home size={12} />
          <span>Manor House ({items.filter(i => i.category === 'MANOR_HOUSE' && !i.isDone).length} Left)</span>
        </button>
      </div>

      {/* Dynamic Status Display with progress lines */}
      {activeTab === 'KIKO' ? (
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col gap-2 text-stone-700">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[8px] font-mono uppercase tracking-wider font-bold text-emerald-800">Kiko's Royal Status</span>
              <div className="text-xs font-bold text-[#06402B]">{kikoMood}</div>
            </div>
            <div className="text-2xl animate-bounce duration-4000 shrink-0">🤍</div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono text-emerald-700 font-bold">
              <span>💖 {language === 'ID' ? 'SERENITY KIKO INDEX' : 'RAGDOLL SERENITY COEFFICIENT'}</span>
              <span>{Math.round(items.filter(i => i.category === 'KIKO').length > 0 ? (items.filter(i => i.category === 'KIKO' && i.isDone).length / items.filter(i => i.category === 'KIKO').length) * 100 : 100)}%</span>
            </div>
            <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-650 h-full transition-all duration-500 rounded-full"
                style={{ width: `${items.filter(i => i.category === 'KIKO').length > 0 ? (items.filter(i => i.category === 'KIKO' && i.isDone).length / items.filter(i => i.category === 'KIKO').length) * 100 : 100}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col gap-2 text-stone-700">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[8px] font-mono uppercase tracking-wider font-bold text-amber-800">House Infrastructure Status</span>
              <div className="text-xs font-bold text-amber-900">
                {progressRatio === 100 
                  ? (language === 'ID' ? "🏰 Rumah Sangat Nyaman & Terawat!" : "🏰 Castle Integrity Fully Maintained!") 
                  : (language === 'ID' ? "⚙️ Pembayaran prioritas sedang berjalan" : "⚙️ Urgent outlays tracking live")
                }
              </div>
            </div>
            <div className="text-2xl shrink-0">🏡</div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono text-amber-700 font-bold">
              <span>🏰 {language === 'ID' ? 'INTEGRITAS SANCTUARY' : 'CASTLE INTEGRITY RATING'}</span>
              <span>{Math.round(progressRatio)}%</span>
            </div>
            <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chime / Allocation Confirmation Toast */}
      {dopamineBurst && (
        <div className="p-2.5 bg-stone-900 text-white font-mono text-[9px] font-bold rounded-xl animate-in fade-in zoom-in duration-300 flex items-center gap-1.5">
          <Sparkles size={11} className="text-amber-400 shrink-0 animate-pulse" />
          <span className="leading-snug">{dopamineBurst}</span>
        </div>
      )}

      {/* Active Items list */}
      <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
        {activeItems.map((item) => (
          <div 
            key={item.id}
            className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
              item.isDone 
                ? 'bg-stone-50 border-stone-200/60 opacity-65 line-through' 
                : 'bg-white border-[#E2D9C8]/70 hover:border-sand-400 hover:shadow-3xs'
            }`}
          >
            <div className="flex items-center gap-2 max-w-[70%]">
              <button 
                onClick={() => handleToggleItemStatus(item.id)}
                className="text-[#06402B] hover:scale-110 active:scale-95 transition shrink-0"
              >
                {item.isDone ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <div className="space-y-0.5">
                <span className="text-[11px] font-sans font-bold text-stone-800 block leading-tight">{item.task}</span>
                <span className="text-[8px] font-mono text-sand-500 font-bold uppercase tracking-wider">
                  {item.isDone ? (language === 'ID' ? 'LUNAS' : 'PAID') : `${language === 'ID' ? 'Kebutuhan Saku' : 'From Pocket'}: ${item.pocketId}`}
                </span>
              </div>
            </div>

            {/* Fund action */}
            {!item.isDone && (
              <button
                onClick={() => handleFundItem(item)}
                className="px-2 py-1 bg-[#FDFCF7] hover:bg-[#FAF8F2] border border-[#06402B]/30 hover:border-[#06402B] rounded-lg text-[#06402B] flex items-center gap-1 text-[9px] font-mono font-extrabold transition active:scale-95 text-right shrink-0"
                title={language === 'ID' ? "Bayar menggunakan jatah Saku" : "Transact instantly out of Pocket budget"}
              >
                <Coins size={10} />
                <span>Rp {formatIDR(item.cost)}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer Insight & Resets */}
      <div className="flex justify-between items-center bg-sand-50/50 border border-sand-150 p-2.5 rounded-2xl gap-2">
        <button
          onClick={handleRollInsight}
          className="flex-1 py-1.5 px-3 bg-white hover:bg-sand-100 border border-sand-200 rounded-xl text-[9px] font-mono font-black uppercase text-sand-700 flex items-center justify-center gap-1 transition active:scale-95"
          title="Feline Reality Check"
        >
          <Zap size={11} className="text-[#06402B]" />
          <span>{language === 'ID' ? "Fakta Lucu Kiko" : "Feline Insight"}</span>
        </button>

        <button
          onClick={handleResetObligations}
          className="py-1.5 px-2.5 bg-white hover:bg-red-50 border border-sand-200 rounded-xl text-sand-400 hover:text-red-650 transition active:scale-95"
          title="Reset Monthly List"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Cute Reality Insight text */}
      {insight && (
        <div className="p-3 bg-indigo-50/30 border border-indigo-200 border-dashed rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex gap-1.5 items-start">
            <Heart size={12} className="text-indigo-500 fill-indigo-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="text-[8px] font-mono uppercase tracking-widest font-black text-indigo-800">Ragdoll Reality Check:</span>
              <p className="text-[10.5px] italic text-stone-700 leading-normal font-medium">{insight}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
