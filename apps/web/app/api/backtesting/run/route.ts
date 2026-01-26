import { NextRequest, NextResponse } from 'next/server'
import { db } from '@edgeloop/db'
import { edges, games, teams } from '@edgeloop/db/schema'
import { desc, and, eq, gte, lte } from 'drizzle-orm'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@edgeloop/api/auth'
import { calculateKelly, calculateEV } from '@edgeloop/ml'

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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query: BacktestQuery = await request.json()

    // Validate inputs
    if (query.startWeek < 1 || query.endWeek > 18 || query.startWeek > query.endWeek) {
      return NextResponse.json({ error: 'Invalid week range' }, { status: 400 })
    }

    // Fetch historical edges for the specified season and weeks
    const historicalEdges = await db
      .select()
      .from(edges)
      .innerJoin(games, eq(edges.gameId, games.id))
      .where(
        and(
          eq(games.season, query.season),
          gte(games.week, query.startWeek),
          lte(games.week, query.endWeek)
        )
      )
      .orderBy(asc(games.date))

    // Filter by edge type and minimum thresholds
    const filteredEdges = historicalEdges.filter((row) => {
      const edge = row.edges
      const edgeScore = (edge.metadata as Record<string, unknown>)?.score as number | undefined || 0
      const ev = (edge.metadata as Record<string, unknown>)?.ev_percentage as number | undefined || 0

      if (query.edgeType !== 'all') {
        const edgeType = (edge.metadata as Record<string, unknown>)?.type
        if (edgeType !== query.edgeType) return false
      }

      return ev >= query.minEV && edgeScore >= query.minConfidence
    })

    // Run backtest simulation
    let bankroll = query.bankroll
    const trades: Array<{ stake: number; pnl: number; won: boolean }> = []

    for (const edgeRecord of filteredEdges) {
      const edge = edgeRecord.edges
      const game = edgeRecord.games
      const ev = ((edge.metadata as Record<string, unknown>)?.ev_percentage as number | undefined) || 0
      const confidence = ((edge.metadata as Record<string, unknown>)?.score as number | undefined) || 0

      // Calculate stake based on strategy
      let stake = 0
      if (query.stakingStrategy === 'kelly') {
        const impliedProb = confidence / 100
        const decimalOdds = ((edge.metadata as Record<string, unknown>)?.odds as number | undefined) || 1.91
        const kelly = calculateKelly(impliedProb, decimalOdds, 0.25)
        stake = bankroll * kelly
      } else if (query.stakingStrategy === 'fixed') {
        stake = 50 // Fixed $50 per bet
      } else {
        stake = bankroll / 100 // Equal units (1% of bankroll)
      }

      // Estimate win probability based on edge quality
      const winProbability = confidence / 100 + ev / 100

      // Simulate outcome
      const won = Math.random() < winProbability
      const odds = ((edge.metadata as Record<string, unknown>)?.odds as number | undefined) || 1.91
      const pnl = won ? stake * (odds - 1) : -stake

      trades.push({ stake, pnl, won })
      bankroll += pnl

      // Stop if bankroll depleted
      if (bankroll <= 0) break
    }

    // Calculate statistics
    const wins = trades.filter((t) => t.won)
    const losses = trades.filter((t) => !t.won)

    const totalProfit = trades.reduce((acc, t) => acc + t.pnl, 0)
    const winRate = trades.length > 0 ? wins.length / trades.length : 0
    const roi = query.bankroll > 0 ? totalProfit / query.bankroll : 0

    const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pnl, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? losses.reduce((acc, t) => acc + Math.abs(t.pnl), 0) / losses.length : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

    // Sharpe ratio (simplified: return / std dev of returns)
    const returns = trades.map((t) => t.pnl / query.bankroll)
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
    const variance =
      returns.length > 0
        ? returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / returns.length
        : 0
    const stdDev = Math.sqrt(variance)
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0

    // Max drawdown
    let maxDrawdown = 0
    let peak = query.bankroll
    for (const trade of trades) {
      bankroll += trade.pnl
      const drawdown = (peak - bankroll) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
      peak = Math.max(peak, bankroll)
    }

    const result: BacktestResult = {
      totalBets: trades.length,
      winningBets: wins.length,
      losingBets: losses.length,
      winRate,
      totalProfit,
      roi,
      sharpeRatio,
      maxDrawdown,
      avgWin,
      avgLoss,
      profitFactor,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Backtesting error:', error)
    return NextResponse.json({ error: 'Backtesting failed' }, { status: 500 })
  }
}
