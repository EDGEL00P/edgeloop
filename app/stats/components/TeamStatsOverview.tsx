/**
 * TEAM STATS OVERVIEW - V3 Design System
 * Team statistics grid with ReactorCard styling
 */

'use client';

import { motion } from 'framer-motion';
import { ReactorCard } from '../../components/ReactorCard';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface TeamStat {
  id: string;
  name: string;
  abbreviation: string;
  stats: Record<string, number>;
  record: { wins: number; losses: number; ties: number };
}

interface TeamStatsOverviewProps {
  teams: TeamStat[];
}

export function TeamStatsOverview({ teams }: TeamStatsOverviewProps) {
  // Sort by wins
  const sortedTeams = [...teams].sort(
    (a, b) => b.record.wins - a.record.wins
  );

  return (
    <div className="mb-6">
      <ReactorCard intensity="low">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-[#00F5FF]" />
          <h2 className="text-lg font-bold text-bio-rhythm game-state-active">
            TEAM_STANDINGS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedTeams.slice(0, 8).map((team, idx) => {
            const winPct =
              team.record.wins /
              (team.record.wins + team.record.losses + team.record.ties);
            const pointDiff = team.stats.pointsFor - team.stats.pointsAgainst;

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg bg-[#0A1A2E]/50 border border-[#152B47] hover:border-[#00F5FF]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-[#F0F0F0]">{team.abbreviation}</div>
                    <div className="text-xs text-[#F0F0F0]/50 font-mono">
                      {team.record.wins}-{team.record.losses}-{team.record.ties}
                    </div>
                  </div>
                  {pointDiff > 0 ? (
                    <TrendingUp className="w-5 h-5 text-[#00F5FF]" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-[#FF4D00]" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#F0F0F0]/50">Win %</span>
                    <span className="font-mono text-[#00F5FF]">
                      {(winPct * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#F0F0F0]/50">PF</span>
                    <span className="font-mono text-[#F0F0F0]">
                      {team.stats.pointsFor}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#F0F0F0]/50">PA</span>
                    <span className="font-mono text-[#F0F0F0]">
                      {team.stats.pointsAgainst}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#F0F0F0]/50">Diff</span>
                    <span
                      className={`font-mono ${
                        pointDiff > 0 ? 'text-[#00F5FF]' : 'text-[#FF4D00]'
                      }`}
                    >
                      {pointDiff > 0 ? '+' : ''}
                      {pointDiff}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ReactorCard>
    </div>
  );
}
