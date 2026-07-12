
import React, { useState, useEffect } from 'react';
import { AppState, PocketType, Pocket, User, Liability, FortressGoal, PocketGroup, PocketBehavior } from '../types';
import { Shield, Settings, Archive, ArrowRight, Plus, Trash2, Landmark, Globe, Scale, Users, User as UserIcon, X, Check, Edit2, PenLine, Save, RefreshCw, Copy, UserPlus } from 'lucide-react';
import { getHouseholdInviteCode, regenerateInviteCode } from '../services/authService';

interface ControlTowerProps {
  state: AppState;
  householdId: string;
  onClose: () => void;
  onUpdatePact: (userId: string, strategy: { contribution: number, wealthRatio?: number }) => void;
  onUpdatePocket: (pocketId: string, updates: Partial<Pocket>) => void; // Consolidated Updater
  onUpdateSettings: (settings: any) => void;
  onCreatePocket: (pocket: Pocket) => void;
  onDeletePocket: (pocketId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onAddGoal: (goal: FortressGoal) => void;
  onDeleteGoal: (id: string) => void;
  onAddLiability: (liability: Liability) => void;
  onSealMonth: () => void; 
  language?: 'EN' | 'ID';
  onLanguageChange?: (lang: 'EN' | 'ID') => void;
}

const ControlTower: React.FC<ControlTowerProps> = ({
    state, householdId, onClose, onUpdatePact, onUpdatePocket, onUpdateSettings,
    onCreatePocket, onDeletePocket, onUpdateUser, onAddGoal, onDeleteGoal, onAddLiability,
    onSealMonth, language = 'EN', onLanguageChange
}) => {
    const [activeSection, setActiveSection] = useState<'PACT' | 'ARCHITECT' | 'SYSTEM'>('PACT');

    // Invite your partner
    const isOwner = state.user?.role === 'CFO';
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!householdId) return;
        let mounted = true;
        setInviteLoading(true);
        getHouseholdInviteCode(householdId)
            .then((code) => { if (mounted) setInviteCode(code); })
            .catch((err) => { if (mounted) setInviteError(err.message || 'Failed to load invite code'); })
            .finally(() => { if (mounted) setInviteLoading(false); });
        return () => { mounted = false; };
    }, [householdId]);

    const handleCopyInviteCode = async () => {
        if (!inviteCode) return;
        try {
            await navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setInviteError('Could not copy -- select and copy the code manually.');
        }
    };

    const handleRegenerateInviteCode = async () => {
        if (!householdId) return;
        if (!confirm(language === 'ID'
            ? 'Kode lama akan berhenti berfungsi. Lanjutkan?'
            : 'The old code will stop working. Continue?')) return;
        setInviteLoading(true);
        setInviteError(null);
        try {
            const code = await regenerateInviteCode(householdId);
            setInviteCode(code);
        } catch (err: any) {
            setInviteError(err.message || 'Failed to regenerate invite code');
        } finally {
            setInviteLoading(false);
        }
    };

    // Pocket Creation State
    const [newPocketName, setNewPocketName] = useState('');
    const [newPocketGroup, setNewPocketGroup] = useState<PocketGroup>('LIFESTYLE');
    const [newPocketTarget, setNewPocketTarget] = useState('');

    // Pocket Editing State
    const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
    const [editPocketName, setEditPocketName] = useState('');
    const [editPocketTarget, setEditPocketTarget] = useState('');

    const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0, notation: "compact" }).format(num);

    const handleSaveUserEdit = (userId: string, newName: string) => {
        if (newName.trim()) {
            onUpdateUser(userId, { name: newName });
        }
    };

    const handleGuardianCycle = (pocket: Pocket) => {
        // Cycle: Her -> His -> Joint -> Her
        let nextLead = 'user_her';
        if (pocket.leadId === 'user_her') nextLead = 'user_his';
        else if (pocket.leadId === 'user_his') nextLead = 'JOINT';
        else if (pocket.leadId === 'JOINT') nextLead = 'user_her';
        
        onUpdatePocket(pocket.id, { leadId: nextLead });
    };

    const getGuardianLabel = (leadId?: string) => {
        if (leadId === 'JOINT') return 'Joint';
        if (leadId === 'user_his') return state.partner?.name || 'His';
        return state.user?.name || 'Her';
    };

    const renderPactCard = (user: User | null) => {
        if (!user) return null;
        const strategy = user.allocationStrategy || { contribution: 50, wealthRatio: 80 };
        const isOwner = user.role === 'CFO';
        const colorClass = isOwner ? 'accent-rose-700' : 'accent-slate-700';
        const bgClass = isOwner ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200';
        const textClass = isOwner ? 'text-rose-800' : 'text-slate-800';

        return (
            <div className={`p-5 rounded-xl border ${bgClass} space-y-4 shadow-sm`}>
                <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-xl text-white ${isOwner ? 'bg-rose-700' : 'bg-slate-700'}`}>
                        {user.avatar}
                    </div>
                    <div className="flex-1">
                        <div className={`font-serif font-bold text-lg ${textClass}`}>{user.name}</div>
                        <div className="text-[10px] text-wealth-muted uppercase tracking-widest">Monthly Income: {new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', {notation:"compact"}).format(user.monthlyIncome)}</div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-wealth-muted">Contribution to Joint</label>
                        <span className={`font-serif font-bold text-xl ${textClass}`}>{strategy.contribution}%</span>
                    </div>
                    <input 
                       type="range" 
                       min="0" 
                       max="100" 
                       step="5"
                       value={strategy.contribution}
                       onChange={(e) => onUpdatePact(user.id, { contribution: parseInt(e.target.value) })}
                       className={`w-full h-2 bg-white rounded-lg appearance-none cursor-pointer border border-wealth-border ${colorClass}`}
                    />
                    <div className="flex justify-between mt-1 text-[9px] text-wealth-muted uppercase">
                        <span>Keep {100 - strategy.contribution}% Private</span>
                        <span>Give {strategy.contribution}% Joint</span>
                    </div>
                </div>
            </div>
        );
    };

    const handleCreatePocket = () => {
        if (!newPocketName) return;
        const id = newPocketName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        const pocket: Pocket = {
            id,
            name: newPocketName,
            balance: 0,
            target: parseFloat(newPocketTarget) || 0,
            group: newPocketGroup,
            behavior: (newPocketGroup === 'SANCTUARY' || newPocketGroup === 'WEALTH') ? 'COMMITMENT' : 'BUDGET',
            leadId: 'user_her', 
            description: 'Custom Pocket'
        };
        onCreatePocket(pocket);
        setNewPocketName('');
        setNewPocketTarget('');
    };

    const handleStartPocketEdit = (p: Pocket) => {
        setEditingPocketId(p.id);
        setEditPocketName(p.name);
        setEditPocketTarget(p.target ? p.target.toString() : '0');
    };

    const handleSavePocketEdit = (originalPocket: Pocket) => {
        onUpdatePocket(originalPocket.id, { 
            name: editPocketName, 
            target: parseFloat(editPocketTarget) 
        });
        setEditingPocketId(null);
    };

    // Group Pockets for display
    const groups: PocketGroup[] = ['SANCTUARY', 'DAILY', 'LIFESTYLE', 'WEALTH'];

    return (
        <div className="fixed inset-0 z-[100] bg-wealth-bg flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-wealth-panel p-6 border-b border-wealth-border flex justify-between items-center shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-wealth-emerald text-white rounded-xl shadow-lg">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-wealth-text leading-none">The Constitution</h2>
                        <p className="text-xs text-wealth-muted uppercase tracking-widest font-bold mt-1">Governance & Architecture</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-wealth-text">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex px-6 gap-6 border-b border-wealth-border bg-wealth-bg shrink-0 pt-4 z-10">
                <button onClick={() => setActiveSection('PACT')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeSection === 'PACT' ? 'text-wealth-text border-b-2 border-wealth-gold' : 'text-wealth-muted hover:text-wealth-text'}`}>Heritage Pact</button>
                <button onClick={() => setActiveSection('ARCHITECT')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeSection === 'ARCHITECT' ? 'text-wealth-text border-b-2 border-wealth-gold' : 'text-wealth-muted hover:text-wealth-text'}`}>Architect</button>
                <button onClick={() => setActiveSection('SYSTEM')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeSection === 'SYSTEM' ? 'text-wealth-text border-b-2 border-wealth-gold' : 'text-wealth-muted hover:text-wealth-text'}`}>System</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-24 scroll-smooth">
                
                {/* 1. THE PACT */}
                {activeSection === 'PACT' && (
                    <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-left-4 duration-300">
                        {/* Invite your partner */}
                        <div className="bg-wealth-panel p-5 rounded-xl border border-wealth-border shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-wealth-text uppercase flex items-center gap-2">
                                <UserPlus size={16} /> {language === 'ID' ? 'Undang Pasangan' : 'Invite your partner'}
                            </h3>
                            <p className="text-xs text-wealth-muted leading-relaxed">
                                {language === 'ID'
                                    ? 'Bagikan kode ini agar pasangan Anda bergabung dengan household yang sama.'
                                    : "Share this code so your partner can join the same household."}
                            </p>

                            {inviteError && <p className="text-xs text-wealth-danger">{inviteError}</p>}

                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-[#FAF9F5] border border-wealth-border rounded-lg px-3 py-2.5 font-mono font-bold tracking-widest text-wealth-text text-lg text-center select-all">
                                    {inviteLoading && !inviteCode ? '········' : (inviteCode || '—')}
                                </div>
                                <button
                                    onClick={handleCopyInviteCode}
                                    disabled={!inviteCode || inviteLoading}
                                    title={language === 'ID' ? 'Salin kode' : 'Copy code'}
                                    className="p-2.5 bg-wealth-emerald text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 shrink-0"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>

                            {isOwner ? (
                                <button
                                    onClick={handleRegenerateInviteCode}
                                    disabled={inviteLoading}
                                    className="flex items-center gap-1.5 text-[10px] text-wealth-muted hover:text-wealth-text uppercase font-bold tracking-widest transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={11} className={inviteLoading ? 'animate-spin' : ''} />
                                    {language === 'ID' ? 'Buat Ulang Kode' : 'Regenerate code'}
                                </button>
                            ) : (
                                <p className="text-[10px] text-wealth-muted uppercase tracking-widest">
                                    {language === 'ID' ? 'Hanya pemilik household yang dapat membuat ulang kode.' : 'Only the household owner can regenerate the code.'}
                                </p>
                            )}
                        </div>

                        {/* Each person's own name, labeled from their own record -- never a
                            fixed "Her (CFO) / His" template, so both partners see themselves
                            correctly regardless of who created the household. */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold uppercase text-wealth-muted tracking-widest mb-1 block">
                                    {language === 'ID' ? 'Nama Anda' : 'Your Name'} {state.user?.role === 'CFO' ? `(${language === 'ID' ? 'Pemilik' : 'Owner'})` : `(${language === 'ID' ? 'Anggota' : 'Member'})`}
                                </label>
                                <input
                                    type="text"
                                    value={state.user?.name || ''}
                                    onChange={(e) => state.user && handleSaveUserEdit(state.user.id, e.target.value)}
                                    className="w-full bg-white border-b-2 border-rose-200 focus:border-rose-600 text-rose-900 font-serif font-bold text-xl p-2 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold uppercase text-wealth-muted tracking-widest mb-1 block">
                                    {language === 'ID' ? 'Nama Pasangan' : "Partner's Name"} {state.partner ? (state.partner.role === 'CFO' ? `(${language === 'ID' ? 'Pemilik' : 'Owner'})` : `(${language === 'ID' ? 'Anggota' : 'Member'})`) : ''}
                                </label>
                                <input
                                    type="text"
                                    value={state.partner?.name || ''}
                                    onChange={(e) => state.partner && handleSaveUserEdit(state.partner.id, e.target.value)}
                                    placeholder={state.partner ? '' : (language === 'ID' ? 'Belum bergabung' : 'Not joined yet')}
                                    disabled={!state.partner}
                                    className="w-full bg-white border-b-2 border-slate-200 focus:border-slate-600 text-slate-900 font-serif font-bold text-xl p-2 focus:outline-none transition-colors disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="bg-wealth-panel p-5 rounded-xl border border-wealth-border shadow-sm">
                             <h3 className="text-sm font-bold text-wealth-text uppercase mb-2 flex items-center gap-2">
                                 <Scale size={16} /> Zero-Residual Waterfall Rule
                             </h3>
                             <p className="text-xs text-wealth-muted leading-relaxed">
                                 Income injections are automatically split. The "Contribution %" fills Joint Commitments (Tier 1) and Ops (Tier 2). 
                                 The remainder is automatically routed to your Private Reserve.
                             </p>
                        </div>
                        <div className="space-y-4">
                            {renderPactCard(state.user)}
                            {renderPactCard(state.partner)}
                        </div>
                    </div>
                )}

                {/* 2. POCKET ARCHITECT */}
                {activeSection === 'ARCHITECT' && (
                    <div className="space-y-8 max-w-3xl mx-auto animate-in slide-in-from-right-4 duration-300">
                        {/* Creation Form */}
                        <div className="bg-wealth-panel p-6 rounded-xl border border-wealth-border space-y-5 shadow-sm">
                             <div className="text-xs font-bold uppercase tracking-widest text-wealth-text flex items-center gap-2 border-b border-wealth-border pb-2">
                                 <Plus size={14} className="text-wealth-gold" /> Construct New Pillar
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                 <div className="md:col-span-5">
                                     <label className="text-[9px] uppercase font-bold text-wealth-muted block mb-1">Pocket Name</label>
                                     <input type="text" placeholder="e.g. Ski Trip" className="w-full border-b border-wealth-border bg-transparent text-sm p-2 focus:outline-none focus:border-wealth-gold placeholder-wealth-muted/50 font-serif font-bold" value={newPocketName} onChange={e => setNewPocketName(e.target.value)} />
                                 </div>
                                 <div className="md:col-span-3">
                                     <label className="text-[9px] uppercase font-bold text-wealth-muted block mb-1">Monthly Ceiling</label>
                                     <div className="flex items-center">
                                         <span className="text-xs text-wealth-muted mr-1">Rp</span>
                                         <input type="number" placeholder="0" className="w-full border-b border-wealth-border bg-transparent text-sm p-2 focus:outline-none focus:border-wealth-gold placeholder-wealth-muted/50 font-mono" value={newPocketTarget} onChange={e => setNewPocketTarget(e.target.value)} />
                                     </div>
                                 </div>
                                 <div className="md:col-span-4">
                                     <label className="text-[9px] uppercase font-bold text-wealth-muted block mb-1">Zone</label>
                                     <select className="w-full bg-transparent text-xs border border-wealth-border rounded p-2 focus:outline-none font-bold text-wealth-text" value={newPocketGroup} onChange={e => setNewPocketGroup(e.target.value as any)}>
                                         <option value="SANCTUARY">Sanctuary (Fixed Bill)</option>
                                         <option value="DAILY">Daily (Variable Ops)</option>
                                         <option value="LIFESTYLE">Lifestyle (Discretionary)</option>
                                         <option value="WEALTH">Wealth (Savings)</option>
                                     </select>
                                 </div>
                             </div>
                             <button onClick={handleCreatePocket} disabled={!newPocketName} className="w-full bg-wealth-emerald text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 shadow-md">
                                 Initialize Pocket
                             </button>
                        </div>

                        {/* Existing Architecture */}
                        <div className="space-y-8">
                            {groups.map(group => {
                                const pocketsInGroup = (Object.values(state.pockets) as Pocket[]).filter(p => p.group === group);
                                if (pocketsInGroup.length === 0) return null;

                                return (
                                    <div key={group}>
                                        <h3 className="text-xs font-bold text-wealth-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${group === 'SANCTUARY' ? 'bg-orange-500' : group === 'WEALTH' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                            {group} Sector
                                        </h3>
                                        <div className="space-y-3">
                                            {pocketsInGroup.map(pocket => (
                                                <div key={pocket.id} className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-wealth-border rounded-xl shadow-sm hover:shadow-md transition-all">
                                                    
                                                    {/* Info Section */}
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className={`w-1.5 h-10 rounded-full ${pocket.group === 'SANCTUARY' ? 'bg-orange-500' : pocket.group === 'WEALTH' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                                        <div className="flex-1 min-w-0">
                                                            {editingPocketId === pocket.id ? (
                                                                <div className="flex flex-col gap-2 animate-in fade-in">
                                                                    <input 
                                                                        type="text" 
                                                                        className="font-serif font-bold text-lg border-b border-wealth-gold focus:outline-none w-full"
                                                                        value={editPocketName}
                                                                        onChange={e => setEditPocketName(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-wealth-muted">Ceiling:</span>
                                                                        <input 
                                                                            type="number" 
                                                                            className="font-mono text-sm border-b border-wealth-gold focus:outline-none w-24"
                                                                            value={editPocketTarget}
                                                                            onChange={e => setEditPocketTarget(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <button onClick={() => handleSavePocketEdit(pocket)} className="px-3 py-1 bg-emerald-600 text-white text-[10px] uppercase font-bold rounded hover:bg-emerald-700 flex items-center gap-1"><Save size={10}/> Save</button>
                                                                        <button onClick={() => setEditingPocketId(null)} className="px-3 py-1 bg-slate-200 text-slate-600 text-[10px] uppercase font-bold rounded hover:bg-slate-300">Cancel</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-lg font-serif font-bold text-wealth-text truncate">{pocket.name}</div>
                                                                        <button onClick={() => handleStartPocketEdit(pocket)} className="p-1 text-wealth-muted hover:text-wealth-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Edit2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="text-[10px] text-wealth-muted font-mono mt-0.5">
                                                                        Ceiling: Rp {formatIDR(pocket.target || 0)}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Controls Section */}
                                                    {!editingPocketId && (
                                                        <div className="flex items-center gap-3 justify-end mt-3 md:mt-0 pl-6 border-l border-wealth-border/50">
                                                             {/* Guardianship Cycle */}
                                                             <button 
                                                                onClick={() => handleGuardianCycle(pocket)}
                                                                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase flex items-center gap-2 transition-all w-32 justify-center shadow-sm hover:shadow-md ${
                                                                    pocket.leadId === 'user_her' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                                                                    pocket.leadId === 'user_his' ? 'bg-slate-50 border-slate-200 text-slate-700' :
                                                                    'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                }`}
                                                                title="Cycle Lead Guardian"
                                                             >
                                                                 {pocket.leadId === 'JOINT' ? <Users size={10} /> : <UserIcon size={10} />}
                                                                 <span className="truncate">{getGuardianLabel(pocket.leadId)} Lead</span>
                                                                 <RefreshCw size={8} className="ml-1 opacity-50" />
                                                             </button>

                                                             <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-wealth-border hover:border-wealth-gold transition-colors" title="Carryover Balance">
                                                                 <input 
                                                                    type="checkbox" 
                                                                    checked={!!pocket.allowCarryover}
                                                                    onChange={(e) => onUpdatePocket(pocket.id, { allowCarryover: e.target.checked })}
                                                                    className="w-3 h-3 accent-wealth-gold"
                                                                 />
                                                                 <span className="text-[9px] text-wealth-muted uppercase font-bold">Carry</span>
                                                             </label>

                                                            <button 
                                                                onClick={() => { if(confirm(`Permanently dissolve the ${pocket.name} pocket?`)) onDeletePocket(pocket.id); }} 
                                                                className="text-wealth-muted hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Delete Pocket"
                                                            >
                                                                <Trash2 size={16}/>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. SYSTEM */}
                {activeSection === 'SYSTEM' && (
                    <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-300">


                        {/* Claims & Reimbursements Desk Settings Card */}
                        <div className="bg-white p-5 rounded-xl border border-[#E2D9C8] shadow-sm space-y-4">
                             <h3 className="text-xs font-bold text-sand-900 uppercase flex items-center justify-between font-mono tracking-wider">
                                 <div className="flex items-center gap-2">
                                     <Settings size={14} className="text-[#06402B]" /> 
                                     <span>{language === 'ID' ? 'PENGATURAN MEJA KLAIM' : 'CLAIMS DESK SETTINGS'}</span>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer select-none">
                                     <input 
                                         type="checkbox" 
                                         className="sr-only peer" 
                                         checked={state.settings?.showClaimsDesk !== false}
                                         onChange={(e) => onUpdateSettings({ ...state.settings, showClaimsDesk: e.target.checked })}
                                     />
                                     <div className="w-8 h-4 bg-stone-200 rounded-full peer peer-checked:bg-[#06402B] relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                                 </label>
                             </h3>
                             <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                                 {language === 'ID' 
                                    ? 'Aktifkan atau sembunyikan Meja Klaim & Reimbursement di tab Ledger (Chronicle), serta sesuaikan judul kotak penagihan untuk pelanggan Anda.' 
                                    : 'Show or hide the Claims & Reimbursements Desk on the Chronicle tab, and customize billing titles for your subscribers.'
                                 }
                             </p>
                             
                             {(state.settings?.showClaimsDesk !== false) && (
                                 <div className="space-y-3 pt-2 border-t border-stone-100 font-sans text-xs">
                                     <div>
                                         <label className="block text-[8px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                                             {language === 'ID' ? 'Judul Meja Klaim' : 'Claims Desk Title'}
                                         </label>
                                         <input 
                                             type="text" 
                                             className="w-full bg-[#FDFCF7] border border-[#E2D9C8] rounded-lg p-2 focus:outline-none focus:border-[#06402B] text-xs font-serif font-bold"
                                             value={state.settings?.customClaimsDeskTitle || ''}
                                             onChange={(e) => onUpdateSettings({ ...state.settings, customClaimsDeskTitle: e.target.value })}
                                             placeholder="Claims & Reimbursements Desk"
                                         />
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-3">
                                         <div>
                                             <label className="block text-[8px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                                                 {language === 'ID' ? 'Kolom Klien' : 'Client Claims Label'}
                                             </label>
                                             <input 
                                                 type="text" 
                                                 className="w-full bg-[#FDFCF7] border border-[#E2D9C8] rounded-lg p-2 focus:outline-none focus:border-[#06402B] text-xs font-serif font-bold"
                                                 value={state.settings?.customClientClaimsTitle || ''}
                                                 onChange={(e) => onUpdateSettings({ ...state.settings, customClientClaimsTitle: e.target.value })}
                                                 placeholder="Client Claims"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-[8px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                                                 {language === 'ID' ? 'Kolom Talangan' : 'Shared Splits Label'}
                                             </label>
                                             <input 
                                                 type="text" 
                                                 className="w-full bg-[#FDFCF7] border border-[#E2D9C8] rounded-lg p-2 focus:outline-[#06402B] text-xs font-serif font-bold"
                                                 value={state.settings?.customSharedSplitsTitle || ''}
                                                 onChange={(e) => onUpdateSettings({ ...state.settings, customSharedSplitsTitle: e.target.value })}
                                                 placeholder="Shared Splits"
                                             />
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>

                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <div className="relative z-10 text-center">
                                <div className="inline-block p-4 rounded-full bg-slate-800 mb-4 border border-slate-700 group-hover:border-wealth-gold transition-colors">
                                    <Archive className="text-wealth-gold" size={28} />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-white">
                                    {language === 'ID' ? 'Protokol Akhir Bulan' : 'End of Month Protocol'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
                                    {language === 'ID'
                                        ? 'Tutup buku bulan aktif ke General Ledger Historis. Langkah ini menyetel ulang kantong belanja bulanan Anda (kecuali Carryover aktif) dan menghasilkan Snapshot Sistem.'
                                        : 'Seal the active statements into the Historical Audit Ledger. This resets spending buckets (unless Carryover is active) and generates a Consolidated Statement Snapshot.'
                                    }
                                </p>
                                <button 
                                    onClick={onSealMonth}
                                    className="w-full py-3 bg-wealth-gold text-slate-900 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-yellow-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    {language === 'ID' ? 'Tutup Buku & Setel Ulang' : 'Seal Books & Reset'} <ArrowRight size={14}/>
                                </button>
                            </div>
                        </div>
                        <div className="text-center pt-8">
                            <button 
                                onClick={() => { if(confirm(language === 'ID' ? "Ini akan menghapus seluruh data dan menyetel ulang aplikasi. Anda yakin?" : "This will wipe all data and reset the app. Are you sure?")) { localStorage.clear(); window.location.reload(); } }}
                                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold uppercase tracking-widest border-b border-rose-200 pb-0.5 hover:border-rose-500 transition-colors"
                            >
                                {language === 'ID' ? 'Setel Ulang Pabrik Sistem' : 'Factory Reset System'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ControlTower;
