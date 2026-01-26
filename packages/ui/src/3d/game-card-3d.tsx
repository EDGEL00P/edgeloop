'use client'

import * as React from 'react'
import { cn } from '../utils'
import { Badge } from '../primitives/badge'

export interface GameCard3DProps {
  homeTeam: {
    name: string
    logo?: string
    score?: number
    record?: string
  }
  awayTeam: {
    name: string
    logo?: string
    score?: number
    record?: string
  }
  gameTime: string
  status?: 'scheduled' | 'live' | 'final'
  odds?: {
    spread: string
    total: string
  }
  prediction?: {
    winner: 'home' | 'away'
    confidence: number
  }
  variant?: 'default' | 'premium' | 'live'
}

export function GameCard3D({
  homeTeam,
  awayTeam,
  gameTime,
  status = 'scheduled',
  odds,
  prediction,
  variant = 'default',
}: GameCard3DProps) {
  const [isFlipped, setIsFlipped] = React.useState(false)

  const variantStyles = {
    default: 'border-border bg-card',
    premium: 'border-broadcast-gold/50 bg-gradient-to-br from-broadcast-navy to-broadcast-steel',
    live: 'border-broadcast-red/50 bg-gradient-to-br from-broadcast-red/10 to-broadcast-darkRed/10',
  }

  const isPremium = variant === 'premium'
  const isLive = status === 'live'

  return (
    <div
      className="relative h-64 w-full perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          'relative h-full w-full transition-transform duration-700 transform-style-3d',
          isFlipped && 'rotate-y-180'
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl border backdrop-blur-md shadow-2xl backface-hidden',
            variantStyles[variant],
            isLive && 'animate-pulse-border'
          )}
        >
          <div className="h-full p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="text-xs text-muted-foreground">{gameTime}</div>
              <Badge variant={status === 'live' ? 'live' : status === 'final' ? 'final' : 'scheduled'}>
                {status.toUpperCase()}
              </Badge>
            </div>

            {/* Teams */}
            <div className="space-y-4">
              {/* Away Team */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  {awayTeam.logo && (
                    <div className="h-12 w-12 rounded-lg bg-team-away flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <img src={awayTeam.logo} alt={awayTeam.name} className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <div className={cn('font-bold text-lg', isPremium && 'text-broadcast-white')}>
                      {awayTeam.name}
                    </div>
                    {awayTeam.record && (
                      <div className="text-xs text-muted-foreground">{awayTeam.record}</div>
                    )}
                  </div>
                </div>
                {awayTeam.score !== undefined && (
                  <div className={cn('text-3xl font-bold', isPremium && 'text-broadcast-gold')}>
                    {awayTeam.score}
                  </div>
                )}
              </div>

              {/* VS Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-muted-foreground bg-card">VS</span>
                </div>
              </div>

              {/* Home Team */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  {homeTeam.logo && (
                    <div className="h-12 w-12 rounded-lg bg-team-home flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <img src={homeTeam.logo} alt={homeTeam.name} className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <div className={cn('font-bold text-lg', isPremium && 'text-broadcast-white')}>
                      {homeTeam.name}
                    </div>
                    {homeTeam.record && (
                      <div className="text-xs text-muted-foreground">{homeTeam.record}</div>
                    )}
                  </div>
                </div>
                {homeTeam.score !== undefined && (
                  <div className={cn('text-3xl font-bold', isPremium && 'text-broadcast-gold')}>
                    {homeTeam.score}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {odds && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Spread:</span>
                  <span className={cn('font-semibold', isPremium && 'text-broadcast-gold')}>
                    {odds.spread}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">O/U:</span>
                  <span className={cn('font-semibold', isPremium && 'text-broadcast-gold')}>
                    {odds.total}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Premium glow */}
          {isPremium && (
            <div className="absolute inset-0 bg-gradient-to-br from-broadcast-gold/10 via-transparent to-transparent rounded-xl pointer-events-none" />
          )}
        </div>

        {/* Back of card (Prediction details) */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl border backdrop-blur-md shadow-2xl backface-hidden rotate-y-180',
            'bg-gradient-to-br from-brand/20 to-accent/20 border-brand/30'
          )}
        >
          <div className="h-full p-6 flex flex-col justify-center items-center text-center space-y-4">
            {prediction ? (
              <>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">
                  AI Prediction
                </div>
                <div className="text-3xl font-bold">
                  {prediction.winner === 'home' ? homeTeam.name : awayTeam.name}
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="relative h-2 w-48 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full',
                        prediction.confidence > 60
                          ? 'bg-confidence-high'
                          : prediction.confidence > 40
                          ? 'bg-confidence-medium'
                          : 'bg-confidence-low'
                      )}
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                  <div className="text-2xl font-bold">{prediction.confidence}%</div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No prediction available</div>
            )}
          </div>
        </div>
      </div>

      {/* Click hint */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity">
        Click to flip
      </div>
    </div>
  )
}
