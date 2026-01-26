'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'raised' | 'pressed' | 'flat'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}

export function NeumorphicButton({
  className,
  children,
  variant = 'raised',
  size = 'md',
  active = false,
  ...props
}: NeumorphicButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantClasses = {
    raised: active
      ? 'shadow-[inset_5px_5px_10px_rgba(0,0,0,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.05)]'
      : 'shadow-[5px_5px_10px_rgba(0,0,0,0.3),-5px_-5px_10px_rgba(255,255,255,0.05)]',
    pressed: 'shadow-[inset_5px_5px_10px_rgba(0,0,0,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.05)]',
    flat: 'shadow-none border border-border/50',
  }

  return (
    <button
      className={cn(
        'rounded-xl font-semibold transition-all duration-200',
        'bg-card text-foreground',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-brand/50',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export interface GlowingBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: 'brand' | 'success' | 'danger' | 'gold'
  thickness?: number
  animated?: boolean
}

export function GlowingBorder({
  className,
  children,
  color = 'brand',
  thickness = 2,
  animated = true,
  ...props
}: GlowingBorderProps) {
  const colorClasses = {
    brand: 'from-brand to-accent',
    success: 'from-confidence-high to-confidence-high/50',
    danger: 'from-confidence-low to-confidence-low/50',
    gold: 'from-broadcast-gold to-broadcast-gold/50',
  }

  return (
    <div className={cn('relative', className)} {...props}>
      {/* Glowing border */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-r blur-sm',
          colorClasses[color],
          animated && 'animate-pulse'
        )}
        style={{ padding: `${thickness}px` }}
      />

      {/* Content */}
      <div className="relative bg-card rounded-xl">{children}</div>
    </div>
  )
}

export interface PulsingDotProps {
  color?: 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

export function PulsingDot({ color = 'success', size = 'md' }: PulsingDotProps) {
  const colorClasses = {
    success: 'bg-confidence-high',
    danger: 'bg-confidence-low',
    warning: 'bg-confidence-medium',
    info: 'bg-brand',
  }

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
          colorClasses[color]
        )}
      />
      <span className={cn('relative inline-flex rounded-full', sizeClasses[size], colorClasses[color])} />
    </span>
  )
}
