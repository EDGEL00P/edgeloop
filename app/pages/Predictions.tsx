'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/_components/ui/card';
import { Badge } from '@/_components/ui/badge';
import { Button } from '@/_components/ui/button';
import { Input } from '@/_components/ui/input';
import { Label } from '@/_components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/_components/ui/select';
import { cn } from '@/lib/utils';
import { 
  formatPercentage, 
  formatCurrency, 
  BETTING_GLOSSARY 
} from '@/lib/oddsUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/_components/ui/tooltip';
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  BarChart3,
  Home,
  Plane,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Thermometer,
  Wind,
  Users,
  HelpCircle,
} from 'lucide-react';

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

interface PredictionResult {
  prediction: 'cover' | 'loss' | 'over' | 'under';
  confidence: number;
  historicalRecord: string;
  keyFactors: string[];
  sampleSize: number;
}

interface AtsRecord {
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  sampleSize: number;
}

interface MatchupAnalysis {
  headToHead: {
    homeWins: number;
    awayWins: number;
    homeCovers: number;
    awayCovers: number;
    overs: number;
    unders: number;
    sampleSize: number;
  };
  homeTeamTrends: AtsRecord;
  awayTeamTrends: AtsRecord;
  averageTotalPoints: number;
  recommendation: string;
}

interface AnalysisData {
  matchup: MatchupAnalysis;
  spreadPrediction: PredictionResult | null;
  totalPrediction: PredictionResult | null;
}

function ConfidenceGauge({ value, label }: { value: number; label: string }) {
  const getColor = (val: number) => {
    if (val >= 75) return 'text-godmode';
    if (val >= 60) return 'text-espn-gold';
    if (val >= 45) return 'text-muted-foreground';
    return 'text-destructive';
  };

  const getBgColor = (val: number) => {
    if (val >= 75) return 'from-godmode/80 to-godmode';
    if (val >= 60) return 'from-espn-gold/80 to-espn-gold';
    if (val >= 45) return 'from-muted-foreground/60 to-muted-foreground';
    return 'from-destructive/80 to-destructive';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-lg font-mono font-bold", getColor(value))}>{value}%</span>
      </div>
      <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full bg-gradient-to-r", getBgColor(value))}
        />
      </div>
    </div>
  );
}

function AtsBar({ record, teamName }: { record: AtsRecord; teamName: string }) {
  const total = record.wins + record.losses + record.pushes;
  const winPct = total > 0 ? (record.wins / total) * 100 : 0;

  return (
    <div className="p-4 bg-muted/20 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-sm">{teamName}</span>
        <span className="text-xs text-muted-foreground">{record.sampleSize} games</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${winPct}%` }}
            transition={{ duration: 0.6 }}
            className="h-full bg-gradient-to-r from-godmode to-godmode/70"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${total > 0 ? (record.pushes / total) * 100 : 0}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="h-full bg-muted-foreground/50"
          />
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-godmode">{record.wins}W</span>
        <span className="text-destructive">{record.losses}L</span>
        <span className="text-muted-foreground">{record.pushes}P</span>
        <span className={cn(
          "font-mono font-bold",
          record.winPercentage >= 55 ? "text-godmode" : record.winPercentage <= 45 ? "text-destructive" : "text-muted-foreground"
        )}>
          {record.winPercentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function Predictions() {
  const { reduceMotion } = useSettings();
  
  const [homeTeam, setHomeTeam] = useState<string>('');
  const [awayTeam, setAwayTeam] = useState<string>('');
  const [spread, setSpread] = useState<string>('-3');
  const [total, setTotal] = useState<string>('45');
  const [temperature, setTemperature] = useState<string>('60');
  const [windSpeed, setWindSpeed] = useState<string>('5');
  
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [bettingTrends, setBettingTrends] = useState<{
    homeFieldAdvantage: { homeCoverRate: number; homeCoversAsFavorite: number; homeCoversAsUnderdog: number; sampleSize: number } | null;
    weatherImpact: { averageTotal: number; overRate: number; underRate: number; sampleSize: number; recommendation: string } | null;
  }>({ homeFieldAdvantage: null, weatherImpact: null });

  const handleAnalyzeMatchup = async () => {
    if (!homeTeam || !awayTeam) {
      setAnalyzeError('Please select both home and away teams');
      return;
    }
    if (homeTeam === awayTeam) {
      setAnalyzeError('Home and away teams must be different');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalysisData(null);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/predictions/matchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          spread: parseFloat(spread) || 0,
          total: parseFloat(total) || 45,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze matchup');
      }

      const data = await response.json();
      setAnalysisData(data);

      const trendsResponse = await fetch(`/api/predictions/trends?temp=${temperature}&wind=${windSpeed}`);
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        setBettingTrends({
          homeFieldAdvantage: trendsData.homeFieldAdvantage,
          weatherImpact: trendsData.weatherImpact,
        });
      }
    } catch (error) {
      setAnalyzeError('Failed to analyze matchup. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetAiAnalysis = async () => {
    if (!homeTeam || !awayTeam) return;

    setIsLoadingAi(true);
    setAiError(null);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/predictions/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          spread: parseFloat(spread) || 0,
          total: parseFloat(total) || 45,
          context: `Temperature: ${temperature}°F, Wind: ${windSpeed} mph`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI analysis');
      }

      const data = await response.json();
      setAiAnalysis(data.analysis || 'No analysis available');
    } catch (error) {
      setAiError('Failed to generate AI analysis. Please try again.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const getTeamName = (abbr: string) => NFL_TEAMS.find(t => t.abbr === abbr)?.name || abbr;

  return (
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
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-espn-red to-steam flex items-center justify-center box-glow-red">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-3xl tracking-wider text-glow-red flex items-center gap-2" data-testid="page-title">
                    SINGULARITY PREDICTION ENGINE
                    <Sparkles className="w-6 h-6 text-espn-gold animate-pulse" />
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    AI-Powered Betting Intelligence
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-godmode/50 text-godmode animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                NEURAL ACTIVE
              </Badge>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="gradient-border-red box-glow-red" data-testid="game-selector">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-display">
                <Target className="w-5 h-5 text-espn-red" />
                MATCHUP ANALYZER
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Home className="w-3 h-3" /> Home Team
                  </Label>
                  <Select value={homeTeam} onValueChange={setHomeTeam} data-testid="select-home-team">
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {NFL_TEAMS.map((team) => (
                        <SelectItem key={team.abbr} value={team.abbr}>
                          {team.abbr} - {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Plane className="w-3 h-3" /> Away Team
                  </Label>
                  <Select value={awayTeam} onValueChange={setAwayTeam} data-testid="select-away-team">
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {NFL_TEAMS.map((team) => (
                        <SelectItem key={team.abbr} value={team.abbr}>
                          {team.abbr} - {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spread" className="text-sm text-muted-foreground">
                    Spread
                  </Label>
                  <Input
                    id="spread"
                    type="number"
                    step="0.5"
                    value={spread}
                    onChange={(e) => setSpread(e.target.value)}
                    className="bg-muted/30 font-mono"
                    placeholder="-3"
                    data-testid="input-spread"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total" className="text-sm text-muted-foreground">
                    Over/Under
                  </Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.5"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    className="bg-muted/30 font-mono"
                    placeholder="45"
                    data-testid="input-total"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleAnalyzeMatchup}
                    disabled={isAnalyzing || !homeTeam || !awayTeam}
                    className="w-full gradient-espn text-white font-display pulse-exploit"
                    data-testid="button-analyze"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ANALYZING...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        ANALYZE MATCHUP
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {analyzeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-destructive/20 border border-destructive/50 rounded-lg flex items-center gap-2 text-destructive"
                >
                  <AlertCircle className="w-4 h-4" />
                  {analyzeError}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {analysisData && (
            <>
              <motion.div
                initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {analysisData.spreadPrediction && (
                  <Card className={cn(
                    "glass transition-all duration-300",
                    analysisData.spreadPrediction.prediction === 'cover' ? "gradient-border-godmode box-glow-godmode" : "gradient-border-red box-glow-red"
                  )} data-testid="spread-prediction">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl font-display">
                        {analysisData.spreadPrediction.prediction === 'cover' ? (
                          <TrendingUp className="w-5 h-5 text-godmode" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-destructive" />
                        )}
                        SPREAD PREDICTION
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-display">
                            {homeTeam} {parseFloat(spread) >= 0 ? '+' : ''}{spread}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Predicted: <span className={cn(
                              "font-bold",
                              analysisData.spreadPrediction.prediction === 'cover' ? "text-godmode" : "text-destructive"
                            )}>
                              {analysisData.spreadPrediction.prediction.toUpperCase()}
                            </span>
                          </p>
                        </div>
                        <div className={cn(
                          "text-4xl font-display font-bold",
                          analysisData.spreadPrediction.confidence >= 60 ? "text-godmode text-glow-godmode" : "text-muted-foreground"
                        )}>
                          {analysisData.spreadPrediction.confidence}%
                        </div>
                      </div>
                      <ConfidenceGauge value={analysisData.spreadPrediction.confidence} label="Confidence" />
                      <div className="text-xs text-muted-foreground">
                        Historical: {analysisData.spreadPrediction.historicalRecord} • {analysisData.spreadPrediction.sampleSize} games
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysisData.totalPrediction && (
                  <Card className={cn(
                    "glass transition-all duration-300",
                    analysisData.totalPrediction.prediction === 'over' ? "gradient-border-godmode box-glow-godmode" : "gradient-border-steam box-glow-steam"
                  )} data-testid="total-prediction">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl font-display">
                        <BarChart3 className="w-5 h-5 text-espn-gold" />
                        OVER/UNDER PREDICTION
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-display">
                            {analysisData.totalPrediction.prediction.toUpperCase()} {total}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Predicted: <span className={cn(
                              "font-bold",
                              analysisData.totalPrediction.prediction === 'over' ? "text-godmode" : "text-steam"
                            )}>
                              {analysisData.totalPrediction.prediction.toUpperCase()}
                            </span>
                          </p>
                        </div>
                        <div className={cn(
                          "text-4xl font-display font-bold",
                          analysisData.totalPrediction.confidence >= 60 ? "text-godmode text-glow-godmode" : "text-muted-foreground"
                        )}>
                          {analysisData.totalPrediction.confidence}%
                        </div>
                      </div>
                      <ConfidenceGauge value={analysisData.totalPrediction.confidence} label="Confidence" />
                      <div className="text-xs text-muted-foreground">
                        Historical: {analysisData.totalPrediction.historicalRecord} • {analysisData.totalPrediction.sampleSize} games
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>

              {(analysisData.spreadPrediction?.keyFactors?.length || analysisData.totalPrediction?.keyFactors?.length) && (
                <motion.div
                  initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="glass" data-testid="key-factors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl font-display">
                        <CheckCircle className="w-5 h-5 text-godmode" />
                        KEY FACTORS
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-display text-muted-foreground">Spread Factors</p>
                          {analysisData.spreadPrediction?.keyFactors?.map((factor, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-2 text-sm p-2 bg-muted/20 rounded"
                            >
                              <ChevronRight className="w-4 h-4 text-espn-red flex-shrink-0 mt-0.5" />
                              {factor}
                            </motion.div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-display text-muted-foreground">Total Factors</p>
                          {analysisData.totalPrediction?.keyFactors?.map((factor, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-2 text-sm p-2 bg-muted/20 rounded"
                            >
                              <ChevronRight className="w-4 h-4 text-espn-gold flex-shrink-0 mt-0.5" />
                              {factor}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <motion.div
                initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass" data-testid="team-analytics">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl font-display">
                      <Users className="w-5 h-5 text-steam" />
                      TEAM ANALYTICS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-display text-lg flex items-center gap-2">
                          <Home className="w-4 h-4 text-espn-red" />
                          {getTeamName(homeTeam)} (Home)
                        </h3>
                        <AtsBar record={analysisData.matchup.homeTeamTrends} teamName={homeTeam} />
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-display text-lg flex items-center gap-2">
                          <Plane className="w-4 h-4 text-espn-gold" />
                          {getTeamName(awayTeam)} (Away)
                        </h3>
                        <AtsBar record={analysisData.matchup.awayTeamTrends} teamName={awayTeam} />
                      </div>
                    </div>

                    {analysisData.matchup.headToHead.sampleSize > 0 && (
                      <div className="mt-6 pt-6 border-t border-border/50">
                        <h3 className="font-display text-lg mb-4">Head-to-Head History</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-muted/20 rounded-lg">
                            <p className="text-2xl font-display text-godmode">{analysisData.matchup.headToHead.homeWins}</p>
                            <p className="text-xs text-muted-foreground">{homeTeam} Wins</p>
                          </div>
                          <div className="text-center p-3 bg-muted/20 rounded-lg">
                            <p className="text-2xl font-display text-espn-gold">{analysisData.matchup.headToHead.awayWins}</p>
                            <p className="text-xs text-muted-foreground">{awayTeam} Wins</p>
                          </div>
                          <div className="text-center p-3 bg-muted/20 rounded-lg">
                            <p className="text-2xl font-display">{analysisData.matchup.headToHead.overs}</p>
                            <p className="text-xs text-muted-foreground">Overs</p>
                          </div>
                          <div className="text-center p-3 bg-muted/20 rounded-lg">
                            <p className="text-2xl font-display">{analysisData.matchup.headToHead.unders}</p>
                            <p className="text-xs text-muted-foreground">Unders</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-center text-muted-foreground italic">
                          {analysisData.matchup.recommendation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="gradient-border-godmode" data-testid="ai-analysis">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xl font-display">
                        <Brain className="w-5 h-5 text-godmode" />
                        AI BETTING ANALYSIS
                        <Badge className="bg-godmode/20 text-godmode border border-godmode/30">
                          GPT-5 POWERED
                        </Badge>
                      </span>
                      <Button
                        onClick={handleGetAiAnalysis}
                        disabled={isLoadingAi}
                        variant="outline"
                        className="border-godmode/50 text-godmode hover:bg-godmode/20"
                        data-testid="button-ai-analysis"
                      >
                        {isLoadingAi ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ANALYZING...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            GET AI ANALYSIS
                          </>
                        )}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiError && (
                      <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-lg flex items-center gap-2 text-destructive mb-4">
                        <AlertCircle className="w-4 h-4" />
                        {aiError}
                      </div>
                    )}
                    {isLoadingAi && (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-godmode/30 border-t-godmode animate-spin" />
                          <Brain className="w-8 h-8 text-godmode absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-muted-foreground animate-pulse">Neural network processing matchup data...</p>
                      </div>
                    )}
                    {aiAnalysis && !isLoadingAi && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="prose prose-invert max-w-none"
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/20 p-4 rounded-lg border border-border/50">
                          {aiAnalysis}
                        </div>
                      </motion.div>
                    )}
                    {!aiAnalysis && !isLoadingAi && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Click "GET AI ANALYSIS" for detailed betting insights</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass" data-testid="betting-trends">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl font-display">
                      <BarChart3 className="w-5 h-5 text-trap" />
                      BETTING TRENDS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bettingTrends.homeFieldAdvantage && (
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Home className="w-4 h-4 text-espn-red" />
                            <h4 className="font-display">Home Field Advantage</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Cover Rate</span>
                              <span className="font-mono">{bettingTrends.homeFieldAdvantage.homeCoverRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">As Favorite</span>
                              <span className="font-mono">{bettingTrends.homeFieldAdvantage.homeCoversAsFavorite.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">As Underdog</span>
                              <span className="font-mono">{bettingTrends.homeFieldAdvantage.homeCoversAsUnderdog.toFixed(1)}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                              Sample: {bettingTrends.homeFieldAdvantage.sampleSize} games
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-espn-gold" />
                          <h4 className="font-display">Spread Analysis</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Spread</span>
                            <span className="font-mono font-bold">{parseFloat(spread) >= 0 ? '+' : ''}{spread}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Key Number</span>
                            <span className={cn(
                              "font-mono",
                              [3, 7, -3, -7, 3.5, 7.5, -3.5, -7.5].includes(parseFloat(spread)) ? "text-godmode" : "text-muted-foreground"
                            )}>
                              {[3, 7, -3, -7, 3.5, 7.5, -3.5, -7.5].includes(parseFloat(spread)) ? 'YES' : 'NO'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {bettingTrends.weatherImpact && (
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-4 h-4 text-steam" />
                              <Wind className="w-4 h-4 text-steam" />
                            </div>
                            <h4 className="font-display">Weather Impact</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Avg Total</span>
                              <span className="font-mono">{bettingTrends.weatherImpact.averageTotal.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Over Rate</span>
                              <span className="font-mono">{bettingTrends.weatherImpact.overRate.toFixed(1)}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground pt-2 border-t border-border/50 italic">
                              {bettingTrends.weatherImpact.recommendation}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-4">Weather Inputs (Optional)</p>
                      <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="temp" className="text-xs text-muted-foreground flex items-center gap-1">
                            <Thermometer className="w-3 h-3" /> Temperature (°F)
                          </Label>
                          <Input
                            id="temp"
                            type="number"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="bg-muted/30 font-mono h-8 text-sm"
                            data-testid="input-temperature"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wind" className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wind className="w-3 h-3" /> Wind (mph)
                          </Label>
                          <Input
                            id="wind"
                            type="number"
                            value={windSpeed}
                            onChange={(e) => setWindSpeed(e.target.value)}
                            className="bg-muted/30 font-mono h-8 text-sm"
                            data-testid="input-wind"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {!analysisData && !isAnalyzing && (
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-espn-red/20 to-steam/20 flex items-center justify-center">
              <Brain className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl text-muted-foreground mb-2">
              Select a Matchup to Analyze
            </h3>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
              Choose home and away teams above, set the spread and total, then click "ANALYZE MATCHUP" to get AI-powered predictions
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
