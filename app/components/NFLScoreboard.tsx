/**
 * NFL SCOREBOARD HUD
 * ESPN Broadcast-style scoreboard component
 */

'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';

interface NFLScoreboardProps {
  homeTeam: { name: string; abbreviation: string; score?: number };
  awayTeam: { name: string; abbreviation: string; score?: number };
  quarter?: string;
  timeRemaining?: string;
  down?: string;
  distance?: string;
  className?: string;
}

export function NFLScoreboard({
  homeTeam,
  awayTeam,
  quarter = 'Q1',
  timeRemaining = '15:00',
  down,
  distance,
  className = '',
}: NFLScoreboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#2C2F33]/90 backdrop-blur-xl border border-white/5 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* Away Team */}
        <div className="flex-1">
          <div className="text-xs text-[#F0F0F0]/50 uppercase tracking-widest mb-1">
            {awayTeam.name}
          </div>
          <div className="text-2xl font-bold text-[#F0F0F0] font-mono">
            {awayTeam.score ?? 0}
          </div>
          <div className="text-xs text-[#00F5FF] font-mono mt-1">
            {awayTeam.abbreviation}
          </div>
        </div>

        {/* Game Info */}
        <div className="flex flex-col items-center gap-2 px-6">
          <div className="flex items-center gap-2 text-[#00F5FF]">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono font-bold">{timeRemaining}</span>
          </div>
          <div className="text-xs text-[#F0F0F0]/60 uppercase tracking-widest">
            {quarter}
          </div>
          {down && distance && (
            <div className="text-xs text-[#FF4D00] font-mono font-bold">
              {down} & {distance}
            </div>
          )}
        </div>

        {/* Home Team */}
        <div className="flex-1 text-right">
          <div className="text-xs text-[#F0F0F0]/50 uppercase tracking-widest mb-1">
            {homeTeam.name}
          </div>
          <div className="text-2xl font-bold text-[#F0F0F0] font-mono">
            {homeTeam.score ?? 0}
          </div>
          <div className="text-xs text-[#00F5FF] font-mono mt-1">
            {homeTeam.abbreviation}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
