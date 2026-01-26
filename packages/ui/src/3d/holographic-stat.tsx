'use client'

import * as React from 'react'
import { cn } from '../utils'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

export interface HolographicStatProps {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  icon?: React.ReactNode
  variant?: 'default' | 'neon' | 'cyber' | 'broadcast'
  animate?: boolean
}

export function HolographicStat({
  label,
  value,
  trend,
  icon,
  variant = 'default',
  animate = true,
}: HolographicStatProps) {
  const variantClasses = {
    default: 'from-brand/20 to-accent/20 border-brand/30',
    neon: 'from-confidence-high/20 to-brand/20 border-confidence-high/40',
    cyber: 'from-broadcast-red/20 to-broadcast-gold/20 border-broadcast-gold/30',
    broadcast: 'from-broadcast-navy/40 to-broadcast-steel/40 border-broadcast-gold/40',
  }

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    neutral: <Activity className="h-4 w-4" />,
  }

  const trendColors = {
    up: 'text-confidence-high',
    down: 'text-confidence-low',
    neutral: 'text-confidence-medium',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-xl p-6',
        'bg-gradient-to-br',
        variantClasses[variant],
        animate && 'group hover:scale-105 transition-all duration-300'
      )}
    >
      {/* Animated scan line */}
      {animate && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-100%] group-hover:translate-y-[200%] transition-transform duration-1000 pointer-events-none" />
      )}

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-current opacity-30 rounded-tl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-current opacity-30 rounded-br-xl" />

      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {icon && <div className="text-muted-foreground opacity-50">{icon}</div>}
        </div>

        {/* Value */}
        <div className="flex items-end gap-3">
          <span
            className={cn(
              'text-4xl font-bold tracking-tight',
              'bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent'
            )}
          >
            {value}
          </span>

          {trend && (
            <div className={cn('flex items-center gap-1 mb-1', trendColors[trend.direction])}>
              {trendIcons[trend.direction]}
              <span className="text-sm font-semibold">{trend.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* Glow effect */}
      {animate && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand/0 via-brand/5 to-brand/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      )}
    </div>
  )
}

export interface NeonTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: 'brand' | 'success' | 'danger' | 'gold' | 'red'
  intensity?: 'low' | 'medium' | 'high'
}

export function NeonText({
  className,
  children,
  color = 'brand',
  intensity = 'medium',
  ...props
}: NeonTextProps) {
  const colorClasses = {
    brand: 'text-brand',
    success: 'text-confidence-high',
    danger: 'text-confidence-low',
    gold: 'text-broadcast-gold',
    red: 'text-broadcast-red',
  }

  const glowIntensity = {
    low: '[text-shadow:0_0_10px_currentColor]',
    medium: '[text-shadow:0_0_10px_currentColor,0_0_20px_currentColor]',
    high: '[text-shadow:0_0_10px_currentColor,0_0_20px_currentColor,0_0_30px_currentColor]',
  }

  return (
    <span
      className={cn(
        'font-bold animate-pulse',
        colorClasses[color],
        glowIntensity[intensity],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
