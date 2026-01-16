/**
 * REACTOR CARD - V3 Design System
 * Fuses V2 Magnetic Hover with Tactical Glass
 * State-based color system (Cyan/Toxic Orange)
 */

'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ReactorCardProps {
  intensity?: 'low' | 'med' | 'critical';
  children: React.ReactNode;
  className?: string;
  onHover?: () => void;
  onClick?: () => void;
}

export function ReactorCard({
  intensity = 'low',
  children,
  className = '',
  onHover,
  onClick,
}: ReactorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Magnetic hover effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Magnetic pull: moves slightly towards cursor (3-5px max)
    setPosition({
      x: Math.max(-5, Math.min(5, x * 0.1)),
      y: Math.max(-5, Math.min(5, y * 0.1)),
    });

    if (!isHovered) {
      setIsHovered(true);
      onHover?.();
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // State-based styling
  const getStateStyles = () => {
    switch (intensity) {
      case 'critical':
        return {
          borderColor: 'border-[#FF4D00]',
          glow: 'shadow-[0_0_30px_rgba(255,77,0,0.4)]',
          pulse: 'animate-pulse-toxic',
          zLift: 'translate-y-[-8px]',
        };
      case 'med':
        return {
          borderColor: 'border-[#00F5FF]/30',
          glow: 'shadow-[0_0_20px_rgba(0,245,255,0.2)]',
          pulse: 'animate-pulse-cyan',
          zLift: 'translate-y-[-4px]',
        };
      default:
        return {
          borderColor: 'border-[#2C2F33]', // Gunmetal Steel
          glow: 'shadow-[0_0_15px_rgba(0,245,255,0.1)]',
          pulse: '',
          zLift: '',
        };
    }
  };

  const styles = getStateStyles();

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        x: position.x,
        y: position.y,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
      className={`
        relative group rounded-xl
        bg-[#152B47]/80 backdrop-blur-xl
        border-2 ${styles.borderColor}
        ${styles.glow}
        ${intensity === 'critical' ? styles.zLift : ''}
        transition-all duration-300
        text-[#F0F0F0]
        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9),0_0_20px_rgba(0,245,255,0.1)]
        hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.95),0_0_40px_rgba(0,245,255,0.2),0_0_20px_rgba(255,77,0,0.1)]
        hover:border-[#00F5FF]/50
        ${className}
      `}
    >
      {/* Conductive Circuit Border (Electric Cyan) - MORE VISIBLE */}
      <div
        className={`
          absolute inset-0 rounded-xl
          opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          overflow-hidden
          ${intensity === 'critical' ? 'opacity-100' : ''}
        `}
      >
        <div
          className={`
            absolute inset-[-50%]
            bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_60%,${
              intensity === 'critical' ? '#FF4D00' : '#00F5FF'
            }_100%)]
            animate-spin-slow
            opacity-60
          `}
        />
        {/* Additional glow layer */}
        <div
          className={`
            absolute inset-0 rounded-xl
            bg-gradient-to-r from-transparent via-${
              intensity === 'critical' ? '[#FF4D00]' : '[#00F5FF]'
            }/20 to-transparent
            animate-pulse
          `}
        />
      </div>

      {/* Tactical Grain Overlay */}
      <div
        className="absolute inset-0 rounded-xl opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Fresnel Edge Effect */}
      <div
        className={`
          absolute inset-0 rounded-xl
          pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        `}
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(0, 245, 255, 0.1) 0%,
              transparent 20%,
              transparent 80%,
              rgba(0, 245, 255, 0.1) 100%
            )
          `,
          maskImage: 'radial-gradient(ellipse at center, transparent 30%, black 70%)',
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 p-6 h-full flex flex-col">{children}</div>
    </motion.div>
  );
}
