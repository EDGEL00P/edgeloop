/**
 * edgeloop SKELETON CARD
 * Staggered entrance animation for loading states
 */

'use client';

import { motion } from 'framer-motion';

interface SkeletonCardProps {
  delay?: number;
  className?: string;
}

export function SkeletonCard({ delay = 0, className = '' }: SkeletonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      className={`card-edgeloop p-6 space-y-4 ${className}`}
    >
      <div className="h-6 w-3/4 skeleton" />
      <div className="h-4 w-full skeleton" />
      <div className="h-4 w-5/6 skeleton" />
      <div className="h-20 w-full skeleton rounded-lg" />
    </motion.div>
  );
}
