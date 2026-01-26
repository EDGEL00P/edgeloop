'use client'

import { useState } from 'react'
import { ComboBox } from './combo-box'
import { NumberField } from './number-field'

interface AlertRule {
  type: 'ev' | 'arb' | 'middle' | 'line_movement'
  minEV?: number
  teams?: string[]
  books?: string[]
  threshold?: number
}

interface AlertRuleEditorProps {
  onSave: (rule: AlertRule) => void
  onCancel?: () => void
  initialRule?: AlertRule
}

const BOOK_OPTIONS = [
  { id: 'dk', code: 'dk', name: 'DraftKings' },
  { id: 'fd', code: 'fd', name: 'FanDuel' },
  { id: 'mgm', code: 'mgm', name: 'BetMGM' },
  { id: 'pb', code: 'pb', name: 'PointsBet' },
  { id: 'caesars', code: 'caesars', name: 'Caesars' },
]

export function AlertRuleEditor({
  onSave,
  onCancel,
  initialRule,
}: AlertRuleEditorProps) {
  const [type, setType] = useState<AlertRule['type']>(initialRule?.type ?? 'ev')
  const [team, setTeam] = useState<string | undefined>(
    initialRule?.teams?.[0]
  )
  const [minEV, setMinEV] = useState<number>(initialRule?.minEV ?? 2)
  const [selectedBooks, setSelectedBooks] = useState<string[]>(
    initialRule?.books ?? []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      type,
      minEV: minEV / 100,
      teams: team ? [team] : [],
      books: selectedBooks,
    })
  }

  const toggleBook = (book: string) => {
    setSelectedBooks((prev) =>
      prev.includes(book) ? prev.filter((b) => b !== book) : [...prev, book]
    )
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm opacity-80">Alert Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['ev', 'arb', 'middle', 'line_movement'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                type === t
                  ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                  : 'border-[var(--border)] hover:border-[var(--brand)]/50'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <ComboBox
        label="Team (optional)"
        value={team}
        onChange={setTeam}
        optionsSource="/api/teams"
        placeholder="All teams"
      />

      {(type === 'ev' || type === 'middle') && (
        <NumberField
          label="Min EV %"
          value={minEV}
          onChange={setMinEV}
          min={0}
          max={50}
          step={0.5}
          suffix="%"
        />
      )}

      <div className="grid gap-2">
        <label className="text-sm opacity-80">Books (optional)</label>
        <div className="grid grid-cols-2 gap-2">
          {BOOK_OPTIONS.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => toggleBook(book.code)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                selectedBooks.includes(book.code)
                  ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                  : 'border-[var(--border)] hover:border-[var(--brand)]/50'
              }`}
            >
              {book.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm opacity-80 hover:opacity-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand)]/90"
        >
          Save Alert Rule
        </button>
      </div>
    </form>
  )
}
