import Link from 'next/link'

export const metadata = { title: 'Analytics Management' }

export default function Page() {
  return (
    <main className="espn-card" style={{padding: '1rem', maxWidth: 1100, margin: '1rem auto'}}>
      <header className="espn-card-header">
        <h1 className="espn-card-header-title font-headline">Analytics Management</h1>
      </header>
      <section className="espn-card-body" style={{padding: '1rem'}}>
        <p className="espn-team-name">Data pipelines, dataset catalog, quality monitoring, and exports for modeling and reporting.</p>
        <ul>
          <li>Ingestion & ETL controls</li>
          <li>Data quality dashboard & drift detection</li>
          <li>Dataset lineage and versioning</li>
        </ul>
        <p>Specification: <a href="/requirements/Epic_Analytics_Management.md">Analytics Management (spec)</a></p>
        <Link href="/">← Back to dashboard</Link>
      </section>
    </main>
  )
}
