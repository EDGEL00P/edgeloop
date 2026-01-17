/**
 * edgeloop HERO SECTION
 * 3D-feeling Hero with Bento Grid layout, radial gradient background, and staggered animations
 */

'use client';

import { useRef, useState, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Activity,
} from 'lucide-react';
import { BentoGrid } from './BentoGrid';
import { HoverGlowBorder } from './HoverGlowBorder';
import { cn } from '../../lib/utils';

const heroCards = [
  {
    id: 'edgeloop',
    title: 'edgeloop Engine',
    description: 'Advanced AI-powered prediction models with real-time analysis',
    icon: Brain,
    gradient: 'bg-gradient-to-br from-[hsl(185_100%_50%)] to-[hsl(270_80%_60%)]',
    size: 'large' as const,
    href: '/predictions-and-analysis',
  },
  {
    id: 'picks',
    title: 'Auto Picks',
    description: 'AI-generated betting recommendations with confidence scores',
    icon: Target,
    gradient: 'bg-gradient-to-br from-[hsl(348_100%_55%)] to-[hsl(348_100%_45%)]',
    size: 'medium' as const,
    href: '/picks',
  },
  {
    id: 'analytics',
    title: 'Live Analytics',
    description: 'Real-time game tracking and statistical insights',
    icon: Activity,
    gradient: 'bg-gradient-to-br from-[hsl(145_80%_50%)] to-[hsl(185_100%_50%)]',
    size: 'small' as const,
    href: '/live',
  },
  {
    id: 'trends',
    title: 'Market Trends',
    description: 'Line movement analysis and exploit detection',
    icon: TrendingUp,
    gradient: 'bg-gradient-to-br from-[hsl(45_100%_50%)] to-[hsl(348_100%_55%)]',
    size: 'small' as const,
    href: '/analytics-management',
  },
  {
    id: 'backtest',
    title: 'Backtest Engine',
    description: 'Historical performance validation and strategy testing',
    icon: BarChart3,
    gradient: 'bg-gradient-to-br from-[hsl(270_80%_60%)] to-[hsl(185_100%_50%)]',
    size: 'medium' as const,
    href: '/backtest',
  },
  {
    id: 'exploits',
    title: 'Exploit Signals',
    description: 'Detect market inefficiencies and value opportunities',
    icon: Zap,
    gradient: 'bg-gradient-to-br from-[hsl(348_100%_55%)] to-[hsl(45_100%_50%)]',
    size: 'small' as const,
    href: '/analytics-management',
  },
];

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Radial Gradient Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, hsl(185 100% 50% / 0.15) 0%, transparent 50%)`,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-20">
        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="text-gradient-espn bg-clip-text text-transparent bg-gradient-to-r from-[hsl(185_100%_60%)] via-[hsl(270_80%_70%)] to-[hsl(348_100%_65%)]">
              edgeloop
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Advanced NFL Analytics & Statistical Research Platform
          </p>
          <p className="text-sm md:text-base text-white/50 mt-4 max-w-2xl mx-auto">
            Professional-grade predictive modeling, real-time analysis, and exploit detection
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <BentoGrid cards={heroCards} />
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-16"
        >
          <HoverGlowBorder
            glowColor="hsl(185 100% 50%)"
            className="inline-block"
          >
            <motion.a
              href="/predictions-and-analysis"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[hsl(185_100%_50%)] to-[hsl(270_80%_60%)] text-white font-semibold text-lg shadow-lg shadow-[hsl(185_100%_50%_/_0.3)]"
            >
              <Brain className="w-5 h-5" />
              Explore edgeloop Engine
            </motion.a>
          </HoverGlowBorder>
        </motion.div>
      </div>

      {/* Ambient Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[hsl(185_100%_60%)] opacity-20"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
            }}
            animate={{
              y: [null, Math.random() * 100 + '%'],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
