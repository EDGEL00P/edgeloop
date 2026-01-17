/**
 * NFL GAMES API ROUTE
 * App Router API endpoint for fetching NFL games
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock data for development - replace with real API calls in production
const MOCK_GAMES = [
  {
    id: 1,
    homeTeamId: 1,
    visitorTeamId: 2,
    homeTeamScore: null,
    visitorTeamScore: null,
    date: '2025-01-18',
    time: '4:30 PM ET',
    status: 'scheduled',
    venue: 'Arrowhead Stadium',
    week: 20,
    season: 2025,
  },
  {
    id: 2,
    homeTeamId: 3,
    visitorTeamId: 4,
    homeTeamScore: 21,
    visitorTeamScore: 17,
    date: '2025-01-18',
    time: null,
    status: 'in_progress',
    venue: 'Ford Field',
    week: 20,
    season: 2025,
  },
  {
    id: 3,
    homeTeamId: 5,
    visitorTeamId: 6,
    homeTeamScore: null,
    visitorTeamScore: null,
    date: '2025-01-19',
    time: '1:00 PM ET',
    status: 'scheduled',
    venue: 'Lincoln Financial Field',
    week: 20,
    season: 2025,
  },
  {
    id: 4,
    homeTeamId: 7,
    visitorTeamId: 8,
    homeTeamScore: 24,
    visitorTeamScore: 31,
    date: '2025-01-19',
    time: null,
    status: 'final',
    venue: 'AT&T Stadium',
    week: 20,
    season: 2025,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get('season') || '2025';
  const week = searchParams.get('week') || '20';

  // Filter games by season and week
  const games = MOCK_GAMES.filter(
    (g) => g.season === parseInt(season) && g.week === parseInt(week)
  );

  // In production: fetch from real API
  // const response = await fetch(`${process.env.API_URL}/nfl/games?season=${season}&week=${week}`);

  return NextResponse.json(games, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
