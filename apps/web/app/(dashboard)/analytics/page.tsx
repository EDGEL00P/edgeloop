'use client'

import { BarChart3, TrendingUp, Activity, Brain, Zap, Target } from 'lucide-react'
import { StatCard, MomentumChart, ConfidenceGauge, Badge, BroadcastPanel } from '@edgeloop/ui'
import { trpc } from '@/lib/trpc'

// Mock momentum data
const mockMomentumData = Array.from({ length: 60 }, (_, i) => ({
  timestamp: i * 60,
  momentum: Math.sin(i / 10) * 0.5 + (Math.random() - 0.5) * 0.3,
  quarter: Math.floor(i / 15) + 1,
}))

export default function AnalyticsPage() {
  const { data: modelStatus } = trpc.analytics.modelStatus.useQuery()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-broadcast-red" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Model performance, system health, and real-time metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Model Accuracy"
          value="94.7%"
          trend={{ direction: 'up', value: '+2.3%', isPositive: true }}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          title="Predictions Today"
          value="847"
          trend={{ direction: 'up', value: '+12%', isPositive: true }}
          icon={<Brain className="h-4 w-4" />}
        />
        <StatCard
          title="Avg Confidence"
          value="71.2%"
          subtitle="Across all predictions"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="API Latency"
          value="48ms"
          subtitle="P99 response time"
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          title="Live Games"
          value="3"
          subtitle="Currently tracking"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Uptime"
          value="99.9%"
          subtitle="Last 30 days"
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Momentum Chart */}
        <BroadcastPanel className="p-6">
          <MomentumChart
            data={mockMomentumData}
            homeTeamName="KC"
            awayTeamName="BUF"
            homeTeamColor="#E31837"
            awayTeamColor="#00338D"
          />
        </BroadcastPanel>

        {/* Model Health */}
        <BroadcastPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4">Model Health</h3>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Accuracy</span>
                <Badge variant="success">Healthy</Badge>
              </div>
              <ConfidenceGauge confidence={0.947} showLabel={false} size="lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Training Data</div>
                <div className="text-2xl font-bold">12.8K</div>
                <div className="text-xs text-muted-foreground">games processed</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Last Trained</div>
                <div className="text-2xl font-bold">2h</div>
                <div className="text-xs text-muted-foreground">ago</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Feature Extraction</span>
                <span className="text-confidence-high">OK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Inference Pipeline</span>
                <span className="text-confidence-high">OK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Data Sync</span>
                <span className="text-confidence-high">OK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Odds API</span>
                <span className="text-confidence-high">Connected</span>
              </div>
            </div>
          </div>
        </BroadcastPanel>
      </div>

      {/* Model Details */}
      <BroadcastPanel className="p-6">
        <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Version</div>
            <div className="font-mono">{modelStatus?.version ?? 'v2.4.1'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Architecture</div>
            <div className="font-mono">Ensemble XGBoost + Neural</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Features</div>
            <div className="font-mono">247 engineered features</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Update Frequency</div>
            <div className="font-mono">Real-time + Daily retrain</div>
          </div>
        </div>
      </BroadcastPanel>

      {/* Recent Activity */}
      <BroadcastPanel className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Predictions</h3>
        <div className="space-y-3">
          {[
            { game: 'KC vs BUF', prediction: 'KC', confidence: 72, result: 'pending' },
            { game: 'SF vs DAL', prediction: 'SF', confidence: 68, result: 'pending' },
            { game: 'PHI vs DET', prediction: 'PHI', confidence: 61, result: 'correct' },
            { game: 'BAL vs CIN', prediction: 'BAL', confidence: 78, result: 'correct' },
            { game: 'MIA vs NE', prediction: 'MIA', confidence: 65, result: 'incorrect' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{item.game}</span>
                <Badge variant="secondary">{item.prediction}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{item.confidence}%</span>
                <Badge
                  variant={
                    item.result === 'correct'
                      ? 'success'
                      : item.result === 'incorrect'
                        ? 'danger'
                        : 'secondary'
                  }
                >
                  {item.result}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </BroadcastPanel>
    </div>
  )
}
