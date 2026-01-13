'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/store';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showValue?: boolean;
  valuePosition?: 'inside' | 'outside';
  colorScheme?: 'default' | 'positive' | 'negative' | 'neutral';
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  barClassName,
  showValue = false,
  valuePosition = 'inside',
  colorScheme = 'default',
}: AnimatedProgressProps) {
  const { reduceMotion } = useSettings();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.01,
  });

  const width = useTransform(springValue, (v) => `${v}%`);

  useEffect(() => {
    if (reduceMotion) {
      springValue.set(percentage);
    } else {
      springValue.set(percentage);
    }
  }, [percentage, springValue, reduceMotion]);

  const getBarColor = () => {
    switch (colorScheme) {
      case 'positive':
        return 'bg-emerald-500';
      case 'negative':
        return 'bg-red-500';
      case 'neutral':
        return 'bg-amber-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full probability-bar",
            getBarColor(),
            barClassName
          )}
          style={{ width }}
        />
      </div>
      {showValue && valuePosition === 'outside' && (
        <motion.span
          initial={reduceMotion ? {} : { opacity: 0 }}
          animate={reduceMotion ? {} : { opacity: 1 }}
          className="absolute right-0 top-3 text-xs font-mono text-muted-foreground"
        >
          {value.toFixed(1)}%
        </motion.span>
      )}
    </div>
  );
}

interface ProbabilityBarProps {
  probability: number;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProbabilityBar({ 
  probability, 
  label, 
  showLabel = true,
  size = 'md' 
}: ProbabilityBarProps) {
  const { reduceMotion } = useSettings();
  
  const springValue = useSpring(0, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.01,
  });

  const width = useTransform(springValue, (v) => `${v}%`);

  useEffect(() => {
    springValue.set(probability);
  }, [probability, springValue]);

  const getColorClass = () => {
    if (probability >= 60) return 'bg-emerald-500 percentage-high';
    if (probability >= 40) return 'bg-amber-500 percentage-medium';
    return 'bg-red-500 percentage-low';
  };

  const getTextColorClass = () => {
    if (probability >= 60) return 'percentage-high';
    if (probability >= 40) return 'percentage-medium';
    return 'percentage-low';
  };

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          <motion.span
            key={probability}
            initial={reduceMotion ? {} : { scale: 1.1, opacity: 0.8 }}
            animate={reduceMotion ? {} : { scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn("text-xs font-mono font-semibold", getTextColorClass())}
          >
            {probability.toFixed(1)}%
          </motion.span>
        </div>
      )}
      <div className={cn("w-full bg-muted/30 rounded-full overflow-hidden", heightClass)}>
        <motion.div
          className={cn("h-full rounded-full", getColorClass())}
          style={{ width }}
        />
      </div>
    </div>
  );
}

interface OddsDisplayProps {
  odds: number;
  previousOdds?: number;
  format?: 'decimal' | 'american';
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedOdds({ 
  odds, 
  previousOdds, 
  format = 'decimal',
  size = 'md' 
}: OddsDisplayProps) {
  const { reduceMotion } = useSettings();
  const hasChanged = previousOdds !== undefined && previousOdds !== odds;
  const isIncrease = previousOdds !== undefined && odds > previousOdds;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <motion.span
      key={odds}
      initial={reduceMotion || !hasChanged ? {} : { 
        scale: 1.15, 
        backgroundColor: isIncrease ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)' 
      }}
      animate={{ 
        scale: 1, 
        backgroundColor: 'transparent' 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "odds-display inline-block px-1 rounded",
        sizeClasses[size],
        hasChanged && (isIncrease ? 'value-positive' : 'value-negative')
      )}
    >
      {format === 'decimal' ? odds.toFixed(2) : (odds > 0 ? `+${odds}` : odds)}
    </motion.span>
  );
}
