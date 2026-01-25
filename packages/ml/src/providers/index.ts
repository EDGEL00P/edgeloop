// AI Provider integrations for explanation synthesis
import type { AIProviderConfig, ExplanationResult, FeatureVector, PredictionResult } from '../types'

export interface AIClient {
  generateExplanation(
    features: FeatureVector,
    prediction: PredictionResult,
    homeTeam: string,
    awayTeam: string
  ): Promise<ExplanationResult>
  isConfigured(): boolean
}

// OpenAI Client
export class OpenAIClient implements AIClient {
  private apiKey: string
  private model: string

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? ''
    this.model = config.model ?? 'gpt-4-turbo-preview'
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    })

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

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY ?? ''
    this.model = config.model ?? 'claude-3-opus-20240229'
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
    })

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
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}
