import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center text-center py-16 px-6">
    <div className="p-3 bg-sand-100 rounded-2xl mb-4 text-sand-500">
      <Icon size={22} />
    </div>
    <h3 className="font-serif font-bold text-lg text-sand-900 mb-1">{title}</h3>
    {subtitle && <p className="text-xs text-sand-500 max-w-xs leading-relaxed">{subtitle}</p>}
  </div>
);

export default EmptyState;
