'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'frosted' | 'translucent' | 'holographic'
  depth?: 'flat' | 'shallow' | 'medium' | 'deep'
  glow?: boolean
  hover3d?: boolean
}

export function GlassCard({
  className,
  children,
  variant = 'default',
  depth = 'medium',
  glow = false,
  hover3d = true,
  ...props
}: GlassCardProps) {
  const [rotateX, setRotateX] = React.useState(0)
  const [rotateY, setRotateY] = React.useState(0)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover3d || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateXValue = ((y - centerY) / centerY) * -10
    const rotateYValue = ((x - centerX) / centerX) * 10

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  const variantClasses = {
    default: 'bg-card/80 border-border/50',
    frosted: 'bg-gradient-to-br from-card/60 to-card/40 border-border/30',
    translucent: 'bg-card/40 border-white/10',
    holographic: 'bg-gradient-to-br from-broadcast-red/20 via-broadcast-gold/20 to-brand/20 border-broadcast-gold/30',
  }

  const depthClasses = {
    flat: 'shadow-none',
    shallow: 'shadow-lg',
    medium: 'shadow-xl shadow-black/20',
    deep: 'shadow-2xl shadow-black/40',
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-xl border backdrop-blur-xl transition-all duration-300',
        variantClasses[variant],
        depthClasses[depth],
        glow && 'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-brand/20 before:to-transparent before:blur-xl before:-z-10',
        hover3d && 'transform-gpu preserve-3d hover:scale-[1.02]',
        className
      )}
      style={
        hover3d
          ? {
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            }
          : undefined
      }
      {...props}
    >
      {/* Shine effect overlay */}
      {variant === 'holographic' && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Inner glow border */}
      {glow && (
        <div className="absolute inset-0 rounded-xl border border-brand/30 pointer-events-none" />
      )}
    </div>
  )
}

export interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCardHeader({ className, children, ...props }: GlassCardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  )
}

export interface GlassCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function GlassCardTitle({ className, children, ...props }: GlassCardTitleProps) {
  return (
    <h3
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export interface GlassCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function GlassCardDescription({ className, children, ...props }: GlassCardDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}

export interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCardContent({ className, children, ...props }: GlassCardContentProps) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export interface GlassCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCardFooter({ className, children, ...props }: GlassCardFooterProps) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
}
