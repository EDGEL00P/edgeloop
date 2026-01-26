import { NextRequest } from 'next/server'
import { getRoster } from '@edgeloop/integrations'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const team = searchParams.get('team')
    const season = searchParams.get('season')

    const params: { team?: string; season?: number } = {}
    if (team) params.team = team
    if (season) params.season = Number(season)

    const roster = await getRoster(params)
    return Response.json(
      { data: roster },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    )
  } catch (error) {
    console.error('Roster API error:', error)
    return Response.json(
      { error: 'Failed to fetch roster' },
      { status: 500 }
    )
  }
}
