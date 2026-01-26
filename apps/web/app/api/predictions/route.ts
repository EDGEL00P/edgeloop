import { NextRequest } from 'next/server'
import { getDb } from '@edgeloop/db'
import { games } from '@edgeloop/db/schema'
import { desc } from 'drizzle-orm'

export const runtime = 'edge'

/**
 * GET /api/predictions
 * Fetch recent predictions with edge scores
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit_ = parseInt(searchParams.get('limit') || '50')

    const db = getDb()
    
    // This is a simplified query - in production, we'd use proper filtering
    const data = await db.query.games.findMany({
      limit: limit_,
      orderBy: desc(games.createdAt),
    })

    return Response.json({
      data: data.map((game) => ({
        ...game,
        // In production, include actual predictions and edge scores
      })),
      total: data.length,
    })
  } catch (error) {
    console.error('Predictions API error:', error)
    return Response.json({ error: 'Failed to fetch predictions' }, { status: 500 })
  }
}

/**
 * POST /api/predictions
 * Create or update prediction for a game (admin/analyst only)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const prediction = {
      gameId: body.gameId,
      modelVersion: body.modelVersion || 'baseline-1.0',
      winProbHome: body.winProbHome,
      winProbAway: body.winProbAway,
      confidence: body.confidence,
      features: body.features || {},
      createdAt: new Date(),
    }

    // In production, use proper database insertion
    // await db.insert(predictions).values(prediction)

    return Response.json({
      ok: true,
      prediction,
    })
  } catch (error) {
    console.error('Prediction creation error:', error)
    return Response.json({ error: 'Failed to create prediction' }, { status: 500 })
  }
}
