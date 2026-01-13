'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/_components/ui/card';
import { Badge } from '@/_components/ui/badge';
import { Input } from '@/_components/ui/input';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/_components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  americanToDecimal, 
  formatDecimalOdds, 
  formatCurrency, 
  formatPercentage, 
  BETTING_GLOSSARY 
} from '@/lib/oddsUtils';
import {
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Target,
  Activity,
  Percent,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Gauge,
  Shield,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

const MOCK_GAMES = [
  { id: 1, home: 'Chiefs', away: 'Ravens', openLine: -3, currentLine: -4.5, total: 47.5, openTotal: 46, type: 'spread', fastMove: true, modelLine: -3.5, confidence: 78 },
  { id: 2, home: 'Eagles', away: 'Cowboys', openLine: -7, currentLine: -7, total: 44.5, openTotal: 45.5, type: 'spread', fastMove: false, modelLine: -6.5, confidence: 82 },
  { id: 3, home: '49ers', away: 'Packers', openLine: -6.5, currentLine: -5, total: 49, openTotal: 48, type: 'spread', fastMove: false, modelLine: -5.5, confidence: 71 },
  { id: 4, home: 'Bills', away: 'Dolphins', openLine: -3, currentLine: -3, total: 52.5, openTotal: 50, type: 'spread', fastMove: true, modelLine: -4, confidence: 85 },
  { id: 5, home: 'Lions', away: 'Bears', openLine: -10, currentLine: -9.5, total: 48, openTotal: 47.5, type: 'spread', fastMove: false, modelLine: -10.5, confidence: 76 },
  { id: 6, home: 'Bengals', away: 'Browns', openLine: -5.5, currentLine: -7, total: 43, openTotal: 44, type: 'spread', fastMove: true, modelLine: -5, confidence: 88 },
  { id: 7, home: 'Chargers', away: 'Raiders', openLine: -4, currentLine: -3.5, total: 45, openTotal: 43.5, type: 'spread', fastMove: false, modelLine: -4.5, confidence: 73 },
  { id: 8, home: 'Jets', away: 'Patriots', openLine: -2.5, currentLine: -3, total: 38, openTotal: 39.5, type: 'spread', fastMove: false, modelLine: -2, confidence: 69 },
];

const QUICK_PICKS = [
  { id: 1, game: 'Bengals +7 vs Browns', ev: '+8.2%', edge: 3.5, confidence: 88, reasoning: 'Model shows 2pt value on dog, sharp reverse movement' },
  { id: 2, game: 'Bills -3 vs Dolphins', ev: '+5.7%', edge: 2.1, confidence: 85, reasoning: 'Key number value, steam move aligned with model' },
  { id: 3, game: 'Eagles -7 vs Cowboys', ev: '+4.3%', edge: 1.8, confidence: 82, reasoning: 'Home field undervalued, divisional dynamics favor PHI' },
];

function americanToImpliedProb(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function calculateEV(odds: number, trueProbability: number, stake: number): number {
  const payout = odds > 0 ? stake * (odds / 100) : stake * (100 / Math.abs(odds));
  const ev = (trueProbability * payout) - ((1 - trueProbability) * stake);
  return ev;
}

function isKeyNumber(line: number): boolean {
  const absLine = Math.abs(line);
  return absLine === 3 || absLine === 7 || absLine === 3.5 || absLine === 7.5;
}

function hasSharpValue(openLine: number, currentLine: number): boolean {
  return Math.abs(currentLine - openLine) >= 1.5;
}

function AnimatedNumber({ value, decimals = 2, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const duration = 300;
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + diff * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span>{prefix}{displayValue.toFixed(decimals)}{suffix}</span>;
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help inline-block ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-card border border-border/50 text-foreground">
        <p className="text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function LineValueGauge({ deviation, maxDeviation = 5 }: { deviation: number; maxDeviation?: number }) {
  const percentage = Math.min(Math.abs(deviation) / maxDeviation * 100, 100);
  const isPositive = deviation > 0;
  
  return (
    <div className="relative h-8 w-full bg-muted/30 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-border/50" />
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage / 2}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "absolute top-0 h-full",
          isPositive ? "right-1/2 bg-gradient-to-l from-godmode/60 to-godmode/20" : "left-1/2 bg-gradient-to-r from-destructive/60 to-destructive/20"
        )}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "text-sm font-mono font-bold",
          isPositive ? "text-godmode" : deviation < 0 ? "text-destructive" : "text-muted-foreground"
        )}>
          {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export default function BettingPortal() {
  const { reduceMotion } = useSettings();
  const [gameType, setGameType] = useState<string>('all');
  const [expandedPick, setExpandedPick] = useState<number | null>(null);
  
  const [odds, setOdds] = useState<string>('-110');
  const [trueProbability, setTrueProbability] = useState<number>(55);
  const [stake, setStake] = useState<string>('100');
  
  const [edgePercent, setEdgePercent] = useState<number>(5);
  const [bankroll, setBankroll] = useState<string>('10000');
  const [riskTolerance, setRiskTolerance] = useState<number>(50);

  const [expectedLine, setExpectedLine] = useState<string>('-3');
  const [currentLine, setCurrentLine] = useState<string>('-4.5');

  const evCalculation = useMemo(() => {
    const oddsNum = parseFloat(odds) || 0;
    const probNum = trueProbability / 100;
    const stakeNum = parseFloat(stake) || 0;

    if (oddsNum === 0 || probNum === 0 || stakeNum === 0) {
      return { impliedProb: 0, edge: 0, ev: 0, isPositive: false, recommendedKelly: 0 };
    }

    const impliedProb = americanToImpliedProb(oddsNum) * 100;
    const edge = (probNum * 100) - impliedProb;
    const ev = calculateEV(oddsNum, probNum, stakeNum);
    
    const decimalOdds = oddsNum > 0 ? (oddsNum / 100) + 1 : (100 / Math.abs(oddsNum)) + 1;
    const kellyFraction = edge > 0 ? (edge / 100) / (decimalOdds - 1) : 0;
    const recommendedKelly = Math.max(0, parseFloat(bankroll) * kellyFraction * 0.5);

    return {
      impliedProb,
      edge,
      ev,
      isPositive: ev > 0,
      recommendedKelly,
    };
  }, [odds, trueProbability, stake, bankroll]);

  const kellyCalculation = useMemo(() => {
    const edgeNum = edgePercent / 100;
    const bankrollNum = parseFloat(bankroll) || 0;
    const oddsNum = parseFloat(odds) || -110;

    if (edgeNum <= 0 || bankrollNum === 0) {
      return { fullKelly: 0, halfKelly: 0, quarterKelly: 0, riskAdjusted: 0, bankrollImpact: { win: 0, loss: 0 } };
    }

    const decimalOdds = oddsNum > 0 ? (oddsNum / 100) + 1 : (100 / Math.abs(oddsNum)) + 1;
    const kellyFraction = edgeNum / (decimalOdds - 1);
    const fullKelly = bankrollNum * kellyFraction;
    const riskMultiplier = riskTolerance / 100;
    const riskAdjusted = fullKelly * riskMultiplier;

    return {
      fullKelly: Math.max(0, fullKelly),
      halfKelly: Math.max(0, fullKelly / 2),
      quarterKelly: Math.max(0, fullKelly / 4),
      riskAdjusted: Math.max(0, riskAdjusted),
      bankrollImpact: {
        win: riskAdjusted * (decimalOdds - 1),
        loss: -riskAdjusted,
      },
    };
  }, [edgePercent, bankroll, odds, riskTolerance]);

  const lineAnalysis = useMemo(() => {
    const expected = parseFloat(expectedLine) || 0;
    const current = parseFloat(currentLine) || 0;
    const deviation = current - expected;
    const isTrap = deviation > 2;
    const isSteam = Math.abs(deviation) > 1.5 && deviation < 0;
    const hasValue = Math.abs(deviation) >= 0.5;
    
    return { deviation, isTrap, isSteam, hasValue, expected, current };
  }, [expectedLine, currentLine]);

  const filteredGames = useMemo(() => {
    if (gameType === 'all') return MOCK_GAMES;
    return MOCK_GAMES;
  }, [gameType]);

  return (
    <TooltipProvider>
      <div className="min-h-screen p-4 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-espn-red to-espn-red/50 flex items-center justify-center box-glow-red">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="font-display text-3xl tracking-wider text-glow-red" data-testid="page-title">
                    SINGULARITY BETTING PORTAL
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">
                  Omni-powered EV analysis and edge detection for optimal betting decisions
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-godmode/50 text-godmode animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  LIVE ANALYSIS
                </Badge>
                <Select value={gameType} onValueChange={setGameType} data-testid="select-game-type">
                  <SelectTrigger className="w-36 bg-muted/30" data-testid="trigger-game-type">
                    <SelectValue placeholder="Game Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="option-all">All Types</SelectItem>
                    <SelectItem value="spread" data-testid="option-spread">Spread</SelectItem>
                    <SelectItem value="totals" data-testid="option-totals">Totals</SelectItem>
                    <SelectItem value="moneyline" data-testid="option-moneyline">Moneyline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="gradient-border-godmode box-glow-godmode" data-testid="quick-picks">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl font-display">
                  <Zap className="w-5 h-5 text-godmode" />
                  QUICK PICKS — TOP +EV OPPORTUNITIES
                  <Badge className="bg-godmode/20 text-godmode border border-godmode/30 ml-2">
                    OMNI SELECTED
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {QUICK_PICKS.map((pick, index) => (
                    <motion.div
                      key={pick.id}
                      initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "relative bg-gradient-to-br from-godmode/10 to-transparent rounded-xl p-4 border border-godmode/30 cursor-pointer transition-all hover:border-godmode/60",
                        expandedPick === pick.id && "border-godmode ring-1 ring-godmode/50"
                      )}
                      onClick={() => setExpandedPick(expandedPick === pick.id ? null : pick.id)}
                      data-testid={`quick-pick-${pick.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-display text-sm text-godmode">{pick.game}</p>
                          <p className="text-2xl font-bold text-godmode text-glow-godmode">{pick.ev}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Target className="w-3 h-3" />
                            Confidence
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted/30 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pick.confidence}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-godmode to-godmode/60 rounded-full"
                              />
                            </div>
                            <span className="text-sm font-mono text-godmode">{pick.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-godmode/30 text-godmode/80 text-xs">
                          Edge: +{pick.edge}pts
                        </Badge>
                        {expandedPick === pick.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {expandedPick === pick.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 mt-3 border-t border-godmode/20">
                              <p className="text-xs text-muted-foreground">{pick.reasoning}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={reduceMotion ? {} : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={cn(
                "glass border-2 transition-all duration-300",
                evCalculation.isPositive ? "gradient-border-godmode box-glow-godmode" : "border-border/50 box-glow-red"
              )} data-testid="ev-calculator">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-display">
                    <Calculator className="w-5 h-5 text-espn-red" />
                    EV CALCULATOR
                    <InfoTooltip content="Calculate Expected Value based on true probability vs implied odds. Positive EV indicates a profitable long-term bet." />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="odds" className="text-sm text-muted-foreground flex items-center">
                        Price (American)
                        <InfoTooltip content={BETTING_GLOSSARY.price} />
                      </Label>
                      <Input
                        id="odds"
                        type="text"
                        value={odds}
                        onChange={(e) => setOdds(e.target.value)}
                        placeholder="-110"
                        className="bg-muted/30 font-mono"
                        data-testid="input-odds"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="probability" className="text-sm text-muted-foreground flex items-center">
                        True Prob %
                        <InfoTooltip content="Your estimated true probability of the bet winning. Higher than implied = positive edge." />
                      </Label>
                      <div className="space-y-2">
                        <Input
                          id="probability"
                          type="number"
                          value={trueProbability}
                          onChange={(e) => setTrueProbability(Number(e.target.value))}
                          min={1}
                          max={99}
                          className="bg-muted/30 font-mono"
                          data-testid="input-probability"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stake" className="text-sm text-muted-foreground flex items-center">
                        Stake
                        <InfoTooltip content={BETTING_GLOSSARY.stake} />
                      </Label>
                      <Input
                        id="stake"
                        type="text"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        placeholder="100"
                        className="bg-muted/30 font-mono"
                        data-testid="input-stake"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        True Probability
                      </span>
                      <span className="font-mono">{trueProbability}%</span>
                    </div>
                    <Slider
                      value={[trueProbability]}
                      onValueChange={([v]) => setTrueProbability(v)}
                      min={1}
                      max={99}
                      step={1}
                      className="py-2"
                      data-testid="slider-probability"
                    />
                    <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${trueProbability}%` }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "h-full rounded-full transition-colors",
                          evCalculation.isPositive 
                            ? "bg-gradient-to-r from-godmode/80 to-godmode" 
                            : "bg-gradient-to-r from-espn-red/80 to-espn-red"
                        )}
                      />
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-white/50"
                        style={{ left: `${evCalculation.impliedProb}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Implied: {evCalculation.impliedProb.toFixed(1)}%</span>
                      <span className={evCalculation.edge > 0 ? "text-godmode" : "text-destructive"}>
                        Edge: {evCalculation.edge > 0 ? '+' : ''}{evCalculation.edge.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Implied Prob</p>
                        <p className="text-lg font-display font-mono">
                          <AnimatedNumber value={evCalculation.impliedProb} suffix="%" />
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg relative overflow-hidden">
                        <div 
                          className={cn(
                            "absolute inset-0 opacity-20",
                            evCalculation.edge > 0 ? "bg-godmode" : evCalculation.edge < 0 ? "bg-destructive" : ""
                          )}
                          style={{ width: `${Math.min(Math.abs(evCalculation.edge) * 5, 100)}%` }}
                        />
                        <p className="text-xs text-muted-foreground mb-1 relative">Edge</p>
                        <p className={cn(
                          "text-lg font-display font-mono relative",
                          evCalculation.edge > 0 ? "text-godmode" : evCalculation.edge < 0 ? "text-destructive" : ""
                        )}>
                          {evCalculation.edge > 0 ? '+' : ''}<AnimatedNumber value={evCalculation.edge} suffix="%" />
                        </p>
                      </div>
                      <div className={cn(
                        "text-center p-3 rounded-lg transition-all",
                        evCalculation.isPositive ? "bg-godmode/20 box-glow-godmode" : "bg-destructive/20"
                      )}>
                        <p className="text-xs text-muted-foreground mb-1">Expected Value</p>
                        <p 
                          className={cn(
                            "text-lg font-display font-mono",
                            evCalculation.isPositive ? "text-godmode text-glow-godmode" : "text-destructive"
                          )}
                          data-testid="text-expected-value"
                        >
                          {evCalculation.ev >= 0 ? '+' : ''}$<AnimatedNumber value={evCalculation.ev} />
                        </p>
                      </div>
                    </div>
                    
                    {evCalculation.isPositive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-godmode/10 border border-godmode/30 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-godmode text-black font-bold pulse-godmode">
                              <Zap className="w-3 h-3 mr-1" />
                              +EV SELECTION DETECTED
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Recommended Stake</p>
                            <p className="font-mono text-godmode font-bold">
                              {formatCurrency(evCalculation.recommendedKelly)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={reduceMotion ? {} : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass gradient-border-red" data-testid="kelly-calculator">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-display">
                    <Target className="w-5 h-5 text-espn-red" />
                    KELLY STAKE CALCULATOR
                    <InfoTooltip content={BETTING_GLOSSARY.kelly_criterion} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground flex items-center">
                        Edge %
                        <InfoTooltip content="Your estimated edge over the market. Higher edge = larger bet size." />
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[edgePercent]}
                          onValueChange={([v]) => setEdgePercent(v)}
                          min={0}
                          max={20}
                          step={0.5}
                          className="flex-1"
                          data-testid="slider-edge"
                        />
                        <span className="font-mono text-sm w-12 text-right">{edgePercent}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankroll" className="text-sm text-muted-foreground">Bankroll ($)</Label>
                      <Input
                        id="bankroll"
                        type="text"
                        value={bankroll}
                        onChange={(e) => setBankroll(e.target.value)}
                        placeholder="10000"
                        className="bg-muted/30 font-mono"
                        data-testid="input-bankroll"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Risk Tolerance
                      </span>
                      <span className="font-mono">{riskTolerance}%</span>
                    </div>
                    <Slider
                      value={[riskTolerance]}
                      onValueChange={([v]) => setRiskTolerance(v)}
                      min={10}
                      max={100}
                      step={5}
                      className="py-2"
                      data-testid="slider-risk"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Conservative</span>
                      <span>Aggressive</span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 mt-4">
                    <p className="text-sm text-muted-foreground mb-3">Recommended Stake Size</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                        <p className="text-xs text-muted-foreground mb-1">Full Stake</p>
                        <p className="text-lg font-display text-destructive font-mono">
                          {formatCurrency(kellyCalculation.fullKelly)}
                        </p>
                        <p className="text-xs text-destructive/70 mt-1">Max Risk</p>
                      </div>
                      <div className="text-center p-3 bg-godmode/10 rounded-lg border border-godmode/30 box-glow-godmode">
                        <p className="text-xs text-muted-foreground mb-1">Half Stake</p>
                        <p className="text-lg font-display text-godmode font-mono">
                          {formatCurrency(kellyCalculation.halfKelly)}
                        </p>
                        <p className="text-xs text-godmode/70 mt-1">Recommended</p>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Quarter Stake</p>
                        <p className="text-lg font-display font-mono">
                          {formatCurrency(kellyCalculation.quarterKelly)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Conservative</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Risk-Adjusted Stake
                        </span>
                        <span className="font-mono font-bold text-espn-red">
                          {formatCurrency(kellyCalculation.riskAdjusted)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between p-2 bg-godmode/10 rounded">
                          <span className="flex items-center gap-1 text-godmode">
                            <TrendingUp className="w-3 h-3" />
                            Returns
                          </span>
                          <span className="font-mono text-godmode">
                            +{formatCurrency(kellyCalculation.bankrollImpact.win)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                          <span className="flex items-center gap-1 text-destructive">
                            <TrendingDown className="w-3 h-3" />
                            If Loss
                          </span>
                          <span className="font-mono text-destructive">
                            {formatCurrency(kellyCalculation.bankrollImpact.loss)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass gradient-border-steam" data-testid="line-analyzer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-display">
                  <Gauge className="w-5 h-5 text-steam" />
                  LINE VALUE ANALYZER
                  <InfoTooltip content="Compare your expected line vs market line to identify value. Positive deviation = you think favorite should be bigger. Negative = underdog value." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Expected Line (Your Model)</Label>
                      <Input
                        type="text"
                        value={expectedLine}
                        onChange={(e) => setExpectedLine(e.target.value)}
                        placeholder="-3"
                        className="bg-muted/30 font-mono text-lg"
                        data-testid="input-expected-line"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Current Market Line</Label>
                      <Input
                        type="text"
                        value={currentLine}
                        onChange={(e) => setCurrentLine(e.target.value)}
                        placeholder="-4.5"
                        className="bg-muted/30 font-mono text-lg"
                        data-testid="input-current-line"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Line Deviation</span>
                        <div className="flex items-center gap-2">
                          {lineAnalysis.isSteam && (
                            <Badge className="bg-steam text-white">
                              <Zap className="w-3 h-3 mr-1" />
                              Steam Move
                            </Badge>
                          )}
                          {lineAnalysis.isTrap && (
                            <Badge className="bg-trap text-black">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Potential Trap
                            </Badge>
                          )}
                        </div>
                      </div>
                      <LineValueGauge deviation={lineAnalysis.deviation} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        lineAnalysis.deviation < -0.5 ? "bg-godmode/10 border-godmode/30" : "bg-muted/20 border-border/30"
                      )}>
                        <p className="text-xs text-muted-foreground mb-1">Underdog Value</p>
                        <p className={cn(
                          "text-lg font-mono font-bold",
                          lineAnalysis.deviation < -0.5 ? "text-godmode" : "text-muted-foreground"
                        )}>
                          {lineAnalysis.deviation < -0.5 ? 'YES' : 'NO'}
                        </p>
                      </div>
                      <div className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        lineAnalysis.deviation > 0.5 ? "bg-espn-red/10 border-espn-red/30" : "bg-muted/20 border-border/30"
                      )}>
                        <p className="text-xs text-muted-foreground mb-1">Favorite Value</p>
                        <p className={cn(
                          "text-lg font-mono font-bold",
                          lineAnalysis.deviation > 0.5 ? "text-espn-red" : "text-muted-foreground"
                        )}>
                          {lineAnalysis.deviation > 0.5 ? 'YES' : 'NO'}
                        </p>
                      </div>
                      <div className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        lineAnalysis.hasValue ? "bg-steam/10 border-steam/30" : "bg-muted/20 border-border/30"
                      )}>
                        <p className="text-xs text-muted-foreground mb-1">Edge Detected</p>
                        <p className={cn(
                          "text-lg font-mono font-bold",
                          lineAnalysis.hasValue ? "text-steam" : "text-muted-foreground"
                        )}>
                          {lineAnalysis.hasValue ? `${Math.abs(lineAnalysis.deviation).toFixed(1)}pts` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass border-border/50" data-testid="line-value-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-display">
                  <Activity className="w-5 h-5 text-espn-red" />
                  LIVE LINE MOVEMENT
                  <Badge variant="secondary" className="ml-2">{filteredGames.length} Games</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGames.map((game, index) => {
                    const lineMove = game.currentLine - game.openLine;
                    const totalMove = game.total - game.openTotal;
                    const sharpValue = hasSharpValue(game.openLine, game.currentLine);
                    const keyNum = isKeyNumber(game.currentLine);
                    const modelDeviation = game.currentLine - game.modelLine;

                    return (
                      <motion.div
                        key={game.id}
                        initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "bg-muted/20 rounded-lg p-4 border transition-all hover:bg-muted/30",
                          sharpValue ? "border-steam/50" : "border-border/30",
                          game.fastMove && "border-l-4 border-l-espn-red"
                        )}
                        data-testid={`game-line-${game.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{game.away} @ {game.home}</p>
                            <p className="text-xs text-muted-foreground">
                              Line: {game.currentLine > 0 ? '+' : ''}{game.currentLine} | O/U: {game.total}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {sharpValue && (
                              <Badge className="bg-steam text-white text-xs" data-testid={`badge-sharp-${game.id}`}>
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Sharp
                              </Badge>
                            )}
                            {game.fastMove && (
                              <Badge className="bg-espn-red text-white text-xs" data-testid={`badge-steam-${game.id}`}>
                                <Zap className="w-3 h-3 mr-1" />
                                Steam
                              </Badge>
                            )}
                            {keyNum && (
                              <Badge variant="outline" className="border-espn-gold text-espn-gold text-xs" data-testid={`badge-key-${game.id}`}>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Key#
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Model Confidence</span>
                            <span className="font-mono">{game.confidence}%</span>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${game.confidence}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className={cn(
                                "h-full rounded-full",
                                game.confidence >= 80 ? "bg-godmode" : game.confidence >= 70 ? "bg-espn-gold" : "bg-muted-foreground"
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-muted/30 rounded p-2">
                            <p className="text-xs text-muted-foreground">Opening Line</p>
                            <p className="font-mono">{game.openLine > 0 ? '+' : ''}{game.openLine}</p>
                          </div>
                          <div className="bg-muted/30 rounded p-2">
                            <p className="text-xs text-muted-foreground">Current Line</p>
                            <p className={cn(
                              "font-mono",
                              Math.abs(lineMove) >= 1 && (lineMove > 0 ? "text-destructive" : "text-godmode")
                            )}>
                              {game.currentLine > 0 ? '+' : ''}{game.currentLine}
                              {lineMove !== 0 && (
                                <span className="text-xs ml-1">
                                  ({lineMove > 0 ? '+' : ''}{lineMove.toFixed(1)})
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="bg-muted/30 rounded p-2">
                            <p className="text-xs text-muted-foreground">Model Line</p>
                            <p className="font-mono text-steam">{game.modelLine > 0 ? '+' : ''}{game.modelLine}</p>
                          </div>
                          <div className={cn(
                            "rounded p-2",
                            Math.abs(modelDeviation) >= 1 ? "bg-godmode/20" : "bg-muted/30"
                          )}>
                            <p className="text-xs text-muted-foreground">Model Edge</p>
                            <p className={cn(
                              "font-mono font-bold",
                              Math.abs(modelDeviation) >= 1 ? "text-godmode" : "text-muted-foreground"
                            )}>
                              {modelDeviation > 0 ? '+' : ''}{modelDeviation.toFixed(1)}pts
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={reduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6 border border-border/50 text-center gradient-border-red"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Sparkles className="w-5 h-5 text-espn-red" />
              <span className="font-display tracking-wide">SINGULARITY OMNI EXPLOIT ENGINE</span>
              <Sparkles className="w-5 h-5 text-espn-red" />
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered edge detection • Real-time line analysis • Optimal bet sizing
            </p>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}
