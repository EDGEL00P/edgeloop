'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface PlayClockProps {
  seconds: number
  isRunning?: boolean
  variant?: 'default' | 'warning' | 'critical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlayClock({
  seconds,
  isRunning = false,
  variant = 'default',
  size = 'md',
  className,
}: PlayClockProps) {
  const [time, setTime] = React.useState(seconds)

  React.useEffect(() => {
    setTime(seconds)
  }, [seconds])

  React.useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTime((t) => Math.max(0, t - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const determineVariant = (): 'default' | 'warning' | 'critical' => {
    if (variant !== 'default') return variant
    if (time <= 5) return 'critical'
    if (time <= 10) return 'warning'
    return 'default'
  }

  const currentVariant = determineVariant()

  const variantClasses = {
    default: 'border-muted-foreground text-foreground',
    warning: 'border-confidence-medium text-confidence-medium animate-pulse',
    critical: 'border-confidence-low text-confidence-low animate-pulse-border',
  }

  const sizeClasses = {
    sm: 'text-2xl w-16 h-16',
    md: 'text-4xl w-24 h-24',
    lg: 'text-6xl w-32 h-32',
  }

  return (
    <div
      className={cn(
        'relative rounded-full border-4 flex items-center justify-center font-mono font-black transition-all duration-200',
        'bg-card shadow-2xl',
        variantClasses[currentVariant],
        sizeClasses[size],
        isRunning && 'scale-105',
        className
      )}
    >
      <div className="absolute inset-0 rounded-full animate-shimmer opacity-20" />
      <span className="relative z-10 tabular-nums">{time}</span>
      
      {/* Glow effect for critical */}
      {currentVariant === 'critical' && (
        <div className="absolute inset-0 rounded-full bg-confidence-low blur-xl opacity-50 animate-pulse" />
      )}
    </div>
  )
}

export interface RedZonePulseProps {
  active?: boolean
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export function RedZonePulse({
  active = false,
  intensity = 'high',
  className,
}: RedZonePulseProps) {
  if (!active) return null

  const intensityClasses = {
    low: 'from-confidence-low/10 to-transparent',
    medium: 'from-confidence-low/20 to-transparent',
    high: 'from-confidence-low/30 to-transparent',
  }

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none z-50',
        className
      )}
    >
      {/* Pulsing overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-b animate-pulse',
          intensityClasses[intensity]
        )}
      />
      
      {/* Corner indicators */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-confidence-low rounded-tl-xl animate-pulse" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-confidence-low rounded-tr-xl animate-pulse" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-confidence-low rounded-bl-xl animate-pulse" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-confidence-low rounded-br-xl animate-pulse" />

      {/* RED ZONE label */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="px-6 py-2 rounded-full bg-confidence-low text-white font-black text-sm tracking-wider animate-pulse shadow-2xl">
          RED ZONE
        </div>
      </div>
    </div>
  )
}
