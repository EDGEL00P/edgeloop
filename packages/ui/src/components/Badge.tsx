import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'value' | 'arbitrage' | 'middle' | 'line' | 'high' | 'medium' | 'low';
  className?: string;
}

export function Badge({ children, variant = 'value', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        {
          'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/30': variant === 'value' || variant === 'high',
          'bg-[#0066FF]/20 text-[#0066FF] border border-[#0066FF]/30': variant === 'arbitrage',
          'bg-[#B33FFF]/20 text-[#B33FFF] border border-[#B33FFF]/30': variant === 'middle',
          'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/30': variant === 'line' || variant === 'medium',
          'bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]/30': variant === 'low',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
