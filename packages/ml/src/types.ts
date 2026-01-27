// ML Types for EdgeLoop prediction engine

export interface FeatureVector {
  // Team performance metrics
  homeTeamElo: number
  awayTeamElo: number
  homeTeamRecentWinRate: number
  awayTeamRecentWinRate: number

  // Situational factors
  homeAdvantage: number
  restDaysHome: number
  restDaysAway: number

  // Environmental
  weatherFactor?: number
  altitude?: number

  // Injury impact (0-1 scale)
  injuryImpactHome?: number
  injuryImpactAway?: number

  // Historical matchup
  headToHeadWinRate?: number
  lastMeetingMargin?: number

  // Advanced metrics
  offensiveEfficiencyHome?: number
  offensiveEfficiencyAway?: number
  defensiveEfficiencyHome?: number
  defensiveEfficiencyAway?: number
  turnoverMarginHome?: number
  turnoverMarginAway?: number
}

export interface PredictionResult {
  winProbHome: number
  winProbAway: number
  confidence: number
  predictedSpread: number
  predictedTotal: number
  modelVersion: string
  generatedAt: string
}

export interface PredictionFactor {
  name: string
  category: 'offense' | 'defense' | 'situational' | 'historical' | 'environmental'
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  value: string
  description: string
}

export interface ExplanationResult {
  summary: string
  factors: PredictionFactor[]
  confidence: number
  modelInsights: string[]
  generatedBy: 'openai' | 'anthropic' | 'local'
}

export interface WinProbabilityPoint {
  timestamp: number
  gameTime: string
  homeWinProb: number
  awayWinProb: number
  quarter: number
  event?: string
  isKeyMoment: boolean
}

export interface ModelMetrics {
  accuracy: number
  brierScore: number
  logLoss: number
  calibrationError: number
  sampleSize: number
}

export interface DriftReport {
  featureName: string
  psi: number
  isDrifted: boolean
  referenceDistribution: number[]
  currentDistribution: number[]
  threshold: number
}

/**
 * AI provider for explanation generation.
 * Only 'local' is supported - it's free and requires no API keys.
 */
export type AIProvider = 'local'

export interface AIProviderConfig {
  /**
   * The AI provider to use for explanation generation.
   * Only 'local' is supported - free template-based explanations.
   */
  provider: AIProvider
}
