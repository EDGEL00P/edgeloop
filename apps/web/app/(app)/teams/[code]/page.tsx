import { Suspense } from 'react'

async function getJSON(path: string, tags: string[]) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const r = await fetch(`${baseUrl}${path}`, {
    next: { tags, revalidate: 60 },
  })
  if (!r.ok) throw new Error('fetch failed')
  return r.json()
}

export default async function TeamPage({
  params,
}: {
  params: { code: string }
}) {
  const tag = `team:${params.code}`
  const [inj, roster] = await Promise.all([
    getJSON(`/api/injuries?team=${params.code}`, [tag]),
    getJSON(`/api/roster?team=${params.code}&season=${new Date().getFullYear()}`, [tag]),
  ])

  return (
    <div className="p-4 grid gap-4">
      <h1 className="text-xl font-semibold">Team {params.code}</h1>
      <Suspense
        fallback={
          <div className="h-10 bg-[var(--color-muted)] animate-pulse rounded" />
        }
      >
        <section className="rounded-xl border border-[var(--color-border)] p-3">
          <h2 className="text-sm opacity-80">Injuries</h2>
          <pre className="text-xs opacity-80 max-h-64 overflow-auto">
            {JSON.stringify(inj?.data?.slice(0, 10), null, 2)}
          </pre>
        </section>
      </Suspense>
      <section className="rounded-xl border border-[var(--color-border)] p-3">
        <h2 className="text-sm opacity-80">Roster</h2>
        <pre className="text-xs opacity-80 max-h-64 overflow-auto">
          {JSON.stringify(roster?.data?.slice(0, 10), null, 2)}
        </pre>
      </section>
    </div>
  )
}
