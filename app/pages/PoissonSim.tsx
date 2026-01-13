'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { teams } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/_components/ui/card';
import { Badge } from '@/_components/ui/badge';
import { Button } from '@/_components/ui/button';
import { Label } from '@/_components/ui/label';
import { Slider } from '@/_components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/_components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/_components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Calculator,
  TrendingUp,
  Target,
  BarChart3,
  Percent,
  Activity,
  Grid3X3,
  Zap,
  Play,
  Clock,
  ChevronRight,
  Info,
  CheckCircle2,
  Loader2,
  History,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function poissonProbability(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

const mockBacktestData = {
  spreads: { winRate: 54.2, roi: 3.8, sampleSize: 1284 },
  totals: { winRate: 52.8, roi: 1.9, sampleSize: 1156 },
  moneylines: { winRate: 58.1, roi: 6.2, sampleSize: 892 },
};

const mockWinRateOverTime = [
  { week: 'W1', winRate: 48, cumulative: 48 },
  { week: 'W2', winRate: 55, cumulative: 51.5 },
  { week: 'W3', winRate: 52, cumulative: 51.7 },
  { week: 'W4', winRate: 58, cumulative: 53.3 },
  { week: 'W5', winRate: 54, cumulative: 53.4 },
  { week: 'W6', winRate: 56, cumulative: 53.8 },
  { week: 'W7', winRate: 52, cumulative: 53.6 },
  { week: 'W8', winRate: 59, cumulative: 54.3 },
  { week: 'W9', winRate: 55, cumulative: 54.3 },
  { week: 'W10', winRate: 57, cumulative: 54.6 },
  { week: 'W11', winRate: 53, cumulative: 54.5 },
  { week: 'W12', winRate: 56, cumulative: 54.6 },
  { week: 'W13', winRate: 54, cumulative: 54.5 },
  { week: 'W14', winRate: 58, cumulative: 54.8 },
  { week: 'W15', winRate: 55, cumulative: 54.8 },
  { week: 'W16', winRate: 57, cumulative: 54.9 },
  { week: 'W17', winRate: 54, cumulative: 54.9 },
  { week: 'W18', winRate: 56, cumulative: 55.0 },
];

const teamExpectedPoints: Record<string, number> = {
  kc: 27.5,
  sf: 26.2,
  phi: 25.8,
  buf: 28.1,
  det: 26.8,
  dal: 24.5,
  mia: 25.2,
  bal: 27.8,
};

const matchupPresets = [
  { name: 'High Scoring', homeExp: 28, awayExp: 26, icon: '🔥' },
  { name: 'Defensive', homeExp: 17, awayExp: 14, icon: '🛡️' },
  { name: 'Even Match', homeExp: 24, awayExp: 23, icon: '⚖️' },
  { name: 'Blowout', homeExp: 31, awayExp: 14, icon: '💥' },
  { name: 'Close Game', homeExp: 21, awayExp: 20, icon: '🎯' },
];

interface SimulationHistory {
  id: string;
  timestamp: Date;
  homeExp: number;
  awayExp: number;
  winProb: number;
  mostLikelyScore: { teamA: number; teamB: number };
}

interface CellDetail {
  homeScore: number;
  awayScore: number;
  probability: number;
  total: number;
  margin: number;
}

type SimulatorStatus = 'READY' | 'CALCULATING' | 'COMPLETE';

export default function PoissonSim() {
  const { reduceMotion } = useSettings();
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [lambda1, setLambda1] = useState(24.5);
  const [lambda2, setLambda2] = useState(21.5);
  const [totalLine, setTotalLine] = useState(46);
  const [spreadLine, setSpreadLine] = useState(-3);
  const [status, setStatus] = useState<SimulatorStatus>('READY');
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistory[]>([]);
  const [monteCarloResult, setMonteCarloResult] = useState<{
    homeWins: number;
    awayWins: number;
    draws: number;
    avgHomeScore: number;
    avgAwayScore: number;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleTeamAChange = (teamId: string) => {
    setTeamA(teamId);
    if (teamExpectedPoints[teamId]) {
      setLambda1(teamExpectedPoints[teamId]);
    }
    setStatus('CALCULATING');
    setTimeout(() => setStatus('COMPLETE'), 300);
  };

  const handleTeamBChange = (teamId: string) => {
    setTeamB(teamId);
    if (teamExpectedPoints[teamId]) {
      setLambda2(teamExpectedPoints[teamId]);
    }
    setStatus('CALCULATING');
    setTimeout(() => setStatus('COMPLETE'), 300);
  };

  const handleSliderChange = useCallback((setter: (val: number) => void) => {
    return (value: number[]) => {
      setter(value[0]);
      setStatus('CALCULATING');
      setTimeout(() => setStatus('COMPLETE'), 200);
    };
  }, []);

  const applyPreset = (preset: typeof matchupPresets[0]) => {
    setLambda1(preset.homeExp);
    setLambda2(preset.awayExp);
    setStatus('CALCULATING');
    setTimeout(() => setStatus('COMPLETE'), 300);
  };

  const probabilityMatrix = useMemo(() => {
    const matrix: number[][] = [];
    for (let i = 0; i <= 10; i++) {
      const row: number[] = [];
      for (let j = 0; j <= 10; j++) {
        const prob = poissonProbability(i, lambda1 / 7) * poissonProbability(j, lambda2 / 7);
        row.push(prob);
      }
      matrix.push(row);
    }
    return matrix;
  }, [lambda1, lambda2]);

  const { winProb, loseProb, pushProb, overProb, underProb, spreadCoverProb, mostLikelyScore, confidenceScore } = useMemo(() => {
    let win = 0;
    let lose = 0;
    let push = 0;
    let over = 0;
    let under = 0;
    let spreadCover = 0;
    let maxProb = 0;
    let likelyScore = { teamA: 0, teamB: 0 };

    for (let i = 0; i <= 50; i++) {
      for (let j = 0; j <= 50; j++) {
        const prob = poissonProbability(i, lambda1 / 7) * poissonProbability(j, lambda2 / 7);
        const totalScore = i + j;
        const margin = i - j;

        if (prob > maxProb) {
          maxProb = prob;
          likelyScore = { teamA: i, teamB: j };
        }

        if (i > j) win += prob;
        else if (i < j) lose += prob;
        else push += prob;

        if (totalScore > totalLine) over += prob;
        else if (totalScore < totalLine) under += prob;

        if (margin > Math.abs(spreadLine)) spreadCover += prob;
        else if (margin === Math.abs(spreadLine)) spreadCover += prob * 0.5;
      }
    }

    const confidence = Math.min(95, Math.max(60, win * 100 + (maxProb * 1000)));

    return {
      winProb: win * 100,
      loseProb: lose * 100,
      pushProb: push * 100,
      overProb: over * 100,
      underProb: under * 100,
      spreadCoverProb: spreadCover * 100,
      mostLikelyScore: likelyScore,
      confidenceScore: confidence,
    };
  }, [lambda1, lambda2, totalLine, spreadLine]);

  const getHeatmapColor = (prob: number, isHighlighted: boolean) => {
    const maxProb = Math.max(...probabilityMatrix.flat());
    const normalized = prob / maxProb;
    
    if (isHighlighted) {
      return 'bg-gradient-to-br from-godmode/90 to-godmode/70 shadow-[0_0_15px_rgba(34,197,94,0.5)]';
    }
    if (normalized > 0.8) return 'bg-gradient-to-br from-espn-red/90 to-espn-red/70 shadow-[0_0_12px_rgba(220,38,38,0.4)]';
    if (normalized > 0.6) return 'bg-gradient-to-br from-espn-red/70 to-espn-red/50';
    if (normalized > 0.4) return 'bg-gradient-to-br from-espn-red/50 to-espn-red/30';
    if (normalized > 0.2) return 'bg-gradient-to-br from-espn-red/30 to-espn-red/15';
    return 'bg-muted/30 hover:bg-muted/50';
  };

  const handleCellClick = (homeScore: number, awayScore: number, prob: number) => {
    setSelectedCell({
      homeScore,
      awayScore,
      probability: prob * 100,
      total: homeScore + awayScore,
      margin: homeScore - awayScore,
    });
  };

  const runMonteCarlo = async () => {
    setIsSimulating(true);
    setStatus('CALCULATING');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalHomeScore = 0;
    let totalAwayScore = 0;
    const simulations = 10000;

    for (let i = 0; i < simulations; i++) {
      let homeScore = 0;
      let awayScore = 0;
      
      for (let t = 0; t < 7; t++) {
        const homeTD = Math.random() < (lambda1 / 7) / 7 ? 7 : 0;
        const awayTD = Math.random() < (lambda2 / 7) / 7 ? 7 : 0;
        homeScore += homeTD + (Math.random() < 0.3 ? 3 : 0);
        awayScore += awayTD + (Math.random() < 0.3 ? 3 : 0);
      }
      
      homeScore = Math.round(homeScore * (lambda1 / 24));
      awayScore = Math.round(awayScore * (lambda2 / 24));
      
      totalHomeScore += homeScore;
      totalAwayScore += awayScore;
      
      if (homeScore > awayScore) homeWins++;
      else if (awayScore > homeScore) awayWins++;
      else draws++;
    }

    setMonteCarloResult({
      homeWins,
      awayWins,
      draws,
      avgHomeScore: totalHomeScore / simulations,
      avgAwayScore: totalAwayScore / simulations,
    });

    setSimulationHistory(prev => [{
      id: Date.now().toString(),
      timestamp: new Date(),
      homeExp: lambda1,
      awayExp: lambda2,
      winProb,
      mostLikelyScore,
    }, ...prev.slice(0, 9)]);

    setIsSimulating(false);
    setStatus('COMPLETE');
  };

  const getAnalysisSummary = () => {
    if (winProb > 65) return 'Strong home advantage detected';
    if (winProb < 35) return 'Away team favored to win';
    if (overProb > 60) return 'High-scoring game expected';
    if (underProb > 60) return 'Defensive battle likely';
    return 'Competitive matchup projected';
  };

  const StatusIndicator = () => {
    const statusConfig = {
      READY: { color: 'bg-blue-500', icon: <Target className="w-3 h-3" />, text: 'READY' },
      CALCULATING: { color: 'bg-yellow-500 animate-pulse', icon: <Loader2 className="w-3 h-3 animate-spin" />, text: 'CALCULATING' },
      COMPLETE: { color: 'bg-godmode', icon: <CheckCircle2 className="w-3 h-3" />, text: 'COMPLETE' },
    };
    const config = statusConfig[status];
    
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border/50">
        <div className={cn('w-2 h-2 rounded-full', config.color)} />
        <span className="text-xs font-mono tracking-wider">{config.text}</span>
        {config.icon}
      </div>
    );
  };

  const ProbabilityBar = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <motion.span 
          key={value}
          initial={reduceMotion ? {} : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-display font-bold"
        >
          {value.toFixed(1)}%
        </motion.span>
      </div>
      <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          initial={reduceMotion ? { width: `${value}%` } : { width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );

  const WinGauge = () => {
    const angle = (winProb / 100) * 180 - 90;
    
    return (
      <div className="relative w-40 h-20 mx-auto">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--espn-red))" />
              <stop offset="50%" stopColor="hsl(var(--espn-gold))" />
              <stop offset="100%" stopColor="hsl(var(--godmode))" />
            </linearGradient>
          </defs>
          <path
            d="M 10 45 A 35 35 0 0 1 90 45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 10 45 A 35 35 0 0 1 90 45"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(winProb / 100) * 110} 110`}
          />
          <motion.line
            x1="50"
            y1="45"
            x2="50"
            y2="15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduceMotion ? { rotate: angle } : { rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: '50px 45px' }}
          />
          <circle cx="50" cy="45" r="4" fill="white" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <motion.span 
            key={winProb}
            initial={reduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-display font-bold"
          >
            {winProb.toFixed(1)}%
          </motion.span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-espn-red/20 to-espn-red/5 border border-espn-red/30">
                  <Grid3X3 className="w-6 h-6 text-espn-red" />
                </div>
                <h1 className="font-display text-3xl tracking-wider text-glow-red" data-testid="page-title">
                  SINGULARITY SIMULATOR
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Advanced Poisson distribution modeling for precise score predictions
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <StatusIndicator />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-godmode/10 border border-godmode/30">
                <Zap className="w-3 h-3 text-godmode" />
                <span className="text-xs font-mono">
                  CONFIDENCE: <span className="text-godmode font-bold">{confidenceScore.toFixed(0)}%</span>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="gap-2"
                data-testid="button-history"
              >
                <History className="w-4 h-4" />
                History
              </Button>
            </div>
          </div>

          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-3 rounded-lg bg-gradient-to-r from-espn-red/10 via-transparent to-transparent border-l-2 border-espn-red"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-espn-red" />
              <span className="text-sm font-medium">{getAnalysisSummary()}</span>
            </div>
          </motion.div>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-4">
          {matchupPresets.map((preset, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="gap-2 hover:border-espn-red/50 transition-colors"
              data-testid={`preset-${preset.name.toLowerCase().replace(' ', '-')}`}
            >
              <span>{preset.icon}</span>
              {preset.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass border-border/50 lg:col-span-2" data-testid="poisson-calculator">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5 text-espn-red" />
                Poisson Distribution Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Team A (Home)</Label>
                  <Select value={teamA} onValueChange={handleTeamAChange} data-testid="select-team-a">
                    <SelectTrigger data-testid="trigger-team-a">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.abbreviation} - {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Expected Points (λ1)</Label>
                      <Badge variant="outline" className="font-mono">{lambda1.toFixed(1)}</Badge>
                    </div>
                    <Slider
                      value={[lambda1]}
                      onValueChange={handleSliderChange(setLambda1)}
                      min={7}
                      max={42}
                      step={0.5}
                      className="py-2"
                      data-testid="slider-lambda1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Team B (Away)</Label>
                  <Select value={teamB} onValueChange={handleTeamBChange} data-testid="select-team-b">
                    <SelectTrigger data-testid="trigger-team-b">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.abbreviation} - {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Expected Points (λ2)</Label>
                      <Badge variant="outline" className="font-mono">{lambda2.toFixed(1)}</Badge>
                    </div>
                    <Slider
                      value={[lambda2]}
                      onValueChange={handleSliderChange(setLambda2)}
                      min={7}
                      max={42}
                      step={0.5}
                      className="py-2"
                      data-testid="slider-lambda2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Total Line (O/U)</Label>
                    <Badge variant="outline" className="font-mono">{totalLine}</Badge>
                  </div>
                  <Slider
                    value={[totalLine]}
                    onValueChange={handleSliderChange(setTotalLine)}
                    min={30}
                    max={60}
                    step={0.5}
                    data-testid="slider-total-line"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Spread Line</Label>
                    <Badge variant="outline" className="font-mono">{spreadLine > 0 ? '+' : ''}{spreadLine}</Badge>
                  </div>
                  <Slider
                    value={[spreadLine]}
                    onValueChange={handleSliderChange(setSpreadLine)}
                    min={-14}
                    max={14}
                    step={0.5}
                    data-testid="slider-spread-line"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-sm tracking-wide flex items-center gap-2">
                  <Target className="w-4 h-4 text-espn-red" />
                  Score Probability Matrix (TDs 0-10)
                  <span className="text-xs text-muted-foreground ml-2">Click cells for details</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border/50 p-2" data-testid="probability-matrix">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="p-1.5 text-muted-foreground font-mono">A\B</th>
                        {Array.from({ length: 11 }, (_, i) => (
                          <th key={i} className="p-1.5 text-muted-foreground font-mono">{i}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {probabilityMatrix.map((row, i) => (
                        <tr key={i}>
                          <td className="p-1.5 text-muted-foreground font-mono font-medium">{i}</td>
                          {row.map((prob, j) => {
                            const isHighlighted = i === mostLikelyScore.teamA && j === mostLikelyScore.teamB;
                            return (
                              <td
                                key={j}
                                onClick={() => handleCellClick(i, j, prob)}
                                className={cn(
                                  'p-1.5 text-center rounded cursor-pointer transition-all duration-200 hover:scale-105',
                                  getHeatmapColor(prob, isHighlighted)
                                )}
                                title={`A=${i} TDs, B=${j} TDs: ${(prob * 100).toFixed(2)}%`}
                                data-testid={`cell-${i}-${j}`}
                              >
                                <motion.span
                                  key={`${i}-${j}-${prob.toFixed(4)}`}
                                  initial={reduceMotion ? {} : { opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  {(prob * 100).toFixed(1)}
                                </motion.span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-godmode to-godmode/70 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-muted-foreground">Most Likely</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-espn-red/90 to-espn-red/70" />
                    <span className="text-muted-foreground">High Probability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted/30" />
                    <span className="text-muted-foreground">Low Probability</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="font-display text-sm tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-espn-red" />
                  Win Probability Distribution
                </h3>
                <ProbabilityBar
                  label="Team A Win"
                  value={winProb}
                  color="bg-gradient-to-r from-godmode to-godmode/70"
                  icon={<ChevronRight className="w-4 h-4 text-godmode" />}
                />
                <ProbabilityBar
                  label="Draw"
                  value={pushProb}
                  color="bg-gradient-to-r from-muted-foreground to-muted-foreground/70"
                  icon={<Activity className="w-4 h-4 text-muted-foreground" />}
                />
                <ProbabilityBar
                  label="Team B Win"
                  value={loseProb}
                  color="bg-gradient-to-r from-espn-red to-espn-red/70"
                  icon={<ChevronRight className="w-4 h-4 text-espn-red rotate-180" />}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass border-border/50 box-glow-red">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-espn-red" />
                  Projected Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-espn-red/20 to-espn-red/5 rounded-lg p-4 text-center border border-espn-red/30">
                  <div className="text-xs text-muted-foreground mb-1">Most Likely Score</div>
                  <motion.div 
                    key={`${mostLikelyScore.teamA}-${mostLikelyScore.teamB}`}
                    initial={reduceMotion ? {} : { scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-display font-bold"
                  >
                    {mostLikelyScore.teamA} - {mostLikelyScore.teamB}
                  </motion.div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Team A vs Team B
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground text-center">Win Probability Gauge</div>
                  <WinGauge />
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">Over/Under {totalLine}</div>
                  <div className="relative h-8 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={reduceMotion ? { width: `${overProb}%` } : { width: 0 }}
                      animate={{ width: `${overProb}%` }}
                      transition={{ duration: 0.5 }}
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-godmode to-godmode/70 rounded-l-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                      <span>O {overProb.toFixed(0)}%</span>
                      <div className="w-0.5 h-full bg-white/50" />
                      <span>U {underProb.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 text-center border border-border/50">
                  <div className="text-lg font-display">{spreadCoverProb.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">
                    Team A Covers {spreadLine > 0 ? '+' : ''}{spreadLine}
                  </div>
                  <div className="mt-2 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={reduceMotion ? { width: `${spreadCoverProb}%` } : { width: 0 }}
                      animate={{ width: `${spreadCoverProb}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        'h-full rounded-full',
                        spreadCoverProb > 55 ? 'bg-godmode' : spreadCoverProb > 45 ? 'bg-espn-gold' : 'bg-espn-red'
                      )}
                    />
                  </div>
                </div>

                <Button
                  onClick={runMonteCarlo}
                  disabled={isSimulating}
                  className="w-full gap-2 bg-gradient-to-r from-espn-red to-espn-red/80 hover:from-espn-red/90 hover:to-espn-red/70"
                  data-testid="button-monte-carlo"
                >
                  {isSimulating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run 10,000 Simulations
                </Button>

                <AnimatePresence>
                  {monteCarloResult && (
                    <motion.div
                      initial={reduceMotion ? {} : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reduceMotion ? {} : { opacity: 0, height: 0 }}
                      className="p-3 rounded-lg bg-gradient-to-br from-godmode/20 to-godmode/5 border border-godmode/30 space-y-2"
                    >
                      <div className="text-xs font-medium text-godmode flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        Monte Carlo Results
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="font-bold text-godmode">{((monteCarloResult.homeWins / 10000) * 100).toFixed(1)}%</div>
                          <div className="text-muted-foreground">Home Wins</div>
                        </div>
                        <div>
                          <div className="font-bold">{((monteCarloResult.draws / 10000) * 100).toFixed(1)}%</div>
                          <div className="text-muted-foreground">Draws</div>
                        </div>
                        <div>
                          <div className="font-bold text-espn-red">{((monteCarloResult.awayWins / 10000) * 100).toFixed(1)}%</div>
                          <div className="text-muted-foreground">Away Wins</div>
                        </div>
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        Avg Score: {monteCarloResult.avgHomeScore.toFixed(1)} - {monteCarloResult.avgAwayScore.toFixed(1)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="glass border-border/50" data-testid="backtest-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-espn-red" />
              Backtest Results
              <Badge variant="outline" className="ml-2">Historical Data</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-display text-sm tracking-wide flex items-center gap-2">
                  <Percent className="w-4 h-4 text-espn-red" />
                  ROI by Bet Type
                </h3>
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Spreads</span>
                      <Badge className="bg-godmode text-black">{mockBacktestData.spreads.winRate}% Win</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ROI: +{mockBacktestData.spreads.roi}%</span>
                      <span className="text-muted-foreground">n={mockBacktestData.spreads.sampleSize}</span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Totals (O/U)</span>
                      <Badge variant="secondary">{mockBacktestData.totals.winRate}% Win</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ROI: +{mockBacktestData.totals.roi}%</span>
                      <span className="text-muted-foreground">n={mockBacktestData.totals.sampleSize}</span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Moneylines</span>
                      <Badge className="bg-espn-red">{mockBacktestData.moneylines.winRate}% Win</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ROI: +{mockBacktestData.moneylines.roi}%</span>
                      <span className="text-muted-foreground">n={mockBacktestData.moneylines.sampleSize}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-espn-red/10 to-transparent rounded-lg p-4 border-l-2 border-espn-red">
                  <div className="text-sm font-medium mb-1">Total Sample Size</div>
                  <div className="text-2xl font-display">
                    {(mockBacktestData.spreads.sampleSize + mockBacktestData.totals.sampleSize + mockBacktestData.moneylines.sampleSize).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Historical bets analyzed</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-display text-sm tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-espn-red" />
                  Win Rate Over Time
                </h3>
                <div className="h-64" data-testid="win-rate-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockWinRateOverTime}>
                      <defs>
                        <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(348, 83%, 47%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(348, 83%, 47%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                      <XAxis
                        dataKey="week"
                        stroke="hsl(0, 0%, 50%)"
                        tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 10 }}
                      />
                      <YAxis
                        domain={[40, 70]}
                        stroke="hsl(0, 0%, 50%)"
                        tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 10%)',
                          border: '1px solid hsl(0, 0%, 20%)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(0, 0%, 70%)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="winRate"
                        stroke="hsl(348, 83%, 47%)"
                        fillOpacity={1}
                        fill="url(#colorWinRate)"
                        name="Weekly Win %"
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="hsl(142, 76%, 36%)"
                        fillOpacity={1}
                        fill="url(#colorCumulative)"
                        name="Cumulative %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-espn-red" />
                    <span className="text-muted-foreground">Weekly Win %</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-godmode" />
                    <span className="text-muted-foreground">Cumulative %</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-espn-red" />
              Score Probability Details
            </DialogTitle>
            <DialogDescription>Probability analysis for the selected score outcome</DialogDescription>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-espn-red/20 to-espn-red/5 border border-espn-red/30">
                <div className="text-4xl font-display font-bold">
                  {selectedCell.homeScore} - {selectedCell.awayScore}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Team A vs Team B</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <div className="text-2xl font-display text-godmode">{selectedCell.probability.toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">Exact Score Probability</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <div className="text-2xl font-display">{selectedCell.total}</div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Margin of Victory</span>
                  <span className={cn(
                    'font-display font-bold',
                    selectedCell.margin > 0 ? 'text-godmode' : selectedCell.margin < 0 ? 'text-espn-red' : ''
                  )}>
                    {selectedCell.margin > 0 ? '+' : ''}{selectedCell.margin}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {selectedCell.total > totalLine ? (
                  <span className="text-godmode">This score goes OVER {totalLine}</span>
                ) : selectedCell.total < totalLine ? (
                  <span className="text-espn-red">This score goes UNDER {totalLine}</span>
                ) : (
                  <span>This score pushes on {totalLine}</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-espn-red" />
              Simulation History
            </DialogTitle>
            <DialogDescription>Review your past simulation results and parameters</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {simulationHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No simulations yet</p>
                <p className="text-xs">Run a simulation to see history</p>
              </div>
            ) : (
              simulationHistory.map((sim) => (
                <div
                  key={sim.id}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      λ1: {sim.homeExp.toFixed(1)} vs λ2: {sim.awayExp.toFixed(1)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {sim.timestamp.toLocaleTimeString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Score: {sim.mostLikelyScore.teamA} - {sim.mostLikelyScore.teamB}
                    </span>
                    <span className="text-godmode font-medium">
                      {sim.winProb.toFixed(1)}% Win
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
