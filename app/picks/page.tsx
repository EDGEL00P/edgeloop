 'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button } from '../../libs/ui/src';
import { Target, Star, TrendingUp, Filter, X } from 'lucide-react';
import Link from 'next/link';

type PickResult = 'pending' | 'won' | 'lost';

interface MockPick {
  id: string;
  gameId: string;
  game: string;
  type: string;
  selection: string;
  odds: number;
  modelConfidence: number;
  edge: number;
  timestamp: Date;
  result: PickResult;
  starred: boolean;
  notes: string;
}

const MOCK_PICKS: MockPick[] = [
  {
    id: '1',
    gameId: '1',
    game: 'BUF @ KC',
    type: 'spread',
    selection: 'KC -3.5',
    odds: -110,
    modelConfidence: 0.72,
    edge: 3.8,
    timestamp: new Date('2024-01-19T10:30:00'),
    result: 'pending',
    starred: true,
    notes: 'Sharp action detected, weather minimal impact',
  },
  {
    id: '2',
    gameId: '2',
    game: 'SF @ DET',
    type: 'total',
    selection: 'Over 51',
    odds: -110,
    modelConfidence: 0.68,
    edge: 2.5,
    timestamp: new Date('2024-01-19T11:15:00'),
    result: 'pending',
    starred: false,
    notes: 'Both teams high pace, weak secondaries',
  },
  {
    id: '3',
    gameId: '3',
    game: 'HOU @ BAL',
    type: 'moneyline',
    selection: 'BAL',
    odds: -175,
    modelConfidence: 0.81,
    edge: 5.2,
    timestamp: new Date('2024-01-19T09:45:00'),
    result: 'pending',
    starred: true,
    notes: 'Home field advantage, superior defense',
  },
  {
    id: '4',
    gameId: '4',
    game: 'GB @ SF',
    type: 'spread',
    selection: 'GB +7',
    odds: -105,
    modelConfidence: 0.65,
    edge: 1.8,
    timestamp: new Date('2024-01-18T14:20:00'),
    result: 'pending',
    starred: false,
    notes: 'Value on underdog, close game expected',
  },
];

export default function PicksPage() {
  const [filter, setFilter] = useState<'all' | 'starred' | 'pending' | 'won' | 'lost'>('all');
  const [selectedPick, setSelectedPick] = useState<string | null>(null);

  const filteredPicks = MOCK_PICKS.filter((pick) => {
    if (filter === 'starred') return pick.starred;
    if (filter === 'pending') return pick.result === 'pending';
    if (filter === 'won') return pick.result === 'won';
    if (filter === 'lost') return pick.result === 'lost';
    return true;
  });

  const stats = {
    total: MOCK_PICKS.length,
    pending: MOCK_PICKS.filter((p) => p.result === 'pending').length,
    won: MOCK_PICKS.filter((p) => p.result === 'won').length,
    lost: MOCK_PICKS.filter((p) => p.result === 'lost').length,
    winRate: MOCK_PICKS.filter((p) => p.result === 'won').length /
      (MOCK_PICKS.filter((p) => p.result !== 'pending').length || 1),
    avgEdge: MOCK_PICKS.reduce((acc, p) => acc + p.edge, 0) / MOCK_PICKS.length,
  };

  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-[hsl(185_100%_60%)]" />
            <h1 className="text-4xl font-bold">My Picks</h1>
          </div>
          <p className="text-white/50">Track your predictions and model performance</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-sm text-white/50 mb-1">Total Picks</div>
            <div className="text-2xl font-mono font-bold">{stats.total}</div>
          </Card>
          <Card>
            <div className="text-sm text-white/50 mb-1">Pending</div>
            <div className="text-2xl font-mono font-bold text-[hsl(45_100%_60%)]">{stats.pending}</div>
          </Card>
          <Card>
            <div className="text-sm text-white/50 mb-1">Win Rate</div>
            <div className="text-2xl font-mono font-bold text-[hsl(145_80%_55%)]">{Math.round(stats.winRate * 100)}%</div>
          </Card>
          <Card>
            <div className="text-sm text-white/50 mb-1">Avg Edge</div>
            <div className="text-2xl font-mono font-bold text-[hsl(185_100%_60%)]">+{stats.avgEdge.toFixed(1)}%</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-4 h-4 text-white/50" />
          <span className="text-sm text-white/50">Filter:</span>
          {(['all', 'starred', 'pending', 'won', 'lost'] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-[hsl(185_100%_50%/0.2)] text-[hsl(185_100%_60%)] border border-[hsl(185_100%_50%/0.3)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              variant={filter === f ? 'primary' : 'ghost'}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Picks List */}
        <div className="space-y-4">
          {filteredPicks.length > 0 ? (
            filteredPicks.map((pick) => (
              <motion.div
                key={pick.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-edgeloop p-6 hover:border-[hsl(185_100%_50%/0.3)] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        href={`/game/${pick.gameId}`}
                        className="font-bold text-lg hover:text-[hsl(185_100%_60%)] transition-colors"
                      >
                        {pick.game}
                      </Link>
                      {pick.starred && (
                        <Star className="w-4 h-4 text-[hsl(45_100%_60%)] fill-[hsl(45_100%_60%)]" />
                      )}
                      <div className={`badge-neon ${pick.edge > 3 ? 'badge-positive' : 'badge-cyan'}`}>
                        +{pick.edge.toFixed(1)}% edge
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-white/50 mb-1">Type</div>
                        <div className="text-sm font-medium capitalize">{pick.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50 mb-1">Selection</div>
                        <div className="text-sm font-bold">{pick.selection}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50 mb-1">Odds</div>
                        <div className="text-sm font-mono">
                          {pick.odds > 0 ? '+' : ''}
                          {pick.odds}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50 mb-1">Confidence</div>
                        <div className="text-sm font-mono text-[hsl(185_100%_60%)]">
                          {Math.round(pick.modelConfidence * 100)}%
                        </div>
                      </div>
                    </div>

                    {pick.notes && (
                      <div className="p-3 rounded-lg bg-white/[0.03] text-sm text-white/70">
                        {pick.notes}
                      </div>
                    )}

                    <div className="text-xs text-white/40 mt-3">
                      Tracked {pick.timestamp.toLocaleString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col items-end gap-2">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pick.result === 'pending'
                          ? 'bg-[hsl(45_100%_50%/0.2)] text-[hsl(45_100%_60%)] border border-[hsl(45_100%_50%/0.3)]'
                          : pick.result === 'won'
                          ? 'bg-[hsl(145_80%_50%/0.2)] text-[hsl(145_80%_55%)] border border-[hsl(145_80%_50%/0.3)]'
                          : 'bg-[hsl(348_100%_50%/0.2)] text-[hsl(348_100%_65%)] border border-[hsl(348_100%_50%/0.3)]'
                      }`}
                    >
                      {pick.result === 'pending' ? 'Pending' : pick.result === 'won' ? 'Won' : 'Lost'}
                    </div>
                    <Link
                      href={`/game/${pick.gameId}`}
                      className="text-xs text-[hsl(185_100%_60%)] hover:underline"
                    >
                      View Game →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="card-edgeloop p-12 text-center">
              <Target className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Picks Found</h3>
              <p className="text-white/50">
                {filter === 'all'
                  ? 'Start tracking picks from the dashboard'
                  : `No ${filter} picks found`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
