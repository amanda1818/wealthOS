import React, { useState, useEffect } from 'react';
import { Transaction, PocketType, Pocket, HistoricalSnapshot, PocketSettings } from '../types';
import { 
  FileText, Calendar, TrendingDown, TrendingUp, History, Fingerprint, 
  BookOpen, Lock, Download, Printer, Search, Filter, CheckCircle2, 
  HelpCircle, RefreshCw, Landmark, Coins, Scale, Users, User, ArrowRightLeft, 
  Check, X, ChevronLeft, ChevronRight, AlertCircle, Settings
} from 'lucide-react';
import { getPocketName } from './PocketCard';
import GlobalSearchBar from './GlobalSearchBar';

interface LedgerProps {
  currentPockets: Record<string, Pocket>; // Current live state
  history: HistoricalSnapshot[]; // Archived snapshots
  activeLens: 'HIS' | 'JOINT' | 'HER';
  liveTransactions?: Transaction[]; // Live unclosed transactions
  userName?: string;
  partnerName?: string;
  onSettleClaim?: (tx: Transaction, amount?: number) => void;
  onSettleClientReimbursement?: (tx: Transaction) => void;
  language?: 'EN' | 'ID';
  settings?: PocketSettings;
  onUpdateSettings?: (settings: Partial<PocketSettings>) => void;
}

const Ledger: React.FC<LedgerProps> = ({ 
  currentPockets, 
  history, 
  activeLens, 
  liveTransactions = [], 
  userName = 'Victoria', 
  partnerName = 'David',
  onSettleClaim,
  onSettleClientReimbursement,
  language = 'EN',
  settings,
  onUpdateSettings
}) => {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('live');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDeskSettings, setShowDeskSettings] = useState(false);

  // Filter and Search States
  const [globalFilters, setGlobalFilters] = useState({ query: '', startDate: '', endDate: '', merchant: '', tag: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [claimFilter, setClaimFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [adhdHushMode, setAdhdHushMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Auto-select live if selectedSnapshotId is empty
  useEffect(() => {
      if (!selectedSnapshotId) {
          setSelectedSnapshotId('live');
      }
  }, [history]);

  const formatIDR = (num: number) => {
    if ((window as any).privacyShieldActive) return "••••••";
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0, notation: "compact" }).format(num);
  };
  const formatFullIDR = (num: number) => {
    if ((window as any).privacyShieldActive) return "••••••";
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
  };

  // Assemble dynamic live snapshot
  const currentMonthName = new Date().toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
  const activeTxList = liveTransactions;

  // Aggregate stats based on active snapshot
  const liveIncome = activeTxList
    .filter(t => t.type === 'INCOME' || t.type === 'REVENUE')
    .reduce((acc, t) => acc + t.netAmount, 0);

  const liveBurn = activeTxList
    .filter(t => t.type === 'EXPENSE' || t.type === 'INVESTMENT' || t.type === 'DEBT_PAYMENT')
    .reduce((acc, t) => acc + t.netAmount, 0);

  const liveSnapshot: HistoricalSnapshot = {
      id: 'live',
      month: `${currentMonthName} (${language === 'ID' ? 'Buku Aktif' : 'Live Active'})`,
      totalRevenue: liveIncome,
      totalBurn: liveBurn,
      netWorth: 0,
      sovereigntyDays: Math.round(liveBurn > 0 ? (liveIncome / liveBurn) * 30 : 0),
      pockets: currentPockets,
      transactions: activeTxList
  };

  // Resolve selected snapshot details
  const snapshot = selectedSnapshotId === 'live' ? liveSnapshot : history.find(h => h.id === selectedSnapshotId);

  // Outstanding Reimbursements & Claims
  const activeClientReimbursements = liveTransactions.filter(t => t.status === 'PENDING_REIMBURSEMENT');
  const activePartnerClaims = liveTransactions.filter(t => t.status === 'PARTNER_RECEIVABLE');

  const totalOutstandingClientReimb = activeClientReimbursements.reduce((acc, t) => acc + (t.receivableAmount || t.netAmount), 0);
  const totalOutstandingPartnerClaims = activePartnerClaims.reduce((acc, t) => acc + (t.receivableAmount || 0), 0);

  // Apply Search, Filters
  const [filteredTx, setFilteredTx] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!snapshot) return;
    let list = [...snapshot.transactions];

    const { query, startDate, endDate, merchant, tag } = globalFilters;

    // 1. Search Query
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t => 
        (t.description || '').toLowerCase().includes(q) || 
        (t.category || '').toLowerCase().includes(q) ||
        (t.merchant || '').toLowerCase().includes(q) ||
        (t.tags || []).some(tg => tg.toLowerCase().includes(q))
      );
    }

    // Date Range
    if (startDate) {
        list = list.filter(t => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
        // use setHours to include the end of the day
        const endDay = new Date(endDate);
        endDay.setHours(23, 59, 59, 999);
        list = list.filter(t => new Date(t.date) <= endDay);
    }

    // Merchant and Tag
    if (merchant) {
        list = list.filter(t => t.merchant === merchant);
    }
    if (tag) {
        list = list.filter(t => (t.tags || []).includes(tag));
    }

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      list = list.filter(t => t.category === categoryFilter);
    }

    // 3. Status/Claim Filter
    if (claimFilter === 'reimbursables') {
      list = list.filter(t => t.status === 'PENDING_REIMBURSEMENT');
    } else if (claimFilter === 'partner_split') {
      list = list.filter(t => t.status === 'PARTNER_RECEIVABLE');
    } else if (claimFilter === 'any_claim') {
      list = list.filter(t => t.status === 'PENDING_REIMBURSEMENT' || t.status === 'PARTNER_RECEIVABLE');
    }

    // 4. Owner filter
    if (ownerFilter === 'user_her') {
      list = list.filter(t => t.ownerId === 'user_her');
    } else if (ownerFilter === 'user_his') {
      list = list.filter(t => t.ownerId === 'user_his');
    }

    // ADHD operation: suppress flat settled operational noise 
    if (adhdHushMode) {
      list = list.filter(t => t.status === 'PENDING_REIMBURSEMENT' || t.status === 'PARTNER_RECEIVABLE' || t.status === 'PENDING_REPAYMENT');
    }

    setFilteredTx(list);
    setCurrentPage(1);
  }, [globalFilters, categoryFilter, claimFilter, ownerFilter, adhdHushMode, selectedSnapshotId, snapshot?.transactions]);

  if (!snapshot) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#FDFCF7] border border-dashed border-[#E2D9C8] rounded-3xl m-4">
              <div className="p-4 bg-white rounded-full mb-4 shadow-sm border border-[#E2D9C8]">
                   <History className="w-8 h-8 text-sand-400" />
              </div>
              <h3 className="text-xl font-serif font-black text-[#06402B]">
                  {language === 'ID' ? 'Arsip Ledger Kosong' : 'The Ledger Archive is Empty'}
              </h3>
              <p className="text-sm text-sand-500 mt-2 max-w-sm font-sans leading-relaxed">
                  {language === 'ID'
                      ? 'Setelah Anda menutup buku bulanan, gunakan "Protokol Tutup Buku" di Control Tower untuk mengunci data Anda di sini.'
                      : 'Once you complete a month, use the "End of Month Protocol" in the Control Tower to seal your books.'}
              </p>
          </div>
      );
  }

  // Categories list extracted dynamically for filter combobox
  const dynamicCategories = Array.from(new Set(snapshot.transactions.map(t => t.category).filter(Boolean)));

  // Pagination Actuarial
  const totalPages = Math.ceil(filteredTx.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isGhostTx = (tx: Transaction) => {
      if (activeLens === 'JOINT') return false;
      const otherOwner = activeLens === 'HER' ? 'user_his' : 'user_her';
      if (tx.isPrivate && tx.ownerId === otherOwner) return true;
      return false;
  };

  // CSV Statement Export Engine
  const handleDownloadCSV = () => {
      const csvRows: string[] = [];
      const headerPeriod = selectedSnapshotId === 'live' ? 'Active Live Books' : snapshot.month;
      
      csvRows.push(`Wealth OS - Statement for ${headerPeriod}`);
      csvRows.push(`Date Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`);
      csvRows.push(`Family Lens View: ${activeLens}`);
      csvRows.push(`Base Currency: IDR`);
      csvRows.push(``);
      
      csvRows.push(`Date,Description,Type,Category,Target Pocket,Gross Amount (IDR),Net Personal Cost (IDR),Source,Caretaker,Repaid Amount,Receivable Owed,Status`);
      
      snapshot.transactions.forEach(t => {
          const isMasked = activeLens === 'JOINT' && t.isPrivate && t.ownerId !== (activeLens === 'HER' ? 'user_his' : 'user_her'); 
          if (isMasked) {
              csvRows.push(`"${new Date(t.date).toLocaleDateString('en-GB')}","Confidential Private Expense","EXPENSE","Confidential","Confidential",0,0,"PRIVATE","Confidential",0,0,"SETTLED"`);
          } else {
              const pocketName = currentPockets[t.pocket] ? getPocketName(currentPockets[t.pocket], language) : 'Unallocated';
              const ownerName = t.ownerId === 'user_her' ? userName : t.ownerId === 'user_his' ? partnerName : 'Joint';
              csvRows.push(`"${new Date(t.date).toLocaleDateString('en-GB')}","${(t.description || '').replace(/"/g, '""')}","${t.type}","${t.category}","${pocketName}",${t.amount || t.netAmount},${t.netAmount},"${t.source || 'JOINT'}","${ownerName}",${t.repaidAmount || 0},${t.receivableAmount || 0},"${t.status || 'SETTLED'}"`);
          }
      });
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Wealth_OS_Ledger_${headerPeriod.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Print function
  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20"> 
      
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2D9C8]/40 pb-4 gap-3">
          <div>
              <h2 className="text-xl font-serif font-black text-[#06402B] flex items-center gap-2 uppercase tracking-tight">
                  <Fingerprint className="text-[#06402B] h-5 w-5" />
                  {language === 'ID' ? 'Ledger Buku Besar' : 'General Ledger'}
              </h2>
              <p className="text-[9px] uppercase tracking-widest text-[#78716c] font-bold font-mono">
                  {language === 'ID' ? 'Arsip Rekap Audit Transaksi Rumah Tangga' : 'Audited Transaction Histories & Archives'}
              </p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E2D9C8]/80 px-2.5 py-1.5 shadow-sm w-full sm:w-auto self-stretch sm:self-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 animate-pulse-slow">
                  <Calendar size={13} className="text-[#78716c]" />
                  <span className="text-[9px] text-[#78716c] font-bold font-mono uppercase sm:hidden">{language === 'ID' ? 'Periode:' : 'Period:'}</span>
              </div>
              <select 
                  value={selectedSnapshotId} 
                  onChange={e => setSelectedSnapshotId(e.target.value)}
                  className="bg-transparent text-[10px] font-mono font-bold text-sand-950 focus:outline-none cursor-pointer text-right sm:text-left"
              >
                  <option value="live">{language === 'ID' ? 'Buku Kas Berjalan Aktif' : 'Current Running Books (Active)'}</option>
                  {history.map(h => (
                      <option key={h.id} value={h.id}>{h.month}</option>
                  ))}
               </select>
          </div>
      </div>

      {/* 1. HERITAGE PERFORMANCE CARD */}
      <div className="bg-[#FDFCF7] rounded-3xl p-5 border border-[#E2D9C8] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 bg-[#06402B]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2D9C8]/40">
              <div className="flex-1 pb-3 sm:pb-0">
                  <div className="text-[9px] uppercase font-bold text-sand-400 font-mono tracking-widest mb-1">
                      {language === 'ID' ? 'Total Surplus Likuid' : 'Total Liquid Surplus'}
                  </div>
                  <div className="text-xl md:text-2xl font-serif font-black text-[#06402B] tracking-tight">
                      + Rp {formatFullIDR(snapshot.totalRevenue - snapshot.totalBurn)}
                  </div>
                  <div className="text-[9px] text-sand-500 font-sans font-semibold mt-0.5">
                      {language === 'ID' ? 'Surplus Aliran Kas Net Bersama' : 'Net Cash Flow Family Surplus'}
                  </div>
              </div>
              <div className="flex-1 pt-3 sm:pt-0 sm:pl-4">
                  <div className="text-[9px] uppercase font-bold text-sand-400 font-mono tracking-widest mb-1 text-left sm:text-right">
                      {language === 'ID' ? 'Runway Kemandirian' : 'Independence Runway'}
                  </div>
                  <div className="text-xl md:text-2xl font-serif font-black text-[#06402B] tracking-tight text-left sm:text-right">
                      {snapshot.sovereigntyDays} {language === 'ID' ? 'Hari' : 'Days'}
                  </div>
                  <div className="text-[9px] text-sand-500 font-sans font-semibold mt-0.5 text-left sm:text-right">
                      {language === 'ID' ? 'Runway Penutup Beban Hidup' : 'Solvency Coverage Runway'}
                  </div>
              </div>
          </div>

          <div className="mt-5 pt-3 border-t border-dashed border-[#E2D9C8]/55 flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-1.5">
                  <span className="text-sand-400 uppercase font-mono tracking-wider font-bold">
                      {language === 'ID' ? 'Laju Pengeluaran Akumulatif:' : 'Aggregate Burn Rate:'}
                  </span>
                  <span className="text-rose-700 font-black font-serif">Rp {formatFullIDR(snapshot.totalBurn)}</span>
              </div>
              <div className="text-[8px] text-sand-400 font-bold tracking-widest uppercase font-mono">
                  {language === 'ID' ? 'Dasar Pengukuran Terkalibrasi' : 'Audited Baseline Established'}
              </div>
          </div>
      </div>

      {/* 3. TRANSACATION INVENTORY PANEL */}
      <div className="bg-[#FDFCF7] rounded-3xl border border-[#E2D9C8]/80 overflow-hidden shadow-sm">
          
          {/* Header Controls for search */}
          <div className="p-4 bg-white border-b border-[#E2D9C8]/40 flex flex-col space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-[10px] font-bold text-sand-950 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <BookOpen size={13} className="text-[#06402B]" /> 
                      {selectedSnapshotId === 'live' ? (language === 'ID' ? 'Ledger Mutasi Aktif' : 'Live Operating Ledger') : (language === 'ID' ? 'Arsip Ledger Mutasi' : 'Archived Ledger')} ({filteredTx.length})
                  </h3>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                          onClick={() => setShowPrintModal(true)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-sand-100 text-[#06402B] rounded-lg text-[9px] font-mono tracking-widest font-extrabold uppercase transition-all active:scale-95 shadow-sm border border-[#E2D9C8]"
                          title="Generate Printable PDF Statement"
                      >
                          <Printer size={11} />
                          <span>{language === 'ID' ? 'Cetak PDF' : 'Print PDF'}</span>
                      </button>
                      <button 
                          onClick={handleDownloadCSV}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-[#06402B] hover:bg-[#0d543b] text-white rounded-lg text-[9px] font-mono tracking-widest font-extrabold uppercase transition-all active:scale-95 shadow-sm"
                      >
                          <Download size={11} />
                          <span>{language === 'ID' ? 'Ekspor CSV' : 'Export CSV'}</span>
                      </button>
                  </div>
              </div>

              {/* Dynamic Filter Controls Row */}
              <div className="space-y-3">
                <GlobalSearchBar 
                   transactions={snapshot.transactions} 
                   language={language}
                   onFilterChange={setGlobalFilters}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  
                  {/* Combobox Category Filter */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full pl-2 pr-4 py-1.5 text-[10px] font-mono bg-[#FAF9F5] border border-stone-200 rounded-lg focus:outline-none focus:border-[#06402B] focus:bg-white text-stone-900 appearance-none cursor-pointer"
                  >
                    <option value="all">{language === 'ID' ? 'Semua Kategori' : 'All Categories'}</option>
                    {dynamicCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-2 pointer-events-none flex items-center text-stone-400 text-[8px]">▼</span>
                </div>

                {/* Combobox Claim Status Filter */}
                <div className="relative">
                  <select
                    value={claimFilter}
                    onChange={e => setClaimFilter(e.target.value)}
                    className="w-full pl-2 pr-4 py-1.5 text-[10px] font-mono bg-[#FAF9F5] border border-stone-200 rounded-lg focus:outline-none focus:border-[#06402B] focus:bg-white text-stone-900 appearance-none cursor-pointer"
                  >
                    <option value="all">{language === 'ID' ? 'Semua Jenis Rujukan' : 'All Claims status'}</option>
                    <option value="reimbursables">{language === 'ID' ? 'Klaim Klien Victoria' : `Victoria Client Claims`}</option>
                    <option value="partner_split">{language === 'ID' ? 'Talangan David' : `David Shared Splits`}</option>
                    <option value="any_claim">{language === 'ID' ? 'Seluruh Piutang Aktif' : 'Any Pending Reminders'}</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-2 pointer-events-none flex items-center text-stone-400 text-[8px]">▼</span>
                </div>

                {/* Combobox Payer/Owner lens Filter */}
                <div className="relative">
                  <select
                    value={ownerFilter}
                    onChange={e => setOwnerFilter(e.target.value)}
                    className="w-full pl-2 pr-4 py-1.5 text-[10px] font-mono bg-[#FAF9F5] border border-stone-200 rounded-lg focus:outline-none focus:border-[#06402B] focus:bg-white text-stone-900 appearance-none cursor-pointer"
                  >
                    <option value="all">{language === 'ID' ? 'Semua Pihak' : 'All Owners'}</option>
                    <option value="user_her">{userName} (Her)</option>
                    <option value="user_his">{partnerName} (His)</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-2 pointer-events-none flex items-center text-stone-400 text-[8px]">▼</span>
                </div>
              </div>

              {/* ADHD Quick Filters toolbar */}
              <div className="flex gap-2 items-center flex-wrap p-2 bg-[#FDFCF7] border border-dashed border-stone-200/85 rounded-xl mt-2.5">
                <span className="text-[8px] font-mono tracking-wider font-extrabold text-stone-405 uppercase shrink-0">
                  {language === 'ID' ? 'KONTROL ADHD:' : 'ADHD DE-CLUTTER:'}
                </span>
                
                <button
                  onClick={() => setAdhdHushMode(!adhdHushMode)}
                  className={`px-2 py-0.5 text-[7.5px] font-mono font-black uppercase tracking-wider rounded transition-all active:scale-95 flex items-center gap-1 border select-none ${
                    adhdHushMode 
                      ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold' 
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                  title="Hide normal fully-settled transaction noise"
                >
                  <span className={`w-1 h-1 rounded-full shrink-0 ${adhdHushMode ? 'bg-rose-600 animate-ping' : 'bg-stone-300'}`} />
                  <span>{language === 'ID' ? 'HUSH OPERASI RUTIN' : 'HUSH SETTLED NOISE'}</span>
                </button>
                
                <span className="text-[7.5px] italic text-stone-450 font-medium leading-none">
                  {adhdHushMode 
                    ? (language === 'ID' ? 'Piutang & rujukan aktif saja!' : 'Displaying active claims and unsettled items only')
                    : (language === 'ID' ? 'Seluruh riwayat transaksi' : 'Displaying complete double-entry operating logs')
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Table Header Row (Desktop view) */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#06402B]/5 text-sand-500 font-mono text-[9px] uppercase tracking-widest border-b border-[#E2D9C8]/40 font-black">
              <div className="col-span-2">{language === 'ID' ? 'Tanggal' : 'Date'}</div>
              <div className="col-span-5">{language === 'ID' ? 'Keterangan / Kategori' : 'Description / Category'}</div>
              <div className="col-span-2">{language === 'ID' ? 'Pelaku' : 'Owner'}</div>
              <div className="col-span-3 text-right">{language === 'ID' ? 'Dana Bersih (Net Rp)' : 'Net Amount (IDR)'}</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#E2D9C8]/40 bg-white min-h-[300px]">
              {paginatedTransactions.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center p-8 text-center text-stone-400 font-mono uppercase text-[9px] font-bold">
                    <AlertCircle size={20} className="text-stone-300 mb-2" />
                    {language === 'ID' ? 'Tidak ada transaksi cocok dengan kriteria' : 'No matching transactions in logs'}
                  </div>
              ) : (
                  paginatedTransactions.map((t) => {
                      const ghost = isGhostTx(t);
                      const isPartnerClaim = t.status === 'PARTNER_RECEIVABLE';
                      const isClientReimb = t.status === 'PENDING_REIMBURSEMENT';
                      const isIncome = t.type === 'INCOME' || t.type === 'REVENUE';
                      const tOwner = t.ownerId === 'user_her' ? userName : t.ownerId === 'user_his' ? partnerName : 'Joint';

                      return (
                          <div key={t.id} className={`grid grid-cols-12 gap-3 px-5 py-3 hover:bg-[#FAF9F5]/40 transition-colors items-center ${ghost ? 'opacity-35 grayscale' : ''}`}>
                              <div className="col-span-3 sm:col-span-2 text-[9px] sm:text-[10px] font-mono text-sand-400 font-extrabold whitespace-nowrap">
                                  {new Date(t.date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US')}
                              </div>
                              
                              <div className="col-span-6 sm:col-span-5 min-w-0">
                                  <div className="text-sand-900 font-serif font-black text-xs md:text-sm flex items-center flex-wrap gap-1 hover:text-stone-700 truncate select-all">
                                      {ghost && <Lock size={10} className="shrink-0 text-sand-400" />}
                                      <span className="truncate pr-1">{ghost ? 'Confidential Private Ledger Entry' : t.description}</span>
                                      
                                      {isPartnerClaim && (
                                          <span className="text-[6.5px] bg-slate-100 border border-slate-200 text-slate-800 font-mono font-black tracking-wider px-1 py-[1px] uppercase rounded shrink-0">
                                              Split Claim
                                          </span>
                                      )}
                                      {isClientReimb && (
                                          <span className="text-[6.5px] bg-rose-100 border border-rose-200 text-rose-850 font-mono font-black tracking-wider px-1 py-[1px] uppercase rounded shrink-0">
                                              Client Reimbursable
                                          </span>
                                      )}
                                  </div>
                                  <div className="text-[8px] text-[#78716c] uppercase tracking-widest font-mono font-bold mt-0.5">{t.category}</div>
                              </div>

                              <div className="hidden sm:block col-span-2 text-[9px] font-mono uppercase font-black text-[#556b5c]">
                                {tOwner}
                              </div>

                              <div className={`col-span-3 sm:col-span-3 text-right font-serif font-black text-[11px] sm:text-xs whitespace-nowrap ${isIncome ? 'text-emerald-700 font-extrabold' : 'text-sand-950'}`}>
                                  {isIncome ? '+' : '-'} Rp {formatFullIDR(t.netAmount)}
                              </div>
                          </div>
                      );
                  })
              )}
          </div>

          {/* Clean Pagination Controls */}
          <div className="flex justify-between items-center px-5 py-3.5 border-t border-[#E2D9C8]/45 bg-[#FAF9F5] select-none">
            <div className="text-[9px] text-[#78716c] font-mono uppercase font-bold">
              {language === 'ID' 
                ? `Menampilkan ${filteredTx.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-${Math.min(filteredTx.length, currentPage * itemsPerPage)} dari ${filteredTx.length} mutasi` 
                : `Showing ${filteredTx.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-${Math.min(filteredTx.length, currentPage * itemsPerPage)} of ${filteredTx.length} records`}
            </div>
            
            {totalPages > 1 && (
              <div className="flex gap-1.5 items-center">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 px-2 text-[9.5px] font-mono font-bold uppercase border border-[#E2D9C8]/80 rounded hover:bg-white disabled:opacity-40 transition-colors flex items-center"
                >
                  <ChevronLeft size={10} />
                </button>
                <span className="text-[9.5px] font-mono font-bold text-stone-700 mx-1">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 px-2 text-[9.5px] font-mono font-bold uppercase border border-[#E2D9C8]/80 rounded hover:bg-white disabled:opacity-40 transition-colors flex items-center"
                >
                  <ChevronRight size={10} />
                </button>
              </div>
            )}
          </div>
      </div>

      {/* 4. CHRONICLE BEAUTIFUL PRINTABLE PDF REPORT MODAL (OVERLAY WINDOW IN IFRAME) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-[#FAF9F5] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E2D9C8]">
            
            {/* Modal Header Controls */}
            <div className="p-4 border-b border-[#E2D9C8] flex justify-between items-center bg-white shrink-0 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-[#06402B]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
                  {language === 'ID' ? 'Pratinjau Cetak Audit (Tekan Print untuk mengonversi PDF/Halaman)' : 'Executive Audit Print Preview (Converts to high-fidelity PDF)'}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={triggerBrowserPrint}
                  className="px-4 py-1.5 bg-[#06402B] hover:bg-[#095237] text-white rounded-lg text-[9px] font-mono tracking-widest font-extrabold uppercase transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Printer size={11} />
                  <span>{language === 'ID' ? 'Cetak Laporan' : 'Execute Print / PDF'}</span>
                </button>
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 px-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Document Container */}
            <div className="flex-1 overflow-y-auto p-8 scroll-smooth" id="scrollable-document-canvas">
              
              <div 
                id="print-heritage-document" 
                className="bg-white p-10 border border-stone-200 rounded-xl space-y-8 font-sans text-stone-900 shadow-sm mx-auto max-w-[8.27in] min-h-[11.69in] bg-white text-[12px] leading-relaxed"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                {/* Print Style Injector */}
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body {
                      background-color: white !important;
                      color: black !important;
                    }
                    body * {
                      visibility: hidden;
                    }
                    #print-heritage-document, #print-heritage-document * {
                      visibility: visible !important;
                    }
                    #print-heritage-document {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      border: none !important;
                      margin: 0 !important;
                      padding: 1.5cm !important;
                      box-shadow: none !important;
                    }
                    @page {
                      /* Standard Letter / A4 with clean margins */
                      size: A4 portrait;
                      margin: 1.5cm;
                    }
                  }
                `}} />

                {/* Header Crest */}
                <div className="text-center space-y-2 border-b-2 border-stone-800 pb-5">
                  <div className="text-[10px] font-mono tracking-widest uppercase font-extrabold text-[#06402B]">
                    {language === 'ID' ? 'KRITERIA AUDIT KELUARGA GLOBAL' : 'GLOBAL MARRIAGE TRUST & WEALTH REGISTRY'}
                  </div>
                  <h1 className="text-3xl font-serif text-stone-950 font-black tracking-tight uppercase leading-none">
                    {language === 'ID' ? 'Laporan Audit Surplus Bulanan' : 'Monthly Surplus Audit Statement'}
                  </h1>
                  <p className="text-[10px] font-mono tracking-wider font-extrabold text-stone-400 uppercase">
                    {language === 'ID' ? `Masa Audit: ${snapshot.month} • Tampilan Lensa: ${activeLens} • Mata Uang: IDR` : `Audited Period: ${snapshot.month} • Active View Lens: ${activeLens} • Base Currency: IDR`}
                  </p>
                </div>

                {/* 1. Summary Cards row */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="border border-stone-300 p-4 rounded-xl bg-[#FAF9F5]">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-stone-500 block mb-1">
                      {language === 'ID' ? 'TOTAL PENGHASILAN TERCECAP' : 'REPORTED HOUSEHOLD REVENUE'}
                    </span>
                    <strong className="text-xl font-serif text-[#06402B] block">
                      Rp {formatFullIDR(snapshot.totalRevenue)}
                    </strong>
                    <span className="text-[7.5px] font-mono text-stone-400 uppercase font-semibold block mt-0.5">
                      {language === 'ID' ? 'Pendapatan Bersih Rumah Tangga' : 'Household net inflow receipts'}
                    </span>
                  </div>

                  <div className="border border-stone-300 p-4 rounded-xl bg-[#FAF9F5]">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-stone-500 block mb-1">
                      {language === 'ID' ? 'TOTAL PENGELUARAN YANG DIAUDIT' : 'AUDITED TOTAL HOUSEHOLD BURN'}
                    </span>
                    <strong className="text-xl font-serif text-rose-800 block">
                      Rp {formatFullIDR(snapshot.totalBurn)}
                    </strong>
                    <span className="text-[7.5px] font-mono text-stone-400 uppercase font-semibold block mt-0.5">
                      {language === 'ID' ? 'Seluruh pengeluaran hidup bulanan' : 'Consolidated monthly burn expenditure'}
                    </span>
                  </div>
                </div>

                <div className="border border-stone-300 p-4 rounded-xl bg-white flex justify-between items-center sm:grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-stone-500 block mb-1">
                      {language === 'ID' ? 'SURPLUS LIKUID TERSISA (SISA KAS)' : 'REMAINING LIQUID SURPLUS'}
                    </span>
                    <strong className="text-xl font-serif text-[#06402B] block">
                      Rp {formatFullIDR(snapshot.totalRevenue - snapshot.totalBurn)}
                    </strong>
                  </div>
                  <div className="text-right sm:text-left">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-stone-500 block mb-1">
                      {language === 'ID' ? 'KAPASITAS INDEPENDENSI FINANSIAL:' : 'INDEPENDENCE SOLVENCY COVERAGE:'}
                    </span>
                    <strong className="text-xl font-serif text-stone-900 block">
                      {snapshot.sovereigntyDays} {language === 'ID' ? 'Hari Aman' : 'Solvent Days'}
                    </strong>
                  </div>
                </div>

                {/* 2. Pocket Balance Sheet section */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#06402B] border-b border-stone-400 pb-1">
                    {language === 'ID' ? 'KONDISI SALDO TIANG AIR TERJUN (POCKET AUDIT)' : 'TIED WATERFALL POCKET ARCHITECTURE BALANCES'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(snapshot.pockets).slice(0, 10).map((pocket: any) => (
                      <div key={pocket.id} className="flex justify-between items-center border-b border-stone-200 py-1.5 text-[11px]">
                        <span className="font-semibold text-stone-850 truncate">{getPocketName(pocket, language)} ({pocket.group})</span>
                        <span className="font-mono font-bold text-stone-900 text-right">Rp {formatFullIDR(pocket.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Transaction listing table */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#06402B] border-b border-stone-400 pb-1">
                    {language === 'ID' ? 'DETIL CATATAN TRANSAKSI YANG SAH (MAKS. 45 BARIS)' : 'DETAILED TRANSACTION LOG SUMMARY (MAX 45 ENTRIES)'}
                  </h3>
                  
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800 font-mono uppercase tracking-wider text-[8px] text-stone-500">
                        <th className="py-1 pb-2 w-1/6">Date</th>
                        <th className="py-1 pb-2 w-1/2">Description / Class</th>
                        <th className="py-1 pb-2 w-1/6 text-center">Owner</th>
                        <th className="py-1 pb-2 w-1/6 text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredTx.slice(0, 45).map((t) => {
                        const isInc = t.type === 'INCOME' || t.type === 'REVENUE';
                        const ownerLabel = t.ownerId === 'user_her' ? userName : t.ownerId === 'user_his' ? partnerName : 'Joint';
                        return (
                          <tr key={t.id} className="align-middle">
                            <td className="py-2.5 font-mono text-stone-400">{new Date(t.date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US')}</td>
                            <td className="py-2.5 font-serif font-bold text-stone-850 pr-4">
                              {t.description}
                              <span className="text-[7.5px] font-mono bg-stone-100 p-0.5 rounded text-stone-500 font-bold ml-1 uppercase">{t.category}</span>
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-stone-600">{ownerLabel}</td>
                            <td className={`py-2.5 text-right font-mono font-bold ${isInc ? 'text-emerald-700' : 'text-stone-900'}`}>
                              {isInc ? '+' : '-'}Rp{formatFullIDR(t.netAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Formal Seal Footer Signature */}
                <div className="pt-8 flex justify-between items-end border-t border-stone-300">
                  <div className="space-y-4">
                    <p className="text-[8.5px] text-stone-400 uppercase font-mono font-semibold">
                      {language === 'ID' ? 'SISTEM KEAMANAN KEUANGAN KELUARGA' : 'VERIFIED TRUST AND MARITAL FINANCIAL SANCTUARY SECURITY'}
                    </p>
                    <div className="font-mono text-[8px] text-stone-400 bg-stone-100 p-1.5 px-2.5 rounded-lg border border-stone-200 inline-block">
                      {language === 'ID' ? 'SEGEL ELEKTRONIK OS: WEALTH-SECURE-ID-SHA-256' : 'VERIFIED ELECTRONIC REGISTER SEAL: SHA-256-AUTHENTIC'}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="w-36 h-0.5 bg-stone-700 ml-auto mt-12"></div>
                    <p className="text-[10px] font-serif font-black uppercase tracking-wider text-stone-950 mt-1">
                      {language === 'ID' ? 'CFO BERSAMA (MARITAL CERTIFICATE)' : 'FAMILY CHIEF FINANCIAL OFFICER'}
                    </p>
                    <p className="text-[8px] text-stone-400 font-mono tracking-wider font-extrabold uppercase">
                      {userName} &amp; {partnerName}
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Ledger;
