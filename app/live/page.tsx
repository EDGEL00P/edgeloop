'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Clock, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const MOCK_LIVE_GAMES = [
  {
    id: '1',
    homeTeam: { abbreviation: 'KC', name: 'Chiefs', score: 24 },
    awayTeam: { abbreviation: 'BUF', name: 'Bills', score: 21 },
    status: 'Q3 8:32',
    quarter: 3,
    timeRemaining: '8:32',
    possession: 'BUF',
    down: 2,
    distance: 7,
    yardLine: 'KC 42',
    winProb: { home: 0.58, away: 0.42 },
    momentum: 'home',
    lastPlay: 'Josh Allen pass complete to Stefon Diggs for 12 yards',
    keyEvents: [
      { time: 'Q3 10:15', event: 'Touchdown - Patrick Mahomes 8-yard pass to Travis Kelce', team: 'KC' },
      { time: 'Q3 9:45', event: 'Field Goal - Tyler Bass 45-yard FG', team: 'BUF' },
      { time: 'Q2 0:00', event: 'Halftime - KC 17, BUF 14', team: null },
    ],
  },
  {
    id: '2',
    homeTeam: { abbreviation: 'DET', name: 'Lions', score: 31 },
    awayTeam: { abbreviation: 'SF', name: '49ers', score: 28 },
    status: 'Q4 2:15',
    quarter: 4,
    timeRemaining: '2:15',
    possession: 'SF',
    down: 1,
    distance: 10,
    yardLine: 'DET 35',
    winProb: { home: 0.52, away: 0.48 },
    momentum: 'away',
    lastPlay: 'Brock Purdy pass incomplete to Deebo Samuel',
    keyEvents: [
      { time: 'Q4 3:45', event: 'Touchdown - Jahmyr Gibbs 15-yard run', team: 'DET' },
      { time: 'Q4 4:12', event: 'Field Goal - Jake Moody 38-yard FG', team: 'SF' },
    ],
  },
  {
    id: '3',
    homeTeam: { abbreviation: 'PHI', name: 'Eagles', score: 14 },
    awayTeam: { abbreviation: 'BAL', name: 'Ravens', score: 17 },
    status: 'Q2 5:22',
    quarter: 2,
    timeRemaining: '5:22',
    possession: 'PHI',
    down: 3,
    distance: 4,
    yardLine: 'BAL 28',
    winProb: { home: 0.45, away: 0.55 },
    momentum: 'away',
    lastPlay: 'Jalen Hurts rush for 3 yards',
    keyEvents: [
      { time: 'Q2 8:30', event: 'Touchdown - Lamar Jackson 12-yard run', team: 'BAL' },
      { time: 'Q1 2:15', event: 'Touchdown - Jalen Hurts 1-yard run', team: 'PHI' },
    ],
  },
];

export default function LivePage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PlayCircle className="w-8 h-8 text-[hsl(348_100%_55%)]" />
            <h1 className="text-4xl font-bold">Live Games</h1>
            <motion.div
              key={refreshKey}
              animate={{ scale: [1, 1.2, 1] }}
              className="w-3 h-3 rounded-full bg-[hsl(348_100%_55%)]"
            />
          </div>
          <p className="text-white/50">Real-time game tracking & win probability</p>
        </div>

        <div className="space-y-6">
          {MOCK_LIVE_GAMES.map((game) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-edgeloop overflow-hidden"
            >
              <div className="p-6">
                {/* Game Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-[hsl(348_100%_55%/0.2)] border border-[hsl(348_100%_55%/0.3)]">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-2 h-2 rounded-full bg-[hsl(348_100%_55%)]"
                        />
                        <span className="text-xs font-bold text-[hsl(348_100%_55%)]">LIVE</span>
                      </div>
                    </div>
                    <div className="text-sm text-white/50">{game.status}</div>
                  </div>
                  <Link
                    href={`/game/${game.id}`}
                    className="text-sm text-[hsl(185_100%_60%)] hover:underline"
                  >
                    View Details →
                  </Link>
                </div>

                {/* Score */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-right">
                    <div className="font-bold text-2xl">{game.awayTeam.abbreviation}</div>
                    <div className="text-sm text-white/50">{game.awayTeam.name}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold">
                      {game.awayTeam.score} - {game.homeTeam.score}
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      {game.possession === game.awayTeam.abbreviation ? '◄' : ''} {game.down} & {game.distance} {game.possession === game.homeTeam.abbreviation ? '►' : ''}
                    </div>
                    <div className="text-xs text-white/40 mt-1">{game.yardLine}</div>
                  </div>
                  <div>
                    <div className="font-bold text-2xl">{game.homeTeam.abbreviation}</div>
                    <div className="text-sm text-white/50">{game.homeTeam.name}</div>
                  </div>
                </div>

                {/* Win Probability */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>{game.awayTeam.abbreviation}</span>
                    <span>Win Probability</span>
                    <span>{game.homeTeam.abbreviation}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                    <motion.div
                      key={refreshKey}
                      initial={{ width: `${game.winProb.away * 100}%` }}
                      animate={{ width: `${game.winProb.away * 100}%` }}
                      className="h-full bg-[hsl(348_100%_55%)]"
                    />
                    <motion.div
                      key={refreshKey}
                      initial={{ width: `${game.winProb.home * 100}%` }}
                      animate={{ width: `${game.winProb.home * 100}%` }}
                      className="h-full bg-[hsl(145_80%_50%)]"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/40 font-mono mt-1">
                    <span>{Math.round(game.winProb.away * 100)}%</span>
                    <span>{Math.round(game.winProb.home * 100)}%</span>
                  </div>
                </div>

                {/* Last Play */}
                <div className="p-3 rounded-lg bg-white/[0.03] mb-4">
                  <div className="text-xs text-white/50 mb-1">Last Play</div>
                  <div className="text-sm">{game.lastPlay}</div>
                </div>

                {/* Key Events Toggle */}
                <button
                  onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[hsl(45_100%_60%)]" />
                    <span className="text-sm font-medium">Key Events</span>
                  </div>
                  <TrendingUp
                    className={`w-4 h-4 text-white/50 transition-transform ${
                      selectedGame === game.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Key Events List */}
                <AnimatePresence>
                  {selectedGame === game.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        {game.keyEvents.map((event, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02] text-sm"
                          >
                            <div className="text-xs text-white/40 font-mono w-16 flex-shrink-0">
                              {event.time}
                            </div>
                            <div className="flex-1">
                              <span
                                className={
                                  event.team === game.awayTeam.abbreviation
                                    ? 'text-[hsl(348_100%_65%)]'
                                    : event.team === game.homeTeam.abbreviation
                                    ? 'text-[hsl(145_80%_55%)]'
                                    : 'text-white/70'
                                }
                              >
                                {event.event}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Live Games State */}
        {MOCK_LIVE_GAMES.length === 0 && (
          <div className="card-edgeloop p-12 text-center">
            <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Live Games</h3>
            <p className="text-white/50">Check back during game times</p>
          </div>
        )}
      </div>
    </div>
  );
}
