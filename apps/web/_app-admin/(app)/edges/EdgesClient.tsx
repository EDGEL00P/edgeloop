'use client'

import { useEffect, useRef, useState } from 'react'

interface Edge {
  id: string
  gameId: string
  game_home: string
  game_away: string
  market: string
  ev: number
  bestBook: string
  type: string
  timestamp: string
}

export default function EdgesClient() {
  const [rows, setRows] = useState<Edge[]>([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource('/api/stream/edges')
    esRef.current = es

    es.onopen = () => {
      setConnected(true)
    }

    es.onerror = () => {
      setConnected(false)
    }

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data?.id) {
          setRows((r) => [data, ...r].slice(0, 5000))
        } else if (data?.connected) {
          setConnected(true)
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    }

    return () => es.close()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm opacity-70">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="text-xs opacity-50">
          {rows.length} edges tracked
        </span>
      </div>

      <div className="grid gap-2">
        {rows.length === 0 && (
          <div className="rounded-xl border border-[var(--border)] p-8 text-center">
            <p className="text-sm opacity-70">
              Waiting for edge updates... (Demo mode sends updates every 5s)
            </p>
          </div>
        )}
        
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-4 transition-all hover:border-[var(--brand)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    {r.game_home} vs {r.game_away}
                  </span>
                  <span className="rounded-full bg-[var(--muted)]/20 px-2 py-0.5 text-xs uppercase">
                    {r.market}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm">
                  <span className="opacity-70">Best: {r.bestBook}</span>
                  <span
                    className={`font-semibold ${
                      r.ev > 0.05
                        ? 'text-[var(--success)]'
                        : 'text-[var(--warning)]'
                    }`}
                  >
                    EV {Math.round(r.ev * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="text-right text-xs opacity-50">
                {new Date(r.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
