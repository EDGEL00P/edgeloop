'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, BarChart3 } from 'lucide-react';

const MOCK_PROPS = [
  {
    id: '1',
    player: 'Patrick Mahomes',
    team: 'KC',
    prop: 'Passing Yards',
    line: 275.5,
    prediction: 289.3,
    edge: 4.8,
    confidence: 0.78,
    odds: { over: -110, under: -110 },
    factors: [
      { name: 'Opponent Pass Defense', value: 0.72, impact: 'positive' },
      { name: 'Weather Impact', value: 0.15, impact: 'negative' },
      { name: 'Game Script', value: 0.68, impact: 'positive' },
    ],
  },
  {
    id: '2',
    player: 'Josh Allen',
    team: 'BUF',
    prop: 'Passing TDs',
    line: 2.5,
    prediction: 2.8,
    edge: 12.0,
    confidence: 0.82,
    odds: { over: -115, under: -105 },
    factors: [
      { name: 'Red Zone Efficiency', value: 0.85, impact: 'positive' },
      { name: 'Opponent RZ Defense', value: 0.42, impact: 'positive' },
    ],
  },
  {
    id: '3',
    player: 'Christian McCaffrey',
    team: 'SF',
    prop: 'Rushing Yards',
    line: 95.5,
    prediction: 102.4,
    edge: 7.2,
    confidence: 0.75,
    odds: { over: -110, under: -110 },
    factors: [
      { name: 'Snap Share', value: 0.78, impact: 'positive' },
      { name: 'Opponent Run Defense', value: 0.38, impact: 'positive' },
      { name: 'Game Script', value: 0.65, impact: 'positive' },
    ],
  },
  {
    id: '4',
    player: 'Tyreek Hill',
    team: 'MIA',
    prop: 'Receiving Yards',
    line: 89.5,
    prediction: 94.2,
    edge: 5.3,
    confidence: 0.71,
    odds: { over: -110, under: -110 },
    factors: [
      { name: 'Target Share', value: 0.82, impact: 'positive' },
      { name: 'Matchup Rating', value: 0.68, impact: 'positive' },
    ],
  },
  {
    id: '5',
    player: 'Travis Kelce',
    team: 'KC',
    prop: 'Receptions',
    line: 6.5,
    prediction: 7.1,
    edge: 9.2,
    confidence: 0.79,
    odds: { over: -115, under: -105 },
    factors: [
      { name: 'Target Share', value: 0.75, impact: 'positive' },
      { name: 'Route Participation', value: 0.88, impact: 'positive' },
    ],
  },
];

export default function PropsPage() {
  const [selectedProp, setSelectedProp] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'over' | 'under'>('all');

  const filteredProps = MOCK_PROPS.filter((prop) => {
    if (filter === 'over') return prop.prediction > prop.line;
    if (filter === 'under') return prop.prediction < prop.line;
    return true;
  });

  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-[hsl(185_100%_60%)]" />
            <h1 className="text-4xl font-bold">Player Props</h1>
          </div>
          <p className="text-white/50">AI-Powered Prop Analysis & Edge Detection</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-white/50">Filter:</span>
          {(['all', 'over', 'under'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[hsl(185_100%_50%/0.2)] text-[hsl(185_100%_60%)] border border-[hsl(185_100%_50%/0.3)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f === 'over' ? 'Over' : 'Under'}
            </button>
          ))}
        </div>

        {/* Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProps.map((prop) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-edgeloop p-5 cursor-pointer hover:border-[hsl(185_100%_50%/0.3)] transition-all"
              onClick={() => setSelectedProp(selectedProp === prop.id ? null : prop.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-lg">{prop.player}</div>
                  <div className="text-sm text-white/50">{prop.team} • {prop.prop}</div>
                </div>
                <div className={`badge-neon ${prop.edge > 5 ? 'badge-positive' : 'badge-cyan'}`}>
                  +{prop.edge.toFixed(1)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-white/[0.03]">
                  <div className="text-xs text-white/50 mb-1">Line</div>
                  <div className="text-xl font-mono font-bold">{prop.line}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03]">
                  <div className="text-xs text-white/50 mb-1">Model</div>
                  <div className="text-xl font-mono font-bold text-[hsl(185_100%_60%)]">
                    {prop.prediction.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-white/40" />
                  <span className="text-white/50">
                    {Math.round(prop.confidence * 100)}% conf
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[hsl(145_80%_55%)]">O {prop.odds.over}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-[hsl(348_100%_65%)]">U {prop.odds.under}</span>
                </div>
              </div>

              {selectedProp === prop.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-white/50 mb-2">Key Factors:</div>
                    {prop.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-white/70">{factor.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${factor.value * 100}%` }}
                              className={`h-full ${
                                factor.impact === 'positive'
                                  ? 'bg-[hsl(145_80%_55%)]'
                                  : 'bg-[hsl(348_100%_65%)]'
                              }`}
                            />
                          </div>
                          <span className="text-xs text-white/50 w-8 text-right">
                            {Math.round(factor.value * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-edgeloop p-5 text-center">
            <TrendingUp className="w-6 h-6 text-[hsl(145_80%_55%)] mx-auto mb-2" />
            <div className="text-2xl font-mono font-bold">{MOCK_PROPS.length}</div>
            <div className="text-sm text-white/50">Total Props</div>
          </div>
          <div className="card-edgeloop p-5 text-center">
            <Zap className="w-6 h-6 text-[hsl(185_100%_60%)] mx-auto mb-2" />
            <div className="text-2xl font-mono font-bold">
              {MOCK_PROPS.filter((p) => p.edge > 5).length}
            </div>
            <div className="text-sm text-white/50">High Edge</div>
          </div>
          <div className="card-edgeloop p-5 text-center">
            <Target className="w-6 h-6 text-[hsl(45_100%_60%)] mx-auto mb-2" />
            <div className="text-2xl font-mono font-bold">
              {Math.round(
                (MOCK_PROPS.reduce((acc, p) => acc + p.confidence, 0) / MOCK_PROPS.length) * 100
              )}%
            </div>
            <div className="text-sm text-white/50">Avg Confidence</div>
          </div>
          <div className="card-edgeloop p-5 text-center">
            <BarChart3 className="w-6 h-6 text-[hsl(185_100%_60%)] mx-auto mb-2" />
            <div className="text-2xl font-mono font-bold">
              {MOCK_PROPS.filter((p) => p.prediction > p.line).length}/
              {MOCK_PROPS.filter((p) => p.prediction < p.line).length}
            </div>
            <div className="text-sm text-white/50">Over/Under Split</div>
          </div>
        </div>
      </div>
    </div>
  );
}
