/**
 * BACKTEST API — Walk-forward backtesting results
 * Returns calibration curves, season metrics, and ROI simulations
 */

import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CalibrationBin {
  predictedProbLow: number;
  predictedProbHigh: number;
  predictedProbMid: number;
  actualWinRate: number;
  sampleSize: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
}

interface SeasonMetrics {
  season: number;
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  logLoss: number;
  brierScore: number;
  roi: number;
  unitsWon: number;
  bestWeek: { week: number; roi: number };
  worstWeek: { week: number; roi: number };
}

interface BacktestResults {
  overallMetrics: {
    totalGames: number;
    accuracy: number;
    logLoss: number;
    brierScore: number;
    calibrationError: number;
    roi: number;
    sharpeRatio: number;
  };
  calibrationCurve: CalibrationBin[];
  seasonBreakdown: SeasonMetrics[];
  weeklyROI: Array<{ season: number; week: number; roi: number; cumulative: number }>;
  marketTypeBreakdown: {
    spread: { accuracy: number; roi: number; sampleSize: number };
    total: { accuracy: number; roi: number; sampleSize: number };
    moneyline: { accuracy: number; roi: number; sampleSize: number };
  };
  modelInfo: {
    version: string;
    trainedOn: string;
    features: number;
    calibrationMethod: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK BACKTEST DATA
// ═══════════════════════════════════════════════════════════════════════════

function generateBacktestResults(): BacktestResults {
  // Generate calibration curve (10 bins)
  const calibrationCurve: CalibrationBin[] = [];
  for (let i = 0; i < 10; i++) {
    const low = i * 10;
    const high = (i + 1) * 10;
    const mid = (low + high) / 2;
    
    // Well-calibrated model: actual should be close to predicted
    const noise = (Math.random() - 0.5) * 8;
    const actual = Math.max(0, Math.min(100, mid + noise));
    const sampleSize = 50 + Math.floor(Math.random() * 100);
    const se = Math.sqrt((actual * (100 - actual)) / sampleSize);
    
    calibrationCurve.push({
      predictedProbLow: low,
      predictedProbHigh: high,
      predictedProbMid: mid,
      actualWinRate: Math.round(actual * 10) / 10,
      sampleSize,
      confidenceIntervalLow: Math.max(0, actual - 1.96 * se),
      confidenceIntervalHigh: Math.min(100, actual + 1.96 * se),
    });
  }

  // Generate season breakdown (2020-2024)
  const seasonBreakdown: SeasonMetrics[] = [];
  for (let season = 2020; season <= 2024; season++) {
    const totalPicks = 200 + Math.floor(Math.random() * 100);
    const winRate = 0.52 + Math.random() * 0.08;
    const wins = Math.floor(totalPicks * winRate);
    const losses = totalPicks - wins;
    
    seasonBreakdown.push({
      season,
      totalPicks,
      wins,
      losses,
      pushes: Math.floor(Math.random() * 10),
      winRate: Math.round(winRate * 1000) / 10,
      logLoss: 0.68 - Math.random() * 0.05,
      brierScore: 0.24 - Math.random() * 0.02,
      roi: Math.round((winRate - 0.524) * 100 * 10) / 10, // 52.4% is breakeven
      unitsWon: Math.round((wins - losses * 1.1) * 10) / 10,
      bestWeek: { week: Math.floor(Math.random() * 18) + 1, roi: 20 + Math.random() * 30 },
      worstWeek: { week: Math.floor(Math.random() * 18) + 1, roi: -15 - Math.random() * 20 },
    });
  }

  // Generate weekly ROI (last 2 seasons)
  const weeklyROI: Array<{ season: number; week: number; roi: number; cumulative: number }> = [];
  let cumulative = 0;
  for (let season = 2023; season <= 2024; season++) {
    for (let week = 1; week <= 18; week++) {
      const roi = (Math.random() - 0.45) * 20;
      cumulative += roi;
      weeklyROI.push({
        season,
        week,
        roi: Math.round(roi * 10) / 10,
        cumulative: Math.round(cumulative * 10) / 10,
      });
    }
  }

  return {
    overallMetrics: {
      totalGames: 1247,
      accuracy: 55.8,
      logLoss: 0.672,
      brierScore: 0.238,
      calibrationError: 2.3,
      roi: 5.4,
      sharpeRatio: 0.82,
    },
    calibrationCurve,
    seasonBreakdown,
    weeklyROI,
    marketTypeBreakdown: {
      spread: { accuracy: 54.2, roi: 3.8, sampleSize: 589 },
      total: { accuracy: 56.1, roi: 6.2, sampleSize: 412 },
      moneyline: { accuracy: 58.4, roi: 7.1, sampleSize: 246 },
    },
    modelInfo: {
      version: 'edgeloop-v1.0.0',
      trainedOn: '2024-09-01',
      features: 127,
      calibrationMethod: 'isotonic_regression',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GET HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketType = searchParams.get('marketType'); // spread, total, moneyline
    const startSeason = parseInt(searchParams.get('startSeason') || '2020');
    const endSeason = parseInt(searchParams.get('endSeason') || '2024');

    const results = generateBacktestResults();

    // Filter by market type if specified
    if (marketType && marketType !== 'all') {
      const breakdown = results.marketTypeBreakdown[marketType as keyof typeof results.marketTypeBreakdown];
      if (!breakdown) {
        return NextResponse.json({ error: 'Invalid market type' }, { status: 400 });
      }
    }

    // Filter by season range
    const filteredSeasons = results.seasonBreakdown.filter(
      s => s.season >= startSeason && s.season <= endSeason
    );

    return NextResponse.json({
      data: {
        ...results,
        seasonBreakdown: filteredSeasons,
      },
      meta: {
        startSeason,
        endSeason,
        marketType: marketType || 'all',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Backtest API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve backtest results' },
      { status: 500 }
    );
  }
}
