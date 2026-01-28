import { z } from 'zod'

const BASE = process.env['BALLDONTLIE_API_BASE'] ?? 'https://api.balldontlie.io'

/**
 * Get the BallDontLie API key from environment.
 * Throws a descriptive error if not configured.
 */
function getApiKey(): string {
  const key = process.env['BALLDONTLIE_API_KEY']
  if (!key) {
    throw new Error(
      'BALLDONTLIE_API_KEY environment variable is required. ' +
        'Please set it in your .env file or environment configuration.'
    )
  }
  return key
}

// DTOs based on actual API response structure
export const BdlTeam = z.object({
  id: z.number(),
  conference: z.string().nullable(),
  division: z.string().nullable(),
  location: z.string(),
  name: z.string(),
  full_name: z.string(),
  abbreviation: z.string(),
})

export const BdlGame = z.object({
  id: z.number(),
  season: z.number(),
  week: z.number(),
  start_time: z.string(),
  home_team_id: z.number(),
  away_team_id: z.number(),
  status: z.enum(['scheduled', 'in_progress', 'final']),
})

export const BdlOdds = z.object({
  id: z.number(),
  game_id: z.number(),
  vendor: z.string(),
  spread_home_value: z.string().nullable(),
  spread_home_odds: z.number().nullable(),
  spread_away_value: z.string().nullable(),
  spread_away_odds: z.number().nullable(),
  moneyline_home_odds: z.number().nullable(),
  moneyline_away_odds: z.number().nullable(),
  total_value: z.string().nullable(),
  total_over_odds: z.number().nullable(),
  total_under_odds: z.number().nullable(),
  updated_at: z.string(),
})

export type BdlTeam = z.infer<typeof BdlTeam>
export type BdlGame = z.infer<typeof BdlGame>
export type BdlOdds = z.infer<typeof BdlOdds>

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    next_cursor: number | null
    per_page: number
  }
}

export async function bdl<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!KEY) {
    throw new Error('BALLDONTLIE_API_KEY environment variable is required')
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: getApiKey(),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`BDL ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function* paginate<T>(
  path: string,
  perPage = 100
): AsyncGenerator<T, void, unknown> {
  if (!KEY) {
    throw new Error('BALLDONTLIE_API_KEY environment variable is required')
  }
  let cursor: number | null = null
  let hasMore = true
  
  while (hasMore) {
    const url = new URL(`${BASE}${path}`)
    if (cursor !== null) url.searchParams.set('cursor', String(cursor))
    url.searchParams.set('per_page', String(Math.min(perPage, 100))) // Max 100 per API
    const res = await fetch(url, {
      headers: {
        Authorization: getApiKey(),
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error(`BDL ${res.status}: ${res.statusText}`)
    }
    const data = (await res.json()) as PaginatedResponse<T>
    for (const row of data.data) {
      yield row
    }
    cursor = data.meta?.next_cursor ?? null
    hasMore = cursor !== null && data.data.length > 0
  }
}

// Convenience methods using correct API paths
export async function getAllTeams(): Promise<BdlTeam[]> {
  const teams: BdlTeam[] = []
  for await (const team of paginate<BdlTeam>('/nfl/v1/teams')) {
    teams.push(BdlTeam.parse(team))
  }
  return teams
}

export async function getGames(params: {
  season?: number
  week?: number
  teamIds?: number[]
}): Promise<BdlGame[]> {
  const url = new URL(`${BASE}/nfl/v1/games`)
  if (params.season) url.searchParams.set('season', String(params.season))
  if (params.week) url.searchParams.set('week', String(params.week))
  if (params.teamIds?.length) {
    params.teamIds.forEach((id) => url.searchParams.append('team_ids[]', String(id)))
  }
  url.searchParams.set('per_page', '100')
  const res = await fetch(url, {
    headers: {
      Authorization: getApiKey(),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`BDL games ${res.status}`)
  }
  const data = (await res.json()) as PaginatedResponse<BdlGame>
  return data.data.map((g) => BdlGame.parse(g))
}

export async function getInjuries(params: {
  team?: string
  season?: number
}): Promise<unknown[]> {
  const url = new URL(`${BASE}/nfl/v1/injuries`)
  if (params.team) url.searchParams.set('team', params.team)
  if (params.season) url.searchParams.set('season', String(params.season))
  url.searchParams.set('per_page', '100')
  const res = await fetch(url, {
    headers: {
      Authorization: getApiKey(),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`BDL injuries ${res.status}`)
  }
  const data = (await res.json()) as PaginatedResponse<unknown>
  return data.data
}

export async function getRoster(params: {
  team?: string
  season?: number
}): Promise<unknown[]> {
  const url = new URL(`${BASE}/nfl/v1/rosters`)
  if (params.team) url.searchParams.set('team', params.team)
  if (params.season) url.searchParams.set('season', String(params.season))
  url.searchParams.set('per_page', '100')
  const res = await fetch(url, {
    headers: {
      Authorization: getApiKey(),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`BDL roster ${res.status}`)
  }
  const data = (await res.json()) as PaginatedResponse<unknown>
  return data.data
}

export async function getOdds(params: {
  season?: number
  week?: number
  gameIds?: number[]
}): Promise<BdlOdds[]> {
  const url = new URL(`${BASE}/nfl/v1/odds`)
  if (params.season) url.searchParams.set('season', String(params.season))
  if (params.week) url.searchParams.set('week', String(params.week))
  if (params.gameIds?.length) {
    params.gameIds.forEach((id) => url.searchParams.append('game_ids[]', String(id)))
  }
  url.searchParams.set('per_page', '100')
  const res = await fetch(url, {
    headers: {
      Authorization: getApiKey(),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`BDL odds ${res.status}`)
  }
  const data = (await res.json()) as PaginatedResponse<BdlOdds>
  return data.data.map((o) => BdlOdds.parse(o))
}
