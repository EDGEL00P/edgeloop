'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@edgeloop/ui/cards'
import { Button } from '@edgeloop/ui/primitives'
import { calculateKelly, calculateEV } from '@edgeloop/ml'

interface BetLeg {
  id: string
  gameId: string
  homeTeam: string
  awayTeam: string
  market: string
  selection: string
  odds: number
  impliedProb: number
  trueProb?: number
  ev?: number
}

interface BetSlipProps {
  onClose?: () => void
  defaultLeg?: Partial<BetLeg>
}

export function BetSlip({ onClose, defaultLeg }: BetSlipProps) {
  const [legs, setLegs] = useState<BetLeg[]>(defaultLeg ? [{
    id: '1',
    gameId: defaultLeg.gameId || '',
    homeTeam: defaultLeg.homeTeam || '',
    awayTeam: defaultLeg.awayTeam || '',
    market: defaultLeg.market || '',
    selection: defaultLeg.selection || '',
    odds: defaultLeg.odds || 0,
    impliedProb: defaultLeg.impliedProb || 0,
    trueProb: defaultLeg.trueProb,
    ev: defaultLeg.ev,
  }] : [])

  const [bankroll, setBankroll] = useState(1000)
  const [kellyFraction] = useState(0.25) // Fractional Kelly
  const [stakeType, setStakeType] = useState<'kelly' | 'fixed' | 'percentage'>('kelly')
  const [customStake, setCustomStake] = useState(0)

  const calculations = useMemo(() => {
    if (legs.length === 0) return null

    // Parlay odds (multiply all odds)
    const parlayOdds = legs.reduce((acc, leg) => acc * leg.odds, 1)
    const impliedProbParlay = 1 / parlayOdds

    // Calculate EV for each leg
    const legsWithEV = legs.map((leg) => ({
      ...leg,
      ev: leg.trueProb ? calculateEV(leg.trueProb, leg.odds) * 100 : undefined,
    }))

    // Expected value of parlay (product of individual EVs)
    const expectedValue = legsWithEV.reduce((acc, leg) => {
      return acc * (1 + (leg.ev || 0) / 100)
    }, 1)

    // Kelly calculation for parlay
    const parlayProbability = legs.reduce((acc, leg) => acc * leg.trueProb!, 1)
    const kelly = parlayProbability > 0 ? calculateKelly(parlayProbability, parlayOdds, kellyFraction) : 0

    // Determine stake
    let stakeAmount = 0
    if (stakeType === 'kelly') {
      stakeAmount = bankroll * kelly
    } else if (stakeType === 'percentage') {
      stakeAmount = bankroll * (customStake / 100)
    } else {
      stakeAmount = customStake
    }

    const potentialWin = stakeAmount * parlayOdds - stakeAmount
    const riskReward = stakeAmount > 0 ? potentialWin / stakeAmount : 0

    return {
      parlayOdds,
      impliedProbParlay,
      kelly,
      stakeAmount,
      potentialWin,
      riskReward,
      expectedValue,
      legsWithEV,
    }
  }, [legs, bankroll, kellyFraction, stakeType, customStake])

  const handleAddLeg = () => {
    const newId = String(Math.max(...legs.map((l) => parseInt(l.id)), 0) + 1)
    setLegs([
      ...legs,
      {
        id: newId,
        gameId: '',
        homeTeam: '',
        awayTeam: '',
        market: '',
        selection: '',
        odds: 0,
        impliedProb: 0,
      },
    ])
  }

  const handleRemoveLeg = (id: string) => {
    setLegs(legs.filter((leg) => leg.id !== id))
  }

  const handleUpdateLeg = (id: string, updates: Partial<BetLeg>) => {
    setLegs(legs.map((leg) => (leg.id === id ? { ...leg, ...updates } : leg)))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bet Slip</CardTitle>
          <CardDescription>
            {legs.length === 0 ? 'Add legs to create a parlay' : `${legs.length} leg parlay`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Legs */}
          <div className="space-y-3">
            {legs.map((leg, index) => (
              <BetLegForm
                key={leg.id}
                leg={leg}
                index={index + 1}
                onUpdate={(updates) => handleUpdateLeg(leg.id, updates)}
                onRemove={() => handleRemoveLeg(leg.id)}
                canRemove={legs.length > 1}
              />
            ))}
          </div>

          <Button
            onClick={handleAddLeg}
            variant="outline"
            className="w-full"
          >
            + Add Leg
          </Button>

          {/* Bankroll Input */}
          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Bankroll ($)
            </label>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => setBankroll(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Stake Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Stake Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['kelly', 'percentage', 'fixed'].map((type) => (
                <button
                  key={type}
                  onClick={() => setStakeType(type as any)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    stakeType === type
                      ? 'bg-brand text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type === 'kelly' ? 'Kelly' : type === 'percentage' ? '%' : '$'}
                </button>
              ))}
            </div>

            {stakeType !== 'kelly' && (
              <input
                type="number"
                value={customStake}
                onChange={(e) => setCustomStake(parseFloat(e.target.value))}
                placeholder={stakeType === 'percentage' ? 'e.g., 2' : 'e.g., 50'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {calculations && (
        <Card className="bg-gradient-to-br from-broadcast-navy to-broadcast-steel border-broadcast-gold/30">
          <CardHeader>
            <CardTitle className="text-broadcast-gold">Parlay Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Parlay Odds</p>
                <p className="text-2xl font-bold text-broadcast-gold">{calculations.parlayOdds.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Implied Probability</p>
                <p className="text-2xl font-bold text-broadcast-gold">{(calculations.impliedProbParlay * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recommended Stake</p>
                <p className="text-2xl font-bold text-confidence-high">${calculations.stakeAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Potential Win</p>
                <p className="text-2xl font-bold text-confidence-high">${calculations.potentialWin.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Risk/Reward Ratio</p>
                <p className="text-2xl font-bold text-broadcast-white">{calculations.riskReward.toFixed(2)}:1</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kelly Percentage</p>
                <p className="text-2xl font-bold text-broadcast-white">{(calculations.kelly * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
        <Button className="w-full sm:w-auto" disabled={legs.length === 0}>
          Place Bet
        </Button>
      </div>
    </div>
  )
}

interface BetLegFormProps {
  leg: BetLeg
  index: number
  onUpdate: (updates: Partial<BetLeg>) => void
  onRemove: () => void
  canRemove: boolean
}

function BetLegForm({ leg, index, onUpdate, onRemove, canRemove }: BetLegFormProps) {
  const NFL_TEAMS = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
    'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC', 'LAR', 'LV', 'MIA',
    'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB',
    'TEN', 'WAS',
  ]

  return (
    <div className="p-4 border border-gray-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium">Leg {index}</p>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Home Team</label>
          <select
            value={leg.homeTeam}
            onChange={(e) => onUpdate({ homeTeam: e.target.value })}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Select team</option>
            {NFL_TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Away Team</label>
          <select
            value={leg.awayTeam}
            onChange={(e) => onUpdate({ awayTeam: e.target.value })}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Select team</option>
            {NFL_TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Market</label>
          <select
            value={leg.market}
            onChange={(e) => onUpdate({ market: e.target.value })}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Select market</option>
            <option value="spread">Spread</option>
            <option value="moneyline">Moneyline</option>
            <option value="total">Total</option>
            <option value="props">Props</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Selection</label>
          <input
            type="text"
            value={leg.selection}
            onChange={(e) => onUpdate({ selection: e.target.value })}
            placeholder="e.g., Home -3.5"
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Odds</label>
          <input
            type="number"
            step="0.01"
            value={leg.odds}
            onChange={(e) => onUpdate({ odds: parseFloat(e.target.value) })}
            placeholder="e.g., 1.91"
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">True Probability (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={leg.trueProb ? leg.trueProb * 100 : ''}
            onChange={(e) => onUpdate({ trueProb: parseFloat(e.target.value) / 100 })}
            placeholder="e.g., 55"
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {leg.ev !== undefined && (
        <div className={`p-2 rounded text-sm ${
          leg.ev > 2 ? 'bg-confidence-high/10 border border-confidence-high/30' :
          leg.ev > 0 ? 'bg-confidence-medium/10 border border-confidence-medium/30' :
          'bg-confidence-low/10 border border-confidence-low/30'
        }`}>
          <p className="text-muted-foreground">Expected Value</p>
          <p className={`font-bold ${
            leg.ev > 2 ? 'text-confidence-high' :
            leg.ev > 0 ? 'text-confidence-medium' :
            'text-confidence-low'
          }`}>
            {(leg.ev * 100).toFixed(2)}%
          </p>
        </div>
      )}
    </div>
  )
}
