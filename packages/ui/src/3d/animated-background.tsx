'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface AnimatedGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'aurora' | 'mesh' | 'wave' | 'holographic' | 'neon'
  speed?: 'slow' | 'normal' | 'fast'
  opacity?: number
}

export function AnimatedGradient({
  className,
  variant = 'aurora',
  speed = 'normal',
  opacity = 0.3,
  ...props
}: AnimatedGradientProps) {
  const speedClass = {
    slow: 'animate-gradient-slow',
    normal: 'animate-gradient',
    fast: 'animate-gradient-fast',
  }

  const variantGradients = {
    aurora: 'bg-gradient-to-br from-brand via-accent to-broadcast-gold',
    mesh: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/40 via-accent/40 to-transparent',
    wave: 'bg-gradient-to-r from-brand via-broadcast-red to-broadcast-gold',
    holographic: 'bg-gradient-to-br from-broadcast-red/30 via-broadcast-gold/30 via-brand/30 to-accent/30',
    neon: 'bg-gradient-to-r from-confidence-high via-brand to-confidence-low',
  }

  return (
    <div
      className={cn(
        'absolute inset-0 -z-10 blur-3xl',
        variantGradients[variant],
        speedClass[speed],
        className
      )}
      style={{ opacity }}
      {...props}
    />
  )
}

export interface ParallaxContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  depth?: number
}

export function ParallaxContainer({
  className,
  children,
  depth = 20,
  ...props
}: ParallaxContainerProps) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height

    setOffset({ x: x * depth, y: y * depth })
  }

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
