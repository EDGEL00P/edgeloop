'use client'

import { useEffect, useState } from 'react'

interface ComboBoxProps {
  label: string
  value?: string
  onChange: (v: string | undefined) => void
  optionsSource?: string
  options?: Array<{ id: number | string; code: string; name: string }>
  placeholder?: string
}

export function ComboBox({
  label,
  value,
  onChange,
  optionsSource,
  options: providedOptions,
  placeholder = 'Search…',
}: ComboBoxProps) {
  const [items, setItems] = useState<
    Array<{ id: number | string; code: string; name: string }>
  >([])
  const [q, setQ] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (optionsSource && !providedOptions) {
      fetch(optionsSource)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setItems(data)
          } else if (data.data && Array.isArray(data.data)) {
            setItems(data.data)
          }
        })
        .catch(() => setItems([]))
    } else if (providedOptions) {
      setItems(providedOptions)
    }
  }, [optionsSource, providedOptions])

  const filtered = items.filter((i) =>
    (i.name + i.code).toLowerCase().includes(q.toLowerCase())
  )

  const selectedItem = items.find((i) => i.code === value)

  return (
    <div className="grid gap-1">
      <label className="text-sm opacity-80">{label}</label>
      <div className="relative">
        <input
          value={selectedItem ? selectedItem.name : q}
          onChange={(e) => {
            setQ(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="input w-full"
        />
        {isOpen && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded border border-[var(--color-border)] bg-[var(--color-background)] shadow-lg">
            {filtered.map((i) => (
              <button
                key={i.id}
                onClick={() => {
                  onChange(i.code)
                  setIsOpen(false)
                  setQ('')
                }}
                className={`block w-full text-left px-3 py-2 hover:bg-[var(--color-accent)] ${
                  value === i.code ? 'bg-[var(--color-accent)]' : ''
                }`}
              >
                {i.name} <span className="opacity-60">({i.code})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
