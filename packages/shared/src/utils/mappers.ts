import type { TeamInfo, GameInfo, TeamCode, GameId } from '../types'

/**
 * Map database team to API TeamInfo
 */
export function mapTeamToApi(team: { code: string; name: string; city: string }): TeamInfo {
  return {
    code: team.code as TeamCode,
    name: team.name,
    city: team.city,
  }
}

/**
 * Map database game with teams to API GameInfo
 */
export function mapGameToApi(game: {
  id: string
  homeTeam: { code: string; name: string; city: string }
  awayTeam: { code: string; name: string; city: string }
  kickoffAt: Date | null
  scheduledAt: Date
  status: 'scheduled' | 'pregame' | 'in_progress' | 'halftime' | 'final' | 'postponed' | 'cancelled'
  homeScore: number | null
  awayScore: number | null
  quarter: number | null
  timeRemaining: string | null
}): GameInfo {
  const homeTeam = mapTeamToApi(game.homeTeam)
  const awayTeam = mapTeamToApi(game.awayTeam)

  return {
    id: game.id as GameId,
    homeTeam,
    awayTeam,
    kickoffAt: (game.kickoffAt ?? game.scheduledAt).toISOString() as any,
    status: game.status,
    homeScore: game.homeScore ?? undefined,
    awayScore: game.awayScore ?? undefined,
    quarter: game.quarter ?? undefined,
    timeRemaining: game.timeRemaining ?? undefined,
  }
}
