import React, { useEffect, useState } from 'react';
import { Sparkles, X, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
import { useStore } from '../state/store';
import {
  computeDerived, computeFreedomYear, formatIDR,
  computeWeeklyPactContribution, computeWeeklyClaimsSettled, WeeklyClaimsSettled,
} from '../state/selectors';

interface WeeklyReportProps {
  onClose: () => void;
}

// The signature "can't wait to open it" ritual (PRODUCT-BRIEF.md §6). Every
// line here traces to a real transaction date or the same Freedom Date
// simulation used elsewhere -- nothing here is fabricated, and a quiet week
// is shown as a quiet week, not padded with filler.
const WeeklyReport: React.FC<WeeklyReportProps> = ({ onClose }) => {
  const state = useStore(s => s.state);
  const language = useStore(s => s.language);
  const privacyMode = useStore(s => s.privacyMode);
  const handleRecordWeeklyReport = useStore(s => s.handleRecordWeeklyReport);

  // Stable for the lifetime of this visit -- re-deriving `now` on every
  // render would make the trailing-7-day window drift mid-scroll.
  const [now] = useState(() => Date.now());

  // Capture the PRIOR report baseline before this visit's roll-forward (see
  // handleRecordWeeklyReport) can overwrite it -- same technique as
  // routes/Together.tsx's Layer 1 instrument, separate namespace.
  const [baseline] = useState(() => ({
    freedomYear: state.lastReportFreedomYear,
    netWorth: state.lastReportNetWorth,
    date: state.lastReportDate,
  }));

  const derived = computeDerived(state, 'JOINT', language);
  const activeLifeCards = state.lifeCards.filter(c => c.isActive);
  const currentFreedomYear = computeFreedomYear(state.monthlyIncome, derived.monthlyBurn, derived.totalPocketCash, activeLifeCards);
  const currentNetWorth = derived.householdNetWorth;

  useEffect(() => {
    handleRecordWeeklyReport(currentFreedomYear, currentNetWorth);
    // Deliberately once per visit -- handleRecordWeeklyReport itself gates
    // on 7 real days having elapsed, so mid-week revisits are a no-op.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtIDR = (n: number) => formatIDR(privacyMode, language, n);
  const hasPriorReport = baseline.date != null;

  const meName = state.user?.name || (language === 'ID' ? 'Anda' : 'You');
  const partnerName = state.partner?.name || (language === 'ID' ? 'Pasangan' : 'Partner');
  const meContribution = computeWeeklyPactContribution(state, state.user, now);
  const meClaims = computeWeeklyClaimsSettled(state, state.user?.id, now);
  const partnerContribution = computeWeeklyPactContribution(state, state.partner, now);
  const partnerClaims = computeWeeklyClaimsSettled(state, state.partner?.id, now);
  const usClaims = computeWeeklyClaimsSettled(state, undefined, now);

  const freedomLabel = (year: number) => year === -1
    ? (language === 'ID' ? 'Di luar cakrawala 20 tahun' : 'Beyond 20-year horizon')
    : (language === 'ID' ? `Dalam ${year} Tahun` : `In ${year} Year${year === 1 ? '' : 's'}`);

  const renderPersonSection = (name: string, contribution: number, claims: WeeklyClaimsSettled) => {
    const hasActivity = contribution > 0 || claims.count > 0;
    if (!hasActivity) {
      return (
        <p className="text-sm text-sand-500 italic">
          {language === 'ID' ? `Tidak ada aktivitas baru untuk ${name} minggu ini.` : `No new activity logged for ${name} this week.`}
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {contribution > 0 && (
          <div className="flex items-center gap-2 text-sm text-sand-800">
            <CheckCircle2 size={16} className="text-[#06402B] shrink-0" />
            <span>{language === 'ID' ? `${name} memindahkan Rp ${fmtIDR(contribution)} ke kantong bersama minggu ini.` : `${name} moved Rp ${fmtIDR(contribution)} into joint pockets this week.`}</span>
          </div>
        )}
        {claims.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-sand-800">
            <CheckCircle2 size={16} className="text-[#06402B] shrink-0" />
            <span>{language === 'ID' ? `${name} menyelesaikan ${claims.count} klaim (Rp ${fmtIDR(claims.amount)}) minggu ini.` : `${name} settled ${claims.count} claim${claims.count === 1 ? '' : 's'} (Rp ${fmtIDR(claims.amount)}) this week.`}</span>
          </div>
        )}
      </div>
    );
  };

  // Same honest branching as Together.tsx's Layer 1 -- see that file for the
  // full case-by-case reasoning on the -1 (beyond 20-year horizon) sentinel.
  let freedomDeltaNode: React.ReactNode = null;
  let netWorthDeltaNode: React.ReactNode = null;
  if (hasPriorReport) {
    const priorYear = baseline.freedomYear ?? -1;
    if (priorYear === -1 && currentFreedomYear === -1) {
      freedomDeltaNode = <span className="text-sand-500 flex items-center gap-1"><Minus size={14} /> {language === 'ID' ? 'Masih di luar cakrawala 20 tahun, tidak berubah' : 'Still beyond the 20-year horizon, unchanged'}</span>;
    } else if (priorYear === -1 && currentFreedomYear !== -1) {
      freedomDeltaNode = <span className="text-[#06402B] font-bold flex items-center gap-1"><TrendingUp size={14} /> {language === 'ID' ? 'Kini terlihat -- pertama kali dalam 20 tahun' : 'Now in view -- first time within 20 years'}</span>;
    } else if (priorYear !== -1 && currentFreedomYear === -1) {
      freedomDeltaNode = <span className="text-rose-700 font-bold flex items-center gap-1"><TrendingDown size={14} /> {language === 'ID' ? 'Bergeser ke luar cakrawala 20 tahun' : 'Moved beyond the 20-year horizon'}</span>;
    } else {
      const deltaYears = priorYear - currentFreedomYear;
      if (deltaYears > 0) {
        freedomDeltaNode = <span className="text-[#06402B] font-bold flex items-center gap-1"><TrendingUp size={14} /> {language === 'ID' ? `${deltaYears} tahun lebih dekat` : `${deltaYears} year${deltaYears === 1 ? '' : 's'} closer`}</span>;
      } else if (deltaYears < 0) {
        freedomDeltaNode = <span className="text-rose-700 font-bold flex items-center gap-1"><TrendingDown size={14} /> {language === 'ID' ? `${Math.abs(deltaYears)} tahun lebih jauh` : `${Math.abs(deltaYears)} year${Math.abs(deltaYears) === 1 ? '' : 's'} further`}</span>;
      } else {
        freedomDeltaNode = <span className="text-sand-500 flex items-center gap-1"><Minus size={14} /> {language === 'ID' ? 'Tidak berubah' : 'No change'}</span>;
      }
    }

    const priorNetWorth = baseline.netWorth ?? 0;
    const netWorthDelta = currentNetWorth - priorNetWorth;
    if (netWorthDelta > 0) {
      netWorthDeltaNode = <span className="text-[#06402B] font-bold flex items-center gap-1"><TrendingUp size={14} /> +Rp {fmtIDR(netWorthDelta)}</span>;
    } else if (netWorthDelta < 0) {
      netWorthDeltaNode = <span className="text-rose-700 font-bold flex items-center gap-1"><TrendingDown size={14} /> -Rp {fmtIDR(Math.abs(netWorthDelta))}</span>;
    } else {
      netWorthDeltaNode = <span className="text-sand-500 flex items-center gap-1"><Minus size={14} /> {language === 'ID' ? 'Tidak berubah' : 'No change'}</span>;
    }
  }

  return (
    <div className="fixed inset-0 z-[1050] bg-wealth-bg flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-wealth-panel p-6 border-b border-wealth-border flex justify-between items-center shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-wealth-emerald text-white rounded-xl shadow-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-wealth-text leading-none">
              {language === 'ID' ? 'Laporan Mingguan' : 'Weekly Report'}
            </h2>
            <p className="text-xs text-wealth-muted uppercase tracking-widest font-bold mt-1">
              {language === 'ID' ? 'Kemenangan Nyata Minggu Ini' : "This Week's Real Wins"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          title={language === 'ID' ? 'Kembali ke Dasbor' : 'Back to Dashboard'}
          className="flex items-center gap-1.5 pl-3 pr-2 py-2 hover:bg-black/5 rounded-full transition-colors text-wealth-text border border-wealth-border shrink-0"
        >
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-wealth-muted">
            {language === 'ID' ? 'Kembali' : 'Back'}
          </span>
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-6">

          {!hasPriorReport && (
            <div className="bg-white border border-sand-200 rounded-3xl p-6 text-center space-y-2">
              <p className="text-sm text-sand-700">
                {language === 'ID'
                  ? 'Ini laporan pertama Anda -- kami baru mencatat titik acuan hari ini. Laporan mingguan berikutnya akan menunjukkan pergerakan nyata.'
                  : "This is your first report -- we just recorded today's baseline. Your next weekly report will show real movement."}
              </p>
              <div className="flex justify-center gap-8 pt-2 text-sm">
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">{language === 'ID' ? 'Freedom Date' : 'Freedom Date'}</div>
                  <div className="font-serif font-bold text-sand-950">{freedomLabel(currentFreedomYear)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">{language === 'ID' ? 'Kekayaan Bersih' : 'Net Worth'}</div>
                  <div className="font-serif font-bold text-sand-950">Rp {fmtIDR(currentNetWorth)}</div>
                </div>
              </div>
            </div>
          )}

          {/* For You */}
          <div className="bg-white border border-sand-200 rounded-3xl p-6">
            <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-sand-500 mb-3">
              {language === 'ID' ? `Untuk ${meName}` : `For ${meName}`}
            </h3>
            {renderPersonSection(meName, meContribution, meClaims)}
          </div>

          {/* For Partner */}
          <div className="bg-white border border-sand-200 rounded-3xl p-6">
            <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-sand-500 mb-3">
              {language === 'ID' ? `Untuk ${partnerName}` : `For ${partnerName}`}
            </h3>
            {renderPersonSection(partnerName, partnerContribution, partnerClaims)}
          </div>

          {/* For Us */}
          <div className="bg-white border border-sand-200 rounded-3xl p-6 space-y-4">
            <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-sand-500">
              {language === 'ID' ? 'Untuk Kita' : 'For Us'}
            </h3>

            {hasPriorReport && (
              <>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">
                    {language === 'ID' ? 'Freedom Date' : 'Freedom Date'}
                  </div>
                  <div className="text-lg font-serif font-bold text-sand-950 mb-1">{freedomLabel(currentFreedomYear)}</div>
                  <div className="text-xs">{freedomDeltaNode}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">
                    {language === 'ID' ? 'Kekayaan Bersih Bersama' : 'Joint Net Worth'}
                  </div>
                  <div className="text-lg font-serif font-bold text-sand-950 mb-1">Rp {fmtIDR(currentNetWorth)}</div>
                  <div className="text-xs">{netWorthDeltaNode}</div>
                </div>
              </>
            )}

            {usClaims.count > 0 ? (
              <div className="flex items-center gap-2 text-sm text-sand-800">
                <CheckCircle2 size={16} className="text-[#06402B] shrink-0" />
                <span>
                  {language === 'ID'
                    ? `Bersama, Anda menyelesaikan ${usClaims.count} klaim (Rp ${fmtIDR(usClaims.amount)}) minggu ini.`
                    : `Together, you cleared ${usClaims.count} claim${usClaims.count === 1 ? '' : 's'} (Rp ${fmtIDR(usClaims.amount)}) this week.`}
                </span>
              </div>
            ) : (
              <p className="text-sm text-sand-500 italic">
                {language === 'ID' ? 'Tidak ada klaim yang diselesaikan bersama minggu ini.' : 'No claims settled together this week.'}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;
