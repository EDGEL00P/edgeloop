import { Suspense } from 'react'
import EdgesClient from './EdgesClient'

export default function EdgesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Live Edges Feed</h1>
        <p className="mt-1 text-sm opacity-70">
          Real-time arbitrage, EV+, and middle opportunities across all games
        </p>
      </div>
      
      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-[var(--muted)]/20" />}>
        <EdgesClient />
      </Suspense>
    </div>
  )
}
