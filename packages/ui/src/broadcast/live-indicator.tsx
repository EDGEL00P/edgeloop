'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface LiveIndicatorProps {
  isLive: boolean
  label?: string
  showPulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LiveIndicator({
  isLive,
  label,
  showPulse = true,
  size = 'md',
  className,
}: LiveIndicatorProps) {
  if (!isLive) return null

  const sizeClasses = {
    sm: {
      container: 'px-1.5 py-0.5 text-xs',
      dot: 'h-1.5 w-1.5',
    },
    md: {
      container: 'px-2 py-1 text-xs',
      dot: 'h-2 w-2',
    },
    lg: {
      container: 'px-3 py-1.5 text-sm',
      dot: 'h-2.5 w-2.5',
    },
  }

  const styles = sizeClasses[size]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-broadcast-red text-white font-semibold uppercase tracking-wider',
        styles.container,
        className
      )}
    >
      <span
        className={cn(
          'rounded-full bg-white',
          styles.dot,
          showPulse && 'animate-pulse'
        )}
      />
      <span>{label || 'LIVE'}</span>
    </div>
  )
}

export interface StatusIndicatorProps {
  status: 'live' | 'upcoming' | 'final' | 'delayed' | 'postponed'
  showTime?: string
  className?: string
}

export function StatusIndicator({
  status,
  showTime,
  className,
}: StatusIndicatorProps) {
  const statusConfig = {
    live: {
      bg: 'bg-broadcast-red',
      text: 'text-white',
      label: 'LIVE',
      pulse: true,
    },
    upcoming: {
      bg: 'bg-broadcast-steel',
      text: 'text-white',
      label: showTime || 'UPCOMING',
      pulse: false,
    },
    final: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      label: 'FINAL',
      pulse: false,
    },
    delayed: {
      bg: 'bg-confidence-medium',
      text: 'text-black',
      label: 'DELAYED',
      pulse: true,
    },
    postponed: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      label: 'POSTPONED',
      pulse: false,
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider',
        config.bg,
        config.text,
        className
      )}
    >
      {config.pulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      <span>{config.label}</span>
    </div>
  )
}
