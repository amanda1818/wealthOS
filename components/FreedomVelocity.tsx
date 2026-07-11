
import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';

interface FreedomVelocityProps {
  freedomDays: number; // Current days of freedom purchased this month
  historicalData?: number[]; // [1.2, 1.5, 2.1, 1.8, 3.2]
}

const FreedomVelocity: React.FC<FreedomVelocityProps> = ({ freedomDays, historicalData = [1.5, 2.2, 1.8, 2.5, 2.9, 3.5, 4.1] }) => {
  // Transform array to object for Recharts
  const data = historicalData.map((val, idx) => ({ idx, val }));

  return (
    <div className="bg-wealth-panel border border-wealth-border rounded-xl p-5 relative overflow-hidden shadow-sm h-full flex flex-col justify-between">
      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-wealth-gold/10 rounded-md text-wealth-gold">
              <Clock size={16} />
           </div>
           <div>
               <h3 className="text-xs font-bold text-wealth-muted uppercase tracking-widest">Freedom Velocity</h3>
               <p className="text-[10px] text-emerald-600 font-bold">Time Acquired This Month</p>
           </div>
        </div>
        <div className="text-right">
             <div className="text-3xl font-serif font-bold text-wealth-text">+{freedomDays}</div>
             <div className="text-[10px] text-wealth-muted">Days</div>
        </div>
      </div>

      <div className="h-16 w-full -mb-2 mt-4 z-0 opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
                type="monotone" 
                dataKey="val" 
                stroke="#D4AF37" 
                strokeWidth={2} 
                fill="url(#velocityGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-2 z-10">
           <TrendingUp size={12} />
           <span>+12% vs Last Month</span>
      </div>
    </div>
  );
};

export default FreedomVelocity;
