import React from 'react';
import { HeartHandshake } from 'lucide-react';
import { useStore } from '../state/store';
import EmptyState from '../ui/EmptyState';

const Together: React.FC = () => {
  const language = useStore(s => s.language);

  return (
    <EmptyState
      icon={HeartHandshake}
      title={language === 'ID' ? 'Segera Hadir' : 'Coming Soon'}
      subtitle={
        language === 'ID'
          ? 'Skor kemitraan, penyelesaian, dan simulasi merger akan hadir di sini.'
          : 'Partnership score, settlements, and the merger simulator will live here.'
      }
    />
  );
};

export default Together;
