/**
 * Game Service
 *
 * Provides core business logic for retrieving and managing NFL game data.
 * This service handles game queries, filtering, and status updates.
 *
 * @module core/services/game
 */

import { eq, and, gte, lte, desc, or } from 'drizzle-orm'
import { getDb, games, teams, type Game, type Team } from '@edgeloop/db'
import type { GameFilters, Pagination } from '@edgeloop/shared'

/**
 * Game entity with related team information.
 */
export type GameWithTeams = Game & {
  homeTeam: Team
  awayTeam: Team
}

/**
 * Retrieves paginated games with optional filtering.
 *
 * @param filters - Optional filters for season, week, and status
 * @param pagination - Page number and page size for pagination
 * @returns Object containing games array and total count
 *
 * @example
 * ```ts
 * const { games, total } = await getGames(
 *   { season: 2024, week: 1 },
 *   { page: 1, pageSize: 20 }
 * )
 * ```
 */
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

/**
 * Retrieves a single game by its unique identifier.
 *
 * @param gameId - The UUID of the game to retrieve
 * @returns The game with team information, or null if not found
 */
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

/**
 * Retrieves upcoming scheduled or pregame games.
 *
 * @param limit - Maximum number of games to return (default: 10)
 * @returns Array of upcoming games sorted by scheduled time
 */
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

/**
 * Retrieves all currently live games (in_progress or halftime).
 *
 * @returns Array of games currently in progress
 */
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

/**
 * Updates the score and optional game state for a game.
 *
 * @param gameId - The UUID of the game to update
 * @param homeScore - The current home team score
 * @param awayScore - The current away team score
 * @param quarter - Optional current quarter (1-4, or 5+ for overtime)
 * @param timeRemaining - Optional time remaining in the quarter (e.g., "12:34")
 * @returns The updated game, or null if the game was not found
 */
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

/**
 * Updates the status of a game.
 *
 * @param gameId - The UUID of the game to update
 * @param status - The new status for the game
 * @returns The updated game, or null if the game was not found
 */
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
