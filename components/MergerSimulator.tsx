import React, { useState } from 'react';
import { GhostProfile } from '../types';
import { Users, TrendingUp, ShieldCheck, Heart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const GHOST_PROFILES: GhostProfile[] = [
    { id: '1', name: 'Alexander', archetype: 'The High-Flyer', monthlyIncome: 120000000, monthlyBurn: 80000000, description: 'High income, high burn. Luxury travel and assets.' },
    { id: '2', name: 'Elena', archetype: 'The Conservator', monthlyIncome: 45000000, monthlyBurn: 15000000, description: 'Steady growth, minimal debt. Prudent and secure.' },
    { id: '3', name: 'Julian', archetype: 'The Visionary', monthlyIncome: 60000000, monthlyBurn: 40000000, description: 'Invests heavily in startups. High risk, high reward.' },
];

interface MergerSimulatorProps {
    currentUserIncome: number;
    currentUserBurn: number;
    currentNetWorth: number;
    language?: 'EN' | 'ID';
}

const MergerSimulator: React.FC<MergerSimulatorProps> = ({ currentUserIncome, currentUserBurn, currentNetWorth, language = 'EN' }) => {
    const [selectedGhost, setSelectedGhost] = useState<GhostProfile>(GHOST_PROFILES[0]);
    
    // Projection Logic (10 Years)
    const generateProjection = () => {
        const data = [];
        let singleNW = currentNetWorth;
        let mergedNW = currentNetWorth * 1.5; // Assume partner brings some assets
        
        const singleMonthlySave = currentUserIncome - currentUserBurn;
        
        // Synergy Bonus: Shared housing/utilities reduces OpEx by ~30% per person
        const synergyBonus = (currentUserBurn * 0.15) + (selectedGhost.monthlyBurn * 0.15);
        const mergedMonthlySave = singleMonthlySave + (selectedGhost.monthlyIncome - selectedGhost.monthlyBurn) + synergyBonus;

        for (let i = 0; i <= 10; i++) {
            data.push({
                year: `Y${i}`,
                Single: Math.round(singleNW / 1000000), // In Millions
                Merged: Math.round(mergedNW / 1000000),
            });
            
            // 7% Annual Growth on Net Worth + Annual Savings
            singleNW = (singleNW * 1.07) + (singleMonthlySave * 12);
            mergedNW = (mergedNW * 1.07) + (mergedMonthlySave * 12);
        }
        return data;
    };

    const data = generateProjection();
    const finalDiff = data[10].Merged - data[10].Single;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="bg-wealth-panel p-6 rounded-xl border border-wealth-border shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Heart className="text-rose-600" size={24} />
                    <h2 className="text-2xl font-serif font-bold text-wealth-text">The Merger Simulator</h2>
                </div>
                <p className="text-sm text-wealth-muted mb-6">Select a "Ghost Partner" archetype to project your combined Sovereignty trajectory.</p>
                
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {GHOST_PROFILES.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setSelectedGhost(p)}
                            className={`min-w-[140px] p-4 rounded-xl border text-left transition-all ${selectedGhost.id === p.id ? 'bg-wealth-text text-white border-wealth-text shadow-lg transform scale-105' : 'bg-wealth-bg border-wealth-border text-wealth-muted hover:border-wealth-gold'}`}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">{p.archetype}</div>
                            <div className="font-serif font-bold text-lg mb-2">{p.name}</div>
                            <div className="text-[10px] opacity-80 leading-tight">{p.description}</div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorMerged" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06402B" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#06402B" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSingle" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="year" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}M`} />
                            <Tooltip contentStyle={{backgroundColor: '#F9F7F2', borderColor: '#E2D9C8', fontSize: '12px', fontFamily: 'Cormorant Garamond'}} />
                            <Area type="monotone" dataKey="Merged" stroke="#06402B" fillOpacity={1} fill="url(#colorMerged)" strokeWidth={2} />
                            <Area type="monotone" dataKey="Single" stroke="#D4AF37" fillOpacity={1} fill="url(#colorSingle)" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-emerald-700" size={24} />
                        <div>
                            <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-widest">Sovereignty Bonus</div>
                            <div className="text-xs text-emerald-600">10-Year Delta</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-serif font-bold text-emerald-800">+ {new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { notation: "compact", compactDisplay: "short" }).format(finalDiff * 1000000)}</div>
                    </div>
                </div>

                {/* Readiness Badge */}
                <div className="mt-6 text-center border-t border-dashed border-wealth-border pt-6">
                     <div className="inline-block p-3 rounded-full bg-wealth-gold/10 mb-2">
                         <ShieldCheck className="text-wealth-gold w-8 h-8" />
                     </div>
                     <h3 className="text-lg font-serif font-bold text-wealth-text">Gold Tier Eligible</h3>
                     <p className="text-xs text-wealth-muted max-w-xs mx-auto mt-1">
                         Your financial momentum (Low Debt, High Savings Rate) qualifies you for the Sovereign Gold Badge.
                     </p>
                </div>
            </div>
        </div>
    );
};

export default MergerSimulator;