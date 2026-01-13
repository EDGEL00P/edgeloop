import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameFutures, useTeams, usePlayerProps, useCorrelationAnalysis, useSGMKelly, CorrelationLeg, CorrelationResult, KellyResult } from '@/lib/api';
import { enrichGameFuture } from '@/lib/utils';
import { useSettings } from '@/lib/store';
import { useBetSlip } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { 
  Layers, 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Link2,
  Zap,
  Calculator,
  Target,
  Shield,
  Crosshair,
  ChevronUp,
  ChevronDown,
  Info,
  DollarSign,
  BarChart3,
  Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { americanToDecimal, formatDecimalOdds, calculateParlayDecimalOdds, formatCurrency, formatPercentage } from '@/lib/oddsUtils';

interface SelectedProp {
  id: string;
  playerId: number;
  playerName: string;
  teamAbbreviation: string;
  position: string | null;
  propType: string;
  line: number;
  selection: 'over' | 'under';
  odds: number;
  category: string;
}

const PROP_CATEGORIES = [
  { id: 'all', label: 'All Props', icon: Layers },
  { id: 'Passing', label: 'Passing', icon: Target },
  { id: 'Rushing', label: 'Rushing', icon: TrendingUp },
  { id: 'Receiving', label: 'Receiving', icon: Crosshair },
  { id: 'Touchdowns', label: 'TDs', icon: Zap },
  { id: 'Defense', label: 'Defense', icon: Shield },
];

const PROP_TYPE_LABELS: Record<string, string> = {
  passing_yards: 'Pass Yds',
  passing_tds: 'Pass TDs',
  completions: 'Completions',
  interceptions: 'INTs',
  rushing_yards: 'Rush Yds',
  rushing_tds: 'Rush TDs',
  receiving_yards: 'Rec Yds',
  receptions: 'Receptions',
  receiving_tds: 'Rec TDs',
  touchdowns: 'Anytime TD',
  tackles: 'Tackles',
  sacks: 'Sacks',
  assists: 'Assists',
};

function formatPropType(propType: string): string {
  return PROP_TYPE_LABELS[propType] || propType.replace(/_/g, ' ');
}

function formatOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

function CorrelationHeatmap({ 
  correlations, 
  selectedProps 
}: { 
  correlations: CorrelationResult | null;
  selectedProps: SelectedProp[];
}) {
  if (!correlations || selectedProps.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Grid3X3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        Select 2+ legs to view correlation matrix
      </div>
    );
  }

  const n = selectedProps.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
  }

  correlations.leg_correlations.forEach(({ leg1, leg2, correlation }) => {
    const idx1 = selectedProps.findIndex(p => 
      `${p.playerName} ${formatPropType(p.propType)} ${p.selection.toUpperCase()}` === leg1
    );
    const idx2 = selectedProps.findIndex(p => 
      `${p.playerName} ${formatPropType(p.propType)} ${p.selection.toUpperCase()}` === leg2
    );
    if (idx1 >= 0 && idx2 >= 0) {
      matrix[idx1][idx2] = correlation;
      matrix[idx2][idx1] = correlation;
    }
  });

  const getCorrelationColor = (value: number) => {
    if (value >= 0.6) return 'bg-green-500/80';
    if (value >= 0.3) return 'bg-green-400/60';
    if (value >= 0.1) return 'bg-yellow-400/50';
    if (value >= -0.1) return 'bg-muted/40';
    if (value >= -0.3) return 'bg-orange-400/60';
    return 'bg-red-500/70';
  };

  const getTextColor = (value: number) => {
    if (Math.abs(value) >= 0.3) return 'text-white';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Correlation Matrix</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" /> +High
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded" /> Neutral
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" /> -High
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${n}, 60px)` }}>
            <div />
            {selectedProps.map((prop, i) => (
              <div key={`header-${i}`} className="text-xs text-center truncate px-1" title={prop.playerName}>
                {prop.playerName.split(' ').pop()}
              </div>
            ))}
            
            {selectedProps.map((rowProp, i) => (
              <>
                <div key={`row-${i}`} className="text-xs truncate pr-2 flex items-center" title={rowProp.playerName}>
                  {rowProp.playerName.split(' ').pop()}
                </div>
                {selectedProps.map((_, j) => (
                  <Tooltip key={`cell-${i}-${j}`}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "w-14 h-10 rounded flex items-center justify-center text-xs font-mono cursor-help transition-all hover:scale-105",
                          getCorrelationColor(matrix[i][j]),
                          getTextColor(matrix[i][j])
                        )}
                      >
                        {matrix[i][j].toFixed(2)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {rowProp.playerName} {formatPropType(rowProp.propType)} ↔ {selectedProps[j].playerName} {formatPropType(selectedProps[j].propType)}
                      </p>
                      <p className="text-xs font-mono mt-1">Correlation: {(matrix[i][j] * 100).toFixed(1)}%</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>

      {correlations.sgm_adjustment > 1.1 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-2 bg-yellow-400/10 rounded-lg border border-yellow-400/20"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <span className="text-xs text-yellow-400">
            High correlation detected ({((correlations.sgm_adjustment - 1) * 100).toFixed(0)}% adjustment). Consider diversifying selections.
          </span>
        </motion.div>
      )}
    </div>
  );
}

function KellyRecommendations({ kelly, stake }: { kelly: KellyResult | null; stake: number }) {
  if (!kelly) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-neon-violet" />
        <span className="font-display text-sm tracking-wide">Kelly Staking</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-lg p-3 text-center border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Quarter</div>
          <div className="font-mono text-sm text-green-400">{formatCurrency(kelly.quarter_kelly)}</div>
        </div>
        <div className={cn(
          "glass rounded-lg p-3 text-center border",
          kelly.recommended_fraction === 'half' ? "border-primary/50 bg-primary/5" : "border-border/30"
        )}>
          <div className="text-xs text-muted-foreground mb-1">Half</div>
          <div className="font-mono text-sm text-yellow-400">{formatCurrency(kelly.half_kelly)}</div>
        </div>
        <div className={cn(
          "glass rounded-lg p-3 text-center border",
          kelly.recommended_fraction === 'full' ? "border-primary/50 bg-primary/5" : "border-border/30"
        )}>
          <div className="text-xs text-muted-foreground mb-1">Full</div>
          <div className="font-mono text-sm text-red-400">{formatCurrency(kelly.full_kelly)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Edge</span>
        <span className={cn("font-mono", kelly.edge > 0 ? "text-green-400" : "text-red-400")}>
          {kelly.edge_percent}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Expected ROI</span>
        <span className={cn("font-mono", kelly.roi_expected > 0 ? "text-green-400" : "text-red-400")}>
          {kelly.roi_expected.toFixed(1)}%
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Recommended</span>
        <Badge variant={kelly.is_approved ? "default" : "destructive"} className="text-xs">
          {kelly.recommended_fraction.toUpperCase()}
        </Badge>
      </div>

      {!kelly.is_approved && kelly.rejection_reason && (
        <div className="text-xs text-red-400 bg-red-400/10 rounded-lg p-2">
          {kelly.rejection_reason}
        </div>
      )}
    </div>
  );
}

export default function SGMBuilder() {
  const { reduceMotion } = useSettings();
  const { addSelection } = useBetSlip();
  const { data: gameFuturesData = [], isLoading: gamesLoading } = useGameFutures();
  const { data: teamsData = [], isLoading: teamsLoading } = useTeams();
  const gameFutures = gameFuturesData.map(game => enrichGameFuture(game, teamsData));
  
  const [selectedGameId, setSelectedGameId] = useState<string>(gameFutures[0]?.id || 'g1');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProps, setSelectedProps] = useState<SelectedProp[]>([]);
  const [stake, setStake] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playerProps = [], isLoading: propsLoading } = usePlayerProps(selectedGameId);
  const correlationMutation = useCorrelationAnalysis();
  const kellyMutation = useSGMKelly();

  const [correlationResult, setCorrelationResult] = useState<CorrelationResult | null>(null);
  const [kellyResult, setKellyResult] = useState<KellyResult | null>(null);

  const selectedGame = gameFutures.find(g => g.id === selectedGameId) || gameFutures[0];

  useEffect(() => {
    if (selectedProps.length >= 2) {
      const legs: CorrelationLeg[] = selectedProps.map(prop => ({
        id: prop.id,
        description: `${prop.playerName} ${formatPropType(prop.propType)} ${prop.selection.toUpperCase()}`,
        player_id: prop.playerId,
        team: prop.teamAbbreviation,
        stat_type: prop.propType,
        odds: prop.odds,
      }));

      correlationMutation.mutate(legs, {
        onSuccess: (result) => setCorrelationResult(result),
        onError: () => setCorrelationResult(null),
      });
    } else {
      setCorrelationResult(null);
    }
  }, [selectedProps]);

  useEffect(() => {
    if (selectedProps.length >= 1) {
      const totalDecimalOdds = calculateTotalDecimalOdds();
      const impliedProb = 1 / totalDecimalOdds;
      const trueProb = impliedProb * (correlationResult?.fair_odds_multiplier || 1.05);

      kellyMutation.mutate({
        true_probability: Math.min(0.9, trueProb),
        decimal_odds: totalDecimalOdds,
        confidence: 0.7,
      }, {
        onSuccess: (result) => setKellyResult(result),
        onError: () => setKellyResult(null),
      });
    } else {
      setKellyResult(null);
    }
  }, [selectedProps, correlationResult]);

  const filteredProps = useMemo(() => {
    let props = playerProps;
    
    if (selectedCategory !== 'all') {
      props = props.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      props = props.filter(p => 
        p.playerName.toLowerCase().includes(query) ||
        p.teamAbbreviation.toLowerCase().includes(query) ||
        p.propType.toLowerCase().includes(query)
      );
    }
    
    return props;
  }, [playerProps, selectedCategory, searchQuery]);

  const groupedProps = useMemo(() => {
    const groups: Record<string, typeof filteredProps> = {};
    filteredProps.forEach(prop => {
      const key = `${prop.playerId}-${prop.propType}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(prop);
    });
    return Object.values(groups);
  }, [filteredProps]);

  const toggleProp = (prop: typeof playerProps[0], selection: 'over' | 'under') => {
    const propId = `${prop.id}-${selection}`;
    const odds = selection === 'over' ? prop.overOdds : prop.underOdds;
    
    const exists = selectedProps.find(p => p.id === propId);
    if (exists) {
      setSelectedProps(prev => prev.filter(p => p.id !== propId));
    } else {
      const samePropOther = selectedProps.find(p => 
        p.playerId === prop.playerId && 
        p.propType === prop.propType
      );
      if (samePropOther) {
        setSelectedProps(prev => prev.filter(p => 
          !(p.playerId === prop.playerId && p.propType === prop.propType)
        ));
      }
      
      setSelectedProps(prev => [...prev, {
        id: propId,
        playerId: prop.playerId,
        playerName: prop.playerName,
        teamAbbreviation: prop.teamAbbreviation,
        position: prop.position,
        propType: prop.propType,
        line: prop.line,
        selection,
        odds,
        category: prop.category,
      }]);
    }
  };

  const calculateTotalDecimalOdds = () => {
    if (selectedProps.length === 0) return 1;
    const americanOdds = selectedProps.map(p => p.odds);
    return calculateParlayDecimalOdds(americanOdds);
  };

  const addToBetslip = () => {
    selectedProps.forEach(prop => {
      addSelection({
        id: prop.id,
        gameId: parseInt(selectedGameId) || 1,
        type: 'prop',
        selection: `${prop.playerName} ${formatPropType(prop.propType)} ${prop.selection.toUpperCase()} ${prop.line}`,
        odds: prop.odds,
        team: prop.teamAbbreviation,
        line: prop.line,
      });
    });
  };

  const totalOdds = calculateTotalDecimalOdds();
  const potentialPayout = stake * totalOdds;

  if (gamesLoading || teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading SGM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <h1 className="font-display text-2xl md:text-3xl tracking-wider text-glow-cyan mb-1">
            SGM BUILDER
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Build correlated same-game parlays with AI-powered analysis
          </p>
        </motion.div>

        <div className="glass rounded-xl p-3 border border-border/50">
          <div className="text-xs text-muted-foreground mb-2">Select Game</div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {gameFutures.map(game => (
              <button
                key={game.id}
                onClick={() => {
                  setSelectedGameId(game.id);
                  setSelectedProps([]);
                }}
                className={cn(
                  "px-3 py-2 rounded-lg font-display text-sm whitespace-nowrap transition-all touch-manipulation",
                  selectedGameId === game.id
                    ? "bg-primary/20 text-primary box-glow-cyan"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 active:bg-muted/70"
                )}
                data-testid={`sgm-game-${game.id}`}
              >
                {game.awayTeam?.abbreviation || 'AWAY'} @ {game.homeTeam?.abbreviation || 'HOME'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-xl p-4 border border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neon-cyan" />
                  <span className="font-display tracking-wide">Player Props</span>
                  {propsLoading && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="md:w-48 h-8 text-sm"
                  data-testid="input-search-props"
                />
              </div>

              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1 bg-muted/30">
                  {PROP_CATEGORIES.map(cat => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="flex-1 min-w-[60px] text-xs py-2 data-[state=active]:bg-primary/20"
                      data-testid={`tab-${cat.id}`}
                    >
                      <cat.icon className="w-3 h-3 mr-1 hidden sm:inline" />
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto scrollbar-thin">
                  {groupedProps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No props available for this category
                    </div>
                  ) : (
                    groupedProps.map((props, groupIdx) => {
                      const prop = props[0];
                      const isOverSelected = selectedProps.some(p => p.id === `${prop.id}-over`);
                      const isUnderSelected = selectedProps.some(p => p.id === `${prop.id}-under`);
                      
                      return (
                        <motion.div
                          key={`group-${groupIdx}`}
                          initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: groupIdx * 0.02 }}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-all"
                          data-testid={`prop-row-${prop.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs shrink-0">
                                {prop.teamAbbreviation}
                              </Badge>
                              <span className="font-medium text-sm truncate">{prop.playerName}</span>
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {prop.position}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatPropType(prop.propType)} <span className="font-mono">{prop.line}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleProp(prop, 'over')}
                              className={cn(
                                "flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-mono transition-all touch-manipulation",
                                isOverSelected
                                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 active:bg-muted/70 border border-transparent"
                              )}
                              data-testid={`btn-over-${prop.id}`}
                            >
                              <ChevronUp className="w-4 h-4" />
                              O {formatOdds(prop.overOdds)}
                            </button>
                            <button
                              onClick={() => toggleProp(prop, 'under')}
                              className={cn(
                                "flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-mono transition-all touch-manipulation",
                                isUnderSelected
                                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 active:bg-muted/70 border border-transparent"
                              )}
                              data-testid={`btn-under-${prop.id}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                              U {formatOdds(prop.underOdds)}
                            </button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2"
                                  onClick={() => toggleProp(prop, 'over')}
                                  data-testid={`btn-add-betslip-${prop.id}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add to Betslip</TooltipContent>
                            </Tooltip>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </Tabs>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div
              layout
              className="glass rounded-xl p-4 border border-border/50 sticky top-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-violet" />
                  <span className="font-display tracking-wide">Your Build</span>
                  {selectedProps.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedProps.length} leg{selectedProps.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {selectedProps.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProps([])}
                    className="text-xs text-muted-foreground"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              <AnimatePresence mode="popLayout">
                {selectedProps.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 text-muted-foreground text-sm"
                  >
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Select props to build your SGM
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {selectedProps.map((prop, index) => (
                        <motion.div
                          key={prop.id}
                          initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg group"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium truncate block">
                              {prop.playerName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatPropType(prop.propType)} {prop.selection.toUpperCase()} {prop.line}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {formatDecimalOdds(americanToDecimal(prop.odds))}
                            </span>
                            <button
                              onClick={() => setSelectedProps(prev => prev.filter(p => p.id !== prop.id))}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="border-t border-border/50 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Combined Odds</span>
                        <span className="font-display text-xl text-glow-cyan">
                          {formatDecimalOdds(totalOdds)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={stake}
                          onChange={(e) => setStake(Number(e.target.value) || 0)}
                          className="w-24 h-8 text-sm font-mono"
                          data-testid="input-stake"
                        />
                        <span className="text-sm text-muted-foreground">→</span>
                        <span className="font-mono text-green-400">
                          {formatCurrency(potentialPayout)}
                        </span>
                      </div>

                      {correlationResult && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            Correlation Adj
                          </span>
                          <span className={cn(
                            "font-mono",
                            correlationResult.sgm_adjustment > 1.1 ? "text-yellow-400" : "text-green-400"
                          )}>
                            {((correlationResult.sgm_adjustment - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}

                      <Button 
                        className="w-full bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90"
                        onClick={addToBetslip}
                        data-testid="button-add-parlay"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Add Parlay to Betslip
                      </Button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            {selectedProps.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-neon-cyan" />
                  <span className="font-display text-sm tracking-wide">Correlation Analysis</span>
                  {correlationMutation.isPending && (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <CorrelationHeatmap 
                  correlations={correlationResult} 
                  selectedProps={selectedProps}
                />
              </motion.div>
            )}

            {selectedProps.length >= 1 && kellyResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 border border-border/50"
              >
                <KellyRecommendations kelly={kellyResult} stake={stake} />
              </motion.div>
            )}

            <div className="glass rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Correlation Guide</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Positive (+)</span>
                  <span className="text-muted-foreground">QB Pass + WR Rec = Boost</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Negative (-)</span>
                  <span className="text-muted-foreground">RB Rush + QB Pass = Risk</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400">Neutral (0)</span>
                  <span className="text-muted-foreground">Independent outcomes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
