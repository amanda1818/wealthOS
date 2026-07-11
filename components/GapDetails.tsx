import React from 'react';
import { Shield } from 'lucide-react';

interface GapDetailsProps {
    monthlyBurn: number;
    monthlyPassive: number;
    sovereigntyGap: number;
    language?: 'EN' | 'ID';
}

export const GapDetails: React.FC<GapDetailsProps> = ({ monthlyBurn, monthlyPassive, sovereigntyGap, language = 'EN' }) => {
    const formatIDR = (num: number) => {
        if ((window as any).privacyShieldActive) return "••••••";
        return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="bg-white w-full rounded-[2.5rem] p-6 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-sand-100/50 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden group">
            {/* Subtle premium background glow */}
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
                            <span className="font-serif font-bold text-rose-800 text-lg md:text-xl tracking-tight drop-shadow-sm">Rp {formatIDR(monthlyBurn)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end group/item">
                        <div className="flex flex-col gap-1 w-1/2">
                            <span className="text-sand-400 font-mono font-bold tracking-widest uppercase text-[9px] group-hover/item:text-sand-600 transition-colors">
                                {language === 'ID' ? 'Hasil Pasif:' : 'Passive Yield'}
                            </span>
                        </div>
                        <div className="text-right w-1/2">
                            <span className="font-serif font-bold text-[#06402B] text-lg md:text-xl tracking-tight drop-shadow-sm">Rp {formatIDR(monthlyPassive)}</span>
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
                                {sovereigntyGap <= 0 ? (language === 'ID' ? 'Terpenuhi 🎉' : 'Cleared 🎉') : `Rp ${formatIDR(sovereigntyGap)}`}
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
    );
};
