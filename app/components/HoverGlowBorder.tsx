/**
 * edgeloop HOVER GLOW BORDER
 * Gradient border that follows mouse cursor
 */

'use client';

import { useRef, useState, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface HoverGlowBorderProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export function HoverGlowBorder({
  children,
  className,
  glowColor = 'hsl(185 100% 50%)',
  intensity = 0.3,
}: HoverGlowBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('relative', className)}
    >
      {/* Gradient Border Effect */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: isHovered
            ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}${Math.round(intensity * 255).toString(16)}, transparent 40%)`
            : 'transparent',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-xl border border-transparent pointer-events-none"
        style={{
          borderImageSource: isHovered
            ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent)`
            : 'none',
          borderImageSlice: 1,
          opacity: isHovered ? 0.5 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
}
