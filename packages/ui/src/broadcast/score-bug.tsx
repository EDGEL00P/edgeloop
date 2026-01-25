'use client'

import * as React from 'react'
import { cn, formatScore, formatGameTime } from '../utils'

import type { Team } from '../types'

export interface ScoreBugProps {
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
  quarter: number
  timeRemaining: number
  status: 'scheduled' | 'live' | 'final'
  possession?: 'home' | 'away'
  className?: string
}

export function ScoreBug({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  quarter,
  timeRemaining,
  status,
  possession,
  className,
}: ScoreBugProps) {
  return (
    <div
      className={cn(
        'inline-flex items-stretch bg-broadcast-navy/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-2xl border border-broadcast-steel/20',
        className
      )}
    >
      {/* Away Team */}
      <div className="flex items-center gap-3 px-4 py-2 min-w-[140px]">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: awayTeam.primaryColor }}
        >
          {awayTeam.abbreviation}
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            {awayTeam.abbreviation}
          </div>
          <div className="text-2xl font-bold tabular-nums">{formatScore(awayScore)}</div>
        </div>
        {possession === 'away' && (
          <div className="w-2 h-2 rounded-full bg-broadcast-gold animate-pulse" />
        )}
      </div>

      {/* Divider & Game Info */}
      <div className="flex flex-col items-center justify-center px-4 py-2 bg-broadcast-slate/50 min-w-[80px]">
        {status === 'live' && (
          <>
            <div className="text-xs font-semibold text-broadcast-red uppercase tracking-wider">
              LIVE
            </div>
            <div className="text-sm font-mono text-broadcast-white">
              {formatGameTime(timeRemaining, quarter)}
            </div>
          </>
        )}
        {status === 'final' && (
          <div className="text-sm font-semibold text-muted-foreground uppercase">FINAL</div>
        )}
        {status === 'scheduled' && (
          <div className="text-sm font-semibold text-muted-foreground uppercase">UPCOMING</div>
        )}
      </div>

      {/* Home Team */}
      <div className="flex items-center gap-3 px-4 py-2 min-w-[140px]">
        {possession === 'home' && (
          <div className="w-2 h-2 rounded-full bg-broadcast-gold animate-pulse" />
        )}
        <div className="flex-1 text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            {homeTeam.abbreviation}
          </div>
          <div className="text-2xl font-bold tabular-nums">{formatScore(homeScore)}</div>
        </div>
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: homeTeam.primaryColor }}
        >
          {homeTeam.abbreviation}
        </div>
      </div>
    </div>
  )
}
