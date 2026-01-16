'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export interface StickyHeaderProps {
  logo?: string;
  navItems?: Array<{ label: string; href: string }>;
  className?: string;
  children?: React.ReactNode;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  logo = 'Edgeloop',
  navItems = [
    { label: 'Picks', href: '/picks' },
    { label: 'Predictions', href: '/predictions-and-analysis' },
    { label: 'Backtest', href: '/backtest' },
  ],
  className = '',
  children,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'backdrop-blur-md bg-black/20 border-b border-white/10' : 'bg-transparent'
      } ${className}`}
      initial={{ y: 0 }}
      animate={{ y: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {children ? (
          children
        ) : (
          <>
            {/* Logo */}
            <Link
              href="/"
              className={`font-bold tracking-tight transition-all ${
                isScrolled ? 'text-lg' : 'text-2xl'
              } text-white hover:opacity-80`}
            >
              {logo}
            </Link>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <motion.div key={item.href} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Link
                    href={item.href}
                    className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
            >
              Launch
            </motion.button>
          </>
        )}
      </div>
    </motion.header>
  );
};

export default StickyHeader;
