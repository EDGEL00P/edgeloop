'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './cards'
import { calculateEV, calculateKelly } from '@edgeloop/ml'

interface WhatIfScenario {
  homeWinProb: number
  awayWinProb: number
  injuryImpact: number
  lineMovement: number
  homeSpread: number
  overUnder: number
}

interface GameData {
  homeTeam: string
  awayTeam: string
  season: number
  week: number
  spreadOdds: number // Decimal odds
  totalOdds: number
  homeMoneyline: number
  awayMoneyline: number
  homeHistoricWinRate: number
  awayHistoricWinRate: number
}

interface WhatIfToolProps {
  game: GameData
  onScenarioSelect?: (scenario: WhatIfScenario) => void
}

export function WhatIfTool({ game, onScenarioSelect }: WhatIfToolProps) {
  const [scenario, setScenario] = useState<WhatIfScenario>({
    homeWinProb: game.homeHistoricWinRate * 100,
    awayWinProb: game.awayHistoricWinRate * 100,
    injuryImpact: 0,
    lineMovement: 0,
    homeSpread: -3.5, // Default spread
    overUnder: 45.5, // Default total
  })

  const analysis = useMemo(() => {
    const homeProb = (scenario.homeWinProb + scenario.injuryImpact) / 100
    const awayProb = 1 - homeProb

    // Calculate EV for different sides
    const homeSpreadEV = calculateEV(homeProb, game.spreadOdds) * 100
    const awaySpreadEV = calculateEV(awayProb, game.spreadOdds) * 100
    const homeMoneylineEV = calculateEV(homeProb, game.homeMoneyline) * 100
    const awayMoneylineEV = calculateEV(awayProb, game.awayMoneyline) * 100

    // Kelly calculations
    const homeSpreadKelly = calculateKelly(homeProb, game.spreadOdds, 0.25) * 100
    const homeMoneylineKelly = calculateKelly(homeProb, game.homeMoneyline, 0.25) * 100

    return {
      homeProb,
      awayProb,
      homeSpreadEV,
      awaySpreadEV,
      homeMoneylineEV,
      awayMoneylineEV,
      homeSpreadKelly,
      homeMoneylineKelly,
    }
  }, [scenario, game])

  const handleScenarioChange = (updates: Partial<WhatIfScenario>) => {
    const newScenario = { ...scenario, ...updates }
    setScenario(newScenario)
    onScenarioSelect?.(newScenario)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>What-If Analysis</CardTitle>
          <CardDescription>
            Adjust parameters to see how different scenarios affect edge detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Probability Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  {game.homeTeam} Win Probability
                </label>
                <span className="text-lg font-bold text-brand">{scenario.homeWinProb.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={scenario.homeWinProb}
                onChange={(e) => handleScenarioChange({ homeWinProb: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex gap-2 mt-2 text-xs text-gray-600">
                <button
                  onClick={() => handleScenarioChange({ homeWinProb: game.homeHistoricWinRate * 100 })}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Historic: {(game.homeHistoricWinRate * 100).toFixed(1)}%
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Injury Impact on {game.homeTeam}
                </label>
                <span className={`text-lg font-bold ${scenario.injuryImpact < 0 ? 'text-confidence-low' : 'text-confidence-high'}`}>
                  {scenario.injuryImpact > 0 ? '+' : ''}{scenario.injuryImpact.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="0.1"
                value={scenario.injuryImpact}
                onChange={(e) => handleScenarioChange({ injuryImpact: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Adjust for key player availability changes
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Line Movement Impact
                </label>
                <span className={`text-lg font-bold ${scenario.lineMovement > 0 ? 'text-confidence-high' : 'text-confidence-low'}`}>
                  {scenario.lineMovement > 0 ? '+' : ''}{scenario.lineMovement.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={scenario.lineMovement}
                onChange={(e) => handleScenarioChange({ lineMovement: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Line movement from opening to current
              </p>
            </div>
          </div>

          {/* Market Parameters */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Spread
              </label>
              <input
                type="number"
                step="0.5"
                value={scenario.homeSpread}
                onChange={(e) => handleScenarioChange({ homeSpread: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Over/Under
              </label>
              <input
                type="number"
                step="0.5"
                value={scenario.overUnder}
                onChange={(e) => handleScenarioChange({ overUnder: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={analysis.homeSpreadEV > 0 ? 'border-market-spread bg-market-spread/5' : 'border-confidence-low/30 bg-confidence-low/5'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-market-spread"></span>
              {game.homeTeam} Spread
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Expected Value</p>
              <p className={`text-2xl font-bold ${analysis.homeSpreadEV > 2 ? 'text-confidence-high' : analysis.homeSpreadEV > 0 ? 'text-confidence-medium' : 'text-confidence-low'}`}>
                {analysis.homeSpreadEV > 0 ? '+' : ''}{analysis.homeSpreadEV.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Kelly Bet Size</p>
              <p className="text-lg font-semibold">{analysis.homeSpreadKelly.toFixed(1)}%</p>
            </div>
            <div className="text-xs text-gray-500">
              {analysis.homeSpreadEV > 2 && '✓ Strong edge detected'}
              {analysis.homeSpreadEV > 0 && analysis.homeSpreadEV <= 2 && '⊕ Slight edge'}
              {analysis.homeSpreadEV <= 0 && '✗ No edge'}
            </div>
          </CardContent>
        </Card>

        <Card className={analysis.homeMoneylineEV > 0 ? 'border-confidence-high/30 bg-confidence-high/5' : 'border-confidence-low/30 bg-confidence-low/5'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{game.homeTeam} Moneyline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Expected Value</p>
              <p className={`text-2xl font-bold ${analysis.homeMoneylineEV > 2 ? 'text-confidence-high' : analysis.homeMoneylineEV > 0 ? 'text-confidence-medium' : 'text-confidence-low'}`}>
                {analysis.homeMoneylineEV > 0 ? '+' : ''}{analysis.homeMoneylineEV.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Kelly Bet Size</p>
              <p className="text-lg font-semibold">{analysis.homeMoneylineKelly.toFixed(1)}%</p>
            </div>
            <div className="text-xs text-gray-500">
              {analysis.homeMoneylineEV > 2 && '✓ Strong edge detected'}
              {analysis.homeMoneylineEV > 0 && analysis.homeMoneylineEV <= 2 && '⊕ Slight edge'}
              {analysis.homeMoneylineEV <= 0 && '✗ No edge'}
            </div>
          </CardContent>
        </Card>

        <Card className={analysis.awaySpreadEV > 0 ? 'border-market-spread bg-market-spread/5' : 'border-confidence-low/30 bg-confidence-low/5'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-market-spread"></span>
              {game.awayTeam} Spread
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Expected Value</p>
              <p className={`text-2xl font-bold ${analysis.awaySpreadEV > 2 ? 'text-confidence-high' : analysis.awaySpreadEV > 0 ? 'text-confidence-medium' : 'text-confidence-low'}`}>
                {analysis.awaySpreadEV > 0 ? '+' : ''}{analysis.awaySpreadEV.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Implied Probability</p>
              <p className="text-lg font-semibold">{(analysis.awayProb * 100).toFixed(1)}%</p>
            </div>
            <div className="text-xs text-gray-500">
              {analysis.awaySpreadEV > 2 && '✓ Strong edge detected'}
              {analysis.awaySpreadEV > 0 && analysis.awaySpreadEV <= 2 && '⊕ Slight edge'}
              {analysis.awaySpreadEV <= 0 && '✗ No edge'}
            </div>
          </CardContent>
        </Card>

        <Card className={analysis.awayMoneylineEV > 0 ? 'border-confidence-high/30 bg-confidence-high/5' : 'border-confidence-low/30 bg-confidence-low/5'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{game.awayTeam} Moneyline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Expected Value</p>
              <p className={`text-2xl font-bold ${analysis.awayMoneylineEV > 2 ? 'text-confidence-high' : analysis.awayMoneylineEV > 0 ? 'text-confidence-medium' : 'text-confidence-low'}`}>
                {analysis.awayMoneylineEV > 0 ? '+' : ''}{analysis.awayMoneylineEV.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Implied Probability</p>
              <p className="text-lg font-semibold">{(analysis.awayProb * 100).toFixed(1)}%</p>
            </div>
            <div className="text-xs text-gray-500">
              {analysis.awayMoneylineEV > 2 && '✓ Strong edge detected'}
              {analysis.awayMoneylineEV > 0 && analysis.awayMoneylineEV <= 2 && '⊕ Slight edge'}
              {analysis.awayMoneylineEV <= 0 && '✗ No edge'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
