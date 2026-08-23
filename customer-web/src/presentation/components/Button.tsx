import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = true, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'flex justify-center items-center px-4 py-3 rounded-lg font-bold text-[16px] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover border-transparent',
    secondary: 'bg-secondary text-primary hover:bg-gray-200 border-transparent',
    text: 'bg-transparent text-primary hover:text-primary-hover shadow-none uppercase text-sm tracking-wider'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
