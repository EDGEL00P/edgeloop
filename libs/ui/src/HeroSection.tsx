'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const HeroSection: React.FC<{
  title: string;
  subtitle: string;
  cta?: React.ReactNode;
}> = ({ title, subtitle, cta }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#071015] via-[#0d1620] to-[#1a1a1a]"
    >
      {/* Radial gradient background that follows cursor */}
      <motion.div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle 600px at ${50 + mousePos.x * 5}% ${50 + mousePos.y * 5}%, rgba(208, 0, 0, 0.15), transparent 80%)`,
        }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Animated title */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-white mb-6 font-headline tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            animate={{ x: mousePos.x }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="inline-block"
          >
            {title}
          </motion.span>
        </motion.h1>

        {/* Subtitle with gradient */}
        <motion.p
          className="text-lg md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {subtitle}
        </motion.p>

        {/* CTA buttons */}
        {cta && (
          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {cta}
          </motion.div>
        )}
      </motion.div>

      {/* Decorative floating elements */}
      <motion.div
        className="absolute top-1/4 left-10 w-72 h-72 bg-[hsl(0_100%_50%/0.1)] rounded-full blur-3xl pointer-events-none"
        animate={{
          y: [0, 20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-10 w-72 h-72 bg-[hsl(185_100%_50%/0.1)] rounded-full blur-3xl pointer-events-none"
        animate={{
          y: [0, -20, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default HeroSection;
