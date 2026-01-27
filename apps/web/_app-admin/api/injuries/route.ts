import { NextRequest } from 'next/server'
import { getInjuries } from '@edgeloop/integrations'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const team = searchParams.get('team') // team code, e.g., KC
    const season = searchParams.get('season')

    const params: { team?: string; season?: number } = {}
    if (team) params.team = team
    if (season) params.season = Number(season)

    const injuries = await getInjuries(params)
    return Response.json(
      { data: injuries },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Injuries API error:', error)
    return Response.json(
      { error: 'Failed to fetch injuries' },
      { status: 500 }
    )
  }
}

