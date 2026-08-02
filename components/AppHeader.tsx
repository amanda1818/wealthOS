import React from 'react';
import { Gem, History, Eye, EyeOff, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useStore, LensType } from '../state/store';
import { getLensLabel } from '../state/selectors';
import { signOut } from '../services/authService';

const AppHeader: React.FC = () => {
  const state = useStore(s => s.state);
  const language = useStore(s => s.language);
  const activeLens = useStore(s => s.activeLens);
  const setActiveLens = useStore(s => s.setActiveLens);
  const isPremium = useStore(s => s.isPremium);
  const setIsPremium = useStore(s => s.setIsPremium);
  const previousState = useStore(s => s.previousState);
  const handleUndo = useStore(s => s.handleUndo);
  const privacyMode = useStore(s => s.privacyMode);
  const togglePrivacyMode = useStore(s => s.togglePrivacyMode);
  const setShowControlTower = useStore(s => s.setShowControlTower);
  const scrollToTop = useStore(s => s.scrollToTop);

  return (
    <div className="z-[1000] bg-white border-b border-sand-200 px-4 md:px-8 py-3 flex justify-between items-center shrink-0 shadow-sm relative">
      <div onClick={scrollToTop} className="cursor-pointer group flex items-baseline gap-1.5 select-none shrink-0">
        <span className="text-xl md:text-2xl font-serif font-black italic text-[#06402B] tracking-tight transition-all duration-300 group-hover:text-sage-750">Wealth</span>
        <span className="text-sm md:text-base font-sans font-extrabold tracking-wider text-sand-400 uppercase">os</span>
        <span className="hidden lg:inline border-l border-sand-200 h-3.5 mx-2.5"></span>
        <p className="hidden lg:inline text-[8px] uppercase tracking-[0.22em] text-sand-500 font-mono font-bold">
          Sovereign Family Office
        </p>
      </div>

      <div className="flex bg-sand-100 border border-sand-200 rounded-xl p-0.5 shadow-sm scale-90 sm:scale-100">
        {(['HIS', 'JOINT', 'HER'] as LensType[]).map(lens => (
          <button
            key={lens}
            onClick={() => setActiveLens(lens)}
            title={getLensLabel(state, language, lens)}
            className={`max-w-[6.5rem] truncate px-2.5 py-1 md:px-4 md:py-1.5 rounded-lg text-[8px] md:text-[9.5px] font-mono font-bold uppercase tracking-widest transition-all active:scale-95 ${
                activeLens === lens
                ? (lens === 'HER' ? 'bg-sage-600 text-white shadow-sm' : lens === 'HIS' ? 'bg-sand-850 text-white shadow-sm' : 'bg-sage-600 text-white shadow-sm')
                : 'text-sand-500 hover:text-sand-950 hover:bg-black/5'
            }`}
          >
            {getLensLabel(state, language, lens)}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 md:gap-2.5 items-center shrink-0">
        {/* Premium / Upgrade -- inline value prop + price, no modal (REVAMP.md) */}
        {!isPremium && (
          <button
            onClick={() => setIsPremium(true)}
            title={language === 'ID' ? 'Buka semua fitur Plus' : 'Unlock every Plus feature'}
            className="px-2.5 py-1.5 md:px-3 md:py-1.5 bg-gradient-to-br from-sand-800 to-sand-950 hover:from-sand-900 hover:to-black text-amber-200 border border-sand-700 rounded-xl transition-all duration-300 active:scale-95 flex items-center gap-1.5 shadow-sm font-bold"
          >
            <Gem size={13} strokeWidth={2.5} className="text-amber-300" />
            <span className="hidden sm:inline text-[9px] font-mono tracking-widest uppercase font-extrabold text-amber-200">Plus · Rp 79k/mo</span>
          </button>
        )}

        {/* CS & Product Protection: History Rollback / Undo Button */}
        {previousState && (
          <button
            onClick={handleUndo}
            title={language === 'ID' ? "Batalkan Tindakan Terakhir" : "Undo Last Action"}
            className="p-1.5 md:p-2 bg-amber-50 hover:bg-[#FAF6EA] border border-amber-300 text-amber-800 rounded-lg transition-all duration-300 active:scale-95 flex items-center gap-1 shadow-sm"
          >
            <History size={13} className="text-amber-700 animate-pulse" />
            <span className="hidden xs:inline text-[9px] font-mono font-bold tracking-wider uppercase text-amber-800">{language === 'ID' ? 'Batal' : 'Undo'}</span>
          </button>
        )}

        {/* CS & Product Protection: Dynamic Privacy Shield Toggle */}
        <button
          onClick={togglePrivacyMode}
          title={privacyMode ? "Reveal Balances (Privacy Shield)" : "Hide Balances (Privacy Shield)"}
          className={`p-1.5 md:p-2 border rounded-lg transition-all duration-300 active:scale-95 flex items-center gap-1 ${
              privacyMode
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm font-bold'
              : 'bg-sand-100 border-sand-200 text-sand-700 hover:bg-sand-200/50 hover:border-sand-300'
          }`}
        >
          {privacyMode ? <EyeOff size={13} className="text-emerald-700" /> : <Eye size={13} className="text-sand-600" />}
          <span className="hidden xs:inline text-[9px] font-mono font-bold tracking-wider uppercase">
            {privacyMode ? 'Masked' : 'Private'}
          </span>
        </button>

        <button onClick={() => setShowControlTower(true)} title="System Control Tower" className="p-1.5 md:p-2 bg-sand-100 border border-sand-200 rounded-lg hover:border-sage-600 transition-colors text-sand-900 active:scale-95 hover:bg-sand-200/50">
          <SettingsIcon size={13} />
        </button>

        <button onClick={() => signOut()} title="Sign Out" className="p-1.5 md:p-2 bg-sand-100 border border-sand-200 rounded-lg hover:border-rose-400 transition-colors text-sand-900 active:scale-95 hover:bg-sand-200/50">
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
};

export default AppHeader;
