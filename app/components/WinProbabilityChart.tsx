'use client';

/**
 * WIN PROBABILITY CHART — Animated probability curve with confidence bands
 * NFL broadcast-style visualization showing game momentum
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WinProbDataPoint {
  play: number;
  quarter: number;
  time: string;
  homeWinProb: number;
  awayWinProb: number;
  homeWinProbLow: number;
  homeWinProbHigh: number;
  description?: string;
  isKeyPlay?: boolean;
  scoreDelta?: number;
}

interface WinProbabilityChartProps {
  data: WinProbDataPoint[];
  homeTeam: string;
  awayTeam: string;
  homeColor?: string;
  awayColor?: string;
  className?: string;
  showConfidenceBand?: boolean;
  animated?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
  data: WinProbDataPoint[];
  homeTeam: string;
  awayTeam: string;
}

function CustomTooltip({ active, payload, label, data, homeTeam, awayTeam }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const point = data.find((d) => d.play === label);
  if (!point) return null;

  const homeProb = point.homeWinProb;
  const awayProb = point.awayWinProb;
  const favorite = homeProb > 50 ? homeTeam : awayTeam;
  const favoriteProb = Math.max(homeProb, awayProb);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[hsl(220_18%_10%)] border border-white/10 rounded-lg p-3 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-white/50">Q{point.quarter}</span>
        <span className="text-xs font-mono text-white/70">{point.time}</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{homeTeam}</span>
          <span className={`font-mono font-bold ${homeProb > 50 ? 'text-[hsl(145_80%_55%)]' : 'text-white/70'}`}>
            {homeProb.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{awayTeam}</span>
          <span className={`font-mono font-bold ${awayProb > 50 ? 'text-[hsl(145_80%_55%)]' : 'text-white/70'}`}>
            {awayProb.toFixed(1)}%
          </span>
        </div>
      </div>

      {point.description && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs text-white/60">{point.description}</p>
        </div>
      )}

      {point.isKeyPlay && (
        <div className="mt-2 flex items-center gap-1">
          <Activity className="w-3 h-3 text-[hsl(45_100%_60%)]" />
          <span className="text-xs text-[hsl(45_100%_60%)]">Key Play</span>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function WinProbabilityChart({
  data,
  homeTeam,
  awayTeam,
  homeColor = 'hsl(145, 80%, 55%)',
  awayColor = 'hsl(348, 100%, 60%)',
  className = '',
  showConfidenceBand = true,
  animated = true,
}: WinProbabilityChartProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Current win probabilities
  const currentPoint = data[data.length - 1];
  const homeWinProb = currentPoint?.homeWinProb ?? 50;
  const awayWinProb = currentPoint?.awayWinProb ?? 50;

  // Momentum calculation (last 10 plays)
  const momentum = useMemo(() => {
    if (data.length < 10) return 0;
    const recent = data.slice(-10);
    const start = recent[0].homeWinProb;
    const end = recent[recent.length - 1].homeWinProb;
    return end - start;
  }, [data]);

  // Key plays
  const keyPlays = useMemo(() => {
    return data.filter((d) => d.isKeyPlay);
  }, [data]);

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[hsl(185_100%_60%)]" />
          <h3 className="font-bold">Win Probability</h3>
        </div>
        
        {/* Momentum indicator */}
        <div className="flex items-center gap-2">
          {momentum > 0 ? (
            <TrendingUp className="w-4 h-4 text-[hsl(145_80%_55%)]" />
          ) : momentum < 0 ? (
            <TrendingDown className="w-4 h-4 text-[hsl(348_100%_60%)]" />
          ) : null}
          <span className={`text-xs font-mono ${
            momentum > 0 ? 'text-[hsl(145_80%_55%)]' : 
            momentum < 0 ? 'text-[hsl(348_100%_60%)]' : 'text-white/50'
          }`}>
            {momentum > 0 ? '+' : ''}{momentum.toFixed(1)}% momentum
          </span>
        </div>
      </div>

      {/* Current probabilities */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
          <span className="font-medium">{awayTeam}</span>
          <span className={`font-mono font-bold text-lg ${awayWinProb > 50 ? 'text-[hsl(145_80%_55%)]' : 'text-white/70'}`}>
            {awayWinProb.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
          <span className="font-medium">{homeTeam}</span>
          <span className={`font-mono font-bold text-lg ${homeWinProb > 50 ? 'text-[hsl(145_80%_55%)]' : 'text-white/70'}`}>
            {homeWinProb.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {/* Home team gradient */}
              <linearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={homeColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={homeColor} stopOpacity={0} />
              </linearGradient>
              {/* Away team gradient */}
              <linearGradient id="awayGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={awayColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={awayColor} stopOpacity={0} />
              </linearGradient>
              {/* Confidence band gradient */}
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.05)" 
              vertical={false}
            />

            <XAxis 
              dataKey="play"
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis 
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />

            {/* 50% reference line */}
            <ReferenceLine 
              y={50} 
              stroke="rgba(255,255,255,0.2)" 
              strokeDasharray="5 5"
            />

            {/* Quarter markers */}
            {[1, 2, 3, 4].map((q) => {
              const quarterStart = data.find((d) => d.quarter === q);
              if (!quarterStart) return null;
              return (
                <ReferenceLine
                  key={q}
                  x={quarterStart.play}
                  stroke="rgba(255,255,255,0.1)"
                  label={{
                    value: `Q${q}`,
                    fill: 'rgba(255,255,255,0.3)',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
              );
            })}

            {/* Confidence band */}
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="homeWinProbHigh"
                stroke="none"
                fill="url(#confidenceGradient)"
                animationDuration={animated ? 1500 : 0}
              />
            )}

            {/* Home win probability area */}
            <Area
              type="monotone"
              dataKey="homeWinProb"
              stroke={homeColor}
              strokeWidth={2}
              fill="url(#homeGradient)"
              animationDuration={animated ? 2000 : 0}
              animationEasing="ease-out"
            />

            <Tooltip 
              content={
                <CustomTooltip 
                  data={data} 
                  homeTeam={homeTeam} 
                  awayTeam={awayTeam} 
                />
              }
              cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '5 5' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Key plays legend */}
      {keyPlays.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {keyPlays.slice(0, 4).map((play, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[hsl(45_100%_60%)]" />
              <span className="text-white/60">Q{play.quarter} {play.time}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateMockWinProbData(
  homeTeamFavorite: boolean = true,
  volatility: number = 0.15
): WinProbDataPoint[] {
  const data: WinProbDataPoint[] = [];
  let homeProb = homeTeamFavorite ? 58 : 42;
  
  const quarterTimes = ['15:00', '12:00', '9:00', '6:00', '3:00', '0:00'];
  
  for (let quarter = 1; quarter <= 4; quarter++) {
    const playsPerQuarter = 15;
    
    for (let p = 0; p < playsPerQuarter; p++) {
      // Random walk with mean reversion
      const change = (Math.random() - 0.5) * 20 * volatility;
      const meanReversion = (50 - homeProb) * 0.02;
      homeProb = Math.max(1, Math.min(99, homeProb + change + meanReversion));
      
      const play = (quarter - 1) * playsPerQuarter + p + 1;
      const timeIndex = Math.floor((p / playsPerQuarter) * 6);
      
      const isKeyPlay = Math.random() < 0.1;
      
      data.push({
        play,
        quarter,
        time: quarterTimes[Math.min(timeIndex, 5)],
        homeWinProb: Math.round(homeProb * 10) / 10,
        awayWinProb: Math.round((100 - homeProb) * 10) / 10,
        homeWinProbLow: Math.max(1, homeProb - 8),
        homeWinProbHigh: Math.min(99, homeProb + 8),
        isKeyPlay,
        description: isKeyPlay ? getRandomPlayDescription() : undefined,
      });
    }
  }
  
  return data;
}

function getRandomPlayDescription(): string {
  const descriptions = [
    'Touchdown pass, 32 yards',
    'Interception returned for TD',
    'Field goal, 48 yards',
    'Fumble recovered by defense',
    'Fourth down conversion',
    'Safety scored',
    'Blocked punt touchdown',
    '75-yard rushing touchdown',
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}
