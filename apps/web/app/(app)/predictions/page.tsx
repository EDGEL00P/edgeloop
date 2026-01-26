import Link from 'next/link'

/**
 * Predictions Landing Page
 * Shows shortcuts to current week and popular views
 */
export default function PredictionsPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentWeek = Math.min(Math.max(1, Math.ceil((now.getMonth() * 4.33) + 1)), 18)

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">NFL Predictions</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/predictions/week/${currentYear}/${currentWeek}`}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--brand)] transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">This Week</h2>
          <p className="text-sm opacity-70">
            Week {currentWeek} • {currentYear} Season
          </p>
          <p className="mt-3 text-sm">
            View predictions, odds, and edges for all games this week
          </p>
        </Link>

        <Link
          href="/predictions/futures"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--brand)] transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Futures</h2>
          <p className="text-sm opacity-70">
            Season-long markets
          </p>
          <p className="mt-3 text-sm">
            Win totals, conference winners, and Super Bowl odds
          </p>
        </Link>

        <Link
          href="/edges"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--brand)] transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Live Edges</h2>
          <p className="text-sm opacity-70">
            Real-time opportunities
          </p>
          <p className="mt-3 text-sm">
            Active arbitrage, EV+, and middle opportunities across all games
          </p>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Browse by Week</h2>
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 lg:grid-cols-18 gap-2">
          {Array.from({ length: 18 }, (_, i) => i + 1).map((week) => (
            <Link
              key={week}
              href={`/predictions/week/${currentYear}/${week}`}
              className={`rounded-lg border border-[var(--border)] px-3 py-2 text-center text-sm hover:border-[var(--brand)] transition-colors ${
                week === currentWeek
                  ? 'bg-[var(--brand)]/10 border-[var(--brand)]'
                  : ''
              }`}
            >
              {week}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
