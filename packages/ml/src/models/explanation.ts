// AI-powered explanation synthesis
import type {
  FeatureVector,
  PredictionResult,
  PredictionFactor,
  ExplanationResult,
  AIProvider,
} from '../types'

export interface ExplanationGenerator {
  generate(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): Promise<ExplanationResult>
}

export class LocalExplanationGenerator implements ExplanationGenerator {
  async generate(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): Promise<ExplanationResult> {
    const factors = this.extractFactors(features, prediction, homeTeam, awayTeam)
    const summary = this.generateSummary(factors, prediction, homeTeam, awayTeam)
    const insights = this.generateInsights(features, prediction)

    return {
      summary,
      factors,
      confidence: prediction.confidence,
      modelInsights: insights,
      generatedBy: 'local',
    }
  }

  private extractFactors(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = []

    // ELO difference
    const eloDiff = features.homeTeamElo - features.awayTeamElo
    factors.push({
      name: 'ELO Rating',
      category: 'historical',
      impact: eloDiff > 50 ? 'positive' : eloDiff < -50 ? 'negative' : 'neutral',
      weight: 0.25,
      value: `${eloDiff > 0 ? '+' : ''}${Math.round(eloDiff)}`,
      description: `${homeTeam} has ${Math.abs(Math.round(eloDiff))} ELO points ${eloDiff > 0 ? 'advantage' : 'disadvantage'} over ${awayTeam}`,
    })

    // Home field advantage
    factors.push({
      name: 'Home Field Advantage',
      category: 'situational',
      impact: 'positive',
      weight: 0.15,
      value: `+${(features.homeAdvantage * 100).toFixed(0)}%`,
      description: `${homeTeam} playing at home with established crowd support`,
    })

    // Recent form
    const formDiff = features.homeTeamRecentWinRate - features.awayTeamRecentWinRate
    factors.push({
      name: 'Recent Form',
      category: 'historical',
      impact: formDiff > 0.1 ? 'positive' : formDiff < -0.1 ? 'negative' : 'neutral',
      weight: 0.2,
      value: `${(features.homeTeamRecentWinRate * 100).toFixed(0)}% vs ${(features.awayTeamRecentWinRate * 100).toFixed(0)}%`,
      description: `${homeTeam} winning ${(features.homeTeamRecentWinRate * 100).toFixed(0)}% of recent games`,
    })

    // Rest days
    const restDiff = features.restDaysHome - features.restDaysAway
    if (Math.abs(restDiff) >= 2) {
      factors.push({
        name: 'Rest Advantage',
        category: 'situational',
        impact: restDiff > 0 ? 'positive' : 'negative',
        weight: 0.1,
        value: `${restDiff > 0 ? '+' : ''}${restDiff} days`,
        description: `${restDiff > 0 ? homeTeam : awayTeam} has ${Math.abs(restDiff)} more days of rest`,
      })
    }

    // Offensive efficiency
    if (features.offensiveEfficiencyHome && features.offensiveEfficiencyAway) {
      const offDiff = features.offensiveEfficiencyHome - features.offensiveEfficiencyAway
      factors.push({
        name: 'Offensive Efficiency',
        category: 'offense',
        impact: offDiff > 5 ? 'positive' : offDiff < -5 ? 'negative' : 'neutral',
        weight: 0.15,
        value: `${features.offensiveEfficiencyHome.toFixed(1)} vs ${features.offensiveEfficiencyAway.toFixed(1)}`,
        description: `${homeTeam} averaging ${features.offensiveEfficiencyHome.toFixed(1)} offensive rating`,
      })
    }

    // Injury impact
    if (features.injuryImpactHome || features.injuryImpactAway) {
      const injuryDiff = (features.injuryImpactAway ?? 0) - (features.injuryImpactHome ?? 0)
      factors.push({
        name: 'Injury Report',
        category: 'situational',
        impact: injuryDiff > 0.1 ? 'positive' : injuryDiff < -0.1 ? 'negative' : 'neutral',
        weight: 0.12,
        value: injuryDiff > 0 ? `${awayTeam} impacted` : `${homeTeam} impacted`,
        description: `${injuryDiff > 0 ? awayTeam : homeTeam} dealing with key injuries`,
      })
    }

    return factors.sort((a, b) => b.weight - a.weight)
  }

  private generateSummary(
    factors: PredictionFactor[],
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): string {
    const winner = prediction.winProbHome > 0.5 ? homeTeam : awayTeam
    const confidenceLevel =
      prediction.confidence >= 0.75
        ? 'high'
        : prediction.confidence >= 0.5
          ? 'moderate'
          : 'low'

    const positiveFactors = factors.filter((f) => f.impact === 'positive')
    const negativeFactors = factors.filter((f) => f.impact === 'negative')

    const keyPositive = positiveFactors[0]
    const keyNegative = negativeFactors[0]

    let summary = `The model predicts ${winner} to win with ${confidenceLevel} confidence (${(prediction.winProbHome > 0.5 ? prediction.winProbHome : prediction.winProbAway).toFixed(0)}% win probability). `

    if (keyPositive) {
      summary += `Key advantage: ${keyPositive.name.toLowerCase()} (${keyPositive.description.toLowerCase()}). `
    }

    if (keyNegative) {
      summary += `Primary concern: ${keyNegative.name.toLowerCase()} (${keyNegative.description.toLowerCase()}).`
    }

    return summary
  }

  private generateInsights(
    features: FeatureVector,
    prediction: PredictionResult
  ): string[] {
    const insights: string[] = []

    if (prediction.confidence >= 0.75) {
      insights.push('High confidence prediction based on strong feature signals')
    } else if (prediction.confidence < 0.5) {
      insights.push('Lower confidence due to closely matched teams or missing data')
    }

    if (Math.abs(prediction.predictedSpread) <= 3) {
      insights.push('Expected to be a close game with margin within 3 points')
    }

    if (features.headToHeadWinRate !== undefined) {
      insights.push(
        `Historical matchup data included in prediction (${(features.headToHeadWinRate * 100).toFixed(0)}% head-to-head)`
      )
    }

    return insights
  }
}

// Factory function supporting multiple providers
export function createExplanationGenerator(provider: AIProvider = 'local'): ExplanationGenerator {
  switch (provider) {
    case 'openai':
    case 'anthropic':
    case 'gemini':
      // For AI providers, we would integrate with their APIs
      // For now, fall back to local
      console.warn(`AI provider ${provider} not yet implemented, using local generator`)
      return new LocalExplanationGenerator()
    case 'local':
    default:
      return new LocalExplanationGenerator()
  }
}
