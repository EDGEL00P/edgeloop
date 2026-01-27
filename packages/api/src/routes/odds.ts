import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getLatestOddsForGame, getOddsHistory } from '@edgeloop/core'
import type { OddsSnapshot } from '@edgeloop/db'
import { nowIso, AppError, isValidUuid, type MarketOdds, type ApiOddsResponse, type GameId } from '@edgeloop/shared'

export const oddsRoutes = new Hono()

const oddsHistorySchema = z.object({
  provider: z.string().optional(),
  since: z.coerce.date().optional(),
})

/**
 * Maps a database OddsSnapshot entity to the API response format.
 */
function mapOddsToApi(odds: OddsSnapshot): MarketOdds {
  return {
    provider: odds.provider,
    moneylineHome: odds.moneylineHome ?? 0,
    moneylineAway: odds.moneylineAway ?? 0,
    spreadHome: parseFloat(odds.spreadHome ?? '0'),
    spreadHomeOdds: odds.spreadHomeOdds ?? -110,
    total: parseFloat(odds.totalPoints ?? '0'),
    overOdds: odds.overOdds ?? -110,
    underOdds: odds.underOdds ?? -110,
  }
}

oddsRoutes.get('/:gameId', zValidator('query', oddsHistorySchema), async (c) => {
  const gameId = c.req.param('gameId')
  const query = c.req.valid('query')

  // Validate UUID format
  if (!isValidUuid(gameId)) {
    throw AppError.badRequest('Invalid game ID: must be a valid UUID')
  }

  const odds = query.since || query.provider
    ? await getOddsHistory(gameId, query.provider, query.since)
    : await getLatestOddsForGame(gameId)

  if (odds.length === 0) {
    throw AppError.notFound(`No odds found for game ${gameId}`)
  }

  const response: ApiOddsResponse = {
    asOfIso: nowIso(),
    gameId: gameId as GameId,
    odds: odds.map(mapOddsToApi),
  }

  return c.json(response)
})

oddsRoutes.get('/:gameId/history', zValidator('query', oddsHistorySchema), async (c) => {
  const gameId = c.req.param('gameId')
  const query = c.req.valid('query')

  // Validate UUID format
  if (!isValidUuid(gameId)) {
    throw AppError.badRequest('Invalid game ID: must be a valid UUID')
  }

  const odds = await getOddsHistory(gameId, query.provider, query.since)

  return c.json({
    asOfIso: nowIso(),
    gameId,
    history: odds.map((o) => ({
      ...mapOddsToApi(o),
      fetchedAt: o.fetchedAt.toISOString(),
    })),
  })
})
