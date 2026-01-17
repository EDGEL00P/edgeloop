/**
 * PREDICTIONS API — Model predictions for NFL games
 * Returns calibrated probabilities, edges, and uncertainty intervals
 */

import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PredictionOutput {
  game_id: string;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  market_type: 'spread' | 'total' | 'moneyline';
  predicted_prob: number;
  fair_odds: number;
  market_odds_used: number;
  market_odds_timestamp: string;
  implied_prob: number;
  edge: number;
  ev: number;
  model_version: string;
  data_version: string;
  generated_at: string;
  uncertainty: {
    lower_bound: number;
    upper_bound: number;
    confidence_level: number;
  };
}

interface GamePrediction {
  gameId: string;
  homeTeam: { abbreviation: string; name: string };
  awayTeam: { abbreviation: string; name: string };
  gameTime: string;
  venue: string;
  predictions: {
    spread: {
      predictedSpread: number;
      marketSpread: number;
      homeWinProb: number;
      edge: number;
      confidence: number;
      uncertaintyLow: number;
      uncertaintyHigh: number;
    };
    total: {
      predictedTotal: number;
      marketTotal: number;
      overProb: number;
      edge: number;
      confidence: number;
    };
    moneyline: {
      homeWinProb: number;
      awayWinProb: number;
      fairHomeOdds: number;
      fairAwayOdds: number;
      marketHomeOdds: number;
      marketAwayOdds: number;
      homeEdge: number;
      awayEdge: number;
    };
  };
  topFactors: Array<{
    name: string;
    contribution: number;
    description: string;
  }>;
  modelVersion: string;
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA (In production, this would call the Python ML engine)
// ═══════════════════════════════════════════════════════════════════════════

function generateMockPredictions(season: number, week: number): GamePrediction[] {
  const games = [
    { home: 'KC', away: 'BUF', homeName: 'Chiefs', awayName: 'Bills', venue: 'Arrowhead Stadium', time: 'SUN 6:30 PM' },
    { home: 'DET', away: 'SF', homeName: 'Lions', awayName: '49ers', venue: 'Ford Field', time: 'SUN 3:00 PM' },
    { home: 'PHI', away: 'BAL', homeName: 'Eagles', awayName: 'Ravens', venue: 'Lincoln Financial Field', time: 'SAT 8:15 PM' },
    { home: 'DAL', away: 'GB', homeName: 'Cowboys', awayName: 'Packers', venue: 'AT&T Stadium', time: 'MON 8:00 PM' },
  ];

  return games.map((game, index) => {
    // Simulate realistic model outputs
    const homeAdvantage = 2.5 + (Math.random() - 0.5) * 2;
    const predictedSpread = -3.5 + (Math.random() - 0.5) * 4 + (index % 2 === 0 ? -1 : 1);
    const marketSpread = Math.round((predictedSpread + (Math.random() - 0.5) * 2) * 2) / 2;
    const spreadEdge = predictedSpread - marketSpread;
    
    const homeWinProb = 50 + (predictedSpread * -2.5) + (Math.random() - 0.5) * 10;
    const clampedHomeWinProb = Math.max(20, Math.min(80, homeWinProb));
    
    const predictedTotal = 46 + Math.random() * 8;
    const marketTotal = Math.round(predictedTotal * 2) / 2 + (Math.random() - 0.5) * 2;
    
    // Convert probabilities to American odds
    const probToOdds = (prob: number) => {
      if (prob >= 50) return Math.round(-100 * prob / (100 - prob));
      return Math.round(100 * (100 - prob) / prob);
    };

    return {
      gameId: `${season}-${week}-${index + 1}`,
      homeTeam: { abbreviation: game.home, name: game.homeName },
      awayTeam: { abbreviation: game.away, name: game.awayName },
      gameTime: game.time,
      venue: game.venue,
      predictions: {
        spread: {
          predictedSpread: Math.round(predictedSpread * 10) / 10,
          marketSpread,
          homeWinProb: Math.round(clampedHomeWinProb * 10) / 10,
          edge: Math.round(spreadEdge * 10) / 10,
          confidence: 0.65 + Math.random() * 0.2,
          uncertaintyLow: predictedSpread - 3,
          uncertaintyHigh: predictedSpread + 3,
        },
        total: {
          predictedTotal: Math.round(predictedTotal * 10) / 10,
          marketTotal,
          overProb: 50 + (predictedTotal - marketTotal) * 5,
          edge: Math.round((predictedTotal - marketTotal) * 10) / 10,
          confidence: 0.60 + Math.random() * 0.15,
        },
        moneyline: {
          homeWinProb: Math.round(clampedHomeWinProb * 10) / 10,
          awayWinProb: Math.round((100 - clampedHomeWinProb) * 10) / 10,
          fairHomeOdds: probToOdds(clampedHomeWinProb),
          fairAwayOdds: probToOdds(100 - clampedHomeWinProb),
          marketHomeOdds: probToOdds(clampedHomeWinProb) + Math.round((Math.random() - 0.5) * 20),
          marketAwayOdds: probToOdds(100 - clampedHomeWinProb) + Math.round((Math.random() - 0.5) * 20),
          homeEdge: Math.round((Math.random() - 0.3) * 8 * 10) / 10,
          awayEdge: Math.round((Math.random() - 0.3) * 8 * 10) / 10,
        },
      },
      topFactors: [
        { name: 'Offensive EPA', contribution: 2.5 + Math.random() * 2, description: `${game.home} ranks top 10 in offensive efficiency` },
        { name: 'Defensive DVOA', contribution: 1.8 + Math.random() * 1.5, description: 'Elite pass defense limits explosive plays' },
        { name: 'Home Field', contribution: homeAdvantage, description: 'Historical home field advantage adjustment' },
        { name: 'Rest Advantage', contribution: Math.random() * 1.5, description: 'Extra preparation time factor' },
        { name: 'Weather Impact', contribution: -0.5 + Math.random(), description: 'Outdoor game weather considerations' },
      ],
      modelVersion: 'edgeloop-v1.0.0',
      generatedAt: new Date().toISOString(),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GET HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season') || '2025');
    const week = parseInt(searchParams.get('week') || '20');
    const gameId = searchParams.get('gameId');

    // Generate predictions
    const predictions = generateMockPredictions(season, week);

    // If specific game requested, filter
    if (gameId) {
      const game = predictions.find(p => p.gameId === gameId);
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }
      return NextResponse.json({ data: game });
    }

    // Return all predictions for the week
    return NextResponse.json({
      data: predictions,
      meta: {
        season,
        week,
        count: predictions.length,
        modelVersion: 'edgeloop-v1.0.0',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST HANDLER (for custom prediction requests)
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeTeam, awayTeam, marketOdds } = body;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'homeTeam and awayTeam are required' },
        { status: 400 }
      );
    }

    // In production, this would call the Python ML engine
    // For now, return a mock prediction
    const prediction: PredictionOutput = {
      game_id: `custom-${Date.now()}`,
      home_team: homeTeam,
      away_team: awayTeam,
      kickoff_time: new Date().toISOString(),
      market_type: 'spread',
      predicted_prob: 55 + (Math.random() - 0.5) * 20,
      fair_odds: -110,
      market_odds_used: marketOdds?.spread || -110,
      market_odds_timestamp: new Date().toISOString(),
      implied_prob: 52.4,
      edge: 2.6 + (Math.random() - 0.5) * 4,
      ev: 4.8,
      model_version: 'edgeloop-v1.0.0',
      data_version: '2025-01-15',
      generated_at: new Date().toISOString(),
      uncertainty: {
        lower_bound: 48,
        upper_bound: 62,
        confidence_level: 0.90,
      },
    };

    return NextResponse.json({ data: prediction });
  } catch (error) {
    console.error('Predictions POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
