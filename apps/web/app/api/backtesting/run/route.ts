import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface BacktestQuery {
  season: number
  startWeek: number
  endWeek: number
  edgeType: 'ev' | 'arbitrage' | 'middle' | 'all'
  minEV: number
  minConfidence: number
  stakingStrategy: 'kelly' | 'fixed' | 'equal'
  bankroll: number
}

interface BacktestResult {
  totalBets: number
  winningBets: number
  losingBets: number
  winRate: number
  totalProfit: number
  roi: number
  sharpeRatio: number
  maxDrawdown: number
  avgWin: number
  avgLoss: number
  profitFactor: number
}

export async function POST(request: NextRequest): Promise<NextResponse<BacktestResult | { error: string }>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query: BacktestQuery = await request.json()

    // Validate inputs
    if (!query.season || query.season < 2020 || query.season > new Date().getFullYear()) {
      return NextResponse.json({ error: 'Invalid season' }, { status: 400 })
    }
    if (!query.startWeek || query.startWeek < 1 || query.startWeek > 18) {
      return NextResponse.json({ error: 'Invalid startWeek (must be between 1 and 18)' }, { status: 400 })
    }
    if (!query.endWeek || query.endWeek < 1 || query.endWeek > 18 || query.startWeek > query.endWeek) {
      return NextResponse.json({ error: 'Invalid week range' }, { status: 400 })
    }
    if (!query.bankroll || query.bankroll <= 0) {
      return NextResponse.json({ error: 'Invalid bankroll (must be positive)' }, { status: 400 })
    }
    if (query.minEV < 0 || query.minEV > 100) {
      return NextResponse.json({ error: 'Invalid minEV (must be between 0 and 100)' }, { status: 400 })
    }
    if (query.minConfidence < 0 || query.minConfidence > 1) {
      return NextResponse.json({ error: 'Invalid minConfidence (must be between 0 and 1)' }, { status: 400 })
    }

    // NOTE: Real backtesting with historical data is intentionally not implemented yet.
    // This simulation provides realistic estimates based on query parameters for demo/preview purposes.
    // When implementing real backtesting, integrate with historical odds data from packages/db
    // and actual prediction accuracy from the ML models in packages/ml.
    
    // Simulate number of bets based on weeks and filters
    const weekCount = query.endWeek - query.startWeek + 1
    const baseBetsPerWeek = query.edgeType === 'all' ? 8 : 3
    const evFilter = Math.max(0, 1 - query.minEV / 10) // Higher minEV = fewer bets
    const totalBets = Math.round(weekCount * baseBetsPerWeek * evFilter)
    
    // Simulate win rate based on strategy and thresholds
    const baseWinRate = 0.52 + (query.minEV / 100) + (query.minConfidence / 1000)
    const winRate = Math.min(0.65, Math.max(0.48, baseWinRate))
    
    const winningBets = Math.round(totalBets * winRate)
    const losingBets = totalBets - winningBets
    
    // Simulate average outcomes
    const avgWin = query.bankroll * 0.05 * (1 + Math.random() * 0.5)
    const avgLoss = query.bankroll * 0.04 * (1 + Math.random() * 0.3)
    
    const totalProfit = (winningBets * avgWin) - (losingBets * avgLoss)
    const roi = totalProfit / query.bankroll
    
    // Calculate metrics - cap profitFactor to avoid Infinity
    const maxProfitFactor = 100
    let profitFactor = 0
    if (avgLoss > 0 && losingBets > 0) {
      profitFactor = Math.min(maxProfitFactor, (winningBets * avgWin) / (losingBets * avgLoss))
    } else if (avgWin > 0 && winningBets > 0) {
      profitFactor = maxProfitFactor
    }
    const sharpeRatio = roi > 0 ? roi * Math.sqrt(totalBets) / 0.15 : 0
    const maxDrawdown = Math.min(0.25, 0.05 + (losingBets / totalBets) * 0.2)

    const result: BacktestResult = {
      totalBets,
      winningBets,
      losingBets,
      winRate,
      totalProfit: Math.round(totalProfit * 100) / 100,
      roi: Math.round(roi * 10000) / 10000,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Backtesting error:', error)
    return NextResponse.json({ error: 'Backtesting failed' }, { status: 500 })
  }
}
