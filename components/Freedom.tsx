import React from 'react';
import { AreaChart, Area, ResponsiveContainer, ReferenceLine, Tooltip, YAxis } from 'recharts';
import { Baby, Briefcase, Plane, Home, Shield } from 'lucide-react';
import { LifeCard } from '../types';

const DEFAULT_LIFE_CARDS: LifeCard[] = [
    { id: 'baby', name: 'New Heir', costImpact: 5000000, upfrontCost: 50000000, icon: 'baby', isActive: false },
    { id: 'estate', name: 'Estate Upgrade', costImpact: 8000000, upfrontCost: 2000000000, icon: 'home', isActive: false },
    { id: 'sabbatical', name: 'Sabbatical', costImpact: 0, upfrontCost: -100000000, icon: 'plane', isActive: false }, // Negative upfront = cost
];

interface FreedomProps {
    monthlyBurn: number;
    monthlyPassive: number;
    sovereigntyGap: number;
    monthlyIncome: number;
    currentLiquidAssets: number;
    lifeCards: LifeCard[];
    onToggleLifeCard: (card: LifeCard) => void;
    language?: 'EN' | 'ID';
}

const Freedom: React.FC<FreedomProps> = ({ monthlyBurn, monthlyPassive, sovereigntyGap, monthlyIncome, currentLiquidAssets, lifeCards, onToggleLifeCard, language = 'EN' }) => {
    const formatIDR = (num: number) => {
        if ((window as any).privacyShieldActive) return "••••••";
        return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
    };

    // Templates backstop any scenario the household hasn't toggled yet (and so
    // has no row in life_cards). Toggling one for the first time upserts it
    // into state.lifeCards via onToggleLifeCard, making it persist for real.
    const displayCards = DEFAULT_LIFE_CARDS.map(template => lifeCards.find(c => c.id === template.id) ?? template);

    const toggleCard = (card: LifeCard) => {
        onToggleLifeCard({ ...card, isActive: !card.isActive });
    };

    // Simulation Logic
    const runSimulation = () => {
        const data = [];
        let liquid = currentLiquidAssets;
        const baseSavings = monthlyIncome - monthlyBurn;

        // Calculate Impact
        let monthlyImpact = 0;
        let upfrontImpact = 0;

        displayCards.filter(c => c.isActive).forEach(c => {
            monthlyImpact += c.costImpact;
            upfrontImpact += c.upfrontCost; // In simulation, we might deduct this at a specific year, but let's do Y1 for simplicity
        });

        const adjustedMonthlySavings = baseSavings - monthlyImpact;
        liquid -= upfrontImpact;

        // Find Freedom Date (When 4% Rule > Annual Burn)
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

        return { data, freedomYear };
    };

    const { data, freedomYear } = runSimulation();

    const getIcon = (icon: string) => {
        switch (icon) {
            case 'baby': return <Baby size={18} />;
            case 'home': return <Home size={18} />;
            case 'plane': return <Plane size={18} />;
            default: return <Briefcase size={18} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Snapshot -- unchanged from the pre-merge GapDetails */}
            <div className="bg-white w-full rounded-[2.5rem] p-6 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-sand-100/50 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-stone-50 to-transparent rounded-full blur-3xl -mr-[200px] -mt-[200px] opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="bg-[#06402B]/5 p-3 rounded-2xl mb-5 text-[#06402B]">
                            <Shield className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <h3 className="font-serif font-black text-2xl md:text-3xl tracking-tight text-sand-950 mb-3">
                            {language === 'ID' ? 'Sovereignty Audit' : 'Sovereignty Audit'}
                        </h3>
                        <p className="text-sand-500 font-medium max-w-md mx-auto text-xs leading-relaxed text-balance">
                            {language === 'ID'
                                ? 'Mengevaluasi kemandirian pasif mutlak dengan memperhitungkan imbal hasil pasif terhadap beban bulanan.'
                                : 'Evaluating absolute passive self-reliance by subtracting passive returns from committed monthly burns.'
                            }
                        </p>
                    </div>

                    <div className="max-w-md mx-auto space-y-6">
                        <div className="flex justify-between items-end group/item">
                            <div className="flex flex-col gap-1 w-1/2">
                                <span className="text-sand-400 font-mono font-bold tracking-widest uppercase text-[9px] group-hover/item:text-sand-600 transition-colors">
                                    {language === 'ID' ? 'Beban Operasional:' : 'Committed Burn'}
                                </span>
                            </div>
                            <div className="text-right w-1/2">
                                <span className="font-serif font-bold text-rose-800 text-lg md:text-xl tracking-tight drop-shadow-sm">Rp {formatIDR(monthlyBurn)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end group/item">
                            <div className="flex flex-col gap-1 w-1/2">
                                <span className="text-sand-400 font-mono font-bold tracking-widest uppercase text-[9px] group-hover/item:text-sand-600 transition-colors">
                                    {language === 'ID' ? 'Hasil Pasif:' : 'Passive Yield'}
                                </span>
                            </div>
                            <div className="text-right w-1/2">
                                <span className="font-serif font-bold text-[#06402B] text-lg md:text-xl tracking-tight drop-shadow-sm">Rp {formatIDR(monthlyPassive)}</span>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-sand-200/60 flex justify-between items-end overflow-visible relative">
                            <div className="flex flex-col gap-1 w-1/2">
                                <span className="text-sand-900 font-sans font-bold tracking-widest uppercase text-[10px]">
                                    {language === 'ID' ? 'Kesenjangan:' : 'Independence Gap'}
                                </span>
                            </div>
                            <div className="text-right w-1/2">
                                <span className={`font-serif font-black text-2xl md:text-3xl tracking-tighter drop-shadow-sm ${sovereigntyGap <= 0 ? 'text-[#06402B]' : 'text-rose-700'}`}>
                                    {sovereigntyGap <= 0 ? (language === 'ID' ? 'Terpenuhi 🎉' : 'Cleared 🎉') : `Rp ${formatIDR(sovereigntyGap)}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-10">
                        <p className="text-sand-400 text-[10px] font-sans font-semibold max-w-sm mx-auto leading-relaxed uppercase tracking-widest">
                            {language === 'ID'
                                ? 'Sistem kemandirian mandiri.'
                                : 'Independent equity status.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Simulation -- revived from the pre-merge CrystalBall. Life Cards are
                now rewired to state.lifeCards (life_cards table) instead of a local
                hardcoded array, so toggles persist across sessions/devices. */}
            <div className="bg-wealth-panel border border-wealth-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-wealth-text">The Crystal Ball</h3>
                        <p className="text-xs text-wealth-muted uppercase tracking-widest">Monte Carlo Strategy Engine</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-wealth-muted font-bold uppercase">Freedom Date</div>
                        <div className={`text-2xl font-serif font-bold ${freedomYear !== -1 ? 'text-wealth-gold' : 'text-wealth-muted'}`}>
                            {freedomYear !== -1 ? `In ${freedomYear} Years` : 'Unknown'}
                        </div>
                    </div>
                </div>

                {/* Card Deck */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {displayCards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => toggleCard(card)}
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
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip cursor={false} contentStyle={{ backgroundColor: '#F9F7F2', borderColor: '#E2D9C8', fontSize: '10px' }} />
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

export default Freedom;
