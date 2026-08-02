import React from 'react';

interface StatProps {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'positive' | 'negative';
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<StatProps['tone']>, string> = {
  default: 'text-sand-950',
  positive: 'text-[#06402B]',
  negative: 'text-rose-700',
};

const Stat: React.FC<StatProps> = ({ label, value, tone = 'default', className = '' }) => (
  <div className={className}>
    <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sand-500 mb-1">{label}</div>
    <div className={`text-xl font-serif font-bold ${TONE_CLASSES[tone]}`}>{value}</div>
  </div>
);

export default Stat;
