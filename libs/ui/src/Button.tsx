import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'icon' | 'default';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'default', children, ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-[hsl(0_0%_10%)] text-white hover:brightness-105',
    secondary: 'bg-white/5 text-white/90 hover:bg-white/10',
    ghost: 'bg-transparent text-white/70 hover:text-white/90',
    outline: 'bg-transparent border border-white/10 text-white/90 hover:bg-white/5',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    default: 'px-3 py-2 text-sm',
    sm: 'px-2 py-1 text-sm',
    icon: 'p-2',
  };

  return (
    <button {...props} className={`${base} ${variants[variant]} ${sizes[size]} ${props.className ?? ''}`}>
      {children}
    </button>
  );
};

export default Button;
