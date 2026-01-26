import { NextRequest } from 'next/server'
import { getAllTeams } from '@edgeloop/integrations'

export const runtime = 'edge'

export async function GET(_req: NextRequest) {
  try {
    const teams = await getAllTeams()
    // Map to simplified format
    const simplified = teams.map((t) => ({
      id: t.id,
      code: t.abbreviation,
      name: t.full_name,
      conference: t.conference,
      division: t.division,
    }))
    return Response.json(simplified, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Teams API error:', error)
    return Response.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}
