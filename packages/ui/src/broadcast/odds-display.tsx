'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatOdds } from '../utils'

export interface OddsDisplayProps {
  odds: number
  previousOdds?: number
  format?: 'american' | 'decimal' | 'fractional'
  showTrend?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OddsDisplay({
  odds,
  previousOdds,
  format = 'american',
  showTrend = true,
  size = 'md',
  className,
}: OddsDisplayProps) {
  const formattedOdds = React.useMemo(() => {
    if (format === 'american') {
      return formatOdds(odds)
    }
    if (format === 'decimal') {
      // Convert American to Decimal
      if (odds > 0) {
        return (odds / 100 + 1).toFixed(2)
      }
      return (100 / Math.abs(odds) + 1).toFixed(2)
    }
    // Fractional
    if (odds > 0) {
      return `${odds}/100`
    }
    return `100/${Math.abs(odds)}`
  }, [odds, format])

  const trend = React.useMemo(() => {
    if (!previousOdds || !showTrend) return null
    if (odds > previousOdds) return 'up'
    if (odds < previousOdds) return 'down'
    return 'neutral'
  }, [odds, previousOdds, showTrend])

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const trendColors = {
    up: 'text-confidence-high',
    down: 'text-confidence-low',
    neutral: 'text-muted-foreground',
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <span
        className={cn(
          'font-mono font-semibold tabular-nums',
          sizeClasses[size],
          odds > 0 ? 'text-confidence-high' : 'text-foreground'
        )}
      >
        {formattedOdds}
      </span>
      {trend && (
        <span className={cn(trendColors[trend])}>
          {trend === 'up' && <TrendingUp className="h-3 w-3" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3" />}
          {trend === 'neutral' && <Minus className="h-3 w-3" />}
        </span>
      )}
    </div>
  )
}

export interface OddsComparisonProps {
  homeOdds: number
  awayOdds: number
  drawOdds?: number
  homeLabel?: string
  awayLabel?: string
  className?: string
}

export function OddsComparison({
  homeOdds,
  awayOdds,
  drawOdds,
  homeLabel = 'Home',
  awayLabel = 'Away',
  className,
}: OddsComparisonProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">{homeLabel}</div>
        <OddsDisplay odds={homeOdds} size="lg" />
      </div>
      {drawOdds && (
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Draw</div>
          <OddsDisplay odds={drawOdds} size="lg" />
        </div>
      )}
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">{awayLabel}</div>
        <OddsDisplay odds={awayOdds} size="lg" />
      </div>
    </div>
  )
}
