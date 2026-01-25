/**
 * Convert American odds to implied probability
 * Positive odds: +150 means win 150 on 100 stake
 * Negative odds: -150 means risk 150 to win 100
 */
export function impliedProbFromAmericanOdds(odds: number): number {
  if (!Number.isFinite(odds) || odds === 0) return 0.5
  if (odds > 0) return 100 / (odds + 100)
  return -odds / (-odds + 100)
}

/**
 * Convert implied probability to American odds
 */
export function americanOddsFromProb(prob: number): number {
  if (!Number.isFinite(prob) || prob <= 0 || prob >= 1) return 0
  if (prob >= 0.5) {
    return Math.round((-100 * prob) / (1 - prob))
  }
  return Math.round((100 * (1 - prob)) / prob)
}

/**
 * Convert American odds to decimal odds
 */
export function decimalFromAmericanOdds(odds: number): number {
  if (!Number.isFinite(odds) || odds === 0) return 2.0
  if (odds > 0) return odds / 100 + 1
  return 100 / -odds + 1
}

/**
 * Convert decimal odds to American odds
 */
export function americanFromDecimalOdds(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return 0
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100)
  }
  return Math.round(-100 / (decimal - 1))
}

/**
 * Calculate betting edge (model probability vs implied probability)
 */
export function calculateEdge(modelProb: number, marketOdds: number): number {
  const impliedProb = impliedProbFromAmericanOdds(marketOdds)
  return modelProb - impliedProb
}

/**
 * Calculate expected value of a bet
 * Returns the EV as a percentage of the stake
 */
export function calculateEV(modelProb: number, marketOdds: number): number {
  const decimalOdds = decimalFromAmericanOdds(marketOdds)
  return modelProb * decimalOdds - 1
}

/**
 * Calculate Kelly criterion bet size
 * Returns the fraction of bankroll to bet
 */
export function kellyBetSize(modelProb: number, marketOdds: number, kellyCriterion = 0.25): number {
  const decimalOdds = decimalFromAmericanOdds(marketOdds)
  const q = 1 - modelProb
  const fullKelly = (modelProb * decimalOdds - q) / (decimalOdds - 1)
  return Math.max(0, fullKelly * kellyCriterion)
}

/**
 * Format American odds as a string with + or - prefix
 */
export function formatAmericanOdds(odds: number): string {
  if (odds > 0) return `+${odds}`
  return String(odds)
}

/**
 * Remove vig/juice from a set of odds to get fair probabilities
 * Takes an array of American odds and returns fair probabilities
 */
export function removeVig(oddsList: number[]): number[] {
  const impliedProbs = oddsList.map(impliedProbFromAmericanOdds)
  const totalImplied = impliedProbs.reduce((sum, p) => sum + p, 0)
  return impliedProbs.map((p) => p / totalImplied)
}
