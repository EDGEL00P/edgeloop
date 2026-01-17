import Link from 'next/link'

export const metadata = { title: 'Platform Management' }

export default function Page() {
  return (
    <main className="espn-card" style={{padding: '1rem', maxWidth: 1200, margin: '1rem auto'}}>
      <header className="espn-card-header">
        <h1 className="espn-card-header-title font-headline">Platform Management</h1>
      </header>
      <section className="espn-card-body" style={{padding: '1rem'}}>
        <p className="espn-team-name">Admin tools: monitoring, model lifecycle, data sources, and compliance.</p>
        <ul>
          <li>Observability dashboards and alerts</li>
          <li>Model deployments and A/B testing</li>
          <li>Data source management and auditing</li>
        </ul>
        <p>Specification: <a href="/requirements/Epic_Administrator_PlatformManagement.md">Platform Management (spec)</a></p>
        <Link href="/">← Back to dashboard</Link>
      </section>
    </main>
  )
}
