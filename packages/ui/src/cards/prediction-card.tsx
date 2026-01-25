'use client'

import * as React from 'react'
import { cn, getConfidenceTier, formatPercentage } from '../utils'
import { Badge } from '../primitives/badge'
import { ConfidenceGauge } from '../charts/confidence-gauge'
import { TrendingUp, TrendingDown, Minus, Brain, ChevronDown, ChevronUp } from 'lucide-react'

export interface PredictionFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  description: string
}

export interface PredictionCardProps {
  gameId: string
  homeTeamName: string
  awayTeamName: string
  predictedWinner: 'home' | 'away'
  confidence: number
  homeWinProbability: number
  awayWinProbability: number
  factors: PredictionFactor[]
  modelVersion: string
  generatedAt: string
  onExplainClick?: () => void
  className?: string
}

export function PredictionCard({
  homeTeamName,
  awayTeamName,
  predictedWinner,
  confidence,
  homeWinProbability,
  awayWinProbability,
  factors,
  modelVersion,
  generatedAt,
  onExplainClick,
  className,
}: PredictionCardProps) {
  const [showFactors, setShowFactors] = React.useState(false)
  const tier = getConfidenceTier(confidence)

  const tierLabels = {
    high: 'High Confidence',
    medium: 'Moderate Confidence',
    low: 'Low Confidence',
  }

  const tierBadgeVariants = {
    high: 'success' as const,
    medium: 'warning' as const,
    low: 'danger' as const,
  }

  const winnerName = predictedWinner === 'home' ? homeTeamName : awayTeamName

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-broadcast-gold" />
            <span className="font-semibold">AI Prediction</span>
          </div>
          <Badge variant={tierBadgeVariants[tier]}>{tierLabels[tier]}</Badge>
        </div>

        <div className="text-center py-4">
          <div className="text-sm text-muted-foreground mb-1">Predicted Winner</div>
          <div className="text-2xl font-bold text-gradient">{winnerName}</div>
        </div>

        <ConfidenceGauge confidence={confidence} size="md" />
      </div>

      {/* Win Probabilities */}
      <div className="p-4 border-b border-border">
        <div className="text-sm text-muted-foreground mb-3">Win Probability</div>
        <div className="space-y-2">
          <ProbabilityBar
            teamName={homeTeamName}
            probability={homeWinProbability}
            isWinner={predictedWinner === 'home'}
          />
          <ProbabilityBar
            teamName={awayTeamName}
            probability={awayWinProbability}
            isWinner={predictedWinner === 'away'}
          />
        </div>
      </div>

      {/* Factors Toggle */}
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        onClick={() => setShowFactors(!showFactors)}
      >
        <span className="text-sm font-medium">Key Factors ({factors.length})</span>
        {showFactors ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Factors List */}
      {showFactors && (
        <div className="p-4 pt-0 space-y-3">
          {factors.map((factor, index) => (
            <FactorItem key={index} factor={factor} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>Model: {modelVersion}</span>
        <span>{new Date(generatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  )
}

function ProbabilityBar({
  teamName,
  probability,
  isWinner,
}: {
  teamName: string
  probability: number
  isWinner: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-20 text-sm truncate', isWinner && 'font-semibold')}>
        {teamName}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', {
            'bg-broadcast-red': isWinner,
            'bg-muted-foreground': !isWinner,
          })}
          style={{ width: formatPercentage(probability, 0) }}
        />
      </div>
      <div className={cn('w-12 text-sm text-right tabular-nums', isWinner && 'font-semibold')}>
        {formatPercentage(probability, 0)}
      </div>
    </div>
  )
}

function FactorItem({ factor }: { factor: PredictionFactor }) {
  const impactIcons = {
    positive: <TrendingUp className="h-4 w-4 text-confidence-high" />,
    negative: <TrendingDown className="h-4 w-4 text-confidence-low" />,
    neutral: <Minus className="h-4 w-4 text-muted-foreground" />,
  }

  const impactColors = {
    positive: 'border-l-confidence-high',
    negative: 'border-l-confidence-low',
    neutral: 'border-l-muted-foreground',
  }

  return (
    <div className={cn('pl-3 border-l-2', impactColors[factor.impact])}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {impactIcons[factor.impact]}
          <span className="text-sm font-medium">{factor.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {(factor.weight * 100).toFixed(0)}% weight
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{factor.description}</p>
    </div>
  )
}
