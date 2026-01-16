/**
 * edgeloop DASHBOARD - TACTICAL NFL HUD
 * ESPN Broadcast meets Fighter Jet Cockpit
 * Advanced NFL predictive interface
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Wind,
  AlertTriangle,
} from 'lucide-react';
import { ReactorCard } from './ReactorCard';
import { TimeCone } from './TimeCone';
import { ExploitRadar } from './ExploitRadar';
import { NeuralWeb } from './NeuralWeb';
import { NFLScanlines } from './NFLScanlines';
import { NFLFieldLines } from './NFLFieldLines';
import { NFLScoreboard } from './NFLScoreboard';
import { NFLTicker } from './NFLTicker';
import { MagneticButton } from './MagneticButton';
import { EdgeloopLogo } from './EdgeloopLogo';

interface GameData {
  gameId: string;
  homeTeam: { id: number; abbreviation: string; name: string; fullName: string; record: string };
  awayTeam: { id: number; abbreviation: string; name: string; fullName: string; record: string };
  gameTime: string;
  venue: string;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore?: number;
  awayScore?: number;
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
    edge: number;
    confidence: number;
  };
  scriptBreakers: Array<{
    type: 'sharp' | 'weather' | 'rlm' | 'steam' | 'trap';
    description: string;
    confidence: number;
  }>;
}

const MOCK_GAMES: GameData[] = [
  {
    gameId: '1',
    homeTeam: { id: 1, abbreviation: 'KC', name: 'Chiefs', fullName: 'Kansas City Chiefs', record: '14-3' },
    awayTeam: { id: 2, abbreviation: 'BUF', name: 'Bills', fullName: 'Buffalo Bills', record: '13-4' },
    gameTime: 'SUN 6:30 PM',
    venue: 'Arrowhead Stadium',
    status: 'scheduled',
    odds: { spread: -3.5, spreadOdds: -110, total: 48.5, overOdds: -105, underOdds: -115, homeML: -175, awayML: +150 },
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
    odds: { spread: -2.5, spreadOdds: -108, total: 51, overOdds: -110, underOdds: -110, homeML: -135, awayML: +115 },
    prediction: { homeWinProb: 55, predictedSpread: -1.8, predictedTotal: 52.3, edge: -1.2, confidence: 0.68 },
    scriptBreakers: [
      { type: 'rlm', description: 'Reverse line movement detected', confidence: 0.72 },
    ],
  },
  {
    gameId: '3',
    homeTeam: { id: 5, abbreviation: 'PHI', name: 'Eagles', fullName: 'Philadelphia Eagles', record: '13-4' },
    awayTeam: { id: 6, abbreviation: 'BAL', name: 'Ravens', fullName: 'Baltimore Ravens', record: '14-3' },
    gameTime: 'SAT 8:15 PM',
    venue: 'Lincoln Financial Field',
    status: 'in_progress',
    homeScore: 21,
    awayScore: 17,
    odds: { spread: 1.5, spreadOdds: -105, total: 47.5, overOdds: -110, underOdds: -110, homeML: +105, awayML: -125 },
    prediction: { homeWinProb: 48, predictedSpread: 2.1, predictedTotal: 49.2, edge: 2.4, confidence: 0.65 },
    scriptBreakers: [
      { type: 'steam', description: 'Steam move on BAL ML', confidence: 0.81 },
    ],
  },
];

const EXPLOIT_VECTORS = [
  { name: 'Physics', value: 72, description: 'Weather, turf, altitude factors' },
  { name: 'Geometry', value: 68, description: 'Formation & route analysis' },
  { name: 'Market', value: 84, description: 'Sharp money & line movements' },
  { name: 'Psych', value: 61, description: 'Motivation & team dynamics' },
  { name: 'Chaos', value: 45, description: 'Injury impact & variance' },
];

export function V3Dashboard() {
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(20);
  const [neuralState, setNeuralState] = useState<'idle' | 'loading' | 'critical'>('idle');

  // Determine neural state based on games
  useEffect(() => {
    const criticalGames = MOCK_GAMES.filter((g) => Math.abs(g.prediction.edge) > 5);
    if (criticalGames.length > 0) {
      setNeuralState('critical');
    } else {
      setNeuralState('idle');
    }
  }, []);

  // Get intensity for ReactorCard
  const getIntensity = (edge: number): 'low' | 'med' | 'critical' => {
    if (Math.abs(edge) > 5) return 'critical';
    if (Math.abs(edge) > 2) return 'med';
    return 'low';
  };

  return (
    <div className="min-h-screen relative">
      {/* NFL Visual Effects Layer */}
      <div className="fixed inset-0 z-0">
        <NeuralWeb state={neuralState} intensity={neuralState === 'critical' ? 1.0 : 0.7} />
        <NFLFieldLines />
        <NFLScanlines />
      </div>

      <div className="relative z-10">
        {/* NFL Ticker */}
        <NFLTicker className="sticky top-0 z-50" />

        {/* Header - MORE DRAMATIC */}
        <header className="px-6 py-6 border-b border-[#00F5FF]/20 backdrop-blur-xl bg-[#0A1A2E]/90 sticky top-[48px] z-40 shadow-[0_0_30px_rgba(0,245,255,0.1)]">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <EdgeloopLogo size="sm" animated={false} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#FF4D00] uppercase tracking-widest">ESPN</span>
                  <h1 className="text-2xl font-black tracking-tight text-bio-rhythm game-state-active uppercase" style={{ textShadow: '0 0 10px rgba(255, 77, 0, 0.3)' }}>
                    EDGELOOP <span className="text-[#FF4D00]">HUD</span>
                  </h1>
                </div>
                <p className="text-sm text-[#F0F0F0]/50 font-mono uppercase tracking-widest">
                  TACTICAL NFL PREDICTIVE INTERFACE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#00F5FF]/60" />
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="bg-[#2C2F33]/40 border border-[#00F5FF]/20 rounded-lg px-4 py-2 
                         text-sm font-medium text-[#F0F0F0] focus:outline-none focus:border-[#00F5FF]/50
                         backdrop-blur-xl"
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

        {/* Main Content */}
        <main className="px-6 py-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Games Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#00F5FF]" />
                  <h2 className="text-lg font-bold text-bio-rhythm game-state-active">
                    REACTOR_GRID
                  </h2>
                  <span className="badge-neon badge-cyan text-xs">
                    {MOCK_GAMES.length} ACTIVE
                  </span>
                </div>
              </div>

              {/* Reactor Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_GAMES.map((game) => {
                  const intensity = getIntensity(game.prediction.edge);
                  return (
                    <ReactorCard
                      key={game.gameId}
                      intensity={intensity}
                      onClick={() => setSelectedGame(game)}
                      className="cursor-pointer"
                    >
                      {/* Game Header with NFL Scoreboard */}
                      {game.status === 'in_progress' ? (
                        <div className="mb-4">
                          <NFLScoreboard
                            awayTeam={{
                              name: game.awayTeam.name,
                              abbreviation: game.awayTeam.abbreviation,
                              score: game.awayScore,
                            }}
                            homeTeam={{
                              name: game.homeTeam.name,
                              abbreviation: game.homeTeam.abbreviation,
                              score: game.homeScore,
                            }}
                            quarter="Q3"
                            timeRemaining="8:45"
                            down="2nd"
                            distance="7"
                          />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[#F0F0F0]/40 font-mono uppercase tracking-widest">
                                [GAME_ID: {game.gameId}]
                              </span>
                              {intensity === 'critical' && (
                                <span className="text-xs text-[#FF4D00] font-bold animate-pulse uppercase tracking-widest">
                                  ⚠️ CRITICAL
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-bio-rhythm game-state-active uppercase tracking-wide">
                              {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                            </h3>
                            <p className="text-xs text-[#F0F0F0]/50 font-mono uppercase">
                              {game.gameTime} • {game.venue}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Odds Display */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-[#0A1A2E]/50 border border-[#00F5FF]/10">
                          <div className="text-xs text-[#F0F0F0]/50 mb-1">SPREAD</div>
                          <div className="text-sm font-mono font-bold text-[#00F5FF]">
                            {game.homeTeam.abbreviation} {game.odds.spread > 0 ? '+' : ''}
                            {game.odds.spread}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0A1A2E]/50 border border-[#00F5FF]/10">
                          <div className="text-xs text-[#F0F0F0]/50 mb-1">TOTAL</div>
                          <div className="text-sm font-mono font-bold text-[#00F5FF]">
                            {game.odds.total}
                          </div>
                        </div>
                      </div>

                      {/* Prediction & Edge */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#F0F0F0]/50">MODEL_EDGE</span>
                          <span
                            className={`text-sm font-mono font-bold ${
                              game.prediction.edge > 0
                                ? 'text-[#00F5FF]'
                                : 'text-[#FF4D00]'
                            }`}
                          >
                            {game.prediction.edge > 0 ? '+' : ''}
                            {game.prediction.edge.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#2C2F33] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.abs(game.prediction.edge) * 10)}%` }}
                            className={`h-full ${
                              game.prediction.edge > 0 ? 'bg-[#00F5FF]' : 'bg-[#FF4D00]'
                            }`}
                            style={{
                              boxShadow:
                                game.prediction.edge > 0
                                  ? '0 0 10px rgba(0, 245, 255, 0.5)'
                                  : '0 0 10px rgba(255, 77, 0, 0.5)',
                            }}
                          />
                        </div>
                      </div>

                      {/* Script Breakers */}
                      {game.scriptBreakers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#2C2F33]">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3 h-3 text-[#FF4D00]" />
                            <span className="text-xs text-[#F0F0F0]/50 uppercase">
                              SIGNALS
                            </span>
                          </div>
                          {game.scriptBreakers.map((sb, i) => (
                            <div
                              key={i}
                              className="text-xs text-[#F0F0F0]/70 mb-1 font-mono"
                            >
                              [{sb.type.toUpperCase()}] {sb.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </ReactorCard>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Exploit Radar */}
              <ReactorCard intensity="med">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#00F5FF]" />
                  <h3 className="font-bold text-bio-rhythm game-state-active">
                    5-VECTOR_EXPLOIT
                  </h3>
                </div>
                <ExploitRadar vectors={EXPLOIT_VECTORS} overallScore={66} />
              </ReactorCard>

              {/* Top Edges */}
              <ReactorCard intensity="low">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#00F5FF]" />
                    <h3 className="font-bold text-bio-rhythm game-state-active">
                      TOP_EDGES
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {MOCK_GAMES.filter((g) => g.prediction.edge > 2)
                    .sort((a, b) => b.prediction.edge - a.prediction.edge)
                    .slice(0, 4)
                    .map((game) => (
                      <motion.button
                        key={game.gameId}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedGame(game)}
                        className="w-full flex items-center justify-between p-3 rounded-lg
                                 bg-[#0A1A2E]/50 hover:bg-[#0A1A2E]/70 
                                 border border-[#2C2F33] hover:border-[#00F5FF]/30
                                 transition-all text-left"
                      >
                        <div>
                          <div className="font-bold text-sm text-bio-rhythm game-state-active">
                            {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                          </div>
                          <div className="text-xs text-[#F0F0F0]/50 font-mono">
                            {game.gameTime}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge-neon badge-positive text-xs">
                            +{game.prediction.edge.toFixed(1)}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#F0F0F0]/30" />
                        </div>
                      </motion.button>
                    ))}
                </div>
              </ReactorCard>
            </div>
          </div>
        </main>

        {/* Game Detail Modal */}
        <AnimatePresence>
          {selectedGame && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1A2E]/90 backdrop-blur-xl"
              onClick={() => setSelectedGame(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto
                         bg-[#2C2F33]/90 border border-[#00F5FF]/20 rounded-2xl shadow-2xl
                         backdrop-blur-2xl"
              >
                {/* Modal Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-5 
                              bg-[#2C2F33]/90 border-b border-[#00F5FF]/10 backdrop-blur-xl">
                  <div>
                    <h2 className="text-xl font-bold text-bio-rhythm game-state-active">
                      {selectedGame.awayTeam.abbreviation} @ {selectedGame.homeTeam.abbreviation}
                    </h2>
                    <p className="text-sm text-[#F0F0F0]/50 font-mono">
                      {selectedGame.gameTime} • {selectedGame.venue}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="p-2 rounded-lg hover:bg-[#0A1A2E]/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-[#F0F0F0]" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Time-Cone Visualization */}
                  <div>
                    <h3 className="text-sm font-bold text-[#F0F0F0]/70 mb-4 uppercase tracking-wider">
                      TIME-CONE_PREDICTION
                    </h3>
                    <TimeCone
                      predictedSpread={selectedGame.prediction.predictedSpread}
                      currentSpread={selectedGame.odds.spread}
                      confidence={selectedGame.prediction.confidence}
                      variance={2.5}
                    />
                  </div>

                  {/* Win Probability */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#F0F0F0]/70">{selectedGame.awayTeam.abbreviation}</span>
                      <span className="text-[#F0F0F0]/70 font-mono">WIN_PROB</span>
                      <span className="text-[#F0F0F0]/70">{selectedGame.homeTeam.abbreviation}</span>
                    </div>
                    <div className="h-4 rounded-full bg-[#0A1A2E] overflow-hidden flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - selectedGame.prediction.homeWinProb}%` }}
                        className="h-full bg-[#FF4D00]"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedGame.prediction.homeWinProb}%` }}
                        className="h-full bg-[#00F5FF]"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[#F0F0F0]/50 font-mono">
                      <span>{100 - selectedGame.prediction.homeWinProb}%</span>
                      <span>{selectedGame.prediction.homeWinProb}%</span>
                    </div>
                  </div>

                  {/* Model Predictions */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#0A1A2E]/50 text-center border border-[#00F5FF]/10">
                      <div className="text-xs text-[#F0F0F0]/50 mb-1 font-mono">MODEL_SPREAD</div>
                      <div className="text-2xl font-mono font-bold text-[#00F5FF]">
                        {selectedGame.prediction.predictedSpread > 0 ? '+' : ''}
                        {selectedGame.prediction.predictedSpread.toFixed(1)}
                      </div>
                      <div className="text-xs text-[#F0F0F0]/40 mt-1 font-mono">
                        Market: {selectedGame.odds.spread > 0 ? '+' : ''}
                        {selectedGame.odds.spread}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0A1A2E]/50 text-center border border-[#00F5FF]/10">
                      <div className="text-xs text-[#F0F0F0]/50 mb-1 font-mono">MODEL_TOTAL</div>
                      <div className="text-2xl font-mono font-bold text-[#00F5FF]">
                        {selectedGame.prediction.predictedTotal.toFixed(1)}
                      </div>
                      <div className="text-xs text-[#F0F0F0]/40 mt-1 font-mono">
                        Market: {selectedGame.odds.total}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0A1A2E]/50 text-center border border-[#00F5FF]/10">
                      <div className="text-xs text-[#F0F0F0]/50 mb-1 font-mono">EDGE</div>
                      <div
                        className={`text-2xl font-mono font-bold ${
                          selectedGame.prediction.edge > 0 ? 'text-[#00F5FF]' : 'text-[#FF4D00]'
                        }`}
                      >
                        {selectedGame.prediction.edge > 0 ? '+' : ''}
                        {selectedGame.prediction.edge.toFixed(1)}%
                      </div>
                      <div className="text-xs text-[#F0F0F0]/40 mt-1 font-mono">
                        Conf: {Math.round(selectedGame.prediction.confidence * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Hazard Button - Magnetic */}
                  {selectedGame.prediction.edge > 3 && (
                    <MagneticButton
                      variant="toxic"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        // Handle bet placement
                        console.log('Place bet:', selectedGame.gameId);
                      }}
                    >
                      PLACE BET [EDGE: {selectedGame.prediction.edge.toFixed(1)}%]
                    </MagneticButton>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
