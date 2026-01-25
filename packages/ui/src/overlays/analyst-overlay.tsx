'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { cn, getConfidenceTier, formatPercentage } from '../utils'
import { Badge } from '../primitives/badge'
import { Button } from '../primitives/button'

export interface AnalystFactor {
  category: string
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  value: string
  explanation: string
}

export interface AnalystOverlayProps {
  isOpen: boolean
  onClose: () => void
  gameTitle: string
  predictedWinner: string
  confidence: number
  factors: AnalystFactor[]
  summary: string
  modelInsights?: string[]
  className?: string
}

export function AnalystOverlay({
  isOpen,
  onClose,
  gameTitle,
  predictedWinner,
  confidence,
  factors,
  summary,
  modelInsights = [],
  className,
}: AnalystOverlayProps) {
  const tier = getConfidenceTier(confidence)

  const groupedFactors = factors.reduce(
    (acc, factor) => {
      if (!acc[factor.category]) {
        acc[factor.category] = []
      }
      acc[factor.category].push(factor)
      return acc
    },
    {} as Record<string, AnalystFactor[]>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 bottom-0 w-full max-w-lg bg-broadcast-navy border-l border-broadcast-steel/30 z-50 overflow-hidden flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="p-6 border-b border-broadcast-steel/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-broadcast-red/20 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-broadcast-red" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">AI Analysis</h2>
                    <p className="text-sm text-muted-foreground">{gameTitle}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Prediction Summary */}
              <div className="bg-broadcast-slate/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Predicted Winner</span>
                  <Badge
                    variant={
                      tier === 'high' ? 'success' : tier === 'medium' ? 'warning' : 'danger'
                    }
                  >
                    {formatPercentage(confidence, 0)} Confidence
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gradient">{predictedWinner}</div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Summary
                </h3>
                <p className="text-sm leading-relaxed">{summary}</p>
              </div>

              {/* Factors by Category */}
              {Object.entries(groupedFactors).map(([category, categoryFactors]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {categoryFactors.map((factor, index) => (
                      <FactorCard key={index} factor={factor} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Model Insights */}
              {modelInsights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Model Insights
                  </h3>
                  <div className="space-y-2">
                    {modelInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-broadcast-steel/30 bg-broadcast-slate/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Analysis powered by EdgeLoop AI</span>
                <span>Updated just now</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function FactorCard({ factor }: { factor: AnalystFactor }) {
  const impactConfig = {
    positive: {
      icon: TrendingUp,
      color: 'text-confidence-high',
      bg: 'bg-confidence-high/10',
      border: 'border-confidence-high/30',
    },
    negative: {
      icon: TrendingDown,
      color: 'text-confidence-low',
      bg: 'bg-confidence-low/10',
      border: 'border-confidence-low/30',
    },
    neutral: {
      icon: Minus,
      color: 'text-muted-foreground',
      bg: 'bg-muted/10',
      border: 'border-muted/30',
    },
  }

  const config = impactConfig[factor.impact]
  const Icon = config.icon

  return (
    <div className={cn('rounded-lg border p-3', config.bg, config.border)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.color)} />
          <span className="text-sm font-medium">{factor.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{factor.value}</span>
          <span className="text-xs text-muted-foreground">
            ({(factor.weight * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{factor.explanation}</p>
    </div>
  )
}
