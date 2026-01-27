import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import {
  getUpcomingPredictions,
  getLatestPredictionForGame,
  getActiveModelVersion,
  type PredictionWithGame,
} from '@edgeloop/core'
import { getLatestOddsForGame } from '@edgeloop/core'
import {
  nowIso,
  AppError,
  impliedProbFromAmericanOdds,
  calculateEdge,
  mapGameToApi,
  type ApiPrediction,
  type ApiPredictionsResponse,
  type MarketOdds,
  type PredictionEdges,
  type PredictionId,
} from '@edgeloop/shared'

export const predictionRoutes = new Hono()

async function mapPredictionToApi(pred: PredictionWithGame): Promise<ApiPrediction> {
  const gameInfo = mapGameToApi(pred.game)

  // Get latest odds for this game
  const odds = await getLatestOddsForGame(pred.game.id)
  const primaryOdds = odds[0] // Use first provider as primary

  let marketOdds: MarketOdds | undefined
  let edges: PredictionEdges | undefined

  if (primaryOdds) {
    marketOdds = {
      provider: primaryOdds.provider,
      moneylineHome: primaryOdds.moneylineHome ?? 0,
      moneylineAway: primaryOdds.moneylineAway ?? 0,
      spreadHome: parseFloat(primaryOdds.spreadHome ?? '0'),
      spreadHomeOdds: primaryOdds.spreadHomeOdds ?? -110,
      total: parseFloat(primaryOdds.totalPoints ?? '0'),
      overOdds: primaryOdds.overOdds ?? -110,
      underOdds: primaryOdds.underOdds ?? -110,
    }

    const winProbHome = parseFloat(pred.winProbHome)

    edges = {
      moneylineHome: calculateEdge(winProbHome, marketOdds.moneylineHome),
      moneylineAway: calculateEdge(1 - winProbHome, marketOdds.moneylineAway),
    }
  }

  return {
    id: pred.id as PredictionId,
    game: gameInfo,
    winProbHome: parseFloat(pred.winProbHome),
    winProbAway: parseFloat(pred.winProbAway),
    confidence: parseFloat(pred.confidence),
    predictedSpread: pred.predictedSpread ? parseFloat(pred.predictedSpread) : undefined,
    predictedTotal: pred.predictedTotal ? parseFloat(pred.predictedTotal) : undefined,
    marketOdds,
    edges,
    createdAt: pred.createdAt.toISOString() as any,
  }
}

predictionRoutes.get('/', async (c) => {
  const predictions = await getUpcomingPredictions()
  const modelVersion = (await getActiveModelVersion()) ?? 'v1.0.0'

  const apiPredictions = await Promise.all(predictions.map(mapPredictionToApi))

  const response: ApiPredictionsResponse = {
    asOfIso: nowIso(),
    modelVersion,
    predictions: apiPredictions,
  }

  return c.json(response)
})

predictionRoutes.get('/:gameId', async (c) => {
  const gameId = c.req.param('gameId')

  const prediction = await getLatestPredictionForGame(gameId)

  if (!prediction) {
    throw AppError.notFound(`No prediction found for game ${gameId}`)
  }

  const apiPrediction = await mapPredictionToApi(prediction)

  return c.json({
    asOfIso: nowIso(),
    prediction: apiPrediction,
  })
})
