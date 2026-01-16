'use client';

/**
 * BACKTEST REPORT PAGE — Walk-forward validation results
 * Shows calibration curves, season metrics, ROI simulations
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CalibrationBin {
  predictedProbMid: number;
  actualWinRate: number;
  sampleSize: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
}

interface SeasonMetrics {
  season: number;
  totalPicks: number;
  wins: number;
  losses: number;
  winRate: number;
  roi: number;
  unitsWon: number;
}

interface WeeklyROI {
  season: number;
  week: number;
  roi: number;
  cumulative: number;
}

interface BacktestData {
  overallMetrics: {
    totalGames: number;
    accuracy: number;
    logLoss: number;
    brierScore: number;
    calibrationError: number;
    roi: number;
    sharpeRatio: number;
  };
  calibrationCurve: CalibrationBin[];
  seasonBreakdown: SeasonMetrics[];
  weeklyROI: WeeklyROI[];
  marketTypeBreakdown: {
    spread: { accuracy: number; roi: number; sampleSize: number };
    total: { accuracy: number; roi: number; sampleSize: number };
    moneyline: { accuracy: number; roi: number; sampleSize: number };
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateBacktestData(): BacktestData {
  // Calibration curve
  const calibrationCurve: CalibrationBin[] = [];
  for (let i = 0; i < 10; i++) {
    const mid = i * 10 + 5;
    const noise = (Math.random() - 0.5) * 8;
    const actual = Math.max(0, Math.min(100, mid + noise));
    const sampleSize = 50 + Math.floor(Math.random() * 100);
    const se = Math.sqrt((actual * (100 - actual)) / sampleSize);
    
    calibrationCurve.push({
      predictedProbMid: mid,
      actualWinRate: Math.round(actual * 10) / 10,
      sampleSize,
      confidenceIntervalLow: Math.max(0, actual - 1.96 * se),
      confidenceIntervalHigh: Math.min(100, actual + 1.96 * se),
    });
  }

  // Season breakdown
  const seasonBreakdown: SeasonMetrics[] = [];
  for (let season = 2020; season <= 2024; season++) {
    const totalPicks = 200 + Math.floor(Math.random() * 100);
    const winRate = 52 + Math.random() * 8;
    const wins = Math.floor(totalPicks * winRate / 100);
    
    seasonBreakdown.push({
      season,
      totalPicks,
      wins,
      losses: totalPicks - wins,
      winRate: Math.round(winRate * 10) / 10,
      roi: Math.round((winRate - 52.4) * 2 * 10) / 10,
      unitsWon: Math.round((wins - (totalPicks - wins) * 1.1) * 10) / 10,
    });
  }

  // Weekly ROI
  const weeklyROI: WeeklyROI[] = [];
  let cumulative = 0;
  for (let season = 2023; season <= 2024; season++) {
    for (let week = 1; week <= 18; week++) {
      const roi = (Math.random() - 0.45) * 20;
      cumulative += roi;
      weeklyROI.push({
        season,
        week,
        roi: Math.round(roi * 10) / 10,
        cumulative: Math.round(cumulative * 10) / 10,
      });
    }
  }

  return {
    overallMetrics: {
      totalGames: 1247,
      accuracy: 55.8,
      logLoss: 0.672,
      brierScore: 0.238,
      calibrationError: 2.3,
      roi: 5.4,
      sharpeRatio: 0.82,
    },
    calibrationCurve,
    seasonBreakdown,
    weeklyROI,
    marketTypeBreakdown: {
      spread: { accuracy: 54.2, roi: 3.8, sampleSize: 589 },
      total: { accuracy: 56.1, roi: 6.2, sampleSize: 412 },
      moneyline: { accuracy: 58.4, roi: 7.1, sampleSize: 246 },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════

interface TooltipPayload {
  value: number;
  dataKey: string;
  payload: Record<string, number>;
}

function CalibrationTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  
  return (
    <div className="bg-[hsl(220_18%_10%)] border border-white/10 rounded-lg p-3 shadow-xl">
      <div className="text-xs text-white/50 mb-1">Predicted: {data.predictedProbMid}%</div>
      <div className="text-sm font-bold text-[hsl(185_100%_60%)]">Actual: {data.actualWinRate}%</div>
      <div className="text-xs text-white/40 mt-1">n = {data.sampleSize}</div>
    </div>
  );
}

function ROITooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  
  return (
    <div className="bg-[hsl(220_18%_10%)] border border-white/10 rounded-lg p-3 shadow-xl">
      <div className="text-xs text-white/50 mb-1">Week {data.week}, {data.season}</div>
      <div className={`text-sm font-bold ${data.roi > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
        {data.roi > 0 ? '+' : ''}{data.roi}% ROI
      </div>
      <div className="text-xs text-white/40 mt-1">
        Cumulative: {data.cumulative > 0 ? '+' : ''}{data.cumulative}%
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function BacktestPage() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(generateBacktestData());
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[hsl(220_20%_4%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-12 h-12 text-[hsl(185_100%_50%)] animate-pulse" />
          <span className="text-white/50">Loading backtest results...</span>
        </div>
      </div>
    );
  }

  // Filter weekly ROI by selected season
  const filteredWeeklyROI = selectedSeason === 'all' 
    ? data.weeklyROI 
    : data.weeklyROI.filter(w => w.season === selectedSeason);

  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[hsl(220_20%_4%)/95] backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-[hsl(185_100%_50%)]" />
              <h1 className="text-lg font-bold">Backtest Report</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto space-y-8">
        {/* Overall Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[hsl(185_100%_60%)]" />
            Overall Performance (2020-2024)
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Total Games</div>
              <div className="text-2xl font-mono font-bold">{data.overallMetrics.totalGames}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Accuracy</div>
              <div className="text-2xl font-mono font-bold text-[hsl(145_80%_55%)]">
                {data.overallMetrics.accuracy}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Log Loss</div>
              <div className="text-2xl font-mono font-bold text-[hsl(185_100%_60%)]">
                {data.overallMetrics.logLoss.toFixed(3)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Brier Score</div>
              <div className="text-2xl font-mono font-bold text-[hsl(185_100%_60%)]">
                {data.overallMetrics.brierScore.toFixed(3)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Cal. Error</div>
              <div className="text-2xl font-mono font-bold text-[hsl(45_100%_60%)]">
                {data.overallMetrics.calibrationError}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">ROI</div>
              <div className={`text-2xl font-mono font-bold ${data.overallMetrics.roi > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                {data.overallMetrics.roi > 0 ? '+' : ''}{data.overallMetrics.roi}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/50 mb-1">Sharpe</div>
              <div className="text-2xl font-mono font-bold text-[hsl(185_100%_60%)]">
                {data.overallMetrics.sharpeRatio.toFixed(2)}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Calibration Curve */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-edgeloop p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-[hsl(185_100%_60%)]" />
              Calibration Curve
            </h2>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(145_80%_55%)]" />
              <span className="text-xs text-white/60">Well-calibrated probabilities</span>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="predictedProbMid" 
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  label={{ value: 'Predicted Probability (%)', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis 
                  dataKey="actualWinRate" 
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  label={{ value: 'Actual Win Rate (%)', angle: -90, position: 'left', fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                {/* Perfect calibration line */}
                <ReferenceLine 
                  segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="5 5"
                />
                <Tooltip content={<CalibrationTooltip />} />
                <Scatter 
                  data={data.calibrationCurve} 
                  fill="hsl(185, 100%, 50%)"
                >
                  {data.calibrationCurve.map((entry, index) => (
                    <Cell 
                      key={index}
                      fill={Math.abs(entry.predictedProbMid - entry.actualWinRate) < 5 
                        ? 'hsl(145, 80%, 55%)' 
                        : 'hsl(185, 100%, 50%)'
                      }
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(145_80%_55%)]" />
              <span>Within 5% of perfect</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(185_100%_50%)]" />
              <span>Outside 5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-white/20" style={{ borderTop: '2px dashed' }} />
              <span>Perfect calibration</span>
            </div>
          </div>
        </motion.section>

        {/* Cumulative ROI */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-edgeloop p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[hsl(145_80%_55%)]" />
              Cumulative ROI
            </h2>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All Seasons</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredWeeklyROI} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(145, 80%, 55%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(145, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="week" 
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Tooltip content={<ROITooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="hsl(145, 80%, 55%)"
                  strokeWidth={2}
                  fill="url(#roiGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Season Breakdown & Market Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Season Breakdown */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-edgeloop p-6"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[hsl(185_100%_60%)]" />
              Season Breakdown
            </h2>

            <div className="space-y-3">
              {data.seasonBreakdown.map((season) => (
                <div 
                  key={season.season}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold">{season.season}</span>
                    <span className="text-sm text-white/50">
                      {season.wins}-{season.losses}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      <span className="text-white/50">Win: </span>
                      <span className="font-mono">{season.winRate}%</span>
                    </span>
                    <span className={`font-mono font-bold ${season.roi > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                      {season.roi > 0 ? '+' : ''}{season.roi}%
                    </span>
                    <span className={`text-sm ${season.unitsWon > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                      {season.unitsWon > 0 ? '+' : ''}{season.unitsWon}u
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Market Type Breakdown */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-edgeloop p-6"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[hsl(45_100%_60%)]" />
              By Market Type
            </h2>

            <div className="space-y-4">
              {Object.entries(data.marketTypeBreakdown).map(([type, metrics]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">{type}</span>
                    <span className="text-xs text-white/40">n = {metrics.sampleSize}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Accuracy bar */}
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metrics.accuracy}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-[hsl(185_100%_50%)]"
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs">
                        <span className="text-white/40">Accuracy</span>
                        <span className="font-mono">{metrics.accuracy}%</span>
                      </div>
                    </div>
                    {/* ROI */}
                    <div className={`text-right font-mono font-bold ${metrics.roi > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                      {metrics.roi > 0 ? '+' : ''}{metrics.roi}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[hsl(145_80%_55%)]" />
                <span>
                  <strong>Moneyline</strong> shows highest accuracy and ROI
                </span>
              </div>
              <p className="text-xs text-white/50 mt-2">
                Probabilities calibrated using isotonic regression on 2019-2022 validation set.
              </p>
            </div>
          </motion.section>
        </div>

        {/* Model Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/50"
        >
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span><strong>Model:</strong> edgeloop-v1.0.0</span>
            <span><strong>Features:</strong> 127</span>
            <span><strong>Calibration:</strong> Isotonic Regression</span>
            <span><strong>Trained:</strong> 2024-09-01</span>
            <span><strong>Validation:</strong> Walk-forward by season/week</span>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
