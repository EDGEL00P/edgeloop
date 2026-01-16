import React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline' | 'secondary';
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-white/5 text-white/90',
    outline: 'border border-white/10 text-white/90 bg-transparent',
    secondary: 'bg-white/10 text-white/80',
  };

  return (
    <span {...props} className={`${variants[variant]} inline-block px-2 py-0.5 rounded-full text-xs ${props.className ?? ''}`}>
      {children}
    </span>
  );
};

export default Badge;
