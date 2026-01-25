import Link from 'next/link'
import { ArrowRight, Activity, Zap, Brain, BarChart3, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-broadcast-red to-broadcast-gold" />
            <span className="text-xl font-bold tracking-tight">EdgeLoop</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/games"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Games
            </Link>
            <Link
              href="/predictions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Predictions
            </Link>
            <Link
              href="/analytics"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Analytics
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center gap-2 rounded-lg bg-broadcast-red px-4 py-2 text-sm font-medium text-white hover:bg-broadcast-red/90 transition-colors"
            >
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-broadcast-red/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-broadcast-red/20 rounded-full blur-3xl" />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-broadcast-red/30 bg-broadcast-red/10 px-4 py-1.5 text-sm text-broadcast-red mb-8">
              <Zap className="h-4 w-4" />
              <span>Real-time AI Predictions</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-gradient">AI-Powered</span>
              <br />
              Sports Analytics
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
              Advanced machine learning models analyzing real-time data to deliver predictions with
              broadcast-quality insights and explanations.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/games"
                className="inline-flex items-center gap-2 rounded-lg bg-broadcast-red px-8 py-4 text-lg font-semibold text-white hover:bg-broadcast-red/90 transition-colors"
              >
                View Live Games
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-4 text-lg font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Explore Analytics
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title="ML-Powered Predictions"
              description="Advanced ensemble models analyzing thousands of data points in real-time for accurate game predictions."
            />
            <FeatureCard
              icon={Activity}
              title="Live Win Probability"
              description="Dynamic probability charts updated every play, with momentum tracking and trend analysis."
            />
            <FeatureCard
              icon={BarChart3}
              title="Explainable AI"
              description="Understand every prediction with structured factor breakdowns and confidence tiers."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Real-Time Odds"
              description="Integrated odds from multiple sportsbooks with edge detection and value identification."
            />
            <FeatureCard
              icon={Zap}
              title="Edge Functions"
              description="Sub-100ms response times powered by edge computing for instant analytics delivery."
            />
            <FeatureCard
              icon={Shield}
              title="Broadcast Quality"
              description="ESPN-grade visual presentation with professional overlays and stat displays."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border bg-card/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBlock value="94.7%" label="Model Accuracy" />
            <StatBlock value="<50ms" label="Prediction Latency" />
            <StatBlock value="10K+" label="Games Analyzed" />
            <StatBlock value="24/7" label="Real-Time Updates" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-broadcast-red to-broadcast-gold" />
              <span className="font-semibold">EdgeLoop</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 EdgeLoop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="broadcast-panel p-6 group hover:border-broadcast-red/50 transition-colors">
      <div className="h-12 w-12 rounded-lg bg-broadcast-red/10 flex items-center justify-center mb-4 group-hover:bg-broadcast-red/20 transition-colors">
        <Icon className="h-6 w-6 text-broadcast-red" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="stat-value text-gradient">{value}</div>
      <div className="stat-label mt-2">{label}</div>
    </div>
  )
}
