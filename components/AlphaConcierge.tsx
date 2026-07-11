
import React from 'react';
import { AlphaAlert } from '../types';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface AlphaConciergeProps {
    alerts: AlphaAlert[];
    onExecute: (command: string) => void;
    onDismiss: (id: string) => void;
    language?: 'EN' | 'ID';
}

const AlphaConcierge: React.FC<AlphaConciergeProps> = ({ alerts, onExecute, onDismiss, language = 'EN' }) => {
    if (alerts.length === 0) return null;

    const translate = (alert: AlphaAlert) => {
        if (language === 'EN') return alert;
        if (alert.id === 'alert-reimbursement') {
            return {
                ...alert,
                title: 'Reimbursement Victoria Menunggu',
                message: 'Victoria memiliki Rp 5.900.000 dana reimbursement klien yang belum dicairkan. Selesaikan untuk mengembalikan ke Kas Investasi.',
                actionLabel: 'Selesaikan'
            };
        }
        if (alert.id === 'alert-claims-david') {
            return {
                ...alert,
                title: 'Hutang Kas David Menunggu',
                message: 'David memiliki Rp 1.900.000 kas pribadi yang belum diganti dari makan malam & sewa lapangan tenis. Selesaikan klaim ke pos gabungan.',
                actionLabel: 'Selesaikan'
            };
        }
        return alert;
    };

    return (
        <div className="space-y-3 mb-6 animate-in slide-in-from-top-4 duration-500">
            {alerts.map(originalAlert => {
                const alert = translate(originalAlert);
                return (
                <div 
                    key={alert.id}
                    className={`relative overflow-hidden rounded-xl border p-4 shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${
                        alert.severity === 'OPPORTUNITY' ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200' :
                        alert.severity === 'WARNING' ? 'bg-gradient-to-br from-rose-50 to-white border-rose-200' :
                        'bg-gradient-to-br from-amber-50 to-white border-amber-200'
                    }`}
                >
                    <div className={`p-2 rounded-full shrink-0 ${
                         alert.severity === 'OPPORTUNITY' ? 'bg-emerald-100 text-emerald-700' :
                         alert.severity === 'WARNING' ? 'bg-rose-100 text-rose-700' :
                         'bg-amber-100 text-amber-700'
                    }`}>
                        <Sparkles size={18} />
                    </div>
                    
                    <div className="flex-1">
                        <h4 className={`text-sm font-serif font-bold mb-1 ${
                             alert.severity === 'OPPORTUNITY' ? 'text-emerald-900' :
                             alert.severity === 'WARNING' ? 'text-rose-900' :
                             'text-amber-900'
                        }`}>
                            {alert.title}
                        </h4>
                        <p className="text-xs text-sand-500 leading-relaxed mb-3 font-semibold">
                            {alert.message}
                        </p>
                        <button 
                            onClick={() => onExecute(alert.actionCommand)}
                            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                                alert.severity === 'OPPORTUNITY' ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' :
                                alert.severity === 'WARNING' ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700' :
                                'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                            }`}
                        >
                            {alert.actionLabel} <ArrowRight size={10} />
                        </button>
                    </div>

                    <button 
                        onClick={() => onDismiss(alert.id)}
                        className="absolute top-2 right-2 text-sand-400 hover:text-sand-700 p-1"
                    >
                        <X size={14} />
                    </button>
                </div>
            )})}
        </div>
    );
};

export default AlphaConcierge;
