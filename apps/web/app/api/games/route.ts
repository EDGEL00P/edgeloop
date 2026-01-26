import { NextRequest } from 'next/server'
import { getGames } from '@edgeloop/integrations'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season')
    const week = searchParams.get('week')
    const gameId = searchParams.get('id')

    if (gameId) {
      // Single game lookup - would need a getGameById method
      return Response.json(
        { error: 'Single game lookup not yet implemented' },
        { status: 501 }
      )
    }

    const params: {
      season?: number
      week?: number
      teamIds?: number[]
    } = {}

    if (season) params.season = Number(season)
    if (week) params.week = Number(week)

    const games = await getGames(params)
    return Response.json(
      { data: games },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    )
  } catch (error) {
    console.error('Games API error:', error)
    return Response.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

