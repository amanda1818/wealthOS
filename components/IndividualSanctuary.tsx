
import React, { useState } from 'react';
import { AppState, PocketType, Pocket } from '../types';
import { Eye, EyeOff, Lock, TrendingUp, Wallet, Shield } from 'lucide-react';
import PocketCard from './PocketCard';

interface IndividualSanctuaryProps {
    state: AppState;
    onPrivacyToggle: () => void;
    onPocketClick: (pocket: Pocket) => void;
    language?: 'EN' | 'ID';
}

const IndividualSanctuary: React.FC<IndividualSanctuaryProps> = ({ state, onPrivacyToggle, onPocketClick, language = 'EN' }) => {
    const user = state.user;
    if (!user) return null;

    const isPrivateMode = user.isPrivateMode;
    const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);

    // 1. Calculate Private Liquidity
    const privatePockets = (Object.values(state.pockets) as Pocket[]).filter(p => !p.isShared && p.group === 'LIFESTYLE');
    const privateLiquidity = privatePockets.reduce((acc, p) => acc + p.balance, 0);

    // 2. Pact Progress
    // Logic: Calculate how much has been transferred to Joint pockets this month by this user.
    // Simplifying: Assume 'contribution' % of income is the Target.
    const pactTarget = user.monthlyIncome * ((user.allocationStrategy?.contribution || 50) / 100);
    
    // Find transfers from User -> Joint Pockets in current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const pactContributed = state.transactions
        .filter(t => 
            t.ownerId === user.id && 
            t.type === 'TRANSFER' && 
            t.date.startsWith(currentMonth) &&
            !t.isPrivate // Assuming transfers to shared pockets are not private
        )
        .reduce((acc, t) => acc + t.amount, 0);

    const pactProgress = Math.min((pactContributed / pactTarget) * 100, 100);

    // 3. Private Assets (Mock filter for now)
    const privateAssets = state.fortressGoals.filter(g => g.ownerId === user.id);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Privacy Toggle */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-wealth-text">Private Sanctuary</h2>
                    <p className="text-[10px] uppercase tracking-widest text-wealth-muted font-bold">Confidential Workspace • {user.name}</p>
                </div>
                <button 
                    onClick={onPrivacyToggle}
                    className={`p-2 rounded-full border transition-all ${isPrivateMode ? 'bg-wealth-emerald text-white border-wealth-emerald' : 'bg-wealth-panel text-wealth-muted border-wealth-border'}`}
                >
                    {isPrivateMode ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {/* Private HUD */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Lock size={100} /></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Wallet size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Private Liquidity</span>
                    </div>
                    <div className="text-4xl font-serif font-bold mb-6">
                        {isPrivateMode ? '••••••••' : `Rp ${formatIDR(privateLiquidity)}`}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                            <span>Pact Obligation</span>
                            <span>{Math.round(pactProgress)}% Fulfilled</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${pactProgress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span>Contributed: {formatIDR(pactContributed)}</span>
                            <span>Target: {formatIDR(pactTarget)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Private Pockets Grid */}
            <div>
                <h3 className="text-xs font-bold text-wealth-muted uppercase tracking-widest mb-3 border-b border-wealth-border pb-2">Discretionary Pools</h3>
                <div className="grid grid-cols-2 gap-3">
                    {privatePockets.map(p => (
                        <div key={p.id} className={isPrivateMode ? 'blur-sm select-none' : ''}>
                             <PocketCard 
                                pocket={p} 
                                compact 
                                onClick={onPocketClick} 
                                userName={state.user?.name} 
                                partnerName={state.partner?.name} 
                             />
                        </div>
                    ))}
                    {/* Add Private Savings/Goals here later */}
                </div>
            </div>

             {/* Private Fortress (Filtered Goals) */}
             <div>
                <h3 className="text-xs font-bold text-wealth-muted uppercase tracking-widest mb-3 border-b border-wealth-border pb-2">Private Holdings</h3>
                {privateAssets.length === 0 ? (
                    <div className="p-4 bg-wealth-panel border border-wealth-border rounded-xl text-center text-xs text-wealth-muted italic">
                        No private assets designated. Move assets to "Private" in Fortress.
                    </div>
                ) : (
                    <div className={`space-y-3 ${isPrivateMode ? 'blur-md select-none' : ''}`}>
                         {privateAssets.map(g => (
                             <div key={g.id} className="flex justify-between items-center p-4 bg-wealth-panel border border-wealth-border rounded-xl shadow-sm">
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Shield size={16}/></div>
                                     <div>
                                         <div className="font-serif font-bold text-wealth-text">{g.name}</div>
                                         <div className="text-[10px] text-wealth-muted">Target: {formatIDR(g.targetAmount)}</div>
                                     </div>
                                 </div>
                                 <div className="font-serif font-bold text-wealth-text">Rp {formatIDR(g.currentAmount)}</div>
                             </div>
                         ))}
                    </div>
                )}
             </div>

        </div>
    );
};

export default IndividualSanctuary;
