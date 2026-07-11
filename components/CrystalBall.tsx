import React, { useState } from 'react';
import { LifeCard } from '../types';
import { Baby, Briefcase, Plane, Home, GraduationCap, X, RotateCcw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, ReferenceLine, Tooltip, YAxis } from 'recharts';

const INITIAL_LIFE_CARDS: LifeCard[] = [
    { id: 'baby', name: 'New Heir', costImpact: 5000000, upfrontCost: 50000000, icon: 'baby', isActive: false },
    { id: 'estate', name: 'Estate Upgrade', costImpact: 8000000, upfrontCost: 2000000000, icon: 'home', isActive: false },
    { id: 'sabbatical', name: 'Sabbatical', costImpact: 0, upfrontCost: -100000000, icon: 'plane', isActive: false }, // Negative upfront = cost
];

interface CrystalBallProps {
    monthlyIncome: number;
    monthlyBurn: number;
    currentLiquidAssets: number;
}

const CrystalBall: React.FC<CrystalBallProps> = ({ monthlyIncome, monthlyBurn, currentLiquidAssets }) => {
    const [cards, setCards] = useState<LifeCard[]>(INITIAL_LIFE_CARDS);
    
    const toggleCard = (id: string) => {
        setCards(cards.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    };

    // Simulation Logic
    const runSimulation = () => {
        const data = [];
        let liquid = currentLiquidAssets;
        const baseSavings = monthlyIncome - monthlyBurn;
        
        // Calculate Impact
        let monthlyImpact = 0;
        let upfrontImpact = 0;

        cards.filter(c => c.isActive).forEach(c => {
            monthlyImpact += c.costImpact;
            upfrontImpact += c.upfrontCost; // In simulation, we might deduct this at a specific year, but let's do Y1 for simplicity
        });

        const adjustedMonthlySavings = baseSavings - monthlyImpact;
        liquid -= upfrontImpact;

        // Find Sovereignty Date (When 4% Rule > Annual Burn)
        const annualBurn = (monthlyBurn + monthlyImpact) * 12;
        const freedomNumber = annualBurn * 25; // 4% Rule
        let freedomYear = -1;

        for (let year = 0; year <= 20; year++) {
            // Investment Growth 7%
            liquid = (liquid * 1.07) + (adjustedMonthlySavings * 12);
            
            data.push({
                year: `Y${year}`,
                wealth: Math.round(liquid / 1000000),
                freedom: Math.round(freedomNumber / 1000000)
            });

            if (freedomYear === -1 && liquid >= freedomNumber) {
                freedomYear = year;
            }
        }

        return { data, freedomYear, freedomNumber };
    };

    const { data, freedomYear } = runSimulation();

    const getIcon = (icon: string) => {
        switch(icon) {
            case 'baby': return <Baby size={18} />;
            case 'home': return <Home size={18} />;
            case 'plane': return <Plane size={18} />;
            default: return <Briefcase size={18} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-wealth-panel border border-wealth-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                         <h3 className="text-xl font-serif font-bold text-wealth-text">The Crystal Ball</h3>
                         <p className="text-xs text-wealth-muted uppercase tracking-widest">Monte Carlo Strategy Engine</p>
                    </div>
                    <div className="text-right">
                         <div className="text-[10px] text-wealth-muted font-bold uppercase">Sovereignty Date</div>
                         <div className={`text-2xl font-serif font-bold ${freedomYear !== -1 ? 'text-wealth-gold' : 'text-wealth-muted'}`}>
                             {freedomYear !== -1 ? `In ${freedomYear} Years` : 'Unknown'}
                         </div>
                    </div>
                </div>

                {/* Card Deck */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {cards.map(card => (
                        <button 
                            key={card.id}
                            onClick={() => toggleCard(card.id)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${card.isActive ? 'bg-wealth-text text-white border-wealth-text shadow-md' : 'bg-wealth-bg border-wealth-border text-wealth-muted opacity-60 hover:opacity-100'}`}
                        >
                            {getIcon(card.icon)}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{card.name}</span>
                        </button>
                    ))}
                </div>

                {/* Chart */}
                <div className="h-48 w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={data}>
                             <defs>
                                <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <YAxis hide domain={['auto', 'auto']} />
                             <Tooltip cursor={false} contentStyle={{backgroundColor: '#F9F7F2', borderColor: '#E2D9C8', fontSize: '10px'}} />
                             <ReferenceLine y={data[0].freedom} stroke="#06402B" strokeDasharray="3 3" label={{ position: 'top', value: 'Freedom Line', fill: '#06402B', fontSize: 10 }} />
                             <Area type="monotone" dataKey="wealth" stroke="#D4AF37" fill="url(#colorWealth)" strokeWidth={2} />
                         </AreaChart>
                     </ResponsiveContainer>
                </div>
                
                <p className="text-center text-[10px] text-wealth-muted italic mt-2">
                    Simulating 7% market returns against 4% withdrawal rule.
                </p>
            </div>
        </div>
    );
};

export default CrystalBall;