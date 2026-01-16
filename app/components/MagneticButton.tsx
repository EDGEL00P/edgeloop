/**
 * MAGNETIC BUTTON - edgeloop HUD
 * Primary action button with magnetic hover effect
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'toxic' | 'cyan' | 'gunmetal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function MagneticButton({
  children,
  onClick,
  variant = 'toxic',
  size = 'md',
  className = '',
  disabled = false,
}: MagneticButtonProps) {
  const variantClasses = {
    toxic: 'bg-[#FF4D00] text-[#080808] hover:bg-[#FF6B1A]',
    cyan: 'bg-[#00F5FF] text-[#080808] hover:bg-[#33F7FF]',
    gunmetal: 'bg-[#2C2F33] text-[#F0F0F0] hover:bg-[#3A3E43] border border-white/10',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        uppercase font-bold tracking-widest
        rounded-lg
        transition-all duration-200
        relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-[0_0_20px_rgba(255,77,0,0.4)]
        hover:shadow-[0_0_40px_rgba(255,77,0,0.6)]
        ${className}
      `}
      style={{
        boxShadow: variant === 'toxic' 
          ? '0 0 20px rgba(255, 77, 0, 0.4)' 
          : variant === 'cyan'
          ? '0 0 20px rgba(0, 245, 255, 0.4)'
          : '0 0 10px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
