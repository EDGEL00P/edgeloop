/**
 * GLOW EFFECT COMPONENT
 * Adds dramatic glowing effects to elements
 */

'use client';

import { ReactNode } from 'react';

interface GlowEffectProps {
  children: ReactNode;
  color?: 'cyan' | 'toxic' | 'white';
  intensity?: 'low' | 'med' | 'high';
  className?: string;
}

export function GlowEffect({ 
  children, 
  color = 'cyan', 
  intensity = 'med',
  className = '' 
}: GlowEffectProps) {
  const colorClasses = {
    cyan: {
      low: 'shadow-[0_0_10px_rgba(0,245,255,0.3)]',
      med: 'shadow-[0_0_20px_rgba(0,245,255,0.5),0_0_40px_rgba(0,245,255,0.2)]',
      high: 'shadow-[0_0_30px_rgba(0,245,255,0.7),0_0_60px_rgba(0,245,255,0.4),0_0_90px_rgba(0,245,255,0.2)]',
    },
    toxic: {
      low: 'shadow-[0_0_10px_rgba(255,77,0,0.4)]',
      med: 'shadow-[0_0_20px_rgba(255,77,0,0.6),0_0_40px_rgba(255,77,0,0.3)]',
      high: 'shadow-[0_0_30px_rgba(255,77,0,0.8),0_0_60px_rgba(255,77,0,0.5),0_0_90px_rgba(255,77,0,0.3)]',
    },
    white: {
      low: 'shadow-[0_0_10px_rgba(240,240,240,0.2)]',
      med: 'shadow-[0_0_20px_rgba(240,240,240,0.3),0_0_40px_rgba(240,240,240,0.1)]',
      high: 'shadow-[0_0_30px_rgba(240,240,240,0.4),0_0_60px_rgba(240,240,240,0.2)]',
    },
  };

  const glowClass = colorClasses[color][intensity];

  return (
    <div className={`${glowClass} transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}
