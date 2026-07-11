
import React from 'react';
import { HeartHandshake, CheckCircle2 } from 'lucide-react';

interface PartnershipScoreProps {
  score: number; // 0-100
}

const PartnershipScore: React.FC<PartnershipScoreProps> = ({ score }) => {
  // Luxe Gradient Colors based on score
  let strokeColor = '#D4AF37'; // Gold default
  let glowColor = 'rgba(212, 175, 55, 0.2)';
  
  if (score >= 90) {
      strokeColor = '#059669'; // Emerald
      glowColor = 'rgba(5, 150, 105, 0.2)';
  } else if (score < 70) {
      strokeColor = '#BE123C'; // Rose
      glowColor = 'rgba(190, 18, 60, 0.2)';
  }

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-wealth-panel border border-wealth-border rounded-xl p-5 shadow-sm h-full flex items-center justify-between">
       <div>
           <div className="flex items-center gap-2 mb-1">
               <HeartHandshake size={16} className="text-wealth-text" />
               <h3 className="text-xs font-bold text-wealth-muted uppercase tracking-widest">Partnership<br/>Score</h3>
           </div>
           <div className="text-[10px] text-wealth-muted max-w-[80px] leading-tight mt-2">
               {score >= 90 ? 'Perfect Pact Alignment.' : 'Review settlements.'}
           </div>
       </div>

       <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="#F3F4F6"
                    strokeWidth="6"
                    fill="transparent"
                />
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-xl font-serif font-bold text-wealth-text">{score}</span>
            </div>
       </div>
    </div>
  );
};

export default PartnershipScore;
