/**
 * 3D BUTTON COMPONENT
 * ESPN-style 3D button with depth and shadows
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Button3DProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'critical';
  className?: string;
  disabled?: boolean;
}

export function Button3D({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '',
  disabled = false 
}: Button3DProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-[#CC0000] to-[#990000] text-white',
    secondary: 'bg-gradient-to-br from-[#2C2F33] to-[#1A1D21] text-[#F0F0F0] border-[#00F5FF]/30',
    critical: 'bg-gradient-to-br from-[#FF4D00] to-[#CC0000] text-white',
  };

  return (
    <motion.button
      whileHover={!disabled ? { y: -2, scale: 1.02 } : {}}
      whileTap={!disabled ? { y: 0, scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        btn-3d
        ${variantStyles[variant]}
        px-6 py-3
        font-bold uppercase tracking-widest text-sm
        rounded-lg
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <span className="relative z-10" style={{ transform: 'translateZ(5px)' }}>
        {children}
      </span>
      
      {/* 3D Shine Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />
    </motion.button>
  );
}
