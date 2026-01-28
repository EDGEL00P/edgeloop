/**
 * Explanation Generation - FREE Local Implementation
 * 
 * This module provides prediction explanations using template-based generation.
 * No external AI APIs required - completely free to use.
 */

import type { AIProviderConfig, ExplanationResult, FeatureVector, PredictionFactor, PredictionResult } from '../types'

/** Threshold constants for local explanation generation */
const ELO_SIGNIFICANCE_THRESHOLD = 30
const FORM_SIGNIFICANCE_THRESHOLD = 0.15
const REST_SIGNIFICANCE_THRESHOLD = 3
const ELO_MAX_WEIGHT = 0.4
const FORM_MAX_WEIGHT = 0.3
const REST_WEIGHT = 0.15

export interface AIClient {
  generateExplanation(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): Promise<ExplanationResult>
  isConfigured(): boolean
}

/**
 * Creates an explanation client.
 * Only the free 'local' provider is supported.
 */
export function createAIClient(config: AIProviderConfig): AIClient {
  if (config.provider !== 'local') {
    console.warn(
      `[ML] Provider '${config.provider}' is not supported. Using free 'local' provider instead. ` +
      'External AI providers (OpenAI, Anthropic) have been removed to keep the system free.'
    )
  }
  return new LocalClient()
}

/**
 * Local template-based explanation client.
 * Generates explanations without any external API calls - completely free.
 * This is the only supported provider.
 */
export class LocalClient implements AIClient {
  isConfigured(): boolean {
    return true // Always configured - no API key needed
  }

  async generateExplanation(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): Promise<ExplanationResult> {
    const factors = this.extractKeyFactors(features, prediction, homeTeam, awayTeam)
    const summary = this.buildSummary(features, prediction, homeTeam, awayTeam, factors)

    return {
      summary,
      factors,
      confidence: prediction.confidence,
      modelInsights: this.getModelInsights(prediction),
      generatedBy: 'local',
    }
  }

  private extractKeyFactors(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = []

    // ELO advantage - significant when difference exceeds threshold
    const eloDiff = features.homeTeamElo - features.awayTeamElo
    if (Math.abs(eloDiff) > ELO_SIGNIFICANCE_THRESHOLD) {
      factors.push({
        name: 'ELO Rating Advantage',
        category: 'historical',
        impact: eloDiff > 0 ? 'positive' : 'negative',
        weight: Math.min(Math.abs(eloDiff) / 100, ELO_MAX_WEIGHT),
        value: `${eloDiff > 0 ? '+' : ''}${eloDiff.toFixed(0)} points`,
        description: `${eloDiff > 0 ? homeTeam : awayTeam} has a significant ELO rating advantage`,
      })
    }

    // Recent form - significant when win rate difference exceeds threshold
    const formDiff = features.homeTeamRecentWinRate - features.awayTeamRecentWinRate
    if (Math.abs(formDiff) > FORM_SIGNIFICANCE_THRESHOLD) {
      factors.push({
        name: 'Recent Form',
        category: 'offense',
        impact: formDiff > 0 ? 'positive' : 'negative',
        weight: Math.min(Math.abs(formDiff), FORM_MAX_WEIGHT),
        value: `${(features.homeTeamRecentWinRate * 100).toFixed(0)}% vs ${(features.awayTeamRecentWinRate * 100).toFixed(0)}%`,
        description: `${formDiff > 0 ? homeTeam : awayTeam} has been in better recent form`,
      })
    }

    // Rest advantage - significant when rest day difference exceeds threshold
    const restDiff = features.restDaysHome - features.restDaysAway
    if (Math.abs(restDiff) >= REST_SIGNIFICANCE_THRESHOLD) {
      factors.push({
        name: 'Rest Advantage',
        category: 'situational',
        impact: restDiff > 0 ? 'positive' : 'negative',
        weight: REST_WEIGHT,
        value: `${features.restDaysHome} vs ${features.restDaysAway} days`,
        description: `${restDiff > 0 ? homeTeam : awayTeam} has a significant rest advantage`,
      })
    }

    // Home advantage
    if (features.homeAdvantage > 0) {
      factors.push({
        name: 'Home Field Advantage',
        category: 'situational',
        impact: 'positive',
        weight: features.homeAdvantage,
        value: `+${(features.homeAdvantage * 100).toFixed(0)}%`,
        description: `${homeTeam} benefits from playing at home`,
      })
    }

    return factors
  }

  private buildSummary(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string,
    factors: PredictionFactor[]
  ): string {
    const favored = prediction.winProbHome > 0.5 ? homeTeam : awayTeam
    const underdog = prediction.winProbHome > 0.5 ? awayTeam : homeTeam
    const favoredProb = Math.max(prediction.winProbHome, prediction.winProbAway) * 100

    let summary = `Our model favors ${favored} with a ${favoredProb.toFixed(0)}% win probability against ${underdog}.`

    if (factors.length > 0) {
      const topFactor = factors.reduce((a, b) => (a.weight > b.weight ? a : b))
      summary += ` ${topFactor.description}.`
    }

    if (prediction.confidence < 0.6) {
      summary += ' This is a lower confidence prediction with significant uncertainty.'
    } else if (prediction.confidence > 0.8) {
      summary += ' The model has high confidence in this projection.'
    }

    return summary
  }

  private getModelInsights(prediction: PredictionResult): string[] {
    const insights: string[] = [`Model version: ${prediction.modelVersion}`]

    if (prediction.predictedSpread !== 0) {
      insights.push(`Projected spread: ${prediction.predictedSpread > 0 ? '+' : ''}${prediction.predictedSpread.toFixed(1)}`)
    }

    if (prediction.predictedTotal > 0) {
      insights.push(`Projected total: ${prediction.predictedTotal.toFixed(1)}`)
    }

    return insights
  }
}
