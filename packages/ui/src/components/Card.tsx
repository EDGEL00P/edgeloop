import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'bordered';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg p-6 transition-all duration-200',
        {
          'bg-[#252B3D] border border-[#2D3548]': variant === 'default',
          'bg-gradient-to-br from-[#252B3D] to-[#1A1F2E] border border-[#4D5568]': variant === 'highlighted',
          'bg-[#1A1F2E] border-2 border-[#0066FF]': variant === 'bordered',
        },
        className
      )}
    >
      {children}
    </div>
  );
}
