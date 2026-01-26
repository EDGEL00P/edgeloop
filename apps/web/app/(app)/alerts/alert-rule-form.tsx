'use client'

import { useState } from 'react'
import type { CreateAlertRuleInput } from '@edgeloop/api/alerts'
import { Button } from '@edgeloop/ui/primitives'

const ALERT_TYPES = [
  { value: 'ev', label: 'Expected Value (EV)', description: 'Alert on positive EV opportunities' },
  { value: 'arbitrage', label: 'Arbitrage', description: 'Alert on riskless arbitrage opportunities' },
  { value: 'middle', label: 'Middle', description: 'Alert on middle opportunities (two-way edges)' },
  { value: 'line_movement', label: 'Line Movement', description: 'Alert on significant line moves' },
  { value: 'injury', label: 'Injury Report', description: 'Alert on key player injuries' },
] as const

type AlertType = (typeof ALERT_TYPES)[number]['value']

const NFL_TEAMS = [
  'ARI',
  'ATL',
  'BAL',
  'BUF',
  'CAR',
  'CHI',
  'CIN',
  'CLE',
  'DAL',
  'DEN',
  'DET',
  'GB',
  'HOU',
  'IND',
  'JAX',
  'KC',
  'LAC',
  'LAR',
  'LV',
  'MIA',
  'MIN',
  'NE',
  'NO',
  'NYG',
  'NYJ',
  'PHI',
  'PIT',
  'SEA',
  'SF',
  'TB',
  'TEN',
  'WAS',
]

const BOOKS = [
  'DraftKings',
  'FanDuel',
  'BetMGM',
  'Caesars',
  'Pointsbet',
  'BetRivers',
  'Wynn',
  'Circa',
]

interface AlertRuleFormProps {
  onSubmit: (input: CreateAlertRuleInput) => void
  onCancel: () => void
  isLoading?: boolean
}

export function AlertRuleForm({ onSubmit, onCancel, isLoading }: AlertRuleFormProps) {
  const [formData, setFormData] = useState<CreateAlertRuleInput>({
    name: '',
    description: '',
    config: {
      type: 'ev',
    },
    delivery: {
      email: true,
    },
  })

  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const config = {
      ...formData.config,
      teams: selectedTeams.length > 0 ? selectedTeams : undefined,
      books: selectedBooks.length > 0 ? selectedBooks : undefined,
    }

    onSubmit({
      ...formData,
      config,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., High EV Favorites"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description of your alert rule"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
      </div>

      {/* Alert Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Alert Type *</label>
        <div className="space-y-2">
          {ALERT_TYPES.map((type) => (
            <label key={type.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="alertType"
                value={type.value}
                checked={(formData.config as Record<string, unknown>).type === type.value}
                onChange={() =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, type: type.value as AlertType },
                  })
                }
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* EV Threshold */}
      {(formData.config as Record<string, unknown>).type === 'ev' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum EV (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={((formData.config as Record<string, unknown>).minEV as number | undefined) ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                config: { ...formData.config, minEV: parseFloat(e.target.value) || undefined },
              })
            }
            placeholder="e.g., 2.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Only alert on opportunities with EV above this threshold</p>
        </div>
      )}

      {/* Line Movement Threshold */}
      {(formData.config as Record<string, unknown>).type === 'line_movement' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Movement Threshold (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={((formData.config as Record<string, unknown>).lineMovementThreshold as number | undefined) ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                config: {
                  ...formData.config,
                  lineMovementThreshold: parseFloat(e.target.value) || undefined,
                },
              })
            }
            placeholder="e.g., 2.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Alert when line moves more than this percentage</p>
        </div>
      )}

      {/* Teams Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Teams (optional)</label>
        <div className="grid grid-cols-4 gap-2">
          {NFL_TEAMS.map((team) => (
            <button
              key={team}
              type="button"
              onClick={() =>
                setSelectedTeams((prev) =>
                  prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
                )
              }
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTeams.includes(team)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {team}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Leave empty to track all teams</p>
      </div>

      {/* Books Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sportsbooks (optional)</label>
        <div className="grid grid-cols-2 gap-2">
          {BOOKS.map((book) => (
            <button
              key={book}
              type="button"
              onClick={() =>
                setSelectedBooks((prev) =>
                  prev.includes(book) ? prev.filter((b) => b !== book) : [...prev, book]
                )
              }
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBooks.includes(book)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {book}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Leave empty to track all books</p>
      </div>

      {/* Delivery Methods */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Notification Methods *</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!((formData.delivery as Record<string, unknown>).email as boolean | undefined)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delivery: { ...formData.delivery, email: e.target.checked },
                })
              }
              className="rounded"
            />
            <span className="text-sm">Email notification</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!((formData.delivery as Record<string, unknown>).slack as boolean | undefined)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delivery: { ...formData.delivery, slack: e.target.checked },
                })
              }
              className="rounded"
            />
            <span className="text-sm">Slack webhook</span>
          </label>

          {!!((formData.delivery as Record<string, unknown>).slack as boolean | undefined) && (
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={((formData.delivery as Record<string, unknown>).webhook as string | undefined) ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delivery: { ...formData.delivery, webhook: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required={!!((formData.delivery as Record<string, unknown>).slack as boolean | undefined)}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Alert Rule'}
        </Button>
      </div>
    </form>
  )
}
