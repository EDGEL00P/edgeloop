import { Suspense } from 'react'

async function getSlate(season: string, week: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const r = await fetch(`${baseUrl}/api/games?season=${season}&week=${week}`, {
    next: {
      revalidate: 30,
      tags: [`games:${season}:${week}`],
    },
  })
  if (!r.ok) throw new Error('games fetch failed')
  return r.json()
}

export default async function Page({
  params,
}: {
  params: { season: string; week: string }
}) {
  const season = Number(params.season)
  const week = Number(params.week)
  const slate = await getSlate(params.season, params.week)

  return (
    <div className="p-4" data-tag={`games:${season}:${week}`}>
      <h1 className="text-xl font-semibold">
        Week {week} — {season}
      </h1>
      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded bg-[var(--color-muted)]" />
        }
      >
        <pre className="text-xs opacity-80">
          {JSON.stringify(slate?.data?.slice(0, 5), null, 2)}
        </pre>
      </Suspense>
    </div>
  )
}
