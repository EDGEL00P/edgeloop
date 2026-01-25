'use client'

import * as React from 'react'
import { cn, getConfidenceTier, formatPercentage } from '../utils'

export interface ConfidenceGaugeProps {
  confidence: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ConfidenceGauge({
  confidence,
  label,
  size = 'md',
  showLabel = true,
  className,
}: ConfidenceGaugeProps) {
  const tier = getConfidenceTier(confidence)

  const tierColors = {
    high: {
      bg: 'bg-confidence-high/20',
      fill: 'bg-confidence-high',
      text: 'text-confidence-high',
      ring: 'ring-confidence-high/30',
    },
    medium: {
      bg: 'bg-confidence-medium/20',
      fill: 'bg-confidence-medium',
      text: 'text-confidence-medium',
      ring: 'ring-confidence-medium/30',
    },
    low: {
      bg: 'bg-confidence-low/20',
      fill: 'bg-confidence-low',
      text: 'text-confidence-low',
      ring: 'ring-confidence-low/30',
    },
  }

  const sizeStyles = {
    sm: {
      container: 'h-1.5',
      text: 'text-sm',
      value: 'text-lg',
    },
    md: {
      container: 'h-2',
      text: 'text-base',
      value: 'text-2xl',
    },
    lg: {
      container: 'h-3',
      text: 'text-lg',
      value: 'text-4xl',
    },
  }

  const colors = tierColors[tier]
  const styles = sizeStyles[size]

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn('text-muted-foreground', styles.text)}>
            {label || 'Confidence'}
          </span>
          <span className={cn('font-bold tabular-nums', styles.value, colors.text)}>
            {formatPercentage(confidence, 0)}
          </span>
        </div>
      )}

      <div
        className={cn(
          'w-full rounded-full overflow-hidden ring-1',
          styles.container,
          colors.bg,
          colors.ring
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colors.fill)}
          style={{ width: formatPercentage(confidence, 0) }}
        />
      </div>

      {!showLabel && (
        <div className={cn('text-center font-bold tabular-nums', styles.value, colors.text)}>
          {formatPercentage(confidence, 0)}
        </div>
      )}
    </div>
  )
}
