import Link from 'next/link'

export const metadata = { title: 'Account Management' }

export default function Page() {
  return (
    <main className="espn-card" style={{padding: '1rem', maxWidth: 980, margin: '1rem auto'}}>
      <header className="espn-card-header">
        <h1 className="espn-card-header-title font-headline">Account Management</h1>
      </header>
      <section className="espn-card-body" style={{padding: '1rem'}}>
        <p className="espn-team-name">User onboarding, authentication, MFA, and responsible gaming settings.</p>
        <ul>
          <li>Secure login and MFA</li>
          <li>Profile, preferences, and bankroll dashboard</li>
          <li>Age verification and self-exclusion tools</li>
        </ul>
        <p>Specification: <a href="/requirements/Epic_SportsBettor_AccountManagement.md">Account Management (spec)</a></p>
        <Link href="/">← Back to dashboard</Link>
      </section>
    </main>
  )
}
