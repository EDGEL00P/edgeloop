import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
    const limitParam = parseInt(searchParams.get('limit') || '50')
    // Cap limit to prevent resource exhaustion
    const limit = Math.min(Math.max(1, limitParam), 100)

    const db = getDb()
    
    // This is a simplified query - in production, we'd use proper filtering
    const data = await db.query.games.findMany({
      limit,
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
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.gameId || typeof body.gameId !== 'string') {
      return Response.json({ error: 'Invalid gameId' }, { status: 400 })
    }
    if (typeof body.winProbHome !== 'number' || body.winProbHome < 0 || body.winProbHome > 1) {
      return Response.json({ error: 'Invalid winProbHome (must be between 0 and 1)' }, { status: 400 })
    }
    if (typeof body.winProbAway !== 'number' || body.winProbAway < 0 || body.winProbAway > 1) {
      return Response.json({ error: 'Invalid winProbAway (must be between 0 and 1)' }, { status: 400 })
    }
    if (body.confidence !== undefined && (typeof body.confidence !== 'number' || body.confidence < 0 || body.confidence > 1)) {
      return Response.json({ error: 'Invalid confidence (must be between 0 and 1)' }, { status: 400 })
    }

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
