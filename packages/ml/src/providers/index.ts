// AI Provider integrations for explanation synthesis
import type { AIProviderConfig, ExplanationResult, FeatureVector, PredictionFactor, PredictionResult } from '../types'

/** Default timeout for API requests in milliseconds */
const DEFAULT_TIMEOUT_MS = 30_000

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
 * Creates an AbortSignal with a timeout.
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that will abort after the timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

/**
 * Performs a fetch with timeout and improved error handling.
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns The response
 * @throws Error with descriptive message on failure
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const signal = createTimeoutSignal(timeoutMs)

  try {
    const response = await fetch(url, { ...options, signal })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`API request failed with status ${response.status}: ${errorText}`)
    }

    return response
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`API request timed out after ${timeoutMs}ms`)
      }
      throw error
    }
    throw new Error('Unknown error during API request')
  }
}

// OpenAI Client
export class OpenAIClient implements AIClient {
  private apiKey: string
  private model: string
  private timeoutMs: number

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey ?? process.env['OPENAI_API_KEY'] ?? ''
    this.model = config.model ?? 'gpt-4-turbo-preview'
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0
  }

  async generateExplanation(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): Promise<ExplanationResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = this.buildPrompt(features, prediction, homeTeam, awayTeam)

    const response = await fetchWithTimeout(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a sports analytics expert. Provide structured analysis of game predictions.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      },
      this.timeoutMs
    )

    const data = await response.json()
    return this.parseResponse(data, prediction)
  }

  private buildPrompt(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): string {
    return `Analyze this sports prediction:
Game: ${homeTeam} (home) vs ${awayTeam} (away)
Win Probability: ${homeTeam} ${(prediction.winProbHome * 100).toFixed(1)}% | ${awayTeam} ${(prediction.winProbAway * 100).toFixed(1)}%
Confidence: ${(prediction.confidence * 100).toFixed(1)}%
Predicted Spread: ${prediction.predictedSpread}

Key Features:
- ELO: ${homeTeam} ${features.homeTeamElo} | ${awayTeam} ${features.awayTeamElo}
- Recent Win Rate: ${homeTeam} ${(features.homeTeamRecentWinRate * 100).toFixed(0)}% | ${awayTeam} ${(features.awayTeamRecentWinRate * 100).toFixed(0)}%
- Rest Days: ${homeTeam} ${features.restDaysHome} | ${awayTeam} ${features.restDaysAway}

Provide a concise analysis with:
1. A 2-3 sentence summary explaining the prediction
2. Key factors supporting this prediction
3. Any concerns or caveats`
  }

  private parseResponse(data: unknown, prediction: PredictionResult): ExplanationResult {
    // Parse OpenAI response (simplified)
    const content = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]
      ?.message?.content

    return {
      summary: content ?? 'Analysis unavailable',
      factors: [],
      confidence: prediction.confidence,
      modelInsights: ['Generated via OpenAI GPT-4'],
      generatedBy: 'openai',
    }
  }
}

// Anthropic Client
export class AnthropicClient implements AIClient {
  private apiKey: string
  private model: string
  private timeoutMs: number

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey ?? process.env['ANTHROPIC_API_KEY'] ?? ''
    this.model = config.model ?? 'claude-3-opus-20240229'
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0
  }

  async generateExplanation(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): Promise<ExplanationResult> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured')
    }

    const prompt = this.buildPrompt(features, prediction, homeTeam, awayTeam)

    const response = await fetchWithTimeout(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      },
      this.timeoutMs
    )

    const data = await response.json()
    return this.parseResponse(data, prediction)
  }

  private buildPrompt(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): string {
    return `As a sports analytics expert, analyze this game prediction:

${homeTeam} (home) vs ${awayTeam} (away)
Predicted Winner: ${prediction.winProbHome > 0.5 ? homeTeam : awayTeam}
Win Probability: ${(Math.max(prediction.winProbHome, prediction.winProbAway) * 100).toFixed(1)}%
Model Confidence: ${(prediction.confidence * 100).toFixed(1)}%

Data Points:
- ELO Ratings: ${homeTeam} ${features.homeTeamElo} | ${awayTeam} ${features.awayTeamElo}
- Recent Form: ${homeTeam} ${(features.homeTeamRecentWinRate * 100).toFixed(0)}% | ${awayTeam} ${(features.awayTeamRecentWinRate * 100).toFixed(0)}%

Provide a broadcast-quality analysis explaining this prediction to viewers.`
  }

  private parseResponse(data: unknown, prediction: PredictionResult): ExplanationResult {
    const content = (data as { content?: { text?: string }[] })?.content?.[0]?.text

    return {
      summary: content ?? 'Analysis unavailable',
      factors: [],
      confidence: prediction.confidence,
      modelInsights: ['Generated via Anthropic Claude'],
      generatedBy: 'anthropic',
    }
  }
}

// Factory
export function createAIClient(config: AIProviderConfig): AIClient {
  switch (config.provider) {
    case 'openai':
      return new OpenAIClient(config)
    case 'anthropic':
      return new AnthropicClient(config)
    case 'local':
      return new LocalClient()
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}

/**
 * Local template-based explanation client.
 * Generates explanations without any external API calls - completely free.
 * Use this as the default option for cost-effective deployments.
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
