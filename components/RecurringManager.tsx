import React, { useState } from 'react';
import { RecurringObligation, Pocket } from '../types';
import { getPocketName } from './PocketCard';
import { Calendar, Repeat, Plus, Trash, CheckCircle2 } from 'lucide-react';

interface RecurringManagerProps {
  recurringObligations: RecurringObligation[];
  pockets: Record<string, Pocket>;
  language?: 'EN' | 'ID';
  // onAdd: (obl: Omit<RecurringObligation, 'id'>) => void;
  // onDelete: (id: string) => void;
}

const RecurringManager: React.FC<RecurringManagerProps> = ({ 
  recurringObligations, 
  pockets,
  language = 'EN'
}) => {
  const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);

  return (
    <div className="bg-white rounded-3xl border border-[#E2D9C8]/80 overflow-hidden shadow-sm p-5 space-y-4 relative">
      <div className="absolute top-0 right-0 p-12 bg-blue-50/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
      
      <div className="flex justify-between items-center pb-2 border-b border-[#E2D9C8]/40 relative z-10">
        <div>
          <h3 className="font-serif font-black text-sand-950 flex items-center gap-2">
            <Repeat size={16} className="text-blue-800" />
            {language === 'ID' ? 'Manajer Tagihan Rutin' : 'Recurring Obligations'}
          </h3>
          <p className="text-[10px] text-sand-500 font-mono tracking-widest uppercase font-semibold mt-1">
            {language === 'ID' ? 'Otomatisasi Potongan Bulanan' : 'Automated Monthly Deductions'}
          </p>
        </div>
        <button className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-widest font-bold uppercase transition-colors">
          <Plus size={12} />
          {language === 'ID' ? 'Tambah' : 'New'}
        </button>
      </div>

      <div className="space-y-3 relative z-10">
        {recurringObligations.map(obl => {
          const pocket = Object.values(pockets).find(p => p.id === obl.pocket);
          const pocketName = pocket ? getPocketName({ id: pocket.id, name: pocket.name }, language) : 'Unknown Pocket';
          
          return (
            <div key={obl.id} className="flex justify-between items-center p-3 rounded-xl border border-stone-200/60 bg-stone-50/30 hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex flex-col items-center justify-center text-blue-900 leading-none">
                  <span className="text-[9px] font-mono uppercase font-bold">{language === 'ID' ? 'Tgl' : 'Day'}</span>
                  <span className="font-serif font-black text-sm">{obl.dueDate}</span>
                </div>
                <div>
                  <div className="font-serif font-black text-sm text-stone-900">{obl.name}</div>
                  <div className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest mt-0.5">
                    {pocketName} • {obl.category}
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="font-mono text-[11px] font-black text-rose-800">
                    Rp {formatIDR(obl.amount)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[8px] text-emerald-600 font-semibold mt-0.5">
                    <CheckCircle2 size={9} />
                    {language === 'ID' ? 'Otomatis (Aktif)' : 'Auto Deduct'}
                  </div>
                </div>
                <button className="text-stone-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                  <Trash size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {recurringObligations.length === 0 && (
           <div className="text-center py-6 text-[10px] uppercase tracking-widest font-mono text-sand-400 font-bold">
              {language === 'ID' ? 'Tidak ada tagihan otomtis' : 'No recurring obligations'}
           </div>
        )}
      </div>
    </div>
  );
};

export default RecurringManager;
