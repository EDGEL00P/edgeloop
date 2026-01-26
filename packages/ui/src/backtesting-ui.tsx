'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './cards'
import { Button } from './primitives'

interface BacktestQuery {
  season: number
  startWeek: number
  endWeek: number
  edgeType: 'ev' | 'arbitrage' | 'middle' | 'all'
  minEV: number
  minConfidence: number
  stakingStrategy: 'kelly' | 'fixed' | 'equal'
  bankroll: number
}

interface BacktestResult {
  totalBets: number
  winningBets: number
  losingBets: number
  winRate: number
  totalProfit: number
  roi: number
  sharpeRatio: number
  maxDrawdown: number
  avgWin: number
  avgLoss: number
  profitFactor: number
}

async function runBacktest(query: BacktestQuery): Promise<BacktestResult> {
  const response = await fetch('/api/backtesting/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  })

  if (!response.ok) {
    throw new Error('Backtesting failed')
  }

  return response.json()
}

export function BacktestingUI() {
  const currentSeason = new Date().getFullYear()
  const [query, setQuery] = useState<BacktestQuery>({
    season: currentSeason,
    startWeek: 1,
    endWeek: 18,
    edgeType: 'all',
    minEV: 2.5,
    minConfidence: 50,
    stakingStrategy: 'kelly',
    bankroll: 1000,
  })

  const [submitted, setSubmitted] = useState(false)
  const { data: result, isLoading } = useQuery({
    queryKey: ['backtest', submitted ? query : null],
    queryFn: () => runBacktest(query),
    enabled: submitted,
  })

  const handleRunBacktest = () => {
    setSubmitted(true)
  }

  const handleExport = (format: 'csv' | 'json') => {
    if (!result) return

    const content =
      format === 'csv'
        ? `Metric,Value\nTotal Bets,${result.totalBets}\nWinning Bets,${result.winningBets}\nLosing Bets,${result.losingBets}\nWin Rate,${(result.winRate * 100).toFixed(2)}%\nTotal Profit,$${result.totalProfit.toFixed(2)}\nROI,${(result.roi * 100).toFixed(2)}%`
        : JSON.stringify(result, null, 2)

    const element = document.createElement('a')
    const file = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    element.href = URL.createObjectURL(file)
    element.download = `backtest-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="space-y-6">
      {/* Query Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Backtesting Configuration</CardTitle>
          <CardDescription>Set parameters and run a historical backtest of your edge detection strategy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Season & Weeks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
              <input
                type="number"
                value={query.season}
                onChange={(e) => setQuery({ ...query, season: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={query.startWeek}
                  onChange={(e) => setQuery({ ...query, startWeek: parseInt(e.target.value) })}
                  placeholder="Start"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <span className="flex items-center text-gray-500">-</span>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={query.endWeek}
                  onChange={(e) => setQuery({ ...query, endWeek: parseInt(e.target.value) })}
                  placeholder="End"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Edge Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edge Type</label>
              <select
                value={query.edgeType}
                onChange={(e) => setQuery({ ...query, edgeType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Edges</option>
                <option value="ev">EV Only</option>
                <option value="arbitrage">Arbitrage Only</option>
                <option value="middle">Middle Only</option>
              </select>
            </div>

            {/* Min EV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min EV (%)</label>
              <input
                type="number"
                step="0.1"
                value={query.minEV}
                onChange={(e) => setQuery({ ...query, minEV: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Confidence (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={query.minConfidence}
                onChange={(e) => setQuery({ ...query, minConfidence: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Staking Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staking Strategy</label>
              <select
                value={query.stakingStrategy}
                onChange={(e) => setQuery({ ...query, stakingStrategy: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="kelly">Kelly Criterion (25%)</option>
                <option value="fixed">Fixed ($50 per bet)</option>
                <option value="equal">Equal Units</option>
              </select>
            </div>

            {/* Bankroll */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting Bankroll ($)</label>
              <input
                type="number"
                min="100"
                value={query.bankroll}
                onChange={(e) => setQuery({ ...query, bankroll: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={handleRunBacktest} disabled={isLoading}>
              {isLoading ? 'Running...' : 'Run Backtest'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <Card className={result.totalProfit > 0 ? 'border-confidence-high/30 bg-confidence-high/5' : 'border-confidence-low/30 bg-confidence-low/5'}>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className={`text-2xl font-bold ${result.totalProfit > 0 ? 'text-confidence-high' : 'text-confidence-low'}`}>
                    ${result.totalProfit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className={`text-2xl font-bold ${result.roi > 5 ? 'text-confidence-high' : result.roi > 0 ? 'text-confidence-medium' : 'text-confidence-low'}`}>
                    {(result.roi * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className={`text-2xl font-bold ${result.winRate > 0.55 ? 'text-confidence-high' : result.winRate > 0.5 ? 'text-confidence-medium' : 'text-muted-foreground'}`}>{(result.winRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className={`text-2xl font-bold ${result.sharpeRatio > 1.5 ? 'text-confidence-high' : result.sharpeRatio > 1 ? 'text-confidence-medium' : 'text-muted-foreground'}`}>{result.sharpeRatio.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Bets</p>
                  <p className="text-lg font-semibold">{result.totalBets}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Winning Bets</p>
                  <p className="text-lg font-semibold text-confidence-high">{result.winningBets}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Losing Bets</p>
                  <p className="text-lg font-semibold text-confidence-low">{result.losingBets}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Win</p>
                  <p className="text-lg font-semibold text-confidence-high">${result.avgWin.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Loss</p>
                  <p className="text-lg font-semibold text-confidence-low">-${result.avgLoss.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Profit Factor</p>
                  <p className={`text-lg font-semibold ${result.profitFactor > 1.5 ? 'text-confidence-high' : result.profitFactor > 1 ? 'text-confidence-medium' : 'text-confidence-low'}`}>{result.profitFactor.toFixed(2)}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-muted-foreground">Max Drawdown</p>
                  <p className="text-lg font-semibold text-confidence-low">{(result.maxDrawdown * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Results</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" onClick={() => handleExport('csv')}>
                Download CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                Download JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
