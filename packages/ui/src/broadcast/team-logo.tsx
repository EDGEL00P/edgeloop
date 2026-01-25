'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface TeamLogoProps {
  name: string
  abbreviation: string
  logoUrl?: string
  primaryColor: string
  secondaryColor?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'circle' | 'square' | 'shield'
  showName?: boolean
  className?: string
}

const sizeClasses = {
  xs: { container: 'h-6 w-6', text: 'text-[8px]', name: 'text-xs' },
  sm: { container: 'h-8 w-8', text: 'text-xs', name: 'text-sm' },
  md: { container: 'h-10 w-10', text: 'text-sm', name: 'text-base' },
  lg: { container: 'h-14 w-14', text: 'text-base', name: 'text-lg' },
  xl: { container: 'h-20 w-20', text: 'text-xl', name: 'text-xl' },
}

const variantClasses = {
  circle: 'rounded-full',
  square: 'rounded-lg',
  shield: 'rounded-t-lg rounded-b-2xl',
}

export function TeamLogo({
  name,
  abbreviation,
  logoUrl,
  primaryColor,
  secondaryColor,
  size = 'md',
  variant = 'circle',
  showName = false,
  className,
}: TeamLogoProps) {
  const [hasError, setHasError] = React.useState(false)
  const styles = sizeClasses[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center shrink-0 font-bold text-white',
          styles.container,
          variantClasses[variant]
        )}
        style={{
          backgroundColor: primaryColor,
          borderColor: secondaryColor,
          borderWidth: secondaryColor ? '2px' : undefined,
        }}
      >
        {logoUrl && !hasError ? (
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-contain p-1"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className={styles.text}>{abbreviation}</span>
        )}
      </div>
      {showName && (
        <span className={cn('font-medium', styles.name)}>{name}</span>
      )}
    </div>
  )
}

export interface TeamMatchupProps {
  homeTeam: {
    name: string
    abbreviation: string
    logoUrl?: string
    primaryColor: string
  }
  awayTeam: {
    name: string
    abbreviation: string
    logoUrl?: string
    primaryColor: string
  }
  size?: 'sm' | 'md' | 'lg'
  separator?: 'vs' | 'at' | '@'
  className?: string
}

export function TeamMatchup({
  homeTeam,
  awayTeam,
  size = 'md',
  separator = 'vs',
  className,
}: TeamMatchupProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <TeamLogo
        name={awayTeam.name}
        abbreviation={awayTeam.abbreviation}
        logoUrl={awayTeam.logoUrl}
        primaryColor={awayTeam.primaryColor}
        size={size}
      />
      <span className="text-muted-foreground text-sm font-medium uppercase">
        {separator}
      </span>
      <TeamLogo
        name={homeTeam.name}
        abbreviation={homeTeam.abbreviation}
        logoUrl={homeTeam.logoUrl}
        primaryColor={homeTeam.primaryColor}
        size={size}
      />
    </div>
  )
}
