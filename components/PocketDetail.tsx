
import React, { useState } from 'react';
import { Pocket, Transaction, TransactionType, FortressGoal, PocketType } from '../types';
import { X, Settings, Trash2, Edit2, ArrowDownLeft, ArrowUpRight, Save, RotateCcw, Plus, Check, Landmark, Lock, Users, User, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { getPocketName, getPocketDescription } from './PocketCard';

interface PocketDetailProps {
  pocket: Pocket;
  transactions: Transaction[];
  fortressGoals?: FortressGoal[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Pocket>) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (tx: Transaction, targetGoalId?: string) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  language?: 'EN' | 'ID';
  userName?: string;
  partnerName?: string;
}

const PocketDetail: React.FC<PocketDetailProps> = ({ pocket, transactions, fortressGoals, onClose, onUpdate, onDelete, onAddTransaction, onDeleteTransaction, language = 'EN', userName, partnerName }) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [newBalance, setNewBalance] = useState(pocket.balance.toString());
  
  // Ceiling Editing State
  const [isEditingCeiling, setIsEditingCeiling] = useState(false);
  const [newCeiling, setNewCeiling] = useState(pocket.target ? pocket.target.toString() : '0');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(() => getPocketName(pocket, language));
  
  // Manual Entry State
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryType, setEntryType] = useState<TransactionType>('EXPENSE');
  const [entrySource, setEntrySource] = useState<'JOINT' | 'PRIVATE'>('JOINT'); // New State
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
  const pocketTransactions = transactions.filter(t => t.pocket === pocket.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const utilization = pocket.target ? (pocket.balance / pocket.target) * 100 : 0;
  
  let statusColor = "border-wealth-border";
  let statusGlow = "";
  
  if (pocket.balance < 0) {
      statusColor = "border-wealth-danger";
      statusGlow = "shadow-[0_0_20px_rgba(159,18,57,0.3)]";
  } else if (utilization > 80) {
      statusColor = "border-wealth-gold";
      statusGlow = "shadow-[0_0_20px_rgba(212,175,55,0.3)]";
  }

  const handleSaveCalibration = () => {
    const val = parseFloat(newBalance.replace(/[^\d.-]/g, ''));
    if (!isNaN(val)) {
        onUpdate(pocket.id, { balance: val });
        setIsCalibrating(false);
    }
  };

  const handleSaveCeiling = () => {
      const newVal = parseFloat(newCeiling.replace(/[^\d.-]/g, ''));
      if (!isNaN(newVal)) {
          onUpdate(pocket.id, { target: newVal });
          setIsEditingCeiling(false);
      }
  };

  const handleSaveName = () => {
      if (editName.trim()) {
          onUpdate(pocket.id, { name: editName });
          setIsEditingName(false);
      }
  };
  
  const handleToggleLead = () => {
      const newLead = pocket.leadId === 'user_her' ? 'user_his' : 'user_her';
      onUpdate(pocket.id, { leadId: newLead });
  };

  const handleSubmitEntry = () => {
      if (!entryAmount || !entryDesc) return;
      const amount = parseFloat(entryAmount.replace(/[^\d.-]/g, ''));
      if (isNaN(amount)) return;

      const newTx: Transaction = {
          id: `manual-${Date.now()}`,
          date: new Date().toISOString(),
          description: entryDesc,
          amount: amount,
          netAmount: amount,
          repaidAmount: 0,
          category: selectedGoalId ? 'Capital Deployment' : 'Manual Log',
          type: entryType,
          pocket: pocket.id,
          status: 'SETTLED',
          ownerId: pocket.leadId || 'JOINT',
          source: entrySource, // Track source
          isPrivate: entrySource === 'PRIVATE'
      };

      onAddTransaction(newTx, selectedGoalId || undefined);
      setIsAddingEntry(false);
      setEntryAmount('');
      setEntryDesc('');
      setSelectedGoalId('');
      setEntrySource('JOINT');
  };

  const isGrowthEngine = pocket.id === PocketType.GROWTH;
  const isDebtService = pocket.id === PocketType.DEBT_SERVICE;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-wealth-bg w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative border border-wealth-gold/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-wealth-border bg-wealth-panel/80 shrink-0">
            <div className="flex-1 mr-4">
                {isEditingName ? (
                    <input 
                        type="text" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)}
                        className="text-2xl font-serif font-bold text-wealth-text bg-transparent border-b border-wealth-gold focus:outline-none w-full"
                        autoFocus
                        onBlur={handleSaveName}
                    />
                ) : (
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-wealth-text tracking-tight cursor-pointer hover:text-wealth-gold transition-colors flex items-center gap-2 group" onClick={() => setIsEditingName(true)} title="Click to Rename">
                            {getPocketName(pocket, language)}
                            <Edit2 size={14} className="opacity-60 hover:opacity-100 text-wealth-gold ml-1 animate-pulse" />
                        </h2>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <p className="text-[10px] text-wealth-muted font-bold font-sans tracking-wide mt-1 uppercase">
                                {getPocketDescription(pocket, language)}
                            </p>
                            <span className="hidden sm:inline text-stone-400 text-[10px] mt-1">•</span>
                            <span className="text-[9px] text-wealth-gold font-mono uppercase tracking-wider mt-1 font-bold">
                                {language === 'ID' ? 'Ketuk Judul untuk Mengubah Nama' : 'Click title to rename pocket'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={handleToggleLead}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase transition-all ${pocket.leadId === 'user_her' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                    title="Toggle Responsible Guardian"
                >
                    {pocket.leadId === 'user_her' ? <User size={12}/> : <Users size={12}/>}
                    {pocket.leadId === 'user_her' ? (userName || 'Partner A') : (partnerName || 'Partner B')} Lead
                </button>
                <button 
                    onClick={() => { if(confirm("Permanently delete this pocket?")) onDelete(pocket.id); }}
                    className="p-2 rounded-full hover:bg-rose-50 text-wealth-muted hover:text-rose-600 transition-colors"
                    title="Delete Pocket"
                >
                    <Trash2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 bg-wealth-panel border border-wealth-border rounded-full hover:bg-wealth-border hover:text-wealth-danger transition-colors ml-2 shadow-sm">
                    <X size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Visual Gauge & Calibration */}
            <div className={`bg-wealth-panel border rounded-xl p-8 text-center transition-all duration-500 ${statusColor} ${statusGlow}`}>
                <div className="text-xs text-wealth-muted uppercase tracking-widest mb-2 font-bold font-sans">Available Liquidity</div>
                
                {isCalibrating ? (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-2xl font-serif text-wealth-muted">Rp</span>
                        <input 
                            type="number"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            className="text-4xl font-serif font-bold text-wealth-text border-b-2 border-wealth-gold focus:outline-none w-1/2 text-center bg-transparent"
                            autoFocus
                        />
                        <button onClick={handleSaveCalibration} className="p-2 bg-wealth-text text-white rounded-lg shadow-md hover:bg-emerald-800"><Check size={18}/></button>
                    </div>
                ) : (
                    <div className={`text-5xl font-serif font-bold mb-6 tracking-tight ${pocket.balance < 0 ? 'text-wealth-danger' : 'text-wealth-text'}`}>
                        Rp {formatIDR(pocket.balance)}
                    </div>
                )}
                
                {/* Ceiling Edit Zone */}
                <div className="relative pt-2">
                    <div className="flex justify-between items-center text-xs text-wealth-muted mb-2 font-semibold font-sans">
                        <span>{language === 'ID' ? 'Kosong' : 'Min Required (Safe)'}</span>
                        <div className="flex items-center gap-2">
                            <span>{language === 'ID' ? 'Target Bulanan (Budget):' : 'Suggested Monthly Budget:'}</span>
                            {isEditingCeiling ? (
                                <div className="flex items-center gap-1">
                                    <span className="font-serif">Rp</span>
                                    <input 
                                        type="number" 
                                        value={newCeiling}
                                        onChange={(e) => setNewCeiling(e.target.value)}
                                        className="w-24 border-b border-wealth-gold bg-transparent text-right focus:outline-none font-bold text-wealth-text"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveCeiling} className="text-wealth-emerald"><Check size={14}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 group cursor-pointer" onClick={() => !isDebtService && setIsEditingCeiling(true)} title={isDebtService ? "Automatically computed from loans" : "Click to edit budget"}>
                                    <span className="font-bold text-[#06402B]">Rp {formatIDR(pocket.target || 0)}</span>
                                    {!isDebtService && <Edit2 size={10} className="text-wealth-gold" />}
                                </div>
                            )}
                        </div>
                    </div>
                    {pocket.target && (
                        <div className="w-full bg-wealth-bg h-3.5 rounded-full overflow-hidden border border-wealth-border relative shadow-inner">
                            <div 
                            className={`h-full transition-all duration-1000 ${pocket.balance < 0 ? 'bg-wealth-danger' : 'bg-wealth-emerald'}`}
                            style={{ width: `${Math.max(0, Math.min(utilization, 100))}%` }}
                            />
                        </div>
                    )}
                    
                    {isDebtService && (
                        <div className="mt-4 bg-[#FEE2E2]/60 border border-rose-250 rounded-xl p-4 text-xs text-rose-900 animate-in fade-in space-y-2 text-left">
                            <div className="flex items-center gap-2 font-bold text-rose-950 uppercase tracking-wide">
                                <AlertCircle size={15} className="text-rose-700 shrink-0" />
                                <span>{language === 'ID' ? 'Penjelasan Kantong Cicilan & Pinjaman' : 'About Cicilan & Pinjaman Pocket'}</span>
                            </div>
                            <p className="font-medium text-[11px] leading-relaxed text-rose-900">
                                {language === 'ID' 
                                  ? 'Kantong ini mendedikasikan dana bulanan khusus untuk melunasi seluruh cicilan KPR dan kredit aktif Anda (seperti Menteng Mortgage & Berlin Mortgage). Target Kebutuhan Bulanan didapatkan secara otomatis dari ringkasan beban utang aktif Anda agar Anda tidak pernah terlambat bayar.'
                                  : 'This pocket centralizes funds dedicated specifically to automatically servicing your active mortgages & property loans (including your Menteng asset & Berlin compound loans). The Monthly Budget is auto-calculated directly from the cumulative installments to prevent cashflow mismatch.'}
                            </p>
                            <div className="pt-2.5 border-t border-rose-300/40 flex justify-between text-[10.5px] font-mono font-bold text-rose-950">
                                <span>{language === 'ID' ? 'Tersedia:' : 'Available:'} Rp {formatIDR(pocket.balance)}</span>
                                <span>{language === 'ID' ? 'Total Harus Terpenuhi:' : 'Target Ceiling:'} Rp {formatIDR(pocket.target || 0)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Entry Block */}
            {isAddingEntry ? (
                <div className="bg-wealth-panel border border-wealth-gold rounded-xl p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 border-b border-wealth-border pb-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-wealth-text font-sans">Log Entry</h3>
                        <button onClick={() => setIsAddingEntry(false)} className="text-wealth-muted hover:text-wealth-danger"><X size={16}/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setEntryType('EXPENSE')} 
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border active:scale-95 transition-transform ${entryType === 'EXPENSE' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-wealth-bg border-wealth-border text-wealth-muted'}`}
                            >
                                {isGrowthEngine ? 'Deploy Capital' : 'Expense'}
                            </button>
                            <button 
                                onClick={() => setEntryType('INCOME')} 
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border active:scale-95 transition-transform ${entryType === 'INCOME' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-wealth-bg border-wealth-border text-wealth-muted'}`}
                            >
                                Refund / Add
                            </button>
                        </div>

                        {/* Source Toggle */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setEntrySource('JOINT')} 
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border flex items-center justify-center gap-2 active:scale-95 transition-transform ${entrySource === 'JOINT' ? 'bg-wealth-emerald text-white border-wealth-emerald' : 'bg-wealth-bg border-wealth-border text-wealth-muted'}`}
                            >
                                <Users size={12} /> Source: Joint
                            </button>
                            <button 
                                onClick={() => setEntrySource('PRIVATE')} 
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border flex items-center justify-center gap-2 active:scale-95 transition-transform ${entrySource === 'PRIVATE' ? 'bg-slate-700 text-white border-slate-700' : 'bg-wealth-bg border-wealth-border text-wealth-muted'}`}
                            >
                                <Lock size={12} /> Source: Private
                            </button>
                        </div>

                        {isGrowthEngine && entryType === 'EXPENSE' && fortressGoals && (
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <label className="text-[10px] uppercase font-bold text-emerald-800 mb-2 block">Allocate to Goal (Optional)</label>
                                <select 
                                    value={selectedGoalId} 
                                    onChange={(e) => setSelectedGoalId(e.target.value)}
                                    className="w-full p-2 text-sm bg-white border border-emerald-200 rounded text-wealth-text focus:outline-none"
                                >
                                    <option value="">-- General Spending --</option>
                                    {fortressGoals.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] uppercase font-bold text-wealth-muted">Amount (IDR)</label>
                            <input 
                                type="number" 
                                value={entryAmount} 
                                onChange={e => setEntryAmount(e.target.value)} 
                                className="w-full py-2 border-b border-wealth-border focus:border-wealth-gold bg-transparent text-xl font-serif font-bold text-wealth-text focus:outline-none" 
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-wealth-muted">Description</label>
                            <input 
                                type="text" 
                                value={entryDesc} 
                                onChange={e => setEntryDesc(e.target.value)} 
                                className="w-full py-2 border-b border-wealth-border focus:border-wealth-gold bg-transparent text-sm font-sans text-wealth-text focus:outline-none" 
                                placeholder={selectedGoalId ? "Investment Ticker / Asset Name" : "e.g. Dinner"}
                            />
                        </div>
                        <button onClick={handleSubmitEntry} className="w-full py-3 bg-wealth-text text-white rounded-lg font-bold font-sans text-xs uppercase tracking-widest hover:bg-emerald-900 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95">
                            {selectedGoalId ? <Landmark size={14}/> : <Check size={14}/>}
                            {selectedGoalId ? 'Authorize Investment' : 'Confirm Record'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIsAddingEntry(true)} className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-wealth-border bg-wealth-panel text-wealth-text hover:border-wealth-gold hover:text-wealth-gold transition-colors shadow-sm group active:scale-95">
                        <Plus size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider font-sans">Manual Entry</span>
                    </button>
                    <button onClick={() => setIsCalibrating(true)} className="flex items-center justify-center gap-2 p-4 rounded-xl border border-wealth-border bg-wealth-panel text-wealth-text hover:border-wealth-gold transition-colors shadow-sm group active:scale-95">
                        <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider font-sans">Calibrate</span>
                    </button>
                </div>
            )}

            {/* Pocket Ledger */}
            <div className="space-y-4 pt-4">
                <h3 className="text-xs font-bold text-wealth-muted uppercase tracking-widest font-sans border-b border-wealth-border pb-2">Pocket Ledger</h3>
                <div className="space-y-3">
                    {pocketTransactions.length === 0 ? (
                        <div className="text-center py-8 text-wealth-muted text-xs italic font-serif">No activity recorded in this sector.</div>
                    ) : (
                        pocketTransactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-4 bg-wealth-panel border border-wealth-border rounded-xl shadow-sm hover:border-wealth-gold transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`shrink-0 p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {t.type === 'INCOME' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm text-wealth-text font-serif font-semibold truncate">{t.description}</div>
                                        <div className="text-[10px] text-wealth-muted font-medium font-sans flex items-center gap-2">
                                            <span>{new Date(t.date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US')}</span>
                                            {t.source === 'PRIVATE' && <span className="flex items-center gap-0.5 text-rose-600"><Lock size={8}/> Private</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`shrink-0 font-serif font-bold text-sm ml-2 ${t.type === 'INCOME' ? 'text-wealth-emerald' : 'text-wealth-text'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'} {formatIDR(t.netAmount)}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (confirm("Revoke this transaction and restore liquidity?")) {
                                                onDeleteTransaction(t);
                                            }
                                        }}
                                        className="p-1.5 text-wealth-muted hover:text-wealth-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PocketDetail;
