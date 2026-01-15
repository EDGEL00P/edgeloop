/**
 * NFL TEAMS API ROUTE
 * App Router API endpoint for fetching NFL teams
 */

import { NextRequest, NextResponse } from 'next/server';

const NFL_TEAMS = [
  { id: 1, abbreviation: 'KC', name: 'Chiefs', fullName: 'Kansas City Chiefs', conference: 'AFC', division: 'West' },
  { id: 2, abbreviation: 'BUF', name: 'Bills', fullName: 'Buffalo Bills', conference: 'AFC', division: 'East' },
  { id: 3, abbreviation: 'DET', name: 'Lions', fullName: 'Detroit Lions', conference: 'NFC', division: 'North' },
  { id: 4, abbreviation: 'SF', name: '49ers', fullName: 'San Francisco 49ers', conference: 'NFC', division: 'West' },
  { id: 5, abbreviation: 'PHI', name: 'Eagles', fullName: 'Philadelphia Eagles', conference: 'NFC', division: 'East' },
  { id: 6, abbreviation: 'BAL', name: 'Ravens', fullName: 'Baltimore Ravens', conference: 'AFC', division: 'North' },
  { id: 7, abbreviation: 'DAL', name: 'Cowboys', fullName: 'Dallas Cowboys', conference: 'NFC', division: 'East' },
  { id: 8, abbreviation: 'GB', name: 'Packers', fullName: 'Green Bay Packers', conference: 'NFC', division: 'North' },
  { id: 9, abbreviation: 'MIA', name: 'Dolphins', fullName: 'Miami Dolphins', conference: 'AFC', division: 'East' },
  { id: 10, abbreviation: 'CIN', name: 'Bengals', fullName: 'Cincinnati Bengals', conference: 'AFC', division: 'North' },
  { id: 11, abbreviation: 'HOU', name: 'Texans', fullName: 'Houston Texans', conference: 'AFC', division: 'South' },
  { id: 12, abbreviation: 'CLE', name: 'Browns', fullName: 'Cleveland Browns', conference: 'AFC', division: 'North' },
  { id: 13, abbreviation: 'LAR', name: 'Rams', fullName: 'Los Angeles Rams', conference: 'NFC', division: 'West' },
  { id: 14, abbreviation: 'SEA', name: 'Seahawks', fullName: 'Seattle Seahawks', conference: 'NFC', division: 'West' },
  { id: 15, abbreviation: 'MIN', name: 'Vikings', fullName: 'Minnesota Vikings', conference: 'NFC', division: 'North' },
  { id: 16, abbreviation: 'TB', name: 'Buccaneers', fullName: 'Tampa Bay Buccaneers', conference: 'NFC', division: 'South' },
  { id: 17, abbreviation: 'JAX', name: 'Jaguars', fullName: 'Jacksonville Jaguars', conference: 'AFC', division: 'South' },
  { id: 18, abbreviation: 'NYJ', name: 'Jets', fullName: 'New York Jets', conference: 'AFC', division: 'East' },
  { id: 19, abbreviation: 'PIT', name: 'Steelers', fullName: 'Pittsburgh Steelers', conference: 'AFC', division: 'North' },
  { id: 20, abbreviation: 'LV', name: 'Raiders', fullName: 'Las Vegas Raiders', conference: 'AFC', division: 'West' },
  { id: 21, abbreviation: 'LAC', name: 'Chargers', fullName: 'Los Angeles Chargers', conference: 'AFC', division: 'West' },
  { id: 22, abbreviation: 'DEN', name: 'Broncos', fullName: 'Denver Broncos', conference: 'AFC', division: 'West' },
  { id: 23, abbreviation: 'IND', name: 'Colts', fullName: 'Indianapolis Colts', conference: 'AFC', division: 'South' },
  { id: 24, abbreviation: 'TEN', name: 'Titans', fullName: 'Tennessee Titans', conference: 'AFC', division: 'South' },
  { id: 25, abbreviation: 'ATL', name: 'Falcons', fullName: 'Atlanta Falcons', conference: 'NFC', division: 'South' },
  { id: 26, abbreviation: 'NO', name: 'Saints', fullName: 'New Orleans Saints', conference: 'NFC', division: 'South' },
  { id: 27, abbreviation: 'CAR', name: 'Panthers', fullName: 'Carolina Panthers', conference: 'NFC', division: 'South' },
  { id: 28, abbreviation: 'ARI', name: 'Cardinals', fullName: 'Arizona Cardinals', conference: 'NFC', division: 'West' },
  { id: 29, abbreviation: 'NYG', name: 'Giants', fullName: 'New York Giants', conference: 'NFC', division: 'East' },
  { id: 30, abbreviation: 'WAS', name: 'Commanders', fullName: 'Washington Commanders', conference: 'NFC', division: 'East' },
  { id: 31, abbreviation: 'CHI', name: 'Bears', fullName: 'Chicago Bears', conference: 'NFC', division: 'North' },
  { id: 32, abbreviation: 'NE', name: 'Patriots', fullName: 'New England Patriots', conference: 'AFC', division: 'East' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conference = searchParams.get('conference');
  const division = searchParams.get('division');

  let teams = NFL_TEAMS;

  if (conference) {
    teams = teams.filter((t) => t.conference === conference);
  }

  if (division) {
    teams = teams.filter((t) => t.division === division);
  }

  return NextResponse.json(teams, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
