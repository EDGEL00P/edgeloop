/**
 * Make the Play Button - Optimistic UI (React 19)
 * 
 * Flat, rectangular, no depth
 * ESPN never makes actions theatrical
 * Uses transitions for smooth updates
 */

'use client';

import { useTransition, useState } from 'react';
import { motion } from 'framer-motion';

interface OptimisticPlayButtonProps {
  onMakePlay: () => Promise<void>;
  disabled?: boolean;
}

export default function OptimisticPlayButton({
  onMakePlay,
  disabled = false,
}: OptimisticPlayButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useState<'idle' | 'playing' | 'success'>('idle');

  const handleClick = () => {
    setOptimisticState('playing');
    
    startTransition(async () => {
      try {
        await onMakePlay();
        setOptimisticState('success');
        setTimeout(() => setOptimisticState('idle'), 2000);
      } catch (error) {
        setOptimisticState('idle');
      }
    });
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isPending}
      className="px-8 py-3 bg-white text-black font-bold text-sm uppercase tracking-wider border-none cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={!disabled && !isPending ? { opacity: 0.9 } : {}}
      whileTap={!disabled && !isPending ? { scale: 0.98 } : {}}
    >
      {optimisticState === 'playing' && 'PROCESSING...'}
      {optimisticState === 'success' && 'PLAY MADE'}
      {optimisticState === 'idle' && 'MAKE THE PLAY'}
    </motion.button>
  );
}
