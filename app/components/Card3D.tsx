/**
 * 3D CARD COMPONENT
 * Professional 3D card with depth, shadows, and ESPN styling
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: 'low' | 'med' | 'critical';
  onClick?: () => void;
}

export function Card3D({ children, className = '', intensity = 'low', onClick }: Card3DProps) {
  const intensityStyles = {
    low: 'border-white/10',
    med: 'border-[#00F5FF]/30',
    critical: 'border-[#FF4D00]/50',
  };

  const intensityGlow = {
    low: 'shadow-[0_0_20px_rgba(0,245,255,0.1)]',
    med: 'shadow-[0_0_30px_rgba(0,245,255,0.2)]',
    critical: 'shadow-[0_0_40px_rgba(255,77,0,0.4)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ 
        y: -8, 
        rotateX: 2,
        rotateY: 2,
        transition: { duration: 0.3 }
      }}
      className={`
        card-3d
        ${intensityStyles[intensity]}
        ${intensityGlow[intensity]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* 3D Depth Indicator */}
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#00F5FF] opacity-50 animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>

      {/* 3D Edge Highlight */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(
            135deg,
            rgba(0, 245, 255, 0.1) 0%,
            transparent 30%,
            transparent 70%,
            rgba(255, 77, 0, 0.05) 100%
          )`,
        }}
      />
    </motion.div>
  );
}
