/**
 * edgeloop BENTO GRID
 * Modern card layout with glassmorphism and hover effects
 */

'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BentoCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  size?: 'small' | 'medium' | 'large';
  href?: string;
}

interface BentoGridProps {
  cards: BentoCard[];
  className?: string;
}

export function BentoGrid({ cards, className }: BentoGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        const sizeClasses = {
          small: 'md:col-span-1',
          medium: 'md:col-span-2',
          large: 'md:col-span-2 lg:col-span-3',
        };

        const content = (
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'card-edgeloop p-6 relative overflow-hidden group cursor-pointer',
              sizeClasses[card.size || 'small']
            )}
          >
            {/* Gradient Background */}
            <div
              className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500',
                card.gradient
              )}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    'p-3 rounded-xl backdrop-blur-sm border border-white/10',
                    card.gradient,
                    'opacity-80 group-hover:opacity-100 transition-opacity'
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[hsl(185_100%_60%)] transition-colors">
                {card.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                {card.description}
              </p>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-[hsl(185_100%_50%_/_0.3)] transition-all duration-300 pointer-events-none" />
            </div>
          </motion.div>
        );

        if (card.href) {
          return (
            <a key={card.id} href={card.href} className="block">
              {content}
            </a>
          );
        }

        return <div key={card.id}>{content}</div>;
      })}
    </motion.div>
  );
}
