import React from 'react';
import { Transaction } from '../types';
import { Zap, AlertTriangle, Scissors, Check } from 'lucide-react';

interface VampireHunterProps {
    transactions: Transaction[];
    onIgnore: (txId: string) => void;
    language?: 'EN' | 'ID';
}

const VampireHunter: React.FC<VampireHunterProps> = ({ transactions, onIgnore, language = 'EN' }) => {
    // Mock Logic: Find transactions < 1M that occur multiple times or match keywords
    const keywords = ['NETFLIX', 'SPOTIFY', 'APPLE', 'DISNEY', 'GYM', 'MEMBERSHIP'];
    
    const suspects = transactions.filter(t => 
        t.type === 'EXPENSE' && 
        t.amount < 1500000 &&
        keywords.some(k => t.description.toUpperCase().includes(k))
    ).slice(0, 3); // Limit to 3 for UI

    if (suspects.length === 0) return (
        <div className="p-6 bg-wealth-panel border border-wealth-border rounded-xl text-center">
            <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-serif font-bold text-wealth-text">Perimeter Secure</h3>
            <p className="text-xs text-wealth-muted">No zombie subscriptions detected.</p>
        </div>
    );

    return (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 shadow-sm animate-pulse-slow">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="text-rose-600" size={20} />
                <h3 className="font-serif font-bold text-rose-900 text-lg">Vampire Signals Detected</h3>
            </div>
            <div className="space-y-3">
                {suspects.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-rose-100">
                        <div>
                            <div className="font-bold text-xs text-wealth-text uppercase">{t.description}</div>
                            <div className="text-[10px] text-wealth-muted">Recurs monthly</div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="font-serif font-bold text-rose-700">Rp {new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { compactDisplay: "short", notation: "compact" }).format(t.amount)}</div>
                             <button className="p-2 bg-rose-100 text-rose-700 rounded-full hover:bg-rose-200" title="Automate Cancellation">
                                 <Scissors size={14} />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VampireHunter;