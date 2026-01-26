import { StatCard } from '@edgeloop/ui';
import { PredictionCard } from '@/components/PredictionCard';
import { ExploitCard } from '@/components/ExploitCard';
import { mockPredictions, mockExploits, mockStats } from '@/lib/mockData';

export default function Home() {
  // Show top 3 predictions and exploits on dashboard
  const topPredictions = mockPredictions.slice(0, 3);
  const topExploits = mockExploits.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary bg-clip-text text-transparent">
          NFL Predictions & Betting Exploits
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Model-driven forecasts and exploits including mispriced lines, arbitrage opportunities, and positive expected value plays
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Predictions"
          value={mockStats.totalPredictions}
          change="+4 this week"
          changeDirection="up"
        />
        <StatCard
          label="Active Exploits"
          value={mockStats.activeExploits}
          change="+3 new today"
          changeDirection="up"
        />
        <StatCard
          label="Average EV"
          value={`${mockStats.averageEV}%`}
          change="+1.2%"
          changeDirection="up"
        />
        <StatCard
          label="Win Rate"
          value={`${mockStats.winRate}%`}
          change="+2.1%"
          changeDirection="up"
        />
      </div>

      {/* Featured Predictions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Featured Predictions</h2>
          <a href="/predictions" className="text-brand-primary hover:text-brand-accent transition-colors text-sm font-medium">
            View All →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topPredictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      </div>

      {/* Top Exploits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Top Exploits</h2>
          <a href="/exploits" className="text-brand-primary hover:text-brand-accent transition-colors text-sm font-medium">
            View All →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topExploits.map((exploit) => (
            <ExploitCard key={exploit.id} exploit={exploit} />
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-br from-background-secondary to-background-tertiary border border-border-default rounded-lg p-8 mt-12">
        <h3 className="text-xl font-bold text-white mb-4">How EdgeLoop Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-brand-accent font-bold text-lg mb-2">1. Model Analysis</div>
            <p className="text-text-secondary text-sm">
              Our proprietary models analyze team performance, player stats, and historical data to generate accurate predictions.
            </p>
          </div>
          <div>
            <div className="text-brand-accent font-bold text-lg mb-2">2. Market Scanning</div>
            <p className="text-text-secondary text-sm">
              We continuously monitor bookmaker lines across multiple sportsbooks to identify pricing inefficiencies.
            </p>
          </div>
          <div>
            <div className="text-brand-accent font-bold text-lg mb-2">3. Edge Detection</div>
            <p className="text-text-secondary text-sm">
              Advanced algorithms surface arbitrage opportunities, middles, and positive EV bets for maximum profit potential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
