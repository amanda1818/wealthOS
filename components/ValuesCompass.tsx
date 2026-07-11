import React, { useState } from 'react';
import { ValueStatement } from '../types';
import { Check, X, RefreshCw, Compass } from 'lucide-react';

const STATEMENTS: ValueStatement[] = [
    { id: '1', text: "I prefer a small luxury apartment in the city over a large house in the suburbs.", category: 'LIFESTYLE' },
    { id: '2', text: "Early retirement (45) is more important than career prestige.", category: 'LIFESTYLE' },
    { id: '3', text: "I believe in fully merging finances, no private accounts.", category: 'ASSETS' },
    { id: '4', text: "Expensive private education for children is a non-negotiable.", category: 'FAMILY' },
    { id: '5', text: "I would spend 50M on a vacation rather than invest it.", category: 'LIFESTYLE' },
];

const ValuesCompass: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<{agree: number, disagree: number} | null>(null);

    const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
        if (currentIndex < STATEMENTS.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Finish
            setResults({ agree: 3, disagree: 2 }); // Mock result logic
        }
    };

    if (results) {
        return (
            <div className="h-96 flex flex-col items-center justify-center bg-wealth-panel border border-wealth-border rounded-xl p-8 text-center animate-in zoom-in-95">
                <Compass className="w-16 h-16 text-wealth-gold mb-4" />
                <h3 className="text-2xl font-serif font-bold text-wealth-text mb-2">Alignment Map Generated</h3>
                <p className="text-sm text-wealth-muted mb-6">You have identified 2 potential friction zones with the "Standard High-Net-Worth" archetype.</p>
                <div className="grid grid-cols-2 gap-4 w-full text-left">
                     <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                         <div className="text-xs font-bold uppercase text-emerald-800">Harmony Zone</div>
                         <div className="font-serif text-emerald-900">Education & Legacy</div>
                     </div>
                     <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                         <div className="text-xs font-bold uppercase text-rose-800">Friction Zone</div>
                         <div className="font-serif text-rose-900">Luxury Travel</div>
                     </div>
                </div>
                <button onClick={() => { setResults(null); setCurrentIndex(0); }} className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-wealth-muted hover:text-wealth-text">
                    <RefreshCw size={14} /> Recalibrate
                </button>
            </div>
        );
    }

    const card = STATEMENTS[currentIndex];

    return (
        <div className="bg-wealth-panel border border-wealth-border rounded-xl p-6 h-96 relative flex flex-col items-center justify-center shadow-md">
            <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-wealth-gold bg-wealth-bg px-2 py-1 rounded">
                {card.category}
            </div>
            <div className="text-center px-4">
                <h3 className="text-2xl font-serif font-bold text-wealth-text leading-tight mb-8">
                    "{card.text}"
                </h3>
            </div>
            
            <div className="absolute bottom-8 w-full px-12 flex justify-between items-center">
                <button 
                    onClick={() => handleSwipe('LEFT')}
                    className="w-14 h-14 rounded-full border-2 border-rose-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 hover:border-rose-500 transition-all active:scale-95"
                >
                    <X size={24} />
                </button>
                <div className="text-xs text-wealth-muted font-mono">{currentIndex + 1} / {STATEMENTS.length}</div>
                <button 
                    onClick={() => handleSwipe('RIGHT')}
                    className="w-14 h-14 rounded-full border-2 border-emerald-200 text-emerald-500 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-500 transition-all active:scale-95"
                >
                    <Check size={24} />
                </button>
            </div>
        </div>
    );
};

export default ValuesCompass;