import React, { useEffect, useState } from 'react';
import { HeartHandshake, TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../state/store';
import { computeDerived, computeFreedomYear, formatIDR, computePartnershipScore, PartnershipScoreResult } from '../state/selectors';
import EmptyState from '../ui/EmptyState';
import Card from '../ui/Card';
import PartnershipScore from '../components/PartnershipScore';

// Entry point to the signature "can't wait to open it" ritual
// (PRODUCT-BRIEF.md §6) -- shown at the top of Together regardless of
// Layer 1/2's own data-sufficiency state, since the report has its own
// independent baseline and can be meaningful even on a first Together visit.
const WeeklyReportBanner: React.FC<{ language: 'EN' | 'ID' }> = ({ language }) => {
  const setShowWeeklyReport = useStore(s => s.setShowWeeklyReport);
  return (
    <button
      onClick={() => setShowWeeklyReport(true)}
      className="w-full bg-[#06402B] hover:bg-[#0d543b] text-white rounded-3xl p-6 flex items-center justify-between gap-4 shadow-sm transition-all active:scale-[0.99] text-left"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/10 rounded-xl shrink-0">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="font-serif font-bold text-lg leading-none">
            {language === 'ID' ? 'Laporan Minggu Ini' : "This Week's Report"}
          </div>
          <div className="text-[11px] text-white/70 mt-1">
            {language === 'ID' ? 'Kemenangan nyata untuk Anda, pasangan, dan berdua' : 'Real wins for you, your partner, and together'}
          </div>
        </div>
      </div>
      <ArrowRight size={18} className="shrink-0 text-white/70" />
    </button>
  );
};

// Shown after the Freedom Date / net worth cards in both the empty-state and
// delta-view branches below -- its own data-sufficiency gate (score === null)
// is independent of Layer 1's "has a prior check-in" gate, so it can render
// real data even on someone's very first visit if contribution/settlement
// history already exists.
const PartnershipSection: React.FC<{ partnership: PartnershipScoreResult; language: 'EN' | 'ID' }> = ({ partnership, language }) => {
  if (partnership.score === null) {
    return (
      <Card className="p-6">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-2">
          {language === 'ID' ? 'Skor Kemitraan' : 'Partnership Score'}
        </div>
        <p className="text-xs text-sand-500 leading-relaxed">
          {language === 'ID'
            ? 'Belum cukup data nyata untuk menghitung skor ini -- perlu setidaknya satu dari: kontribusi pendapatan tercatat, riwayat klaim, atau pemeriksaan Freedom Date sebelumnya.'
            : "Not enough real data to compute this yet -- needs at least one of: recorded income contributions, claim history, or a prior Freedom Date check-in."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <PartnershipScore score={partnership.score} />
      <Card className="p-5 space-y-3">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500">
          {language === 'ID' ? 'Cara Perhitungan' : 'How this is computed'}
        </div>
        {partnership.components.map(c => (
          <div key={c.label} className="flex justify-between items-start gap-4 text-xs">
            <div>
              <div className="font-bold text-sand-900">{c.label}</div>
              <div className="text-sand-500 text-[11px] leading-relaxed">{c.description}</div>
            </div>
            <div className="font-serif font-bold text-sand-950 shrink-0">{c.value}</div>
          </div>
        ))}
      </Card>
    </div>
  );
};

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
  const partnership = computePartnershipScore(state, currentFreedomYear, language);

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
        <WeeklyReportBanner language={language} />
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
        <PartnershipSection partnership={partnership} language={language} />
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
      <WeeklyReportBanner language={language} />

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

      <PartnershipSection partnership={partnership} language={language} />
    </div>
  );
};

export default Together;
