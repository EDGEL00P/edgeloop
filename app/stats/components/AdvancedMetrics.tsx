/**
 * ADVANCED METRICS - V3 Design System
 * EPA, CPOE, Success Rate visualizations
 */

'use client';

import { motion } from 'framer-motion';
import { ReactorCard } from '../../components/ReactorCard';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
  advanced?: {
    epa?: number;
    successRate?: number;
    cpoe?: number;
  };
}

interface AdvancedMetricsProps {
  players: Player[];
}

export function AdvancedMetrics({ players }: AdvancedMetricsProps) {
  // Filter players with advanced metrics
  const playersWithMetrics = players.filter((p) => p.advanced);

  // Top performers
  const topEPA = [...playersWithMetrics]
    .sort((a, b) => (b.advanced?.epa || 0) - (a.advanced?.epa || 0))
    .slice(0, 10);

  const topCPOE = [...playersWithMetrics]
    .sort((a, b) => (b.advanced?.cpoe || 0) - (a.advanced?.cpoe || 0))
    .slice(0, 10);

  const topSuccessRate = [...playersWithMetrics]
    .sort((a, b) => (b.advanced?.successRate || 0) - (a.advanced?.successRate || 0))
    .slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* EPA Leaders */}
      <ReactorCard intensity="med">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#00F5FF]" />
          <h3 className="font-bold text-bio-rhythm game-state-active">
            EPA_LEADERS
          </h3>
        </div>
        <div className="space-y-3">
          {topEPA.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0A1A2E]/50"
            >
              <div>
                <div className="text-sm font-bold text-[#F0F0F0]">{player.name}</div>
                <div className="text-xs text-[#F0F0F0]/50 font-mono">
                  {player.team} • {player.position}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-[#00F5FF]">
                  {player.advanced?.epa?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ReactorCard>

      {/* CPOE Leaders */}
      <ReactorCard intensity="med">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#00F5FF]" />
          <h3 className="font-bold text-bio-rhythm game-state-active">
            CPOE_LEADERS
          </h3>
        </div>
        <div className="space-y-3">
          {topCPOE.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0A1A2E]/50"
            >
              <div>
                <div className="text-sm font-bold text-[#F0F0F0]">{player.name}</div>
                <div className="text-xs text-[#F0F0F0]/50 font-mono">
                  {player.team} • {player.position}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-[#00F5FF]">
                  {player.advanced?.cpoe?.toFixed(1) || 'N/A'}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ReactorCard>

      {/* Success Rate Leaders */}
      <ReactorCard intensity="med">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#00F5FF]" />
          <h3 className="font-bold text-bio-rhythm game-state-active">
            SUCCESS_RATE
          </h3>
        </div>
        <div className="space-y-3">
          {topSuccessRate.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0A1A2E]/50"
            >
              <div>
                <div className="text-sm font-bold text-[#F0F0F0]">{player.name}</div>
                <div className="text-xs text-[#F0F0F0]/50 font-mono">
                  {player.team} • {player.position}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-[#00F5FF]">
                  {(player.advanced?.successRate || 0) * 100}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ReactorCard>
    </div>
  );
}
