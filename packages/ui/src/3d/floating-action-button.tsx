'use client'

import * as React from 'react'
import { cn } from '../utils'
import { Slot } from '@radix-ui/react-slot'

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'broadcast'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  asChild?: boolean
  pulse?: boolean
}

export function FloatingActionButton({
  className,
  variant = 'primary',
  size = 'lg',
  position = 'bottom-right',
  asChild = false,
  pulse = false,
  children,
  ...props
}: FloatingActionButtonProps) {
  const Comp = asChild ? Slot : 'button'

  const variantClasses = {
    primary: 'bg-gradient-to-br from-brand to-brand/80 hover:from-brand/90 hover:to-brand/70 shadow-brand/50',
    secondary: 'bg-gradient-to-br from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-secondary/50',
    success: 'bg-gradient-to-br from-confidence-high to-confidence-high/80 hover:from-confidence-high/90 hover:to-confidence-high/70 shadow-confidence-high/50',
    danger: 'bg-gradient-to-br from-confidence-low to-confidence-low/80 hover:from-confidence-low/90 hover:to-confidence-low/70 shadow-confidence-low/50',
    broadcast: 'bg-gradient-to-br from-broadcast-red to-broadcast-darkRed hover:from-broadcast-red/90 hover:to-broadcast-darkRed/90 shadow-broadcast-red/50',
  }

  const sizeClasses = {
    sm: 'h-12 w-12 text-sm',
    md: 'h-14 w-14 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-xl',
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  }

  return (
    <Comp
      className={cn(
        'rounded-full text-white shadow-2xl transition-all duration-300',
        'transform hover:scale-110 active:scale-95',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-4 focus:ring-brand/30',
        'backdrop-blur-sm',
        variantClasses[variant],
        sizeClasses[size],
        positionClasses[position],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {children}
      
      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Glow effect */}
      <span className="absolute inset-0 rounded-full blur-xl opacity-50 -z-10" />
    </Comp>
  )
}
