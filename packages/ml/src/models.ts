/**
 * Edge Detection and Prediction Models
 * - EV (Expected Value) calculation
 * - Kelly Criterion stake sizing
 * - Arbitrage detection
 * - Middle detection
 */

export interface Odds {
  american: number
  decimal: number
  fractional: string
}

export interface BookLine {
  book: string
  moneyline?: Odds
  spread?: { value: number; odds: Odds }
  total?: { value: number; overOdds: Odds; underOdds: Odds }
}

export interface ModelPrediction {
  winProbability: number // 0-1
  spreadValue?: number
  totalValue?: number
  confidence: number // 0-1
}

/**
 * Convert American odds to decimal
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1
  } else {
    return 100 / Math.abs(americanOdds) + 1
  }
}

/**
 * Convert decimal odds to probability
 */
export function oddsToImpliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds
}

/**
 * Calculate Expected Value
 * EV = (Probability of Winning × Amount Won) - (Probability of Losing × Stake)
 * For odds, EV% = (True Probability × Decimal Odds) - 1
 */
export function calculateEV(
  trueWinProbability: number,
  decimalOdds: number
): number {
  return trueWinProbability * decimalOdds - 1
}

/**
 * Calculate Kelly Criterion fraction
 * f* = (bp - q) / b
 * where:
 * - b = odds (decimal - 1)
 * - p = true probability
 * - q = 1 - p
 */
export function calculateKelly(
  trueWinProbability: number,
  decimalOdds: number,
  maxFraction: number = 0.25 // Use fractional Kelly for safety
): number {
  const b = decimalOdds - 1
  const p = trueWinProbability
  const q = 1 - p

  const kelly = (b * p - q) / b

  // Return fractional Kelly (e.g., 0.25 = quarter Kelly)
  return Math.max(0, Math.min(kelly * maxFraction, 1))
}

/**
 * Detect arbitrage (positive EV across all outcomes)
 */
export function detectArbitrage(
  lines: BookLine[],
  markets: ('moneyline' | 'spread' | 'total')[]
): { profit: number; books: string[]; markets: string[] } | null {
  // Simplified arbitrage detection
  // In production, this would check all possible outcome combinations
  
  const impliedProbs: Record<string, number> = {}
  
  for (const line of lines) {
    if (markets.includes('moneyline') && line.moneyline) {
      const decimal = americanToDecimal(line.moneyline.american)
      const prob = oddsToImpliedProbability(decimal)
      impliedProbs[`${line.book}_ML`] = prob
    }
  }

  const totalProb = Object.values(impliedProbs).reduce((a, b) => a + b, 0)
  
  if (totalProb < 1) {
    return {
      profit: (1 - totalProb) * 100,
      books: lines.map((l) => l.book),
      markets,
    }
  }

  return null
}

/**
 * Detect middle (buy low on one side, sell high on other)
 */
export function detectMiddle(
  homeTeamLines: BookLine[],
  awayTeamLines: BookLine[],
  spreadRange: number = 1
): { profit: number; buy: string; sell: string } | null {
  // Simplified middle detection
  // Look for spreads that differ by more than normal market movement

  const homeSpreads = homeTeamLines
    .map((l) => l.spread?.value)
    .filter((v) => v !== undefined) as number[]

  const awaySpreads = awayTeamLines
    .map((l) => l.spread?.value)
    .filter((v) => v !== undefined) as number[]

  if (homeSpreads.length === 0 || awaySpreads.length === 0) return null

  const minHome = Math.min(...homeSpreads)
  const maxAway = Math.max(...awaySpreads)

  const spread = maxAway - minHome

  if (spread >= spreadRange) {
    return {
      profit: spread,
      buy: 'lower_line',
      sell: 'higher_line',
    }
  }

  return null
}

/**
 * Score edge opportunity
 */
export interface EdgeScore {
  ev: number // -1 to 1 scale
  kelly: number // 0-1 scale
  confidence: number // 0-1 scale
  overallScore: number // 0-100 scale
  flags: string[]
}

export function scoreEdge(
  ev: number,
  kelly: number,
  modelConfidence: number,
  lineCertainty: number = 0.8
): EdgeScore {
  const flags: string[] = []

  if (ev < -0.05) flags.push('negative_ev')
  if (kelly < 0.01) flags.push('low_kelly')
  if (modelConfidence < 0.5) flags.push('low_confidence')
  if (lineCertainty < 0.7) flags.push('uncertain_line')

  const evScore = Math.max(0, Math.min(ev * 100, 100))
  const kellyScore = kelly * 100
  const confScore = modelConfidence * 100
  const lineScore = lineCertainty * 100

  const overallScore = (evScore * 0.4 + kellyScore * 0.25 + confScore * 0.2 + lineScore * 0.15)

  return {
    ev,
    kelly,
    confidence: modelConfidence,
    overallScore: Math.round(overallScore),
    flags,
  }
}

/**
 * Baseline prediction (before applying models)
 * Used for testing when ML models aren't available
 */
export function baselinePrediction(
  homeTeamWinRate: number,
  awayTeamWinRate: number,
  isHome: boolean
): ModelPrediction {
  // Simple baseline: favor the team with better win rate
  const baselineWinProb = isHome
    ? 0.5 + (homeTeamWinRate - awayTeamWinRate) * 0.25
    : 0.5 + (awayTeamWinRate - homeTeamWinRate) * 0.25

  return {
    winProbability: Math.max(0.1, Math.min(0.9, baselineWinProb)),
    confidence: 0.4, // Low confidence for baseline
  }
}
