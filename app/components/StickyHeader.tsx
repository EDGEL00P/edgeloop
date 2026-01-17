/**
 * edgeloop STICKY SPATIAL HEADER
 * Transparent header that transforms to glassmorphism on scroll
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Navigation } from './Navigation';

export function StickyHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{
        backgroundColor: scrolled
          ? 'hsl(220 18% 6% / 0.9)'
          : 'hsl(220 18% 6% / 0)',
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
        borderBottomColor: scrolled
          ? 'hsl(0 0% 100% / 0.1)'
          : 'hsl(0 0% 100% / 0)',
      }}
      transition={{ duration: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all"
    >
      <Navigation />
    </motion.header>
  );
}
