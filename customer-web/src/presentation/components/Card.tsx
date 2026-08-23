import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className = '', onClick, selected = false }: CardProps) {
  const interactableClasses = onClick 
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md' 
    : '';
    
  const borderClasses = selected 
    ? 'ring-2 ring-primary border-transparent' 
    : 'border border-gray-100';

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-4 ${borderClasses} ${interactableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
