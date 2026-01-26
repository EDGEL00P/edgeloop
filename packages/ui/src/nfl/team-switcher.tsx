'use client'

import { useEffect, useState } from 'react'
import nflTeams from '@edgeloop/tokens/nfl-teams.json'

type TeamCode = keyof typeof nflTeams.teams

export function useTeamTheme() {
  const [team, setTeam] = useState<TeamCode | 'league'>('league')

  useEffect(() => {
    const stored = localStorage.getItem('nfl-team-theme') as TeamCode | 'league' | null
    if (stored) {
      setTeam(stored)
      applyTeamTheme(stored)
    }
  }, [])

  const applyTeamTheme = (teamCode: TeamCode | 'league') => {
    const root = document.documentElement
    
    if (teamCode === 'league') {
      const { primary, secondary, accent } = nflTeams.league.colors
      root.style.setProperty('--team-primary', primary)
      root.style.setProperty('--team-secondary', secondary)
      root.style.setProperty('--team-accent', accent)
      root.removeAttribute('data-nfl-team')
    } else {
      const teamData = nflTeams.teams[teamCode]
      if (teamData) {
        root.style.setProperty('--team-primary', teamData.colors.primary)
        root.style.setProperty('--team-secondary', teamData.colors.secondary)
        root.style.setProperty('--team-accent', teamData.colors.accent)
        root.setAttribute('data-nfl-team', String(teamCode))
      }
    }
    
    localStorage.setItem('nfl-team-theme', String(teamCode))
  }

  const switchTeam = (teamCode: TeamCode | 'league') => {
    setTeam(teamCode)
    applyTeamTheme(teamCode)
  }

  return { team, switchTeam, teams: nflTeams.teams, league: nflTeams.league }
}

export interface TeamSwitcherProps {
  variant?: 'dropdown' | 'grid'
  className?: string
}

export function TeamSwitcher({ variant = 'dropdown', className }: TeamSwitcherProps) {
  const { team, switchTeam, teams } = useTeamTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-4 gap-2 ${className ?? ''}`}>
        <button
          onClick={() => switchTeam('league')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            team === 'league'
              ? 'bg-[var(--team-primary)] text-white'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          NFL
        </button>
        {Object.entries(teams).map(([code, data]) => (
          <button
            key={code}
            onClick={() => switchTeam(code as TeamCode)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              team === code
                ? 'text-white scale-105'
                : 'bg-muted hover:bg-muted/80'
            }`}
            style={
              team === code && typeof data === 'object' && data && 'colors' in data
                ? { backgroundColor: (data as any).colors.primary }
                : undefined
            }
          >
            {code}
          </button>
        ))}
      </div>
    )
  }

  return (
    <select
      value={String(team)}
      onChange={(e) => switchTeam(e.target.value as TeamCode | 'league')}
      className={`rounded-lg border border-border bg-card px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[var(--team-primary)] ${className ?? ''}`}
    >
      <option value="league">NFL Default</option>
      <optgroup label="Teams">
        {Object.entries(teams).map(([code, data]) => (
          <option key={code} value={code}>
            {code} - {typeof data === 'object' && data && 'name' in data ? (data as any).name : code}
          </option>
        ))}
      </optgroup>
    </select>
  )
}
