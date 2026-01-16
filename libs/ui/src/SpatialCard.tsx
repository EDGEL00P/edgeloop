'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export interface SpatialCardProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export const SpatialCard: React.FC<SpatialCardProps> = ({
  title,
  subtitle,
  icon,
  accentColor = 'blue',
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const accentMap = {
    blue: 'from-blue-500 to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    red: 'from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    purple: 'from-purple-500 to-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.4)]',
    green: 'from-green-500 to-green-600 shadow-[0_0_20px_rgba(34,197,94,0.4)]',
  } as Record<string, string>;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
      } as any}
      className={`relative h-80 w-72 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-2xl cursor-pointer ${className}`}
    >
      <div
        style={{ transform: 'translateZ(50px)' } as any}
        className="absolute inset-4 flex flex-col justify-between p-6 border border-white/10 rounded-xl bg-white/5 backdrop-blur-md"
      >
        <div className="flex items-start justify-between">
          {icon && <div className="text-white/80">{icon}</div>}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tighter">{title}</h3>
          <p className="text-neutral-400 text-sm mt-2">{subtitle}</p>
          <div className={`mt-4 h-1 w-full bg-gradient-to-r ${accentMap[accentColor] || accentMap.blue}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default SpatialCard;
