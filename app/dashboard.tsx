/**
 * EDGELOOP DASHBOARD — 2027 Modern NFL Analytics Platform
 * Server Components, Streaming, Suspense, and Modern Patterns
 */

'use client';

import { useState, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Brain,
  Target,
  TrendingUp,
  Zap,
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

import { EdgeloopCard } from './components/EdgeloopCard';
import { ExploitRadar } from './components/ExploitRadar';
import { PicksTracker, TrackedPick } from './components/PicksTracker';
import { NFLTicker } from './components/NFLTicker';
import { ExploitsLayer } from './components/exploits/ExploitsLayer';
import { Card3D } from './components/Card3D';
import { Button3D } from './components/Button3D';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Game {
  gameId: string;
  homeTeam: { id: number; abbreviation: string; name: string; fullName: string; record: string };
  awayTeam: { id: number; abbreviation: string; name: string; fullName: string; record: string };
  gameTime: string;
  venue?: string;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore?: number;
  awayScore?: number;
  odds: { spread: number; spreadOdds: number; total: number; overOdds: number; underOdds: number; homeML: number; awayML: number };
  prediction: { homeWinProb: number; predictedSpread: number; predictedTotal: number; edge: number; confidence: number };
  scriptBreakers?: Array<{ type: string; description: string; confidence: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA (Replace with real API)
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_GAMES: Game[] = [
  {
    gameId: '1',
    homeTeam: { id: 1, abbreviation: 'KC', name: 'Chiefs', fullName: 'Kansas City Chiefs', record: '14-3' },
    awayTeam: { id: 2, abbreviation: 'BUF', name: 'Bills', fullName: 'Buffalo Bills', record: '13-4' },
    gameTime: 'SUN 6:30 PM',
    venue: 'Arrowhead Stadium',
    status: 'scheduled',
    odds: { spread: -3.5, spreadOdds: -110, total: 48.5, overOdds: -105, underOdds: -115, homeML: -175, awayML: 150 },
    prediction: { homeWinProb: 62, predictedSpread: -4.2, predictedTotal: 50.1, edge: 3.8, confidence: 0.72 },
    scriptBreakers: [
      { type: 'sharp', description: 'Sharp action on KC -3.5', confidence: 0.78 },
      { type: 'weather', description: 'Wind 15mph from SW', confidence: 0.65 },
    ],
  },
  {
    gameId: '2',
    homeTeam: { id: 3, abbreviation: 'DET', name: 'Lions', fullName: 'Detroit Lions', record: '15-2' },
    awayTeam: { id: 4, abbreviation: 'SF', name: '49ers', fullName: 'San Francisco 49ers', record: '12-5' },
    gameTime: 'SUN 3:00 PM',
    venue: 'Ford Field',
    status: 'scheduled',
    odds: { spread: -2.5, spreadOdds: -108, total: 51, overOdds: -110, underOdds: -110, homeML: -135, awayML: 115 },
    prediction: { homeWinProb: 55, predictedSpread: -1.8, predictedTotal: 52.3, edge: -1.2, confidence: 0.68 },
    scriptBreakers: [
      { type: 'rlm', description: 'Reverse line movement detected', confidence: 0.72 },
    ],
  },
];

const EXPLOIT_VECTORS = [
  { name: 'Arbitrage', value: 85, description: 'Market arbitrage opportunities', color: '#FF4D00' },
  { name: 'EV Delta', value: 72, description: 'Expected value differentials', color: '#00F5FF' },
  { name: 'Middles', value: 58, description: 'Middle opportunities', color: '#00F5FF' },
  { name: 'Correlation', value: 64, description: 'Market correlations', color: '#00F5FF' },
  { name: 'Line Movement', value: 91, description: 'Line movement patterns', color: '#FF4D00' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DashboardContent() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [trackedPicks, setTrackedPicks] = useState<TrackedPick[]>([]);

  // Modern React Query for data fetching
  const { data: games = MOCK_GAMES, isLoading } = useQuery({
    queryKey: ['games', selectedWeek],
    queryFn: async () => {
      // Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_GAMES;
    },
    staleTime: 30000,
  });

  const handleTrackPick = useCallback((gameId: string, type: 'spread' | 'total' | 'ml', selection: string, odds: number) => {
    const game = games.find(g => g.gameId === gameId);
    setTrackedPicks(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        gameId,
        type: type === 'ml' ? 'moneyline' : type,
        selection,
        odds,
        timestamp: new Date(),
        description: `${game?.awayTeam.abbreviation} @ ${game?.homeTeam.abbreviation} - ${selection}`,
        modelConfidence: game?.prediction.confidence || 0.5,
        edge: game?.prediction.edge || 0,
      },
    ]);
  }, [games]);

  const handleRemovePick = useCallback((id: string) => {
    setTrackedPicks(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-nfl-dark relative perspective-container">
      {/* NFL Ticker */}
      <NFLTicker className="sticky top-0 z-40" />

      {/* Header - 2027 Design */}
      <header className="px-6 py-8 border-b border-white/5 bg-nfl-dark/90 backdrop-blur-2xl sticky top-0 z-50 shadow-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#CC0000] uppercase tracking-widest">ESPN</span>
                <span className="text-2xl font-black tracking-tight uppercase text-cyan text-3d-glow">
                  EDGELOOP
                </span>
              </div>
              <p className="text-sm text-white/50 font-mono uppercase tracking-widest mt-1">NFL Predictive Intelligence</p>
            </div>
          </div>

          {/* Week selector - 2027 Design */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="glass-3d px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:border-cyan focus:cyan-glow transition-all"
            >
              {Array.from({ length: 22 }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>
                  {week <= 18 ? `Week ${week}` : week === 19 ? 'Wild Card' : week === 20 ? 'Divisional' : week === 21 ? 'Conf. Championship' : 'Super Bowl'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content - 2027 Layout */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Games Column - 2027 Design */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan" />
                <h2 className="text-lg font-bold">Games</h2>
                <span className="badge-neon badge-cyan">{games.length}</span>
              </div>
            </div>

            {/* Games Grid - 2027 3D Layout */}
            <Suspense fallback={<div className="text-cyan animate-pulse">Loading games...</div>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 preserve-3d">
                {isLoading ? (
                  <div className="col-span-2 text-center py-12 text-white/50">Loading games...</div>
                ) : (
                  games.map((game, idx) => (
                    <motion.div
                      key={game.gameId}
                      initial={{ opacity: 0, y: 30, rotateX: -15 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <EdgeloopCard
                        {...game}
                        scriptBreakers={game.scriptBreakers?.map(sb => ({
                          type: sb.type as 'steam' | 'rlm' | 'sharp' | 'trap' | 'weather',
                          description: sb.description,
                          confidence: sb.confidence,
                        }))}
                        onTrackPick={(type, selection, odds) =>
                          handleTrackPick(game.gameId, type, selection, odds)
                        }
                        onClick={() => setSelectedGame(game)}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </Suspense>
          </div>

          {/* Sidebar - 2027 Design */}
          <div className="space-y-6">
            {/* Exploits Layer - Grouped */}
            <ExploitsLayer gameId={selectedGame?.gameId} />

            {/* Exploit Radar */}
            <Card3D intensity="med">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-cyan" />
                <h3 className="font-bold text-3d">5-Vector Exploit Engine</h3>
              </div>
              <ExploitRadar 
                vectors={EXPLOIT_VECTORS.map(v => ({ 
                  name: v.name, 
                  value: v.value, 
                  description: v.description 
                }))} 
                overallScore={66} 
              />
            </Card3D>

            {/* Top Edges */}
            <Card3D intensity="low">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan" />
                  <h3 className="font-bold">Top Edges Today</h3>
                </div>
              </div>
              <div className="space-y-3">
                {games
                  .filter((g) => g.prediction.edge > 2)
                  .sort((a, b) => b.prediction.edge - a.prediction.edge)
                  .slice(0, 5)
                  .map((game) => (
                    <div key={game.gameId} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">
                          {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                        </span>
                        <span className="text-xs text-cyan font-bold">+{game.prediction.edge.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-white/50">{game.prediction.confidence * 100}% confidence</div>
                    </div>
                  ))}
              </div>
            </Card3D>

            {/* Picks Tracker */}
            {trackedPicks.length > 0 && (
              <PicksTracker 
                picks={trackedPicks} 
                onRemove={handleRemovePick}
                onClear={() => setTrackedPicks([])}
                onToggleStar={(id) => {
                  setTrackedPicks(prev => prev.map(p => p.id === id ? { ...p, starred: !p.starred } : p));
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Game Detail Modal - 2027 Design */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedGame(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto card-3d preserve-3d p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Game Analysis</h2>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Button3D
                    variant="secondary"
                    onClick={() => {
                      handleTrackPick(
                        selectedGame.gameId,
                        'spread',
                        `${selectedGame.homeTeam.abbreviation} ${selectedGame.odds.spread > 0 ? '+' : ''}${selectedGame.odds.spread}`,
                        selectedGame.odds.spreadOdds
                      );
                      setSelectedGame(null);
                    }}
                    className="w-full"
                  >
                    <div className="text-xs mb-1">Track Spread</div>
                    <div className="font-mono font-bold">
                      {selectedGame.homeTeam.abbreviation} {selectedGame.odds.spread > 0 ? '+' : ''}{selectedGame.odds.spread}
                    </div>
                  </Button3D>
                  <Button3D
                    variant="secondary"
                    onClick={() => {
                      handleTrackPick(
                        selectedGame.gameId,
                        'total',
                        `Over ${selectedGame.odds.total}`,
                        selectedGame.odds.overOdds
                      );
                      setSelectedGame(null);
                    }}
                    className="w-full"
                  >
                    <div className="text-xs mb-1">Track Over</div>
                    <div className="font-mono font-bold">Over {selectedGame.odds.total}</div>
                  </Button3D>
                  <Button3D
                    variant="critical"
                    onClick={() => {
                      handleTrackPick(
                        selectedGame.gameId,
                        'ml',
                        `${selectedGame.homeTeam.abbreviation} ML`,
                        selectedGame.odds.homeML
                      );
                      setSelectedGame(null);
                    }}
                    className="w-full"
                  >
                    <div className="text-xs mb-1">Track ML</div>
                    <div className="font-mono font-bold">
                      {selectedGame.homeTeam.abbreviation} {selectedGame.odds.homeML > 0 ? '+' : ''}{selectedGame.odds.homeML}
                    </div>
                  </Button3D>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-nfl-dark flex items-center justify-center text-cyan">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
