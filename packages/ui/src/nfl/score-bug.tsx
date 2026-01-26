'use client'

import * as React from 'react'
import { cn } from '../utils'
import { PulsingDot } from '../3d/neumorphic'

export interface Team {
  abbr: string
  name: string
  score: number
  timeouts: number
}

export interface ScoreBugProps {
  home: Team
  away: Team
  quarter: number
  clock: string
  down?: number
  distance?: number
  yardLine?: number
  possession: 'home' | 'away'
  status?: 'scheduled' | 'live' | 'final' | 'halftime'
  variant?: 'default' | 'minimal' | 'broadcast'
  className?: string
}

export function ScoreBug({
  home,
  away,
  quarter,
  clock,
  down,
  distance,
  yardLine,
  possession,
  status = 'live',
  variant = 'broadcast',
  className,
}: ScoreBugProps) {
  const isBroadcast = variant === 'broadcast'
  const isLive = status === 'live'
  
  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden',
        isBroadcast
          ? 'bg-gradient-to-br from-[var(--team-primary)] to-[var(--team-secondary)] shadow-2xl'
          : 'bg-card border border-border shadow-xl',
        className
      )}
    >
      {/* Broadcast top stripe */}
      {isBroadcast && (
        <div className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      )}

      <div className="px-6 py-3">
        {/* Main score display */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={cn(
                  'text-2xl font-black tracking-tight',
                  isBroadcast ? 'text-white' : 'text-foreground'
                )}
              >
                {away.abbr}
              </div>
              {possession === 'away' && (
                <div className="absolute -right-3 top-0">
                  <div className="w-3 h-3 rounded-full bg-broadcast-gold animate-pulse" />
                </div>
              )}
            </div>
            <div className="flex-1 text-right">
              <div
                className={cn(
                  'text-5xl font-black tabular-nums',
                  isBroadcast ? 'text-white' : 'text-foreground'
                )}
              >
                {away.score}
              </div>
            </div>
          </div>

          {/* Center info */}
          <div
            className={cn(
              'flex flex-col items-center min-w-[120px] px-4 py-2 rounded-lg',
              isBroadcast ? 'bg-black/30' : 'bg-muted'
            )}
          >
            {isLive && <PulsingDot color="danger" size="sm" />}
            <div className={cn('text-xs font-bold uppercase', isBroadcast ? 'text-white/80' : 'text-muted-foreground')}>
              {status === 'halftime' ? 'Halftime' : `Q${quarter}`}
            </div>
            <div className={cn('text-2xl font-mono font-bold', isBroadcast ? 'text-white' : 'text-foreground')}>
              {clock}
            </div>
            {down && distance && (
              <div className={cn('text-xs font-semibold mt-1', isBroadcast ? 'text-white/90' : 'text-muted-foreground')}>
                {down}{getOrdinal(down)} & {distance}
              </div>
            )}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div
                className={cn(
                  'text-5xl font-black tabular-nums',
                  isBroadcast ? 'text-white' : 'text-foreground'
                )}
              >
                {home.score}
              </div>
            </div>
            <div className="relative">
              <div
                className={cn(
                  'text-2xl font-black tracking-tight',
                  isBroadcast ? 'text-white' : 'text-foreground'
                )}
              >
                {home.abbr}
              </div>
              {possession === 'home' && (
                <div className="absolute -left-3 top-0">
                  <div className="w-3 h-3 rounded-full bg-broadcast-gold animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Down & Distance bar */}
        {down && yardLine && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between text-xs">
              <div className={cn('font-semibold', isBroadcast ? 'text-white/80' : 'text-muted-foreground')}>
                {possession === 'home' ? home.abbr : away.abbr} {yardLine}
              </div>
              <div className={cn('font-mono', isBroadcast ? 'text-white/80' : 'text-muted-foreground')}>
                {down !== undefined && distance !== undefined && yardLine !== undefined
                  ? getDownDistanceText(down, distance, yardLine)
                  : null}
              </div>
            </div>
          </div>
        )}

        {/* Timeouts */}
        {isBroadcast && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-white/60">TO:</span>
              {Array.from({ length: away.timeouts }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/80" />
              ))}
              {Array.from({ length: 3 - away.timeouts }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 - home.timeouts }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
              ))}
              {Array.from({ length: home.timeouts }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/80" />
              ))}
              <span className="text-white/60">:OT</span>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast shine effect */}
      {isBroadcast && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      )}
    </div>
  )
}

function getOrdinal(n: number): string {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

function getDownDistanceText(down: number, distance: number, yardLine: number): string {
  if (distance >= 10) return `${down}${getOrdinal(down)} & ${distance}`
  if (distance === 0) return 'GOAL'
  return `${down}${getOrdinal(down)} & ${distance}`
}
