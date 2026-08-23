import React from 'react';

interface IconBadgeProps {
  icon: string | React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'danger';
  size?: 'md' | 'lg' | 'xl';
  pulse?: boolean;
}

export function IconBadge({ icon, variant = 'secondary', size = 'lg', pulse = false }: IconBadgeProps) {
  const sizeClasses = {
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl'
  };

  const variantClasses = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-primary',
    accent: 'bg-accent/20 text-accent',
    success: 'bg-green-100 text-green-500',
    danger: 'bg-red-100 text-red-500'
  };

  const animationClass = pulse ? 'animate-bounce' : '';

  return (
    <div className={`rounded-full flex items-center justify-center mx-auto shadow-sm ${sizeClasses[size]} ${variantClasses[variant]} ${animationClass}`}>
      {typeof icon === 'string' ? <span>{icon}</span> : icon}
    </div>
  );
}
