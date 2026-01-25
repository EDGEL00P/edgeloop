import { eq, and, gte, lte, desc, or } from 'drizzle-orm'
import { getDb, games, teams, type Game, type Team } from '@edgeloop/db'
import type { GameFilters, Pagination } from '@edgeloop/shared'

export type GameWithTeams = Game & {
  homeTeam: Team
  awayTeam: Team
}

export async function getGames(
  filters: GameFilters = {},
  pagination: Pagination = { page: 1, pageSize: 20 }
): Promise<{ games: GameWithTeams[]; total: number }> {
  const db = getDb()
  const offset = (pagination.page - 1) * pagination.pageSize

  const conditions = []

  if (filters.season) {
    conditions.push(eq(games.season, filters.season))
  }

  if (filters.week) {
    conditions.push(eq(games.week, filters.week))
  }

  if (filters.status) {
    conditions.push(eq(games.status, filters.status))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const result = await db.query.games.findMany({
    where: whereClause,
    with: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [desc(games.scheduledAt)],
    limit: pagination.pageSize,
    offset,
  })

  // For total count, we need a separate query
  const countResult = await db.select({ count: games.id }).from(games).where(whereClause)

  return {
    games: result as unknown as GameWithTeams[],
    total: countResult.length,
  }
}

export async function getGameById(gameId: string): Promise<GameWithTeams | null> {
  const db = getDb()

  const result = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      homeTeam: true,
      awayTeam: true,
    },
  })

  return result as unknown as GameWithTeams | null
}

export async function getUpcomingGames(limit = 10): Promise<GameWithTeams[]> {
  const db = getDb()
  const now = new Date()

  const result = await db.query.games.findMany({
    where: and(
      gte(games.scheduledAt, now),
      or(eq(games.status, 'scheduled'), eq(games.status, 'pregame'))
    ),
    with: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [games.scheduledAt],
    limit,
  })

  return result as unknown as GameWithTeams[]
}

export async function getLiveGames(): Promise<GameWithTeams[]> {
  const db = getDb()

  const result = await db.query.games.findMany({
    where: or(eq(games.status, 'in_progress'), eq(games.status, 'halftime')),
    with: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [games.scheduledAt],
  })

  return result as unknown as GameWithTeams[]
}

export async function updateGameScore(
  gameId: string,
  homeScore: number,
  awayScore: number,
  quarter?: number,
  timeRemaining?: string
): Promise<Game | null> {
  const db = getDb()

  const [updated] = await db
    .update(games)
    .set({
      homeScore,
      awayScore,
      quarter,
      timeRemaining,
      updatedAt: new Date(),
    })
    .where(eq(games.id, gameId))
    .returning()

  return updated ?? null
}

export async function updateGameStatus(gameId: string, status: Game['status']): Promise<Game | null> {
  const db = getDb()

  const [updated] = await db
    .update(games)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(games.id, gameId))
    .returning()

  return updated ?? null
}
