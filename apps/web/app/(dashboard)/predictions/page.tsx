'use client'

import { useState } from 'react'
import { Brain, RefreshCw } from 'lucide-react'
import {
  PredictionCard,
  WinProbabilityChart,
  Button,
  StatCard,
  AnalystOverlay,
  type AnalystFactor,
} from '@edgeloop/ui'
import { trpc } from '@/lib/trpc'

const mockAnalystFactors: AnalystFactor[] = [
  {
    category: 'Offense',
    name: 'Points Per Game',
    impact: 'positive',
    weight: 0.25,
    value: '28.5 PPG',
    explanation: 'Home team averaging 28.5 points per game, 4th best in the league.',
  },
  {
    category: 'Offense',
    name: 'Red Zone Efficiency',
    impact: 'positive',
    weight: 0.15,
    value: '68%',
    explanation: 'Converting 68% of red zone opportunities into touchdowns.',
  },
  {
    category: 'Defense',
    name: 'Points Allowed',
    impact: 'negative',
    weight: 0.12,
    value: '24.2 PA',
    explanation: 'Allowing 24.2 points per game, slightly above league average.',
  },
  {
    category: 'Defense',
    name: 'Turnover Margin',
    impact: 'positive',
    weight: 0.18,
    value: '+8',
    explanation: 'Strong +8 turnover differential creating scoring opportunities.',
  },
  {
    category: 'Situational',
    name: 'Home Field',
    impact: 'positive',
    weight: 0.15,
    value: '7-1',
    explanation: '7-1 record at home this season with strong crowd support.',
  },
  {
    category: 'Situational',
    name: 'Rest Advantage',
    impact: 'neutral',
    weight: 0.08,
    value: 'Even',
    explanation: 'Both teams coming off standard 7-day rest periods.',
  },
]

export default function PredictionsPage() {
  const [selectedGameId] = useState<string>('game-1')
  const [showAnalyst, setShowAnalyst] = useState(false)

  const { data: prediction, isLoading: predLoading } = trpc.predictions.forGame.useQuery({
    gameId: selectedGameId,
  })

  const { data: winProbData, isLoading: winProbLoading } =
    trpc.predictions.winProbability.useQuery({
      gameId: selectedGameId,
    })

  const { data: modelStatus } = trpc.analytics.modelStatus.useQuery()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-broadcast-gold" />
            Predictions
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered game predictions with explainable insights
          </p>
        </div>

        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Model Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Model Accuracy"
          value={modelStatus?.accuracy ? `${(modelStatus.accuracy * 100).toFixed(1)}%` : '—'}
          trend={{ direction: 'up', value: '+2.3%', isPositive: true }}
        />
        <StatCard
          title="Latency P99"
          value={modelStatus?.latencyP99 ? `${modelStatus.latencyP99}ms` : '—'}
          subtitle="Response time"
        />
        <StatCard
          title="Games Analyzed"
          value={modelStatus?.gamesAnalyzed?.toLocaleString() ?? '—'}
          trend={{ direction: 'up', value: '+127', isPositive: true }}
        />
        <StatCard
          title="Model Version"
          value={modelStatus?.version ?? '—'}
          subtitle="Latest stable"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Card */}
        <div className="lg:col-span-1">
          {predLoading ? (
            <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
          ) : prediction ? (
            <div className="space-y-4">
              <PredictionCard
                {...prediction}
                homeTeamName="Kansas City Chiefs"
                awayTeamName="Buffalo Bills"
                onExplainClick={() => setShowAnalyst(true)}
              />
              <Button className="w-full" onClick={() => setShowAnalyst(true)}>
                <Brain className="h-4 w-4 mr-2" />
                View Full Analysis
              </Button>
            </div>
          ) : (
            <div className="h-96 bg-card border border-border rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Select a game to view predictions</p>
            </div>
          )}
        </div>

        {/* Win Probability Chart */}
        <div className="lg:col-span-2 broadcast-panel p-6">
          {winProbLoading ? (
            <div className="h-80 animate-pulse bg-muted/20 rounded-lg" />
          ) : winProbData ? (
            <WinProbabilityChart
              data={winProbData}
              homeTeamName="KC"
              awayTeamName="BUF"
              homeTeamColor="#E31837"
              awayTeamColor="#00338D"
            />
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Analyst Overlay */}
      <AnalystOverlay
        isOpen={showAnalyst}
        onClose={() => setShowAnalyst(false)}
        gameTitle="Kansas City Chiefs vs Buffalo Bills"
        predictedWinner="Kansas City Chiefs"
        confidence={0.72}
        factors={mockAnalystFactors}
        summary="The Chiefs hold a slight edge in this matchup due to their superior offensive efficiency and strong home field advantage. While Buffalo's defense has been solid, Kansas City's ability to create turnovers and convert in the red zone gives them the edge. The model assigns high confidence to this prediction based on historical performance in similar matchups."
        modelInsights={[
          'This prediction aligns with historical patterns for Chiefs home games',
          'Weather conditions (moderate wind) may slightly favor the home team',
          'Both teams are fully healthy with no significant injuries',
        ]}
      />
    </div>
  )
}
