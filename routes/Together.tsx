import React, { useEffect, useState } from 'react';
import { HeartHandshake, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useStore } from '../state/store';
import { computeDerived, computeFreedomYear, formatIDR } from '../state/selectors';
import EmptyState from '../ui/EmptyState';
import Card from '../ui/Card';

const Together: React.FC = () => {
  const state = useStore(s => s.state);
  const language = useStore(s => s.language);
  const privacyMode = useStore(s => s.privacyMode);
  const handleRecordCheckIn = useStore(s => s.handleRecordCheckIn);

  // Capture the PRIOR observation once, before this visit's roll-forward
  // (below) overwrites it in the store -- otherwise the delta shown here
  // would collapse to zero the instant the effect fires and re-renders.
  const [baseline] = useState(() => ({
    freedomYear: state.lastCheckFreedomYear,
    netWorth: state.lastCheckNetWorth,
    date: state.lastCheckDate,
  }));

  // Together is always Joint -- shared, not solo (Pillar 4), matching how
  // Household Net Worth is never lens-filtered elsewhere in the app.
  const derived = computeDerived(state, 'JOINT', language);
  const activeLifeCards = state.lifeCards.filter(c => c.isActive);
  const currentFreedomYear = computeFreedomYear(state.monthlyIncome, derived.monthlyBurn, derived.totalPocketCash, activeLifeCards);
  const currentNetWorth = derived.householdNetWorth;

  useEffect(() => {
    handleRecordCheckIn(currentFreedomYear, currentNetWorth);
    // Deliberately once per visit -- see handleRecordCheckIn's same-day guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPriorCheck = baseline.date != null;
  const fmtIDR = (n: number) => formatIDR(privacyMode, language, n);

  const freedomLabel = (year: number) => year === -1
    ? (language === 'ID' ? 'Di luar cakrawala 20 tahun' : 'Beyond 20-year horizon')
    : (language === 'ID' ? `Dalam ${year} Tahun` : `In ${year} Year${year === 1 ? '' : 's'}`);

  if (!hasPriorCheck) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={HeartHandshake}
          title={language === 'ID' ? 'Membangun Riwayat Anda' : 'Building Your History'}
          subtitle={
            language === 'ID'
              ? 'Kami baru mencatat titik acuan hari ini. Kembali lagi setelah beberapa waktu untuk melihat pergerakan nyata Freedom Date dan kekayaan bersih Anda.'
              : "We just recorded today's baseline. Check back after some time has passed to see real movement in your Freedom Date and joint net worth."
          }
        />
        <Card className="p-6 grid grid-cols-2 gap-6">
          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">
              {language === 'ID' ? 'Freedom Date Hari Ini' : "Today's Freedom Date"}
            </div>
            <div className="text-xl font-serif font-bold text-sand-950">{freedomLabel(currentFreedomYear)}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">
              {language === 'ID' ? 'Kekayaan Bersih Hari Ini' : "Today's Net Worth"}
            </div>
            <div className="text-xl font-serif font-bold text-sand-950">Rp {fmtIDR(currentNetWorth)}</div>
          </div>
        </Card>
      </div>
    );
  }

  // Freedom Date delta. Lower year = closer to freedom, so deltaYears counts
  // DOWN as positive movement. The -1 sentinel (never reached within the
  // 20-year simulation horizon) needs its own honest framing in both
  // directions, not just a numeric subtraction.
  const priorYear = baseline.freedomYear ?? -1;
  let freedomDeltaNode: React.ReactNode;
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

  // Net worth delta -- always a real number, no sentinel to handle.
  const priorNetWorth = baseline.netWorth ?? 0;
  const netWorthDelta = currentNetWorth - priorNetWorth;
  let netWorthDeltaNode: React.ReactNode;
  if (netWorthDelta > 0) {
    netWorthDeltaNode = <span className="text-[#06402B] font-bold flex items-center gap-1"><TrendingUp size={14} /> +Rp {fmtIDR(netWorthDelta)}</span>;
  } else if (netWorthDelta < 0) {
    netWorthDeltaNode = <span className="text-rose-700 font-bold flex items-center gap-1"><TrendingDown size={14} /> -Rp {fmtIDR(Math.abs(netWorthDelta))}</span>;
  } else {
    netWorthDeltaNode = <span className="text-sand-500 flex items-center gap-1"><Minus size={14} /> {language === 'ID' ? 'Tidak berubah' : 'No change'}</span>;
  }

  return (
    <div className="space-y-6">
      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-sand-500 px-1">
        {language === 'ID' ? `Sejak pemeriksaan terakhir · ${baseline.date}` : `Since your last check-in · ${baseline.date}`}
      </div>

      <Card className="p-6">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">
          {language === 'ID' ? 'Tanggal Kebebasan' : 'Freedom Date'}
        </div>
        <div className="text-2xl font-serif font-bold text-sand-950 mb-2">{freedomLabel(currentFreedomYear)}</div>
        <div className="text-xs">{freedomDeltaNode}</div>
      </Card>

      <Card className="p-6">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">
          {language === 'ID' ? 'Kekayaan Bersih Bersama' : 'Joint Net Worth'}
        </div>
        <div className="text-2xl font-serif font-bold text-sand-950 mb-2">Rp {fmtIDR(currentNetWorth)}</div>
        <div className="text-xs">{netWorthDeltaNode}</div>
      </Card>
    </div>
  );
};

export default Together;
