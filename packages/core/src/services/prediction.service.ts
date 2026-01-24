import { eq, and, desc, inArray } from 'drizzle-orm'
import { getDb, predictions, games, teams, type Prediction, type NewPrediction } from '@edgeloop/db'
import type { GameWithTeams } from './game.service'

export type PredictionWithGame = Prediction & {
  game: GameWithTeams
}

export async function getPredictions(gameIds?: string[]): Promise<PredictionWithGame[]> {
  const db = getDb()

  const whereClause = gameIds && gameIds.length > 0 ? inArray(predictions.gameId, gameIds) : undefined

  const result = await db.query.predictions.findMany({
    where: whereClause,
    with: {
      game: {
        with: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: [desc(predictions.createdAt)],
  })

  return result as unknown as PredictionWithGame[]
}

export async function getLatestPredictionForGame(gameId: string): Promise<PredictionWithGame | null> {
  const db = getDb()

  const result = await db.query.predictions.findFirst({
    where: eq(predictions.gameId, gameId),
    with: {
      game: {
        with: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: [desc(predictions.createdAt)],
  })

  return result as unknown as PredictionWithGame | null
}

export async function getUpcomingPredictions(): Promise<PredictionWithGame[]> {
  const db = getDb()
  const now = new Date()

  // First get upcoming games
  const upcomingGames = await db.query.games.findMany({
    where: and(
      eq(games.status, 'scheduled'),
    ),
    columns: { id: true },
  })

  const gameIds = upcomingGames.map((g) => g.id)

  if (gameIds.length === 0) {
    return []
  }

  // Get latest prediction for each game
  const result = await db.query.predictions.findMany({
    where: inArray(predictions.gameId, gameIds),
    with: {
      game: {
        with: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: [desc(predictions.createdAt)],
  })

  // Deduplicate to get latest prediction per game
  const latestByGame = new Map<string, PredictionWithGame>()
  for (const pred of result as unknown as PredictionWithGame[]) {
    if (!latestByGame.has(pred.gameId)) {
      latestByGame.set(pred.gameId, pred)
    }
  }

  return Array.from(latestByGame.values())
}

export async function createPrediction(data: NewPrediction): Promise<Prediction> {
  const db = getDb()

  const [prediction] = await db.insert(predictions).values(data).returning()

  if (!prediction) {
    throw new Error('Failed to create prediction')
  }

  return prediction
}

export async function getActiveModelVersion(): Promise<string | null> {
  const db = getDb()

  // Get the most recent prediction's model version
  const result = await db.query.predictions.findFirst({
    columns: { modelVersion: true },
    orderBy: [desc(predictions.createdAt)],
  })

  return result?.modelVersion ?? null
}
