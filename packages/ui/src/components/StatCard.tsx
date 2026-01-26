import React from 'react';
import { clsx } from 'clsx';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ 
  label, 
  value, 
  change, 
  changeDirection = 'neutral',
  icon,
  className 
}: StatCardProps) {
  return (
    <div
      className={clsx(
        'bg-[#252B3D] border border-[#2D3548] rounded-lg p-4 transition-all duration-200 hover:border-[#3D4558]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#718096] text-sm font-medium">{label}</p>
          <p className="text-white text-2xl font-bold mt-2">{value}</p>
          {change && (
            <p
              className={clsx('text-sm font-medium mt-1', {
                'text-[#00FF88]': changeDirection === 'up',
                'text-[#FF4757]': changeDirection === 'down',
                'text-[#718096]': changeDirection === 'neutral',
              })}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-[#718096] ml-2">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
