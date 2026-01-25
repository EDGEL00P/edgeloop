import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import superjson from 'superjson'

const t = initTRPC.create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

// Types for API responses
const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  logoUrl: z.string().optional(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
})

const GameSchema = z.object({
  id: z.string(),
  homeTeam: TeamSchema,
  awayTeam: TeamSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  quarter: z.number(),
  timeRemaining: z.number(),
  status: z.enum(['scheduled', 'live', 'final']),
  startTime: z.string(),
})

type Game = z.infer<typeof GameSchema>;

const PredictionSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  predictedWinner: z.enum(['home', 'away']),
  confidence: z.number(),
  homeWinProbability: z.number(),
  awayWinProbability: z.number(),
  factors: z.array(
    z.object({
      name: z.string(),
      impact: z.enum(['positive', 'negative', 'neutral']),
      weight: z.number(),
      description: z.string(),
    })
  ),
  modelVersion: z.string(),
  generatedAt: z.string(),
})

type Prediction = z.infer<typeof PredictionSchema>;

const WinProbabilityPointSchema = z.object({
  timestamp: z.number(),
  homeWinProb: z.number(),
  awayWinProb: z.number(),
  quarter: z.number(),
  event: z.string().optional(),
})

type WinProbabilityPoint = z.infer<typeof WinProbabilityPointSchema>;

// Mock data generators
function generateMockGames(): Game[] {
  return GameSchema.array().parse([
    {
      id: 'game-1',
      homeTeam: {
        id: 'team-kc',
        name: 'Kansas City Chiefs',
        abbreviation: 'KC',
        primaryColor: '#E31837',
        secondaryColor: '#FFB81C',
      },
      awayTeam: {
        id: 'team-buf',
        name: 'Buffalo Bills',
        abbreviation: 'BUF',
        primaryColor: '#00338D',
        secondaryColor: '#C60C30',
      },
      homeScore: 24,
      awayScore: 21,
      quarter: 4,
      timeRemaining: 342,
      status: 'live',
      startTime: new Date().toISOString(),
    },
    {
      id: 'game-2',
      homeTeam: {
        id: 'team-sf',
        name: 'San Francisco 49ers',
        abbreviation: 'SF',
        primaryColor: '#AA0000',
        secondaryColor: '#B3995D',
      },
      awayTeam: {
        id: 'team-dal',
        name: 'Dallas Cowboys',
        abbreviation: 'DAL',
        primaryColor: '#003594',
        secondaryColor: '#869397',
      },
      homeScore: 17,
      awayScore: 14,
      quarter: 3,
      timeRemaining: 487,
      status: 'live',
      startTime: new Date().toISOString(),
    },
    {
      id: 'game-3',
      homeTeam: {
        id: 'team-phi',
        name: 'Philadelphia Eagles',
        abbreviation: 'PHI',
        primaryColor: '#004C54',
        secondaryColor: '#A5ACAF',
      },
      awayTeam: {
        id: 'team-det',
        name: 'Detroit Lions',
        abbreviation: 'DET',
        primaryColor: '#0076B6',
        secondaryColor: '#B0B7BC',
      },
      homeScore: 0,
      awayScore: 0,
      quarter: 0,
      timeRemaining: 900,
      status: 'scheduled',
      startTime: new Date(Date.now() + 3600000).toISOString(),
    },
  ])
}

function generateMockPrediction(gameId: string): Prediction {
  const confidence = 0.65 + Math.random() * 0.25
  const homeWinProb = 0.4 + Math.random() * 0.3
  const prediction = {
    id: `pred-${gameId}`,
    gameId,
    predictedWinner: homeWinProb > 0.5 ? 'home' : 'away',
    confidence,
    homeWinProbability: homeWinProb,
    awayWinProbability: 1 - homeWinProb,
    factors: [
      {
        name: 'Home Field Advantage',
        impact: 'positive',
        weight: 0.15,
        description: 'Historical home win rate of 58% at this venue',
      },
      {
        name: 'Offensive Efficiency',
        impact: 'positive',
        weight: 0.25,
        description: 'Averaging 28.5 PPG vs opponent allowing 24.2',
      },
      {
        name: 'Injury Report',
        impact: 'negative',
        weight: 0.12,
        description: 'Key defensive player questionable',
      },
      {
        name: 'Recent Form',
        impact: 'positive',
        weight: 0.2,
        description: '4-1 in last 5 games with improving metrics',
      },
      {
        name: 'Head-to-Head',
        impact: 'neutral',
        weight: 0.1,
        description: 'Split last 4 matchups evenly',
      },
    ],
    modelVersion: 'v2.4.1',
    generatedAt: new Date().toISOString(),
  }

  return PredictionSchema.parse(prediction)
}

function generateMockWinProbability(gameId: string): WinProbabilityPoint[] {
  const points: WinProbabilityPoint[] = []
  const startingBias = gameId === 'game-1' ? 0.55 : 0.5
  let homeProb = startingBias

  for (let i = 0; i <= 60; i++) {
    const variance = (Math.random() - 0.5) * 0.08
    homeProb = Math.max(0.1, Math.min(0.9, homeProb + variance))

    points.push({
      timestamp: i * 60,
      homeWinProb: homeProb,
      awayWinProb: 1 - homeProb,
      quarter: Math.floor(i / 15) + 1,
      event: i === 15 ? 'Touchdown' : i === 30 ? 'Field Goal' : undefined,
    })
  }

  return WinProbabilityPointSchema.array().parse(points)
}

// Router definition
export const appRouter = router({
  games: router({
    list: publicProcedure.query(() => generateMockGames()),
    byId: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
      const games = generateMockGames()
      return games.find((g) => g.id === input.id) ?? null
    }),
  }),

  predictions: router({
    forGame: publicProcedure.input(z.object({ gameId: z.string() })).query(({ input }) => {
      return generateMockPrediction(input.gameId)
    }),
    winProbability: publicProcedure
      .input(z.object({ gameId: z.string() }))
      .query(({ input }) => {
        return generateMockWinProbability(input.gameId)
      }),
  }),

  analytics: router({
    modelStatus: publicProcedure.query(() => ({
      status: 'healthy' as const,
      version: 'v2.4.1',
      lastTrainedAt: new Date(Date.now() - 86400000).toISOString(),
      accuracy: 0.947,
      gamesAnalyzed: 12847,
      latencyP99: 48,
    })),
  }),
})

export type AppRouter = typeof appRouter
