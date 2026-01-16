import Link from 'next/link'

export const metadata = { title: 'Predictions & Analysis' }

export default function Page() {
  return (
    <main className="espn-card" style={{padding: '1rem', maxWidth: 980, margin: '1rem auto'}}>
      <header className="espn-card-header">
        <h1 className="espn-card-header-title font-headline">Predictions & Analysis</h1>
      </header>
      <section className="espn-card-body" style={{padding: '1rem'}}>
        <p className="espn-team-name">Core betting features: predictions, probability charts, and bet recommendations.</p>
        <ul>
          <li>Real-time predictions and win probability</li>
          <li>Model explanations and feature importance</li>
          <li>Market comparison and Kelly staking suggestions</li>
        </ul>
        <p>Specification: <a href="/requirements/Epic_SportsBettor_PredictionsAndAnalysis.md">Predictions & Analysis (spec)</a></p>
        <Link href="/">← Back to dashboard</Link>
      </section>
    </main>
  )
}
