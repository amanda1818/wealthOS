import React from 'react';
import { Sparkles } from 'lucide-react';
import { Pocket } from '../types';
import { useStore } from '../state/store';
import WaterfallTier from '../components/WaterfallTier';
import RecurringManager from '../components/RecurringManager';
import IntelligenceDesk from '../components/IntelligenceDesk';
import Ledger from '../components/Ledger';

const Flow: React.FC = () => {
  const state = useStore(s => s.state);
  const activeLens = useStore(s => s.activeLens);
  const language = useStore(s => s.language);
  const isPremium = useStore(s => s.isPremium);
  const setIsPremium = useStore(s => s.setIsPremium);
  const setSelectedPocket = useStore(s => s.setSelectedPocket);
  const handleSettleClaim = useStore(s => s.handleSettleClaim);
  const handleSettleClientReimbursement = useStore(s => s.handleSettleClientReimbursement);
  const handleUpdateSettings = useStore(s => s.handleUpdateSettings);

  const pocketsList = Object.values(state.pockets) as Pocket[];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-sand-500 px-1">
          {language === 'ID' ? 'Wawasan' : 'Insights'}
        </h3>
        <div className={isPremium ? "" : "relative overflow-hidden rounded-3xl"}>
          <div className={isPremium ? "" : "blur-[8px] opacity-30 pointer-events-none select-none transition-all duration-500 saturate-0"}>
            <IntelligenceDesk state={state} language={language} />
          </div>
          {!isPremium && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white/90 backdrop-blur-md p-6 border border-sand-200/50 max-w-sm flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl">
                <Sparkles className="text-[#06402B] mb-3" size={24} />
                <h4 className="font-serif font-black text-lg text-[#06402B] mb-2 font-serif">
                  Intelligence Desk
                </h4>
                <p className="text-sand-500 text-[11px] leading-relaxed mb-1 px-4 font-sans">
                  {language === 'ID' ? 'Akses intelijen pasif mendalam dan audit likuiditas.' : 'Access deep-layer passive intelligence & liquidity audits.'}
                </p>
                <p className="text-sand-400 text-[10px] font-mono uppercase tracking-widest mb-5">
                  {language === 'ID' ? 'Plus · Rp 79rb/bln' : 'Plus · Rp 79k/mo'}
                </p>
                <button onClick={() => setIsPremium(true)} className="bg-sand-100 hover:bg-sand-200 text-sand-900 border border-sand-300 text-xs font-bold px-6 py-2 rounded-xl transition-all font-mono tracking-widest uppercase">
                  {language === 'ID' ? 'Berlangganan' : 'Subscribe'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <WaterfallTier language={language} activeLens={activeLens} level={1} isExpanded={true} title={language === 'ID' ? "Komitmen Utama" : "Primary Commitments"} subtitle={language === 'ID' ? "Pengeluaran Tetap Esensial" : "Essential Fixed Expenses"} pockets={pocketsList.filter(p => p.group === 'SANCTUARY')} totalTarget={pocketsList.filter(p => p.group === 'SANCTUARY').reduce((a, b) => a + (b.target || 0), 0)} currentFilled={pocketsList.filter(p => p.group === 'SANCTUARY').reduce((a, b) => a + b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />
        <WaterfallTier language={language} activeLens={activeLens} level={2} isExpanded={false} title={language === 'ID' ? "Beban Operasional" : "Operating Outlays"} subtitle={language === 'ID' ? "Operasional Berkala & Rutin" : "Routine Running Expenses"} pockets={pocketsList.filter(p => p.group === 'DAILY')} totalTarget={pocketsList.filter(p => p.group === 'DAILY').reduce((a, b) => a + (b.target || 0), 0)} currentFilled={pocketsList.filter(p => p.group === 'DAILY').reduce((a, b) => a + b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />
        <WaterfallTier language={language} activeLens={activeLens} level={3} isExpanded={false} title={language === 'ID' ? "Alokasi Diskresioner" : "Discretionary Spending"} subtitle={language === 'ID' ? "Pengeluaran Gaya Hidup & Hobi" : "Lifestyle & Non-Essential Outlays"} pockets={pocketsList.filter(p => p.group === 'LIFESTYLE')} totalTarget={pocketsList.filter(p => p.group === 'LIFESTYLE').reduce((a, b) => a + (b.target || 0), 0)} currentFilled={pocketsList.filter(p => p.group === 'LIFESTYLE').reduce((a, b) => a + b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />
        <WaterfallTier language={language} activeLens={activeLens} level={4} isExpanded={false} title={language === 'ID' ? "Investasi & Portofolio" : "Capital Reserves & Investing"} subtitle={language === 'ID' ? "Cadangan Pokok Pertumbuhan" : "Asset Reservoirs & Long-Term Capital"} pockets={pocketsList.filter(p => p.group === 'WEALTH')} totalTarget={pocketsList.filter(p => p.group === 'WEALTH').reduce((a, b) => a + (b.target || 0), 0)} currentFilled={pocketsList.filter(p => p.group === 'WEALTH').reduce((a, b) => a + b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />

        <RecurringManager
          recurringObligations={state.recurringObligations}
          pockets={state.pockets}
          language={language}
        />
      </div>

      <Ledger
        currentPockets={state.pockets}
        history={state.history}
        activeLens={activeLens}
        liveTransactions={state.transactions}
        userName={state.user?.name}
        partnerName={state.partner?.name}
        onSettleClaim={handleSettleClaim}
        onSettleClientReimbursement={handleSettleClientReimbursement}
        language={language}
        settings={state.settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
};

export default Flow;
