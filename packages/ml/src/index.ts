// ML Package - Prediction Engine
// This package will contain the ML model inference logic

export type FeatureVector = {
  homeTeamElo: number
  awayTeamElo: number
  homeTeamRecentWinRate: number
  awayTeamRecentWinRate: number
  homeAdvantage: number
  restDaysHome: number
  restDaysAway: number
  weatherFactor?: number
  injuryImpactHome?: number
  injuryImpactAway?: number
}

export type PredictionResult = {
  winProbHome: number
  winProbAway: number
  confidence: number
  predictedSpread: number
  predictedTotal: number
}

export interface PredictionModel {
  version: string
  predict(features: FeatureVector): Promise<PredictionResult>
  calibrate(predictions: number[], outcomes: boolean[]): void
}

// Placeholder implementation
export class SimplePredictionModel implements PredictionModel {
  version = 'v1.0.0-placeholder'

  async predict(features: FeatureVector): Promise<PredictionResult> {
    // Simple ELO-based prediction
    const eloDiff = features.homeTeamElo - features.awayTeamElo
    const homeAdvantage = 65 // Home field advantage in ELO points

    const adjustedDiff = eloDiff + homeAdvantage + features.homeAdvantage * 10

    // Convert ELO difference to win probability using logistic function
    const winProbHome = 1 / (1 + Math.pow(10, -adjustedDiff / 400))
    const winProbAway = 1 - winProbHome

    // Confidence based on how decisive the prediction is
    const confidence = Math.abs(winProbHome - 0.5) * 2

    // Spread approximation: 1 point per 25 ELO difference
    const predictedSpread = -adjustedDiff / 25

    // Total prediction placeholder
    const predictedTotal = 45 + Math.random() * 10

    return {
      winProbHome,
      winProbAway,
      confidence,
      predictedSpread,
      predictedTotal,
    }
  }

  calibrate(): void {
    // Placeholder - would implement Platt scaling or isotonic regression
  }
}

export function getActiveModel(): PredictionModel {
  return new SimplePredictionModel()
}

// Drift detection utilities
export function calculatePSI(reference: number[], current: number[], bins = 10): number {
  const min = Math.min(...reference, ...current)
  const max = Math.max(...reference, ...current)
  const binWidth = (max - min) / bins

  const refCounts = new Array(bins).fill(0)
  const curCounts = new Array(bins).fill(0)

  for (const val of reference) {
    const bin = Math.min(Math.floor((val - min) / binWidth), bins - 1)
    refCounts[bin]++
  }

  for (const val of current) {
    const bin = Math.min(Math.floor((val - min) / binWidth), bins - 1)
    curCounts[bin]++
  }

  // Convert to proportions with small epsilon to avoid log(0)
  const epsilon = 0.0001
  const refProps = refCounts.map((c) => c / reference.length + epsilon)
  const curProps = curCounts.map((c) => c / current.length + epsilon)

  // Calculate PSI
  let psi = 0
  for (let i = 0; i < bins; i++) {
    psi += (curProps[i]! - refProps[i]!) * Math.log(curProps[i]! / refProps[i]!)
  }

  return psi
}

export function isDrifted(psi: number, threshold = 0.2): boolean {
  return psi > threshold
}
