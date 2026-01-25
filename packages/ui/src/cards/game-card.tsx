'use client'

import * as React from 'react'
import { cn, formatScore, formatGameTime, getConfidenceTier } from '../utils'
import { Badge } from '../primitives/badge'
import { ArrowRight } from 'lucide-react'

import type { Team } from '../types'

export interface GameCardProps {
  id: string
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
  quarter: number
  timeRemaining: number
  status: 'scheduled' | 'live' | 'final'
  prediction?: {
    predictedWinner: 'home' | 'away'
    confidence: number
  }
  startTime?: string
  onClick?: () => void
  className?: string
}

export function GameCard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  quarter,
  timeRemaining,
  status,
  prediction,
  startTime,
  onClick,
  className,
}: GameCardProps) {
  const statusBadge = {
    scheduled: { variant: 'scheduled' as const, label: 'Upcoming' },
    live: { variant: 'live' as const, label: 'LIVE' },
    final: { variant: 'final' as const, label: 'Final' },
  }

  return (
    <div
      className={cn(
        'group relative bg-card border border-border rounded-lg overflow-hidden transition-all hover:border-broadcast-red/50 hover:shadow-lg cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant={statusBadge[status].variant}>{statusBadge[status].label}</Badge>
      </div>

      {/* Game Time (for live games) */}
      {status === 'live' && (
        <div className="absolute top-3 left-3 z-10">
          <span className="text-xs font-mono text-muted-foreground">
            {formatGameTime(timeRemaining, quarter)}
          </span>
        </div>
      )}

      {/* Teams & Scores */}
      <div className="p-4 pt-10">
        <div className="space-y-3">
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: awayTeam.primaryColor }}
            >
              {awayTeam.abbreviation}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{awayTeam.name}</div>
              {prediction?.predictedWinner === 'away' && (
                <div className="flex items-center gap-1 text-xs text-broadcast-gold">
                  <span>Predicted</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatScore(awayScore)}</div>
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: homeTeam.primaryColor }}
            >
              {homeTeam.abbreviation}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{homeTeam.name}</div>
              {prediction?.predictedWinner === 'home' && (
                <div className="flex items-center gap-1 text-xs text-broadcast-gold">
                  <span>Predicted</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatScore(homeScore)}</div>
          </div>
        </div>
      </div>

      {/* Prediction Bar */}
      {prediction && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>AI Confidence</span>
            <span
              className={cn({
                'text-confidence-high': getConfidenceTier(prediction.confidence) === 'high',
                'text-confidence-medium': getConfidenceTier(prediction.confidence) === 'medium',
                'text-confidence-low': getConfidenceTier(prediction.confidence) === 'low',
              })}
            >
              {(prediction.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', {
                'bg-confidence-high': getConfidenceTier(prediction.confidence) === 'high',
                'bg-confidence-medium': getConfidenceTier(prediction.confidence) === 'medium',
                'bg-confidence-low': getConfidenceTier(prediction.confidence) === 'low',
              })}
              style={{ width: `${prediction.confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* View Details Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-5 w-5 text-broadcast-red" />
      </div>
    </div>
  )
}
