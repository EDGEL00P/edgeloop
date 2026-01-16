'use client';

/**
 * GAME DETAIL PAGE — Deep dive analysis for a single game
 * NFL broadcast-style visualization with model explainability
 */

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Activity,
  TrendingUp,
  BarChart3,
  Wind,
  Clock,
  MapPin,
  AlertTriangle,
  Zap,
  ChevronRight,
} from 'lucide-react';

import { WinProbabilityChart, generateMockWinProbData } from '../../components/WinProbabilityChart';
import { MomentumStrip, generateMockDriveData } from '../../components/MomentumStrip';
import { MatchupExplainer, generateMockContributions } from '../../components/MatchupExplainer';
import { ExploitRadar } from '../../components/ExploitRadar';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ id: string }>;
}

interface GameData {
  id: string;
  homeTeam: { abbreviation: string; name: string; record: string; color: string };
  awayTeam: { abbreviation: string; name: string; record: string; color: string };
  gameTime: string;
  venue: string;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore?: number;
  awayScore?: number;
  quarter?: number;
  clock?: string;
  weather: { temp: number; wind: number; condition: string };
  odds: {
    spread: number;
    spreadOdds: number;
    total: number;
    overOdds: number;
    underOdds: number;
    homeML: number;
    awayML: number;
  };
  prediction: {
    homeWinProb: number;
    predictedSpread: number;
    predictedTotal: number;
    spreadEdge: number;
    totalEdge: number;
    confidence: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK GAME DATA
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_GAMES: Record<string, GameData> = {
  '1': {
    id: '1',
    homeTeam: { abbreviation: 'KC', name: 'Chiefs', record: '14-3', color: 'hsl(0, 85%, 50%)' },
    awayTeam: { abbreviation: 'BUF', name: 'Bills', record: '13-4', color: 'hsl(210, 100%, 40%)' },
    gameTime: 'SUN 6:30 PM ET',
    venue: 'Arrowhead Stadium',
    status: 'scheduled',
    weather: { temp: 32, wind: 15, condition: 'Clear' },
    odds: { spread: -3.5, spreadOdds: -110, total: 48.5, overOdds: -105, underOdds: -115, homeML: -175, awayML: 150 },
    prediction: { homeWinProb: 62, predictedSpread: -4.2, predictedTotal: 50.1, spreadEdge: 0.7, totalEdge: 1.6, confidence: 0.72 },
  },
  '2': {
    id: '2',
    homeTeam: { abbreviation: 'DET', name: 'Lions', record: '15-2', color: 'hsl(200, 100%, 45%)' },
    awayTeam: { abbreviation: 'SF', name: '49ers', record: '12-5', color: 'hsl(15, 100%, 50%)' },
    gameTime: 'SUN 3:00 PM ET',
    venue: 'Ford Field',
    status: 'in_progress',
    homeScore: 21,
    awayScore: 17,
    quarter: 3,
    clock: '8:42',
    weather: { temp: 72, wind: 0, condition: 'Dome' },
    odds: { spread: -2.5, spreadOdds: -108, total: 51, overOdds: -110, underOdds: -110, homeML: -135, awayML: 115 },
    prediction: { homeWinProb: 65, predictedSpread: -1.8, predictedTotal: 52.3, spreadEdge: -0.7, totalEdge: 1.3, confidence: 0.68 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function GameDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;
  
  const [game, setGame] = useState<GameData | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'flow' | 'factors'>('analysis');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setGame(MOCK_GAMES[gameId] || MOCK_GAMES['1']);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [gameId]);

  if (isLoading || !game) {
    return (
      <div className="min-h-screen bg-[hsl(220_20%_4%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-12 h-12 text-[hsl(185_100%_50%)] animate-pulse" />
          <span className="text-white/50">Loading analysis...</span>
        </div>
      </div>
    );
  }

  const winProbData = generateMockWinProbData(game.prediction.homeWinProb > 50);
  const driveData = generateMockDriveData(game.homeTeam.abbreviation, game.awayTeam.abbreviation);
  const contributions = generateMockContributions(game.homeTeam.abbreviation, game.awayTeam.abbreviation);

  const exploitVectors = [
    { name: 'Physics', value: Math.floor(50 + Math.random() * 40), description: 'Weather & field factors' },
    { name: 'Geometry', value: Math.floor(50 + Math.random() * 40), description: 'Scheme analysis' },
    { name: 'Market', value: Math.floor(50 + Math.random() * 40), description: 'Sharp money tracking' },
    { name: 'Psych', value: Math.floor(50 + Math.random() * 40), description: 'Motivation factors' },
    { name: 'Chaos', value: Math.floor(30 + Math.random() * 40), description: 'Injury & variance' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[hsl(220_20%_4%)/95] backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            
            {game.status === 'in_progress' && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(145_80%_50%/0.15)] border border-[hsl(145_80%_50%/0.3)]"
              >
                <div className="w-2 h-2 rounded-full bg-[hsl(145_80%_50%)]" />
                <span className="text-xs font-bold text-[hsl(145_80%_55%)]">LIVE</span>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Game Hero */}
      <section className="px-6 py-8 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Teams */}
            <div className="flex items-center gap-8">
              {/* Away Team */}
              <div className="text-center">
                <div className="text-4xl font-black tracking-tight">{game.awayTeam.abbreviation}</div>
                <div className="text-sm text-white/50">{game.awayTeam.name}</div>
                <div className="text-xs text-white/30">{game.awayTeam.record}</div>
                {game.status !== 'scheduled' && (
                  <div className="text-3xl font-mono font-bold mt-2">{game.awayScore}</div>
                )}
              </div>

              {/* VS / Score */}
              <div className="flex flex-col items-center">
                <div className="text-white/30 text-lg font-bold">@</div>
                {game.status === 'in_progress' && (
                  <div className="mt-1 text-xs text-[hsl(145_80%_55%)]">
                    Q{game.quarter} • {game.clock}
                  </div>
                )}
              </div>

              {/* Home Team */}
              <div className="text-center">
                <div className="text-4xl font-black tracking-tight">{game.homeTeam.abbreviation}</div>
                <div className="text-sm text-white/50">{game.homeTeam.name}</div>
                <div className="text-xs text-white/30">{game.homeTeam.record}</div>
                {game.status !== 'scheduled' && (
                  <div className="text-3xl font-mono font-bold mt-2">{game.homeScore}</div>
                )}
              </div>
            </div>

            {/* Game Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="w-4 h-4" />
                <span>{game.gameTime}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4" />
                <span>{game.venue}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Wind className="w-4 h-4" />
                <span>{game.weather.temp}°F, {game.weather.wind}mph wind</span>
              </div>
            </div>
          </div>

          {/* Quick Prediction Summary */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Model Spread</div>
              <div className="text-2xl font-mono font-bold text-[hsl(185_100%_60%)]">
                {game.prediction.predictedSpread > 0 ? '+' : ''}{game.prediction.predictedSpread.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">Market: {game.odds.spread}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Model Total</div>
              <div className="text-2xl font-mono font-bold text-[hsl(185_100%_60%)]">
                {game.prediction.predictedTotal.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">Market: {game.odds.total}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">{game.homeTeam.abbreviation} Win</div>
              <div className="text-2xl font-mono font-bold text-[hsl(145_80%_55%)]">
                {game.prediction.homeWinProb}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Spread Edge</div>
              <div className={`text-2xl font-mono font-bold ${game.prediction.spreadEdge > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                {game.prediction.spreadEdge > 0 ? '+' : ''}{game.prediction.spreadEdge.toFixed(1)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Confidence</div>
              <div className="text-2xl font-mono font-bold text-[hsl(45_100%_60%)]">
                {Math.round(game.prediction.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="px-6 border-b border-white/5 sticky top-16 z-40 bg-[hsl(220_20%_4%)]">
        <div className="max-w-6xl mx-auto flex gap-1">
          {[
            { id: 'analysis', label: 'Win Probability', icon: Activity },
            { id: 'flow', label: 'Game Flow', icon: TrendingUp },
            { id: 'factors', label: 'Why This Line', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'text-[hsl(185_100%_60%)] border-b-2 border-[hsl(185_100%_50%)]' 
                  : 'text-white/50 hover:text-white/80'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Win Prob Chart */}
                <div className="lg:col-span-2 card-edgeloop p-6">
                  <WinProbabilityChart
                    data={winProbData}
                    homeTeam={game.homeTeam.abbreviation}
                    awayTeam={game.awayTeam.abbreviation}
                    homeColor={game.homeTeam.color}
                    awayColor={game.awayTeam.color}
                  />
                </div>

                {/* Exploit Radar */}
                <div className="card-edgeloop p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[hsl(185_100%_60%)]" />
                    <h3 className="font-bold">Edge Analysis</h3>
                  </div>
                  <ExploitRadar vectors={exploitVectors} overallScore={68} />
                </div>
              </motion.div>
            )}

            {activeTab === 'flow' && (
              <motion.div
                key="flow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card-edgeloop p-6"
              >
                <MomentumStrip
                  drives={driveData}
                  homeTeam={game.homeTeam.abbreviation}
                  awayTeam={game.awayTeam.abbreviation}
                  homeColor={game.homeTeam.color}
                  awayColor={game.awayTeam.color}
                />
              </motion.div>
            )}

            {activeTab === 'factors' && (
              <motion.div
                key="factors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card-edgeloop p-6"
              >
                <MatchupExplainer
                  contributions={contributions}
                  homeTeam={game.homeTeam.abbreviation}
                  awayTeam={game.awayTeam.abbreviation}
                  predictionType="spread"
                  predictedValue={game.prediction.predictedSpread}
                  marketValue={game.odds.spread}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Market Intelligence Alerts */}
          <div className="mt-8 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[hsl(45_100%_60%)]" />
              Market Intelligence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: 'SHARP', desc: 'Sharp money detected on home spread', conf: 78 },
                { type: 'RLM', desc: 'Reverse line movement: public on away', conf: 72 },
                { type: 'STEAM', desc: 'No steam moves detected', conf: 45 },
              ].map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[hsl(185_100%_50%/0.3)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[hsl(45_100%_50%/0.15)] text-[hsl(45_100%_60%)]">
                      {alert.type}
                    </span>
                    <span className="text-xs font-mono text-white/50">{alert.conf}% conf</span>
                  </div>
                  <p className="text-sm text-white/70">{alert.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
