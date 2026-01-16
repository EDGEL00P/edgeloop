'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';

const MOCK_STANDINGS = {
  AFC: {
    East: [
      { team: 'BUF', wins: 13, losses: 4, ties: 0, pct: 0.765, pf: 451, pa: 311, div: '5-1', conf: '9-3' },
      { team: 'MIA', wins: 11, losses: 6, ties: 0, pct: 0.647, pf: 496, pa: 391, div: '4-2', conf: '7-5' },
      { team: 'NYJ', wins: 7, losses: 10, ties: 0, pct: 0.412, pf: 268, pa: 355, div: '2-4', conf: '4-8' },
      { team: 'NE', wins: 4, losses: 13, ties: 0, pct: 0.235, pf: 236, pa: 366, div: '1-5', conf: '2-10' },
    ],
    North: [
      { team: 'BAL', wins: 14, losses: 3, ties: 0, pct: 0.824, pf: 483, pa: 280, div: '4-2', conf: '9-3' },
      { team: 'CLE', wins: 11, losses: 6, ties: 0, pct: 0.647, pf: 396, pa: 362, div: '3-3', conf: '8-4' },
      { team: 'PIT', wins: 10, losses: 7, ties: 0, pct: 0.588, pf: 304, pa: 324, div: '2-4', conf: '7-5' },
      { team: 'CIN', wins: 9, losses: 8, ties: 0, pct: 0.529, pf: 366, pa: 384, div: '1-5', conf: '4-8' },
    ],
    South: [
      { team: 'HOU', wins: 10, losses: 7, ties: 0, pct: 0.588, pf: 377, pa: 353, div: '4-2', conf: '7-5' },
      { team: 'JAX', wins: 9, losses: 8, ties: 0, pct: 0.529, pf: 377, pa: 371, div: '3-3', conf: '6-6' },
      { team: 'IND', wins: 9, losses: 8, ties: 0, pct: 0.529, pf: 396, pa: 415, div: '3-3', conf: '7-5' },
      { team: 'TEN', wins: 6, losses: 11, ties: 0, pct: 0.353, pf: 305, pa: 367, div: '2-4', conf: '4-8' },
    ],
    West: [
      { team: 'KC', wins: 14, losses: 3, ties: 0, pct: 0.824, pf: 371, pa: 294, div: '5-1', conf: '9-3' },
      { team: 'LV', wins: 8, losses: 9, ties: 0, pct: 0.471, pf: 332, pa: 331, div: '4-2', conf: '6-6' },
      { team: 'DEN', wins: 8, losses: 9, ties: 0, pct: 0.471, pf: 357, pa: 413, div: '2-4', conf: '5-7' },
      { team: 'LAC', wins: 5, losses: 12, ties: 0, pct: 0.294, pf: 346, pa: 398, div: '1-5', conf: '3-9' },
    ],
  },
  NFC: {
    East: [
      { team: 'DAL', wins: 12, losses: 5, ties: 0, pct: 0.706, pf: 509, pa: 315, div: '5-1', conf: '9-3' },
      { team: 'PHI', wins: 11, losses: 6, ties: 0, pct: 0.647, pf: 433, pa: 428, div: '4-2', conf: '7-5' },
      { team: 'NYG', wins: 6, losses: 11, ties: 0, pct: 0.353, pf: 266, pa: 407, div: '1-5', conf: '3-9' },
      { team: 'WAS', wins: 4, losses: 13, ties: 0, pct: 0.235, pf: 329, pa: 518, div: '2-4', conf: '2-10' },
    ],
    North: [
      { team: 'DET', wins: 15, losses: 2, ties: 0, pct: 0.882, pf: 461, pa: 395, div: '5-1', conf: '10-2' },
      { team: 'GB', wins: 12, losses: 5, ties: 0, pct: 0.706, pf: 383, pa: 350, div: '4-2', conf: '8-4' },
      { team: 'MIN', wins: 7, losses: 10, ties: 0, pct: 0.412, pf: 344, pa: 362, div: '2-4', conf: '6-6' },
      { team: 'CHI', wins: 7, losses: 10, ties: 0, pct: 0.412, pf: 360, pa: 379, div: '1-5', conf: '5-7' },
    ],
    South: [
      { team: 'TB', wins: 9, losses: 8, ties: 0, pct: 0.529, pf: 348, pa: 325, div: '4-2', conf: '7-5' },
      { team: 'ATL', wins: 7, losses: 10, ties: 0, pct: 0.412, pf: 321, pa: 373, div: '3-3', conf: '4-8' },
      { team: 'NO', wins: 9, losses: 8, ties: 0, pct: 0.529, pf: 402, pa: 327, div: '3-3', conf: '6-6' },
      { team: 'CAR', wins: 2, losses: 15, ties: 0, pct: 0.118, pf: 236, pa: 416, div: '2-4', conf: '2-10' },
    ],
    West: [
      { team: 'SF', wins: 12, losses: 5, ties: 0, pct: 0.706, pf: 491, pa: 298, div: '5-1', conf: '10-2' },
      { team: 'LAR', wins: 10, losses: 7, ties: 0, pct: 0.588, pf: 404, pa: 377, div: '3-3', conf: '7-5' },
      { team: 'SEA', wins: 9, losses: 8, ties: 0, pct: 0.529, pf: 364, pa: 402, div: '2-4', conf: '6-6' },
      { team: 'ARI', wins: 4, losses: 13, ties: 0, pct: 0.235, pf: 330, pa: 455, div: '2-4', conf: '3-9' },
    ],
  },
};

export default function StandingsPage() {
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(['AFC-East', 'NFC-East'])
  );

  const toggleDivision = (key: string) => {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">NFL Standings</h1>
          <p className="text-white/50">2024 Season • Updated Live</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AFC */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-[hsl(45_100%_60%)]" />
              <h2 className="text-2xl font-bold">AFC</h2>
            </div>

            {Object.entries(MOCK_STANDINGS.AFC).map(([division, teams]) => {
              const key = `AFC-${division}`;
              const isExpanded = expandedDivisions.has(key);
              return (
                <motion.div
                  key={key}
                  className="card-edgeloop overflow-hidden"
                  initial={false}
                >
                  <button
                    onClick={() => toggleDivision(key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <h3 className="font-bold text-lg">{division}</h3>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/50" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/50" />
                    )}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-12 gap-2 text-xs text-white/50 mb-2 pb-2 border-b border-white/10">
                          <div className="col-span-3">Team</div>
                          <div className="col-span-2 text-center">W-L-T</div>
                          <div className="col-span-1 text-center">PCT</div>
                          <div className="col-span-2 text-center">PF</div>
                          <div className="col-span-2 text-center">PA</div>
                          <div className="col-span-2 text-center">DIV</div>
                        </div>
                        {teams.map((team, idx) => (
                          <motion.div
                            key={team.team}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="grid grid-cols-12 gap-2 py-2 items-center hover:bg-white/5 rounded-lg px-2 transition-colors"
                          >
                            <div className="col-span-3 font-bold">{team.team}</div>
                            <div className="col-span-2 text-center text-sm">
                              {team.wins}-{team.losses}-{team.ties}
                            </div>
                            <div className="col-span-1 text-center text-sm font-mono">
                              {team.pct.toFixed(3)}
                            </div>
                            <div className="col-span-2 text-center text-sm">{team.pf}</div>
                            <div className="col-span-2 text-center text-sm">{team.pa}</div>
                            <div className="col-span-2 text-center text-sm">{team.div}</div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* NFC */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-[hsl(45_100%_60%)]" />
              <h2 className="text-2xl font-bold">NFC</h2>
            </div>

            {Object.entries(MOCK_STANDINGS.NFC).map(([division, teams]) => {
              const key = `NFC-${division}`;
              const isExpanded = expandedDivisions.has(key);
              return (
                <motion.div
                  key={key}
                  className="card-edgeloop overflow-hidden"
                  initial={false}
                >
                  <button
                    onClick={() => toggleDivision(key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <h3 className="font-bold text-lg">{division}</h3>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/50" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/50" />
                    )}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-12 gap-2 text-xs text-white/50 mb-2 pb-2 border-b border-white/10">
                          <div className="col-span-3">Team</div>
                          <div className="col-span-2 text-center">W-L-T</div>
                          <div className="col-span-1 text-center">PCT</div>
                          <div className="col-span-2 text-center">PF</div>
                          <div className="col-span-2 text-center">PA</div>
                          <div className="col-span-2 text-center">DIV</div>
                        </div>
                        {teams.map((team, idx) => (
                          <motion.div
                            key={team.team}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="grid grid-cols-12 gap-2 py-2 items-center hover:bg-white/5 rounded-lg px-2 transition-colors"
                          >
                            <div className="col-span-3 font-bold">{team.team}</div>
                            <div className="col-span-2 text-center text-sm">
                              {team.wins}-{team.losses}-{team.ties}
                            </div>
                            <div className="col-span-1 text-center text-sm font-mono">
                              {team.pct.toFixed(3)}
                            </div>
                            <div className="col-span-2 text-center text-sm">{team.pf}</div>
                            <div className="col-span-2 text-center text-sm">{team.pa}</div>
                            <div className="col-span-2 text-center text-sm">{team.div}</div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
