import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EdgeLoop - NFL Predictions & Betting Exploits',
  description: 'Model-driven NFL forecasts and betting edges including mispriced lines, arbitrage, and positive EV opportunities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background-primary text-text-primary antialiased">
        <div className="min-h-screen">
          <header className="border-b border-border-default bg-background-secondary/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                    <span className="text-white font-bold text-lg">E</span>
                  </div>
                  <span className="text-xl font-bold text-white">EdgeLoop</span>
                </div>
                <nav className="flex gap-6">
                  <a href="/" className="text-text-secondary hover:text-white transition-colors">
                    Dashboard
                  </a>
                  <a href="/predictions" className="text-text-secondary hover:text-white transition-colors">
                    Predictions
                  </a>
                  <a href="/exploits" className="text-text-secondary hover:text-white transition-colors">
                    Exploits
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-border-default mt-16">
            <div className="container mx-auto px-4 py-6">
              <p className="text-center text-text-tertiary text-sm">
                © 2026 EdgeLoop. Model-driven NFL predictions and betting analytics.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
