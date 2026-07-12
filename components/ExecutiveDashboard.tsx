import React, { useState } from 'react';
import { Droplets, Shield, TrendingUp, Scale, Info, X, Lock, Landmark, Flame, ArrowRight, ArrowDownLeft, Wallet, Globe, Building2, Sparkles, Activity } from 'lucide-react';
import { FortressGoal } from '../types';

interface ExecutiveDashboardProps {
    // Hero: lens-scoped "spendable cash" -- pockets this lens's owner funds
    // + their private reserve. Deliberately excludes goals/liabilities so
    // switching lenses moves this number in an obvious, meaningful way.
    spendableCash: number;
    spendableCashLabel: string;
    spendableCashDescription: string;
    liquidCash: number;
    privateReserve?: number;
    // Secondary stat: always Joint-wide, never filtered by lens.
    householdNetWorth: number;
    netWorthGoals: number;
    netWorthPocketCash: number;
    netWorthReceivables: number;
    systemBurden: number;
    sovereigntyGap: number;
    monthlyPassive: number;
    monthlyBurn: number;
    actualSpendThisMonth?: number;
    totalAllocatedThisMonth?: number;
    currentMonthName?: string;
    dashboardMonth?: string;
    onMonthChange?: (month: string) => void;
    language?: 'EN' | 'ID';
    fortressGoals?: FortressGoal[];
    // True while viewing the partner's lens with the household set to
    // PRIVATE balance visibility. Masks the lens-scoped figures (hero,
    // Liquid Cash, Private Reserve) with "--" rather than a partial number.
    // Household Net Worth and Liabilities are never masked -- they're the
    // same figure regardless of whose lens is active.
    balanceHidden?: boolean;
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
    spendableCash, spendableCashLabel, spendableCashDescription, liquidCash, privateReserve = 0,
    householdNetWorth, netWorthGoals, netWorthPocketCash, netWorthReceivables, systemBurden,
    sovereigntyGap, monthlyPassive, monthlyBurn,
    actualSpendThisMonth = 0, totalAllocatedThisMonth = 0, currentMonthName = '',
    dashboardMonth, onMonthChange,
    language = 'EN',
    fortressGoals = [],
    balanceHidden = false,
}) => {
    const [showSpendableCashDetails, setShowSpendableCashDetails] = useState(false);
    const [showNetWorthDetails, setShowNetWorthDetails] = useState(false);
    const [showLiquidCashDetails, setShowLiquidCashDetails] = useState(false);
    const [showPrivateReserveDetails, setShowPrivateReserveDetails] = useState(false);
    const [showLiabilitiesDetails, setShowLiabilitiesDetails] = useState(false);

    // Customization state
    const widgets = {
        hero: true, // Independence Gap & Flow
        quadrants: {
            liquidCash: true,
            privateReserve: true,
            liabilities: true
        },
        diversification: false // default false for minimalist view
    };

    const formatIDR = (num: number) => {
        if (balanceHidden) return "—";
        if ((window as any).privacyShieldActive) return "••••••";
        return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
    };

    const formatCompact = (num: number) => {
        if (balanceHidden) return "—";
        if ((window as any).privacyShieldActive) return "••••••";
        if (language === 'EN') {
            if (num >= 1000000000) {
                return (num / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' B';
            }
            if (num >= 1000000) {
                return (num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' M';
            }
            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
        } else {
            if (num >= 1000000000) {
                return (num / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M';
            }
            if (num >= 1000000) {
                return (num / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' Jt';
            }
            return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
        }
    };

    // Household-wide figures (net worth, liabilities) never mask -- there's
    // no partner-private data in a number that's identical in every lens.
    // Still respects the physical-privacy shield (shoulder-surfing).
    const formatIDRShared = (num: number) => {
        if ((window as any).privacyShieldActive) return "••••••";
        return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
    };

    const formatCompactShared = (num: number) => {
        if ((window as any).privacyShieldActive) return "••••••";
        if (language === 'EN') {
            if (num >= 1000000000) return (num / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' B';
            if (num >= 1000000) return (num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' M';
            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
        }
        if (num >= 1000000000) return (num / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M';
        if (num >= 1000000) return (num / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' Jt';
        return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
    };

    const gapProgress = Math.min((monthlyPassive / (monthlyBurn || 1)) * 100, 100);

    return (
        <div id="executive-dashboard-panel" className="space-y-8 font-sans text-sand-900">

            {widgets.hero && (
            <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
                {/* HERO: Spendable Cash -- lens-scoped, moves meaningfully when
                    the Bisma/Together/Amanda toggle changes */}
                <div onClick={() => setShowSpendableCashDetails(true)} className="w-full bg-gradient-to-br from-[#06402B] to-[#042d1e] text-white border border-[#06402B] rounded-[2rem] p-6 md:p-10 flex flex-col shadow-xl shadow-[#06402B]/10 relative hover:from-[#085237] hover:to-[#06402B] cursor-pointer transition-all duration-500 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-[150px] -mt-[250px] transition-transform duration-1000 group-hover:scale-110"></div>

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[9px] font-mono tracking-widest text-[#E2D9C8] font-extrabold uppercase">
                                {spendableCashLabel}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="text-5xl md:text-7xl font-serif font-black tracking-tighter drop-shadow-md leading-none text-white flex items-baseline justify-center gap-2">
                                <span className="text-2xl md:text-3xl font-sans text-white/50 font-normal">Rp</span>
                                <span>{formatCompact(spendableCash)}</span>
                            </div>
                            <div className="text-[10px] text-white/50 font-medium font-mono uppercase tracking-widest leading-relaxed pt-1">
                                {spendableCashDescription}
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="inline-flex items-center gap-1.5 border-b border-[#E2D9C8]/30 pb-0.5 text-[#E2D9C8] opacity-80 group-hover:opacity-100 group-hover:border-[#E2D9C8] transition-all">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{language === 'ID' ? 'Lihat Rincian' : 'View Breakdown'}</span>
                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECONDARY: Household Net Worth -- always Joint, never moves
                    with the lens toggle */}
                <div onClick={() => setShowNetWorthDetails(true)} className="cursor-pointer bg-white border border-[#E2D9C8] rounded-[2rem] p-5 md:p-6 flex items-center justify-between gap-4 shadow-sm hover:border-[#06402B]/30 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-[#06402B]/8 text-[#06402B] rounded-xl shrink-0">
                            <Landmark size={18} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-sand-500">
                                    {language === 'ID' ? 'Kekayaan Bersih Rumah Tangga' : 'Household Net Worth'}
                                </span>
                                <span className="text-[7px] font-mono font-bold uppercase tracking-wider bg-sand-100 text-sand-500 px-1.5 py-0.5 rounded-full border border-sand-200 shrink-0">
                                    {language === 'ID' ? 'SELALU BERSAMA' : 'ALWAYS JOINT'}
                                </span>
                            </div>
                            <div className="text-lg md:text-xl font-serif font-black text-sand-950 leading-none mt-1.5">
                                Rp {formatCompactShared(householdNetWorth)}
                            </div>
                        </div>
                    </div>
                    <Info size={14} className="text-sand-400 shrink-0" />
                </div>

                {/* Spent vs Target (Allocation Flow) */}
                <div className="w-full bg-white border border-[#E2D9C8]/70 rounded-[2rem] p-7 md:p-9 shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-[#06402B]/40 hover:shadow-md">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50/50 rounded-full blur-3xl -mr-16 -mt-16 transition-colors"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sand-400 text-[10px] font-mono tracking-widest uppercase font-extrabold">
                                <Activity size={12} strokeWidth={2.5} />
                                <span>{language === 'ID' ? 'Aktivitas Aliran Dana' : 'Flow Activity'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8.5px] font-mono tracking-widest uppercase text-sand-500 bg-sand-100 px-2.5 py-1 rounded-full font-bold">
                                    {language === 'ID' ? 'Waktu Nyata' : 'Real-Time'}
                                </span>
                                {dashboardMonth && onMonthChange && (
                                    <input
                                        type="month"
                                        value={dashboardMonth}
                                        onChange={(e) => onMonthChange(e.target.value)}
                                        className="text-[9.5px] font-mono font-bold bg-white border border-[#E2D9C8] text-sand-900 px-2.5 py-1 rounded-full uppercase focus:outline-none focus:ring-1 focus:ring-[#06402B] cursor-pointer"
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-3xl md:text-4xl font-serif font-black tracking-tight text-sand-950 drop-shadow-sm leading-none flex items-baseline gap-1.5">
                                <span className="text-[15px] font-sans text-sand-400 font-bold">Rp</span>
                                <span>{formatIDR(actualSpendThisMonth)}</span>
                            </div>
                            <div className="text-[9.5px] text-sand-500 font-bold font-mono uppercase tracking-widest mt-2 px-1">
                                {language === 'ID' ? 'Pengeluaran bulan ini' : 'Recorded spend this month'}
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500">
                                <span>{language === 'ID' ? 'Tingkat Konsumsi Alokasi' : 'Allocation Burn Rate'}</span>
                                <span className={actualSpendThisMonth > totalAllocatedThisMonth ? "text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded" : "text-[#06402B] bg-[#06402B]/5 px-1.5 py-0.5 rounded"}>
                                    {totalAllocatedThisMonth > 0 ? Math.min(100, (actualSpendThisMonth / totalAllocatedThisMonth) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#E2D9C8]/40 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${actualSpendThisMonth > totalAllocatedThisMonth ? 'bg-rose-500' : 'bg-[#06402B]'}`}
                                    style={{ width: `${Math.min((actualSpendThisMonth / (totalAllocatedThisMonth || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[9px] pt-1 font-mono font-bold text-sand-400 uppercase tracking-widest">
                                <span>Rp 0</span>
                                <span>{language === 'ID' ? 'Kapasitas Target:' : 'Target Capacity:'} Rp {formatCompact(totalAllocatedThisMonth)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}

            <div className={`grid gap-4 md:gap-6 transition-all ${
                Object.values(widgets.quadrants).filter(Boolean).length === 4 ? 'grid-cols-2 md:grid-cols-4' :
                Object.values(widgets.quadrants).filter(Boolean).length === 3 ? 'grid-cols-3' :
                Object.values(widgets.quadrants).filter(Boolean).length === 2 ? 'grid-cols-2' :
                'grid-cols-1'
            }`}>

                {widgets.quadrants.liquidCash && (
                <div onClick={() => setShowLiquidCashDetails(true)} className="cursor-pointer bg-[#06402B]/5 p-6 rounded-[2rem] border border-[#06402B]/15 flex flex-col justify-between min-h-[120px] hover:border-[#06402B]/40 transition-colors shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Droplets size={12} className="text-[#06402B]" strokeWidth={2.5} />
                            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-[#06402B]">
                                {language === 'ID' ? 'Kas Lancar' : 'Liquid Cash'}
                            </span>
                        </div>
                        <Info size={13} className="text-[#06402B]/40" />
                    </div>
                    <div className="space-y-1 mt-4">
                        <div className="text-xl sm:text-2xl font-serif font-black text-[#06402B] truncate leading-none">Rp {formatCompact(liquidCash)}</div>
                        <span className="text-[8px] text-sand-500 font-mono uppercase tracking-widest block font-bold">
                            {language === 'ID' ? 'Kas Gabungan' : 'Consolidated Cash'}
                        </span>
                    </div>
                </div>
                )}

                {widgets.quadrants.privateReserve && (
                <div onClick={() => setShowPrivateReserveDetails(true)} className="cursor-pointer bg-white p-6 rounded-[2rem] border border-[#E2D9C8] flex flex-col justify-between min-h-[120px] hover:border-[#06402B]/30 hover:shadow-md transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Wallet size={12} className="text-sand-600" strokeWidth={2.5} />
                            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-sand-500">
                                {language === 'ID' ? 'Dana Pribadi' : 'Private Reserve'}
                            </span>
                        </div>
                        <Info size={13} className="text-sand-400" />
                    </div>
                    <div className="space-y-1 mt-4">
                        <div className="text-xl sm:text-2xl font-serif font-black text-sand-900 truncate leading-none">Rp {formatCompact(privateReserve)}</div>
                        <span className="text-[8px] text-sand-500 font-mono uppercase tracking-widest block font-bold">
                            {language === 'ID' ? 'Cadangan Rahasia' : 'Off-System Buffer'}
                        </span>
                    </div>
                </div>
                )}

                {widgets.quadrants.liabilities && (
                <div onClick={() => setShowLiabilitiesDetails(true)} className="cursor-pointer bg-rose-50/70 p-6 rounded-[2rem] border border-rose-200/50 flex flex-col justify-between min-h-[120px] hover:border-rose-300 hover:shadow-md transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Scale size={12} className="text-rose-700" strokeWidth={2.5} />
                            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-rose-800">
                                {language === 'ID' ? 'Liabilitas' : 'Liabilities'}
                            </span>
                        </div>
                        <Info size={13} className="text-rose-400" />
                    </div>
                    <div className="space-y-1 mt-4">
                        <div className="text-xl sm:text-2xl font-serif font-black text-rose-800 truncate leading-none">Rp {formatCompactShared(systemBurden)}</div>
                        <span className="text-[8px] text-rose-600 font-mono uppercase tracking-widest block font-bold">
                            {language === 'ID' ? 'Sisa Beban Cicilan' : 'Remaining Claims'}
                        </span>
                    </div>
                </div>
                )}

            </div>

            {widgets.diversification && (
            <div className="bg-[#FDFCF7] border border-[#E2D9C8] rounded-3xl p-6 md:p-8 lg:p-10 shadow-sm space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between border-b border-[#E2D9C8]/40 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#06402B]/8 text-[#06402B] rounded-lg">
                            <Sparkles size={14} className="text-[#06402B]" />
                        </div>
                        <div>
                            <h3 className="text-xs font-mono font-bold text-[#06402B] uppercase tracking-widest leading-none">
                                {language === 'ID' ? 'Diversifikasi Aset Strategis' : 'Strategic Asset Diversification'}
                            </h3>
                            <p className="text-[9px] text-sand-500 font-semibold mt-1">
                                {language === 'ID' ? 'Alokasi portofolio global dan domestik pelindung kekayaan.' : 'At-a-glance monitoring of high-conviction growth pipelines & shields.'}
                            </p>
                        </div>
                    </div>
                    <span className="text-[8px] font-mono font-extrabold uppercase bg-amber-50 border border-amber-200 text-amber-801 px-2 py-0.5 rounded">
                        {language === 'ID' ? 'Portofolio Aktif' : 'Active Portfolio'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-indigo-50/35 to-transparent border border-[#E2D9C8] hover:border-indigo-400 p-5 lg:p-6 rounded-2xl flex flex-col justify-between transition-all group shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg group-hover:bg-indigo-100 transition-all">
                                <Globe size={15} />
                            </div>
                            <span className="text-[7.5px] font-mono font-bold tracking-widest uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm border border-indigo-100/30">
                                US STOCKS
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[8.5px] font-mono font-bold text-sand-500 uppercase tracking-wider block">
                                {language === 'ID' ? 'Ekuitas Global' : 'US Tech Growth'}
                            </span>
                            <div className="text-base font-serif font-black text-sand-950 mt-0.5">
                                Rp {formatCompact(475500000)}
                            </div>
                            <div className="text-[8.5px] text-indigo-900/75 font-sans font-bold mt-1 line-clamp-1">
                                NVDA & META Reserves
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-50/35 to-transparent border border-[#E2D9C8] hover:border-teal-400 p-5 lg:p-6 rounded-2xl flex flex-col justify-between transition-all group shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg group-hover:bg-teal-100 transition-all">
                                <Wallet size={15} />
                            </div>
                            <span className="text-[7.5px] font-mono font-bold tracking-widest uppercase bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-sm border border-teal-100/30">
                                RESILIENT
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[8.5px] font-mono font-bold text-sand-500 uppercase tracking-wider block">
                                {language === 'ID' ? 'Valuta Asing' : 'Global Cash Guard'}
                            </span>
                            <div className="text-base font-serif font-black text-sand-950 mt-0.5">
                                Rp {formatCompact(125270000)}
                            </div>
                            <div className="text-[8.5px] text-teal-900/75 font-sans font-bold mt-1 line-clamp-1">
                                USD & SGD DBS Reserves
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50/35 to-transparent border border-[#E2D9C8] hover:border-amber-400 p-5 lg:p-6 rounded-2xl flex flex-col justify-between transition-all group shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-100 transition-all">
                                <Landmark size={15} />
                            </div>
                            <span className="text-[7.5px] font-mono font-bold tracking-widest uppercase bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-sm border border-amber-100/30">
                                DOMESTIC
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[8.5px] font-mono font-bold text-sand-500 uppercase tracking-wider block">
                                {language === 'ID' ? 'Bursa Efek RI' : 'Indo Blue Chips'}
                            </span>
                            <div className="text-base font-serif font-black text-sand-950 mt-0.5">
                                Rp {formatCompact(320000000)}
                            </div>
                            <div className="text-[8.5px] text-amber-900/75 font-sans font-bold mt-1 line-clamp-1">
                                BBCA & TLKM Securities
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50/35 to-transparent border border-[#E2D9C8] hover:border-rose-400 p-5 lg:p-6 rounded-2xl flex flex-col justify-between transition-all group shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg group-hover:bg-rose-100 transition-all">
                                <Building2 size={15} />
                            </div>
                            <span className="text-[7.5px] font-mono font-bold tracking-widest uppercase bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-sm border border-rose-100/30">
                                REAL ESTATE
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[8.5px] font-mono font-bold text-sand-500 uppercase tracking-wider block">
                                {language === 'ID' ? 'Properti Uni Eropa' : 'Euro Mortgages'}
                            </span>
                            <div className="text-base font-serif font-black text-[#06402B] mt-0.5">
                                Rp {formatCompact(2565000000)}
                            </div>
                            <div className="text-[8.5px] text-rose-900/75 font-sans font-bold mt-1 line-clamp-1">
                                Berlin Apartment Gateways
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {showSpendableCashDetails && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowSpendableCashDetails(false)}>
                    <div className="bg-[#FDFCF7] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#E2D9C8] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-[#E2D9C8]/40 pb-3">
                            <div className="flex items-center gap-1.5">
                                <Droplets className="text-[#06402B] h-4.5 w-4.5" />
                                <h3 className="font-serif font-bold text-base text-[#06402B]">{spendableCashLabel}</h3>
                            </div>
                            <button onClick={() => setShowSpendableCashDetails(false)} className="text-sand-500 hover:text-sand-900 border border-transparent hover:border-sand-200 rounded p-1"><X size={16}/></button>
                        </div>
                        <div className="space-y-4 text-xs leading-relaxed text-sand-900 font-sans">
                            <p className="text-sand-500 font-semibold">
                                {language === 'ID'
                                    ? 'Uang Cair adalah Kas Lancar Anda ditambah Dana Pribadi -- uang yang tersedia untuk digunakan sekarang. Angka ini tidak termasuk aset jangka panjang, piutang, atau liabilitas, yang tercermin di Kekayaan Bersih Rumah Tangga di bawah.'
                                    : 'Spendable Cash is your Liquid Cash plus your Private Reserve -- money available to use right now. It excludes long-term goals, receivables, and liabilities, which live in Household Net Worth below.'
                                }
                            </p>
                            <div className="p-3 bg-sand-100 rounded-xl space-y-2 border border-sand-200 font-mono text-[10px] text-sand-800">
                                <div className="flex justify-between">
                                    <span>{language === 'ID' ? '+ Kas Lancar:' : '+ Liquid Cash:'}</span>
                                    <span className="font-bold">Rp {formatIDR(liquidCash)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-sand-300 pb-1.5 mb-1.5">
                                    <span>{language === 'ID' ? '+ Dana Pribadi:' : '+ Private Reserve:'}</span>
                                    <span className="font-bold">Rp {formatIDR(privateReserve)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-[#06402B]">
                                    <span>{language === 'ID' ? '= Uang Cair:' : '= Spendable Cash:'}</span>
                                    <span>Rp {formatIDR(spendableCash)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showLiquidCashDetails && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowLiquidCashDetails(false)}>
                    <div className="bg-[#FDFCF7] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#E2D9C8] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-[#E2D9C8]/40 pb-3">
                            <div className="flex items-center gap-1.5">
                                <Droplets className="text-[#06402B] h-4.5 w-4.5" />
                                <h3 className="font-serif font-bold text-base text-[#06402B]">{language === 'ID' ? 'Detail Kas Lancar' : 'Liquid Cash Breakdown'}</h3>
                            </div>
                            <button onClick={() => setShowLiquidCashDetails(false)} className="text-sand-500 hover:text-sand-900 border border-transparent hover:border-sand-200 rounded p-1"><X size={16}/></button>
                        </div>
                        <div className="space-y-4 text-xs leading-relaxed text-sand-900 font-sans">
                            <p className="text-sand-500 font-semibold">
                                {language === 'ID' ? 'Kas Lancar dihitung dari saldo saat ini di seluruh kantong yang terlihat pada tampilan ini, tidak termasuk Dana Pribadi (ditampilkan terpisah).' : 'Liquid Cash is computed from the current balance across every pocket visible in this view, excluding your Private Reserve (shown separately).'}
                            </p>
                            <div className="p-3 bg-sand-100 rounded-xl space-y-2 border border-sand-200 font-mono text-[10px] text-sand-800">
                                <div className="flex justify-between font-bold text-[#06402B]">
                                    <span>{language === 'ID' ? 'Total Kas Tersedia:' : 'Total Available Cash:'}</span>
                                    <span>Rp {formatIDR(liquidCash)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPrivateReserveDetails && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowPrivateReserveDetails(false)}>
                    <div className="bg-[#FDFCF7] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#E2D9C8] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-[#E2D9C8]/40 pb-3">
                            <div className="flex items-center gap-1.5">
                                <Wallet className="text-sand-600 h-4.5 w-4.5" />
                                <h3 className="font-serif font-bold text-base text-sand-800">{language === 'ID' ? 'Detail Dana Pribadi' : 'Private Reserve Breakdown'}</h3>
                            </div>
                            <button onClick={() => setShowPrivateReserveDetails(false)} className="text-sand-500 hover:text-sand-900 border border-transparent hover:border-sand-200 rounded p-1"><X size={16}/></button>
                        </div>
                        <div className="space-y-4 text-xs leading-relaxed text-sand-900 font-sans">
                            <p className="text-sand-500 font-semibold">
                                {language === 'ID' ? 'Dana Privat mengalkulasi aset amanah dan likuiditas eksklusif yang Anda sisihkan terpisah dari pengeluaran gabungan. Hanya akun Anda yang memiliki kendali atas dana ini.' : 'Private Reserve calculates trust assets and exclusive liquidity segregated from pooled expenses. It acts as your personal safety net off the joint system.'}
                            </p>
                            <div className="p-3 bg-sand-100 rounded-xl space-y-2 border border-sand-200 font-mono text-[10px] text-sand-800">
                                <div className="flex justify-between font-bold text-sand-900">
                                    <span>{language === 'ID' ? 'Total Dana Terpisah:' : 'Total Segregated Funds:'}</span>
                                    <span>Rp {formatIDR(privateReserve)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showLiabilitiesDetails && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowLiabilitiesDetails(false)}>
                    <div className="bg-[#FDFCF7] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#E2D9C8] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-[#E2D9C8]/40 pb-3">
                            <div className="flex items-center gap-1.5">
                                <Scale className="text-rose-700 h-4.5 w-4.5" />
                                <h3 className="font-serif font-bold text-base text-rose-800">{language === 'ID' ? 'Detail Liabilitas' : 'Liabilities Breakdown'}</h3>
                            </div>
                            <button onClick={() => setShowLiabilitiesDetails(false)} className="text-sand-500 hover:text-sand-900 border border-transparent hover:border-sand-200 rounded p-1"><X size={16}/></button>
                        </div>
                        <div className="space-y-4 text-xs leading-relaxed text-sand-900 font-sans">
                            <p className="text-sand-500 font-semibold">
                                {language === 'ID' ? 'Beban Liabilitas menampilkan rekap akumulasi nilai cicilan, utang, atau hipotek jangka panjang yang harus dilunasi secara bertahap. Angka ini selalu utuh (Bersama), berapa pun tampilan yang aktif.' : 'The Liabilities sum reflects long-term mortgages, cumulative pending debts, and active amortizations outstanding across your portfolio. Always shown whole (Joint), regardless of the active lens.'}
                            </p>
                            <div className="p-3 bg-rose-50 rounded-xl space-y-2 border border-rose-100 font-mono text-[10px] text-rose-900">
                                <div className="flex justify-between font-bold">
                                    <span>{language === 'ID' ? 'Total Nilai Buku Utang:' : 'Total Book Value Debt:'}</span>
                                    <span>Rp {formatIDRShared(systemBurden)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNetWorthDetails && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowNetWorthDetails(false)}>
                    <div className="bg-[#FDFCF7] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#E2D9C8] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-[#E2D9C8]/40 pb-3">
                            <div className="flex items-center gap-1.5">
                                <Landmark className="text-[#06402B] h-4.5 w-4.5" />
                                <h3 className="font-serif font-bold text-base text-[#06402B]">
                                    {language === 'ID' ? 'Kekayaan Bersih Rumah Tangga' : 'Household Net Worth'}
                                </h3>
                            </div>
                            <button onClick={() => setShowNetWorthDetails(false)} className="text-sand-500 hover:text-sand-900 border border-transparent hover:border-sand-200 rounded p-1"><X size={16}/></button>
                        </div>
                        <div className="space-y-4 text-xs leading-relaxed text-sand-900 font-sans">
                            <p className="text-sand-500 font-semibold">
                                {language === 'ID'
                                    ? 'Selalu Bersama -- angka ini sama di ketiga tampilan (Bisma/Amanda/Bersama) karena tujuan jangka panjang dan liabilitas adalah milik rumah tangga, bukan satu pihak. Goals + Kas Kantong + Piutang - Liabilitas:'
                                    : 'Always Joint -- this figure is identical across all three lenses because goals and liabilities belong to the household, not one partner. Goals + Pocket Cash + Receivables - Liabilities:'
                                }
                            </p>
                            <div className="p-3 bg-[#06402B]/5 rounded-xl space-y-2 border border-[#06402B]/10 font-mono text-[10px]/normal text-[#032519]">
                                <div className="flex justify-between">
                                    <span>{language === 'ID' ? '+ Pilar Cadangan (Goals):' : '+ Goals & Reserves:'}</span>
                                    <span className="font-bold">Rp {formatIDRShared(netWorthGoals)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{language === 'ID' ? '+ Kas Seluruh Kantong:' : '+ All Pocket Cash:'}</span>
                                    <span className="font-bold">Rp {formatIDRShared(netWorthPocketCash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{language === 'ID' ? '+ Piutang Belum Tertagih:' : '+ Pending Receivables:'}</span>
                                    <span className="text-sage-700 font-bold">Rp {formatIDRShared(netWorthReceivables)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-[#E2D9C8] pb-1.5 mb-1.5">
                                    <span>{language === 'ID' ? '- Nilai Buku Liabilitas:' : '- Outstanding Liabilities:'}</span>
                                    <span className="text-rose-700 font-bold">- Rp {formatIDRShared(systemBurden)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold font-sans text-sand-950 pt-0.5">
                                    <span>{language === 'ID' ? 'Kekayaan Bersih Gabungan:' : 'Consolidated Net Worth:'}</span>
                                    <span className="text-[#06402B]">Rp {formatIDRShared(householdNetWorth)}</span>
                                </div>
                            </div>
                            <div className="p-3.5 bg-sand-100/60 border border-[#E2D9C8]/40 rounded-xl text-sand-500 font-medium">
                                <span className="font-extrabold text-[#06402B] block mb-1">
                                    {language === 'ID' ? '💼 Lacak Lebih Banyak Aset?' : '💼 Track Diverse Assets?'}
                                </span>
                                <span>
                                    {language === 'ID'
                                        ? 'Buka tab Cadangan/Reserves untuk menginput reksa dana, saham, investasi, properti. Neraca disinkron otomatis.'
                                        : 'Navigate to the Capital Reserves tab to register properties, startup equity, private securities, or stock portfolios.'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveDashboard;
