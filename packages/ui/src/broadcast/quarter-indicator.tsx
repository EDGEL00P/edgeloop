'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface QuarterIndicatorProps {
  quarter: number
  totalQuarters?: number
  isOvertime?: boolean
  className?: string
}

export function QuarterIndicator({
  quarter,
  totalQuarters = 4,
  isOvertime = false,
  className,
}: QuarterIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: totalQuarters }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 w-4 rounded-full transition-colors',
            i < quarter ? 'bg-broadcast-red' : 'bg-muted'
          )}
        />
      ))}
      {isOvertime && (
        <div className="h-1.5 w-4 rounded-full bg-broadcast-gold animate-pulse" />
      )}
    </div>
  )
}

export interface GameClockProps {
  minutes: number
  seconds: number
  quarter: number
  isRunning?: boolean
  showQuarter?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function GameClock({
  minutes,
  seconds,
  quarter,
  isRunning = true,
  showQuarter = true,
  size = 'md',
  className,
}: GameClockProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showQuarter && (
        <span className="text-muted-foreground text-sm uppercase">
          Q{quarter}
        </span>
      )}
      <span
        className={cn(
          'font-mono font-bold tabular-nums',
          sizeClasses[size],
          isRunning && 'text-broadcast-red'
        )}
      >
        {formattedTime}
      </span>
    </div>
  )
}

export interface PossessionIndicatorProps {
  possession: 'home' | 'away' | null
  homeAbbr: string
  awayAbbr: string
  className?: string
}

export function PossessionIndicator({
  possession,
  homeAbbr,
  awayAbbr,
  className,
}: PossessionIndicatorProps) {
  if (!possession) return null

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="text-muted-foreground">Possession:</span>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-broadcast-gold animate-pulse" />
        <span className="font-semibold">
          {possession === 'home' ? homeAbbr : awayAbbr}
        </span>
      </div>
    </div>
  )
}
