import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-3xl border border-sand-200 shadow-sm ${onClick ? 'cursor-pointer hover:border-sand-300 transition-colors' : ''} ${className}`}
  >
    {children}
  </div>
);

export default Card;
