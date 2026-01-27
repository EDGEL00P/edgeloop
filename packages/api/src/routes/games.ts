import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getGames, getGameById, getUpcomingGames, getLiveGames, type GameWithTeams } from '@edgeloop/core'
import { nowIso, AppError, type ApiGamesResponse, mapGameToApi } from '@edgeloop/shared'

export const gameRoutes = new Hono()

const gamesQuerySchema = z.object({
  season: z.coerce.number().int().min(2020).max(2030).optional(),
  week: z.coerce.number().int().min(1).max(22).optional(),
  status: z.enum(['scheduled', 'pregame', 'in_progress', 'halftime', 'final', 'postponed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

gameRoutes.get('/', zValidator('query', gamesQuerySchema), async (c) => {
  const query = c.req.valid('query')

  const { games, total } = await getGames(
    {
      season: query.season,
      week: query.week,
      status: query.status,
    },
    {
      page: query.page,
      pageSize: query.pageSize,
    }
  )

  const response: ApiGamesResponse = {
    asOfIso: nowIso(),
    games: games.map(mapGameToApi),
    total,
    page: query.page,
    pageSize: query.pageSize,
  }

  return c.json(response)
})

gameRoutes.get('/upcoming', async (c) => {
  const games = await getUpcomingGames(20)

  return c.json({
    asOfIso: nowIso(),
    games: games.map(mapGameToApi),
  })
})

gameRoutes.get('/live', async (c) => {
  const games = await getLiveGames()

  return c.json({
    asOfIso: nowIso(),
    games: games.map(mapGameToApi),
  })
})

gameRoutes.get('/:id', async (c) => {
  const gameId = c.req.param('id')

  const game = await getGameById(gameId)

  if (!game) {
    throw AppError.notFound(`Game ${gameId} not found`)
  }

  return c.json({
    asOfIso: nowIso(),
    game: mapGameToApi(game),
  })
})
