'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface DepthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  layers?: number
  elevated?: boolean
  interactive?: boolean
}

export function DepthCard({
  className,
  children,
  layers = 3,
  elevated = true,
  interactive = true,
  ...props
}: DepthCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const layerElements = Array.from({ length: layers }, (_, i) => {
    const offset = (i + 1) * 2
    const opacity = 0.1 - i * 0.02

    return (
      <div
        key={i}
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border/30 -z-10 transition-all duration-300',
          isHovered && interactive && 'scale-[0.98]'
        )}
        style={{
          transform: `translateY(${offset}px) translateX(${offset}px)`,
          opacity,
        }}
      />
    )
  })

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Background layers */}
      {layerElements}

      {/* Main card */}
      <div
        className={cn(
          'relative rounded-xl border border-border bg-card transition-all duration-300',
          elevated && 'shadow-2xl',
          interactive && isHovered && 'transform -translate-y-2 shadow-3xl scale-[1.02]'
        )}
      >
        {children}
      </div>
    </div>
  )
}
