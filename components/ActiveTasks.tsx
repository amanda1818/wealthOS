import React, { useState, useRef } from "react";
import { Transaction, Liability } from "../types";
import {
  ArrowDownLeft,
  Users,
  Scale,
  Check,
  ChevronDown,
  FileText,
  Briefcase,
  Eye,
  EyeOff,
} from "lucide-react";

interface SwipeToSettleWrapperProps {
  children: React.ReactNode;
  onSettle: () => void;
  language?: 'EN' | 'ID';
}

const SwipeToSettleWrapper: React.FC<SwipeToSettleWrapperProps> = ({ children, onSettle, language = 'EN' }) => {
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isSwipingActive = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsAnimating(false);
    isSwipingActive.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingActive.current) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff < 0) {
      setTranslateX(diff);
    } else {
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingActive.current) return;
    isSwipingActive.current = false;
    const diff = touchCurrentX.current - touchStartX.current;
    
    setIsAnimating(true);
    if (diff <= -120) {
      setTranslateX(-500);
      setTimeout(() => {
        onSettle();
      }, 250);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchCurrentX.current = e.clientX;
    setIsAnimating(false);
    isSwipingActive.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwipingActive.current) return;
    touchCurrentX.current = e.clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff < 0) {
      setTranslateX(diff);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseEnd = () => {
    if (!isSwipingActive.current) return;
    isSwipingActive.current = false;
    const diff = touchCurrentX.current - touchStartX.current;
    setIsAnimating(true);
    if (diff <= -120) {
      setTranslateX(-500);
      setTimeout(() => {
        onSettle();
      }, 250);
    } else {
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl w-full">
      <div 
        className="absolute inset-0 bg-[#06402B] flex items-center justify-end px-6 text-white rounded-3xl"
        style={{
          opacity: Math.min(Math.abs(translateX) / 120, 1)
        }}
      >
        <div className="flex items-center gap-1.5 font-mono font-bold text-[9px] uppercase tracking-widest text-[#FDFCF7]">
          <Check size={13} className="animate-bounce" />
          <span>{language === 'ID' ? 'Lepas untuk Selesaikan' : 'Release to Settle'}</span>
        </div>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseEnd}
        onMouseLeave={handleMouseEnd}
        className="relative bg-transparent transition-all duration-200 ease-out cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isAnimating ? 'transform 250ms ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface ActiveTasksProps {
  transactions: Transaction[];
  liabilities: Liability[];
  onSettleClaim?: (tx: Transaction, amountToSettle?: number) => void;
  onUpdateTransactionNotes?: (txId: string, notes: string) => void;
  onSettleClientReimbursement?: (tx: Transaction) => void;
  language?: 'EN' | 'ID';
}

const ActiveTasks: React.FC<ActiveTasksProps> = ({
  transactions,
  liabilities,
  onSettleClaim,
  onUpdateTransactionNotes,
  onSettleClientReimbursement,
  language = 'EN',
}) => {
  const formatIDR = (num: number) =>
    new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
  const pendingClaims = transactions.filter(
    (t) => t.status === "PARTNER_RECEIVABLE",
  );
  const pendingReimbursements = transactions.filter(
    (t) => t.status === "PENDING_REIMBURSEMENT",
  );
  const consumptiveLiabilities = liabilities.filter(
    (l) => l.category === "CONSUMPTIVE",
  );

  const [activeCollectId, setActiveCollectId] = useState<string | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [showReceivables, setShowReceivables] = useState(true);
  const [showReimbursements, setShowReimbursements] = useState(true);

  const hasClaims = pendingClaims.length > 0;
  const hasReimbursements = pendingReimbursements.length > 0;

  const handleCollectClick = (tx: Transaction) => {
    if (activeCollectId === tx.id) {
      setActiveCollectId(null);
    } else {
      setActiveCollectId(tx.id);
      setCollectAmount(tx.receivableAmount?.toString() || "");
    }
  };

  const executeCollection = (tx: Transaction) => {
    const amount = parseFloat(collectAmount.replace(/[^\d.-]/g, ""));
    if (!isNaN(amount) && amount > 0 && onSettleClaim) {
      onSettleClaim(tx, amount);
      setActiveCollectId(null);
    }
  };

  return (
    <div id="active-tasks-panel" className="space-y-6">
      {/* Widget Visibility Toggles */}
      {(hasClaims || hasReimbursements) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/40 border border-sand-200/80 p-3 rounded-2xl">
          <div className="flex items-center gap-1.5 pl-1">
            <span className="text-[9px] font-mono font-black text-sand-500 uppercase tracking-widest">
              {language === 'ID' ? 'Filter Tampilan Widget' : 'Widget Visibility Filters'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasClaims && (
              <button
                onClick={() => setShowReceivables(!showReceivables)}
                className={`px-3 py-1.5 rounded-xl border text-[9px] font-mono font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 active:scale-95 ${
                  showReceivables
                    ? 'bg-sage-50 border-sage-200 text-sage-800 shadow-3xs'
                    : 'bg-white/80 border-sand-200 text-sand-400 hover:text-sand-600'
                }`}
              >
                {showReceivables ? <Eye size={11} className="text-sage-700" /> : <EyeOff size={11} className="text-sand-400" />}
                <span>{language === 'ID' ? 'Piutang' : 'Receivables'}</span>
              </button>
            )}

            {hasReimbursements && (
              <button
                onClick={() => setShowReimbursements(!showReimbursements)}
                className={`px-3 py-1.5 rounded-xl border text-[9px] font-mono font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 active:scale-95 ${
                  showReimbursements
                    ? 'bg-sky-50 border-sky-200 text-sky-850 shadow-3xs'
                    : 'bg-white/80 border-sand-200 text-sand-400 hover:text-sand-600'
                }`}
              >
                {showReimbursements ? <Eye size={11} className="text-sky-700" /> : <EyeOff size={11} className="text-sand-400" />}
                <span>{language === 'ID' ? 'Reimbursement' : 'Reimbursements'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: RECEIVABLES OWED TO YOU */}
      {pendingClaims.length > 0 && showReceivables && (
        <div className="animate-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="p-1.5 bg-sage-50 text-sage-800 rounded-xl border border-sage-100">
              <Users size={15} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-sand-800 uppercase tracking-widest">
                {language === 'ID' ? 'Piutang Yang Belum Lunas' : 'Outstanding Receivables'}
              </h3>
              <p className="text-[10px] text-sand-500 font-semibold">
                {language === 'ID' ? 'Tagihan patungan atau pengeluaran bersama yang belum dibayar pasangannya.' : 'Unsettled shared costs & co-spend liabilities.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3.5">
            {pendingClaims.map((t) => {
              const initial =
                t.initialReceivableAmount || t.receivableAmount || 0;
              const current = t.receivableAmount || 0;
              const recovered = initial - current;
              const progress = initial > 0 ? (recovered / initial) * 100 : 0;

              return (
                <SwipeToSettleWrapper
                  key={t.id}
                  language={language}
                  onSettle={() => {
                    if (onSettleClaim) {
                      onSettleClaim(t, current);
                    }
                  }}
                >
                  <div className="bg-white border border-sand-200 p-5 rounded-3xl shadow-sm hover:border-sage-300 transition-all font-sans">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 w-10 h-10 flex items-center justify-center bg-sand-50 text-sand-500 rounded-xl border border-sand-100">
                          <ArrowDownLeft size={18} />
                        </div>
                        <div>
                          <div className="font-display font-black text-sand-900 text-sm leading-snug">
                            {t.description}
                          </div>
                          <div className="text-[9px] text-sand-400 font-mono tracking-wider font-bold uppercase mt-0.5">
                            {new Date(t.date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-black text-base text-sage-700 leading-none">
                          Rp {formatIDR(current)}
                        </div>
                        <div className="text-[9px] text-sand-400 font-mono font-bold mt-1 uppercase">
                          {language === 'ID' ? 'AWAL' : 'INITIAL'}: Rp {formatIDR(initial)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 mb-3.5">
                      <div className="w-full bg-sand-100 h-1.5 rounded-full overflow-hidden border border-sand-200/50">
                        <div
                          className="h-full bg-sage-600 transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      {recovered > 0 && (
                        <div className="text-[9px] text-sage-700 font-bold uppercase mt-1.5 text-right font-mono tracking-wider">
                          {Math.round(progress)}% {language === 'ID' ? 'Telah Kembali' : 'Recovered'}
                        </div>
                      )}
                    </div>

                    {/* Collection Interface */}
                    {activeCollectId === t.id ? (
                      <div className="flex items-center gap-2 mt-2 animate-in fade-in">
                        <span className="text-xs font-mono font-bold text-sand-500">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={collectAmount}
                          onChange={(e) => setCollectAmount(e.target.value)}
                          className="flex-1 border-b border-sand-300 bg-transparent py-1 text-sm font-bold text-sand-900 focus:outline-none focus:border-sage-600"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            executeCollection(t);
                          }}
                          className="px-3.5 py-1.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest font-display shadow-sm"
                        >
                          {language === 'ID' ? 'Konfirmasi' : 'Confirm'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[9px] text-sand-400 font-mono font-bold tracking-tight uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {language === 'ID' ? 'Geser kiri untuk lunasi' : 'Swipe left to settle'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCollectClick(t);
                          }}
                          className="px-3.5 py-1.5 bg-sand-50 text-sand-700 border border-sand-200/70 hover:bg-sand-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 active:scale-95 shadow-2xs font-display"
                        >
                          <Check size={11} /> {language === 'ID' ? 'Tarik Dana Kembali' : 'Collect Fund'}
                        </button>
                      </div>
                    )}

                    {/* Editable Note for Split Details */}
                    <div className="mt-4 pt-3.5 border-t border-sand-100">
                      <div className="flex items-center gap-1.5 mb-2 text-[9px] font-mono font-bold text-sand-500 uppercase tracking-widest">
                        <FileText size={11} className="text-sage-600" />
                        <span>{language === 'ID' ? 'Catatan & Detail Pembagian' : 'Reminders & Split Notes'}</span>
                      </div>
                      <input
                        type="text"
                        value={t.payerNotes || ""}
                        placeholder={language === 'ID' ? "Tambah catatan (misal: 'Cindy bayar setengah, sisanya bulan depan')" : "Add split notes (e.g. 'Cindy paid half, remaining next month')"}
                        onChange={(e) =>
                          onUpdateTransactionNotes &&
                          onUpdateTransactionNotes(t.id, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-sand-50/50 text-xs px-3 py-2 rounded-xl border border-sand-200 focus:bg-white focus:border-sage-400 focus:outline-none placeholder-sand-400 text-sand-800 transition-all font-sans"
                      />
                    </div>
                  </div>
                </SwipeToSettleWrapper>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: SYSTEM BURDENS (PAYABLES) */}
      {consumptiveLiabilities.length > 0 && (
        <div className="animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-2 mb-3 px-1 mt-6">
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
              <Scale size={15} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-sand-850 uppercase tracking-widest">
                {language === 'ID' ? 'Kewajiban Sistem Aktif' : 'Active System Liabilities'}
              </h3>
              <p className="text-[10px] text-sand-500 font-semibold">
                {language === 'ID' ? 'Cicilan konsumtif dan tagihan bulanan berjalan.' : 'Consumptive contract & installment amortizations.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3.5">
            {consumptiveLiabilities.map((l) => (
              <div
                key={l.id}
                className="bg-white border border-sand-200 p-5 rounded-3xl shadow-sm hover:border-rose-300 transition-colors"
               >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-display font-black text-sand-900 text-base">
                      {l.name}
                    </div>
                    <div className="text-[9px] text-sand-400 font-mono tracking-widest uppercase flex items-center gap-1 mt-0.5 font-bold">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                      {language === 'ID' ? 'Amortisasi Aktif' : 'Amortization Active'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-mono tracking-widest text-sand-400 uppercase font-bold">
                      {language === 'ID' ? 'Beban Bulanan' : 'Monthly Burn'}
                    </div>
                    <div className="font-display font-black text-base text-rose-750">
                      - Rp {formatIDR(l.monthlyPayment)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-sand-100 h-1.5 rounded-full overflow-hidden mb-2.5 border border-sand-200/55">
                  <div
                    className="h-full bg-rose-500 transition-all duration-1000"
                    style={{
                      width: `${((l.monthsTotal! - (l.monthsRemaining || 0)) / l.monthsTotal!) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[9px] font-bold text-sand-500 font-mono uppercase tracking-wider">
                  <span>
                    {l.monthsTotal! - (l.monthsRemaining || 0)} /{" "}
                    {l.monthsTotal} {language === 'ID' ? 'Pembayaran' : 'payments'}
                  </span>
                  <span>{language === 'ID' ? `Sisa ${l.monthsRemaining} Bulan` : `${l.monthsRemaining} months left`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: VICTORIA'S CLIENT REIMBURSEMENTS (CFO WORKSPACE) */}
      {pendingReimbursements.length > 0 && showReimbursements && (
        <div className="animate-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 mb-3 px-1 mt-6">
            <div className="p-1.5 bg-sky-50 text-sky-850 rounded-xl border border-sky-100">
              <Briefcase size={15} className="text-sky-700" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-sand-800 uppercase tracking-widest">
                {language === 'ID' ? 'Reimbursement Klien Victoria' : "Victoria's Client Reimbursements"}
              </h3>
              <p className="text-[10px] text-sand-500 font-semibold">
                {language === 'ID' ? 'Biaya operasional konsultasi/perjalanan yang ditagihkan ke klien.' : 'Fragmented business expenses waiting for corporate client clearance.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3.5">
            {pendingReimbursements.map((t) => (
              <SwipeToSettleWrapper
                key={t.id}
                language={language}
                onSettle={() => {
                  if (onSettleClientReimbursement) {
                    onSettleClientReimbursement(t);
                  }
                }}
              >
                <div className="bg-white border border-sand-200 p-5 rounded-3xl shadow-sm hover:border-sky-300 transition-all font-sans">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <div className="font-display font-black text-sand-900 text-sm leading-snug">
                          {t.description}
                        </div>
                        <div className="text-[9px] text-sand-400 font-mono tracking-wider font-bold uppercase mt-0.5 flex items-center gap-1.5">
                          <span>{new Date(t.date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="w-1 h-1 bg-sand-300 rounded-full"></span>
                          <span className="text-sky-600 font-bold">{t.pocket}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-sm text-sky-700 leading-none">
                        Rp {formatIDR(t.netAmount)}
                      </div>
                      <span className="text-[8px] px-1.5 py-0.5 bg-sky-50 text-sky-700 font-mono font-bold rounded-sm mt-1 inline-block uppercase tracking-wider">
                        {language === 'ID' ? 'Klaim Klien' : 'Client Claim'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-sand-100">
                    <span className="text-[9px] text-sand-400 font-mono font-bold tracking-tight uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {language === 'ID' ? 'Geser kiri untuk cairkan' : 'Swipe left to settle'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSettleClientReimbursement && onSettleClientReimbursement(t);
                      }}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 active:scale-95 shadow-sm font-display hover:shadow"
                    >
                      <Check size={11} /> {language === 'ID' ? 'Reimbursement Cair' : 'Reimbursement Paid'}
                    </button>
                  </div>
                </div>
              </SwipeToSettleWrapper>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveTasks;
