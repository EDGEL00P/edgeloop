'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useSwarmAnalysis, useMonteCarlo } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/oddsUtils';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  Cloud,
  AlertTriangle,
  LineChart,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  Minus,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const NFL_TEAMS = [
  { abbr: 'ARI', name: 'Arizona Cardinals' },
  { abbr: 'ATL', name: 'Atlanta Falcons' },
  { abbr: 'BAL', name: 'Baltimore Ravens' },
  { abbr: 'BUF', name: 'Buffalo Bills' },
  { abbr: 'CAR', name: 'Carolina Panthers' },
  { abbr: 'CHI', name: 'Chicago Bears' },
  { abbr: 'CIN', name: 'Cincinnati Bengals' },
  { abbr: 'CLE', name: 'Cleveland Browns' },
  { abbr: 'DAL', name: 'Dallas Cowboys' },
  { abbr: 'DEN', name: 'Denver Broncos' },
  { abbr: 'DET', name: 'Detroit Lions' },
  { abbr: 'GB', name: 'Green Bay Packers' },
  { abbr: 'HOU', name: 'Houston Texans' },
  { abbr: 'IND', name: 'Indianapolis Colts' },
  { abbr: 'JAX', name: 'Jacksonville Jaguars' },
  { abbr: 'KC', name: 'Kansas City Chiefs' },
  { abbr: 'LAC', name: 'Los Angeles Chargers' },
  { abbr: 'LAR', name: 'Los Angeles Rams' },
  { abbr: 'LV', name: 'Las Vegas Raiders' },
  { abbr: 'MIA', name: 'Miami Dolphins' },
  { abbr: 'MIN', name: 'Minnesota Vikings' },
  { abbr: 'NE', name: 'New England Patriots' },
  { abbr: 'NO', name: 'New Orleans Saints' },
  { abbr: 'NYG', name: 'New York Giants' },
  { abbr: 'NYJ', name: 'New York Jets' },
  { abbr: 'PHI', name: 'Philadelphia Eagles' },
  { abbr: 'PIT', name: 'Pittsburgh Steelers' },
  { abbr: 'SEA', name: 'Seattle Seahawks' },
  { abbr: 'SF', name: 'San Francisco 49ers' },
  { abbr: 'TB', name: 'Tampa Bay Buccaneers' },
  { abbr: 'TEN', name: 'Tennessee Titans' },
  { abbr: 'WSH', name: 'Washington Commanders' },
];

interface Agent {
  id: string;
  name: string;
  icon: typeof Brain;
  prediction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signal: string;
  description: string;
}

interface SimulationResult {
  homeWinProb: number;
  awayWinProb: number;
  spreadLow: number;
  spreadHigh: number;
  mean: number;
  distribution: { score: number; probability: number }[];
}

interface ConsensusData {
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  verdict: 'bullish' | 'bearish' | 'neutral';
  keyReasons: string[];
}

interface KellyData {
  recommendedBet: number;
  riskLevel: 'low' | 'medium' | 'high';
  potentialReturn: number;
  ev: number;
  approved: boolean;
}

const AGENT_ICON_MAP: Record<string, typeof Brain> = {
  'StatsAgent': BarChart3,
  'MarketAgent': TrendingUp,
  'WeatherAgent': Cloud,
  'InjuryAgent': AlertTriangle,
  'TrendAgent': LineChart,
};

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'StatsAgent': 'Stats',
  'MarketAgent': 'Market',
  'WeatherAgent': 'Weather',
  'InjuryAgent': 'Injury',
  'TrendAgent': 'Trend',
};

function CompactAgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const Icon = agent.icon;
  
  const getSignalColor = (prediction: string) => {
    if (prediction === 'bullish') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    if (prediction === 'bearish') return 'text-red-400 bg-red-400/10 border-red-400/30';
    return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
  };

  const SignalIcon = agent.prediction === 'bullish' ? TrendingUp : 
                     agent.prediction === 'bearish' ? TrendingDown : Minus;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-card rounded-lg border border-border/60 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-black/20 p-3 flex flex-col items-center gap-2 min-w-[80px] flex-1"
      )}
      data-testid={`agent-card-${agent.id}`}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border",
        getSignalColor(agent.prediction)
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-foreground">{agent.name}</span>
      <div className="flex items-center gap-1">
        <SignalIcon className={cn("w-3 h-3", getSignalColor(agent.prediction).split(' ')[0])} />
        <span className="text-xs font-mono">{agent.confidence}%</span>
      </div>
    </motion.button>
  );
}

function ExpandedAgentCard({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { reduceMotion } = useSettings();
  const Icon = agent.icon;
  
  const getSignalColor = (prediction: string) => {
    if (prediction === 'bullish') return 'text-emerald-400';
    if (prediction === 'bearish') return 'text-red-400';
    return 'text-amber-400';
  };

  return (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card rounded-lg border border-border/60 shadow-md shadow-black/10 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border",
            agent.prediction === 'bullish' ? 'bg-emerald-400/10 border-emerald-400/30' :
            agent.prediction === 'bearish' ? 'bg-red-400/10 border-red-400/30' :
            'bg-amber-400/10 border-amber-400/30'
          )}>
            <Icon className={cn("w-5 h-5", getSignalColor(agent.prediction))} />
          </div>
          <div>
            <p className="font-medium">{agent.name}</p>
            <Badge variant="outline" className={cn("text-xs", getSignalColor(agent.prediction))}>
              {agent.prediction.toUpperCase()} • {agent.confidence}%
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm font-mono font-bold">{agent.signal}</p>
      <p className="text-sm text-muted-foreground">{agent.description}</p>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${agent.confidence}%` }}
          transition={{ duration: 0.5 }}
          className={cn(
            "h-full rounded-full",
            agent.prediction === 'bullish' ? 'bg-emerald-400' :
            agent.prediction === 'bearish' ? 'bg-red-400' :
            'bg-amber-400'
          )}
        />
      </div>
    </motion.div>
  );
}

function WinProbabilityDonut({ homeProb, awayProb }: { homeProb: number; awayProb: number }) {
  const data = [
    { name: 'Home', value: homeProb },
    { name: 'Away', value: awayProb },
  ];
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--muted))'];

  return (
    <div className="relative w-32 h-32 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={50}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold font-mono">{Math.round(homeProb)}%</span>
      </div>
    </div>
  );
}

export default function Singularity() {
  const { reduceMotion } = useSettings();
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [spread, setSpread] = useState('-3');
  const [total, setTotal] = useState('47.5');
  const [bankroll, setBankroll] = useState('10000');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [kellyCalc, setKellyCalc] = useState<KellyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentsExpanded, setAgentsExpanded] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showMonteCarloDetails, setShowMonteCarloDetails] = useState(false);
  const [showKellySettings, setShowKellySettings] = useState(false);

  const swarmAnalysis = useSwarmAnalysis();
  const monteCarlo = useMonteCarlo();

  const handleAnalyze = async () => {
    if (!homeTeam || !awayTeam) return;
    setError(null);
    
    try {
      const result = await swarmAnalysis.mutateAsync({
        homeTeam,
        awayTeam,
        spread: parseFloat(spread) || 0,
        total: parseFloat(total) || 45,
      });

      const mappedAgents: Agent[] = result.agents.map((agent) => {
        const prediction: 'bullish' | 'bearish' | 'neutral' = 
          agent.homeWinProbability > 0.55 ? 'bullish' : 
          agent.homeWinProbability < 0.45 ? 'bearish' : 'neutral';
        
        return {
          id: agent.agentName.toLowerCase().replace('agent', ''),
          name: AGENT_DISPLAY_NAMES[agent.agentName] || agent.agentName.replace(/([A-Z])/g, ' $1').trim(),
          icon: AGENT_ICON_MAP[agent.agentName] || Brain,
          prediction,
          confidence: Math.round(agent.confidence * 100),
          signal: agent.predictedSpread < 0 
            ? `HOME ${agent.predictedSpread.toFixed(1)}`
            : agent.predictedSpread > 0 
              ? `AWAY +${agent.predictedSpread.toFixed(1)}`
              : 'PUSH',
          description: agent.reasoning,
        };
      });

      setAgents(mappedAgents);

      const bullish = mappedAgents.filter(a => a.prediction === 'bullish').length;
      const bearish = mappedAgents.filter(a => a.prediction === 'bearish').length;
      const neutral = mappedAgents.filter(a => a.prediction === 'neutral').length;
      const avgConfidence = Math.round(result.overallConfidence * 100);
      
      let verdict: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (bullish > bearish && bullish > neutral) verdict = 'bullish';
      else if (bearish > bullish && bearish > neutral) verdict = 'bearish';

      const keyReasons = mappedAgents
        .filter(a => a.prediction === verdict || verdict === 'neutral')
        .slice(0, 4)
        .map(a => a.description.split('.')[0] + '.');

      setConsensus({ bullish, bearish, neutral, avgConfidence, verdict, keyReasons });

      const kellyRec = result.kellyRecommendations[0];
      const bankrollNum = parseFloat(bankroll) || 10000;
      if (kellyRec) {
        const recommended = kellyRec.kellySizes.half * bankrollNum;
        setKellyCalc({
          recommendedBet: recommended,
          riskLevel: recommended / bankrollNum > 0.05 ? 'high' : recommended / bankrollNum > 0.02 ? 'medium' : 'low',
          potentialReturn: recommended * (kellyRec.evPerUnit + 1),
          ev: kellyRec.evPerUnit * 100,
          approved: kellyRec.passesThreshold,
        });
      } else {
        const edge = (avgConfidence - 50) / 100;
        const recommended = Math.max(0, bankrollNum * edge * 0.5);
        setKellyCalc({
          recommendedBet: recommended,
          riskLevel: recommended / bankrollNum > 0.05 ? 'high' : recommended / bankrollNum > 0.02 ? 'medium' : 'low',
          potentialReturn: recommended * 1.91,
          ev: edge * 100,
          approved: avgConfidence >= 60 && edge > 0.05,
        });
      }

      if (result.monteCarlo) {
        const mc = result.monteCarlo;
        const homeWinProb = mc.homeWinProbability * 100;
        setSimulationResult({
          homeWinProb,
          awayWinProb: 100 - homeWinProb,
          spreadLow: mc.confidenceIntervals.spread68.lower,
          spreadHigh: mc.confidenceIntervals.spread68.upper,
          mean: mc.homeScoreDistribution.mean,
          distribution: [],
        });
      } else {
        setSimulationResult({
          homeWinProb: avgConfidence,
          awayWinProb: 100 - avgConfidence,
          spreadLow: parseFloat(spread) - 3,
          spreadHigh: parseFloat(spread) + 3,
          mean: 24,
          distribution: [],
        });
      }

      setHasAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      console.error('Swarm analysis error:', err);
    }
  };

  const handleDeepAnalysis = async () => {
    if (!homeTeam || !awayTeam) return;
    setError(null);

    try {
      const homeExpected = 24 + (Math.random() * 6);
      const awayExpected = 22 + (Math.random() * 6);
      
      const result = await monteCarlo.mutateAsync({
        homeExpectedPoints: homeExpected,
        awayExpectedPoints: awayExpected,
        spread: parseFloat(spread) || 0,
        total: parseFloat(total) || 45,
        simulations: 10000,
        variance: 10,
      });

      const distribution = [];
      for (let score = 0; score <= 60; score += 3) {
        const mean = result.totalDistribution.mean;
        const stdDev = result.totalDistribution.stdDev || 8;
        const prob = Math.exp(-Math.pow(score - mean, 2) / (2 * stdDev * stdDev)) * 100;
        distribution.push({ score, probability: prob });
      }

      const homeWinProb = result.homeWinProbability * 100;
      setSimulationResult({
        homeWinProb,
        awayWinProb: 100 - homeWinProb,
        spreadLow: result.confidenceIntervals.spread68.lower,
        spreadHigh: result.confidenceIntervals.spread68.upper,
        mean: result.totalDistribution.mean,
        distribution,
      });
      setShowMonteCarloDetails(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deep analysis failed');
      console.error('Monte Carlo error:', err);
    }
  };

  const isAnalyzing = swarmAnalysis.isPending;
  const isDeepAnalyzing = monteCarlo.isPending;

  const getVerdictDisplay = () => {
    if (!consensus) return { text: '', color: '' };
    if (consensus.verdict === 'bullish') {
      return { text: `${homeTeam} to Cover`, color: 'text-emerald-400' };
    }
    if (consensus.verdict === 'bearish') {
      return { text: `${awayTeam} to Cover`, color: 'text-red-400' };
    }
    return { text: 'No Strong Edge', color: 'text-amber-400' };
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.header
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight" data-testid="page-title">
              Edge Loop Intelligence
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Multi-agent AI system analyzing games with statistical, market, weather, injury, and trend data
          </p>
        </motion.header>

        <motion.section
          initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-lg border border-border/60 shadow-md shadow-black/10 p-4 sm:p-6"
          data-testid="game-selector"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Home Team</Label>
              <Select value={homeTeam} onValueChange={setHomeTeam}>
                <SelectTrigger className="h-12" data-testid="trigger-home-team">
                  <SelectValue placeholder="Select home" />
                </SelectTrigger>
                <SelectContent>
                  {NFL_TEAMS.map((team) => (
                    <SelectItem key={team.abbr} value={team.abbr}>
                      {team.abbr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Away Team</Label>
              <Select value={awayTeam} onValueChange={setAwayTeam}>
                <SelectTrigger className="h-12" data-testid="trigger-away-team">
                  <SelectValue placeholder="Select away" />
                </SelectTrigger>
                <SelectContent>
                  {NFL_TEAMS.filter(t => t.abbr !== homeTeam).map((team) => (
                    <SelectItem key={team.abbr} value={team.abbr}>
                      {team.abbr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={!homeTeam || !awayTeam || isAnalyzing}
            className="w-full h-12 gap-2"
            data-testid="button-analyze"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Game
              </>
            )}
          </Button>
        </motion.section>

        {error && (
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive"
            data-testid="error-message"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {hasAnalyzed && consensus && (
            <>
              <motion.section
                initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-lg border border-border/60 shadow-md shadow-black/10 p-5 sm:p-6"
                data-testid="prediction-panel"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg">AI Prediction</h2>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    {homeTeam} vs {awayTeam} • Spread {spread}
                  </p>
                  <p className={cn("text-2xl sm:text-3xl font-bold", getVerdictDisplay().color)}>
                    {getVerdictDisplay().text}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-mono font-bold">{consensus.avgConfidence}%</span>
                  </div>
                  <Progress value={consensus.avgConfidence} className="h-3" />
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-sm font-medium text-muted-foreground">Key Insights</p>
                  <ul className="space-y-1.5">
                    {consensus.keyReasons.slice(0, 4).map((reason, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-foreground/90">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={handleDeepAnalysis}
                  disabled={isDeepAnalyzing}
                  variant="outline"
                  className="w-full min-h-[44px] gap-2 touch-manipulation"
                  data-testid="button-deep-analysis"
                >
                  {isDeepAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running Full Analysis...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Run Full Analysis
                    </>
                  )}
                </Button>
              </motion.section>

              <Collapsible open={agentsExpanded} onOpenChange={setAgentsExpanded}>
                <motion.section
                  initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-lg border border-border/60 p-4"
                  data-testid="agent-grid"
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full min-h-[44px] flex items-center justify-between mb-3 touch-manipulation">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">Agent Summary</span>
                        <Badge variant="outline" className="text-xs">
                          {consensus.bullish} bullish • {consensus.bearish} bearish
                        </Badge>
                      </div>
                      {agentsExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>

                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide touch-pan-x">
                    {agents.map((agent) => (
                      <CompactAgentCard
                        key={agent.id}
                        agent={agent}
                        onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                      />
                    ))}
                  </div>

                  <CollapsibleContent>
                    <AnimatePresence>
                      {selectedAgent && (
                        <div className="mt-4">
                          <ExpandedAgentCard
                            agent={selectedAgent}
                            onClose={() => setSelectedAgent(null)}
                          />
                        </div>
                      )}
                    </AnimatePresence>
                  </CollapsibleContent>
                </motion.section>
              </Collapsible>

              {simulationResult && (
                <motion.section
                  initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-lg border border-border/60 p-4 sm:p-5"
                  data-testid="monte-carlo"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Monte Carlo Simulation</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMonteCarloDetails(!showMonteCarloDetails)}
                      className="gap-1 text-xs"
                    >
                      {showMonteCarloDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showMonteCarloDetails ? 'Hide' : 'Details'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-6">
                    <WinProbabilityDonut
                      homeProb={simulationResult.homeWinProb}
                      awayProb={simulationResult.awayWinProb}
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Win Probability</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold font-mono">
                            {Math.round(simulationResult.homeWinProb)}%
                          </span>
                          <span className="text-sm text-muted-foreground">{homeTeam}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Spread Range (68% CI)</p>
                        <span className="text-lg font-mono font-bold text-primary">
                          {simulationResult.spreadLow.toFixed(1)} to {simulationResult.spreadHigh.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showMonteCarloDetails && simulationResult.distribution.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-border/50"
                      >
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 rounded-lg bg-muted/20">
                            <p className="text-xs text-muted-foreground mb-1">Mean Score</p>
                            <p className="font-mono font-bold">{simulationResult.mean.toFixed(1)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/20">
                            <p className="text-xs text-muted-foreground mb-1">Home Win</p>
                            <p className="font-mono font-bold">{simulationResult.homeWinProb.toFixed(0)}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/20">
                            <p className="text-xs text-muted-foreground mb-1">Away Win</p>
                            <p className="font-mono font-bold">{simulationResult.awayWinProb.toFixed(0)}%</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              )}

              {kellyCalc && (
                <motion.section
                  initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "bg-card rounded-lg border border-border/60 p-4 sm:p-5 border-2",
                    kellyCalc.approved ? 'border-emerald-500/30' : 'border-amber-500/30'
                  )}
                  data-testid="kelly-staking"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Staking Recommendation</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKellySettings(!showKellySettings)}
                      className="gap-1 text-xs"
                    >
                      <Settings className="w-3 h-3" />
                      Customize
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      kellyCalc.approved ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                    )}>
                      {kellyCalc.approved ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-bold font-mono">
                        {formatCurrency(kellyCalc.recommendedBet)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Recommended bet • {kellyCalc.riskLevel} risk
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Expected Value</p>
                      <p className={cn(
                        "font-mono font-bold",
                        kellyCalc.ev > 0 ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {kellyCalc.ev > 0 ? '+' : ''}{formatPercentage(kellyCalc.ev)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Potential Return</p>
                      <p className="font-mono font-bold text-emerald-400">
                        {formatCurrency(kellyCalc.potentialReturn)}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showKellySettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-border/50"
                      >
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Bankroll</Label>
                            <Input
                              type="text"
                              value={bankroll}
                              onChange={(e) => setBankroll(e.target.value)}
                              className="mt-1 font-mono"
                              data-testid="input-bankroll"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Spread</Label>
                              <Input
                                type="text"
                                value={spread}
                                onChange={(e) => setSpread(e.target.value)}
                                className="mt-1 font-mono"
                                data-testid="input-spread"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Total</Label>
                              <Input
                                type="text"
                                value={total}
                                onChange={(e) => setTotal(e.target.value)}
                                className="mt-1 font-mono"
                                data-testid="input-total"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleAnalyze}
                            className="w-full"
                            disabled={isAnalyzing}
                          >
                            Recalculate
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              )}
            </>
          )}
        </AnimatePresence>

        {!hasAnalyzed && (
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Select teams above to run AI analysis
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
