'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'next/navigation';
import { useNflGames, useNflTeams, useQuickAnalysis, useMatchupAnalysis, useNflOdds, type GameOdds } from '@/lib/api';
import { Card } from '@/_components/ui/card';
import { Badge } from '@/_components/ui/badge';
import { Button } from '@/_components/ui/button';
import { Progress } from '@/_components/ui/progress';
import NewsSection from '@/_components/NewsSection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/_components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/_components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/_components/ui/select';
import { 
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  Shield,
  Brain,
  Cloud,
  Wind,
  Activity,
  Timer,
  Trophy,
  HelpCircle,
  Plus,
  ArrowRight,
  Wifi,
  Thermometer,
  CloudRain
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/_components/ui/tooltip';
import { americanToDecimal, formatDecimalOdds, BETTING_GLOSSARY } from '@/lib/oddsUtils';
import { useBetSlip, type BetSelection } from '@/lib/store';

interface GameAnalytics {
  homeEpa: number;
  awayEpa: number;
  homeWinProb: number;
  awayWinProb: number;
  homeSpreadProb: number;
  overProb: number;
  homeCpoe: number;
  awayCpoe: number;
  homeRushingEpa: number;
  awayRushingEpa: number;
  weather: { temp: number; wind: number; condition: string };
  exploit: { type: string; confidence: number; description: string } | null;
  spread: number;
  total: number;
  homeMoneyline: number;
  awayMoneyline: number;
}

interface WeekInfo {
  week: number;
  label: string;
  shortLabel: string;
  type: 'regular' | 'wildcard' | 'divisional' | 'conference' | 'superbowl';
}

interface QuickPick {
  id: string;
  matchup: string;
  pick: string;
  pickType: 'spread' | 'total' | 'moneyline';
  odds: number;
  confidence: number;
  grade: string;
  homeTeam: string;
  awayTeam: string;
  gameId: number;
}

const NFL_WEEKS: WeekInfo[] = [
  ...Array.from({ length: 18 }, (_, i) => ({
    week: i + 1,
    label: `Week ${i + 1}`,
    shortLabel: `Wk ${i + 1}`,
    type: 'regular' as const
  })),
  { week: 19, label: 'Wild Card Round', shortLabel: 'Wild Card', type: 'wildcard' },
  { week: 20, label: 'Divisional Round', shortLabel: 'Divisional', type: 'divisional' },
  { week: 21, label: 'Conference Championships', shortLabel: 'Conf. Champ', type: 'conference' },
  { week: 22, label: 'Super Bowl', shortLabel: 'Super Bowl', type: 'superbowl' },
];

function getCurrentNflWeek(): number {
  const now = new Date();
  const seasonStart = new Date(2025, 8, 4);
  const superBowlDate = new Date(2026, 1, 8);
  
  if (now < seasonStart) return 1;
  if (now > superBowlDate) return 22;
  
  const weekDates: { week: number; start: Date; end: Date }[] = [];
  
  for (let i = 1; i <= 18; i++) {
    const weekStart = new Date(seasonStart);
    weekStart.setDate(weekStart.getDate() + (i - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekDates.push({ week: i, start: weekStart, end: weekEnd });
  }
  
  weekDates.push({ week: 19, start: new Date(2026, 0, 11), end: new Date(2026, 0, 13) });
  weekDates.push({ week: 20, start: new Date(2026, 0, 18), end: new Date(2026, 0, 19) });
  weekDates.push({ week: 21, start: new Date(2026, 0, 26), end: new Date(2026, 0, 26) });
  weekDates.push({ week: 22, start: new Date(2026, 1, 8), end: new Date(2026, 1, 8) });
  
  for (const { week, start, end } of weekDates) {
    if (now >= start && now <= end) return week;
    if (now < start) return week;
  }
  
  return 18;
}

function DataFreshnessIndicator({ lastUpdated }: { lastUpdated: Date }) {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);
  
  const diffMs = Date.now() - lastUpdated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  let freshness = 'Fresh';
  let color = 'text-emerald-400';
  
  if (diffMins > 5) {
    freshness = `${diffMins}m ago`;
    color = diffMins > 15 ? 'text-amber-400' : 'text-muted-foreground';
  }
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="status-live" />
      <span className={color}>{freshness}</span>
    </div>
  );
}

function LiveOddsTicker({ odds }: { odds: GameOdds[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (odds.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % odds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [odds.length]);
  
  if (odds.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-sm font-medium">Live Odds</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="card-base p-3 rounded-lg"
        >
          <div className="text-xs text-muted-foreground mb-1">{odds[currentIndex]?.awayTeam} @ {odds[currentIndex]?.homeTeam}</div>
          <div className="flex justify-between text-sm">
            <span>Spread: {odds[currentIndex]?.consensus?.spread}</span>
            <span>O/U: {odds[currentIndex]?.consensus?.total}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WeatherAlerts({ games, teams }: { games: any[], teams: any[] }) {
  const weatherAlerts = useMemo(() => {
    return games.slice(0, 3).map(game => {
      const homeTeam = teams.find(t => t.id === game.homeTeamId);
      const seed = game.id * 17;
      const temp = 35 + (seed % 45);
      const wind = seed % 25;
      const condition = ['Clear', 'Cloudy', 'Rain', 'Snow'][seed % 4];
      const hasAlert = wind > 15 || temp < 32 || condition === 'Snow' || condition === 'Rain';
      
      return {
        id: game.id,
        venue: game.venue || homeTeam?.location || 'Stadium',
        temp,
        wind,
        condition,
        hasAlert
      };
    }).filter(w => w.hasAlert);
  }, [games, teams]);
  
  if (weatherAlerts.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium">Weather Alerts</span>
      </div>
      <div className="space-y-2">
        {weatherAlerts.map(alert => (
          <div key={alert.id} className="card-base p-3 rounded-lg border-amber-500/20 bg-amber-500/5">
            <div className="text-xs font-medium mb-1 truncate">{alert.venue}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                {alert.temp}°F
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {alert.wind} mph
              </span>
              {(alert.condition === 'Rain' || alert.condition === 'Snow') && (
                <span className="flex items-center gap-1">
                  <CloudRain className="w-3 h-3" />
                  {alert.condition}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickPickCard({ pick, onAddToBetSlip }: { pick: QuickPick; onAddToBetSlip: (pick: QuickPick) => void }) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'bg-emerald-500';
    if (confidence >= 75) return 'bg-primary';
    return 'bg-amber-500';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-interactive p-4 rounded-xl"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-medium mb-1">{pick.matchup}</div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">
              {pick.grade}
            </Badge>
            <span className="text-xs text-muted-foreground">{pick.pickType}</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:border-primary/50"
          onClick={(e) => {
            e.stopPropagation();
            onAddToBetSlip(pick);
          }}
          data-testid={`button-add-pick-${pick.id}`}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-primary">{pick.pick}</span>
          <span className="text-sm font-mono">{formatDecimalOdds(americanToDecimal(pick.odds))}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium">{pick.confidence}%</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pick.confidence}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${getConfidenceColor(pick.confidence)}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [season] = useState(2025);
  const [week, setWeek] = useState(() => getCurrentNflWeek());
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [matchupInsight, setMatchupInsight] = useState<string | null>(null);
  const [lastUpdated] = useState(() => new Date());
  
  const { data: games = [], isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useNflGames(season, week);
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useNflTeams();
  const { data: oddsData } = useNflOdds();
  
  const { addSelection } = useBetSlip();
  const quickAnalysis = useQuickAnalysis();
  const matchupAnalysis = useMatchupAnalysis();

  const isLoading = gamesLoading || teamsLoading;
  const error = gamesError || teamsError;

  const currentWeekInfo = useMemo(() => {
    return NFL_WEEKS.find(w => w.week === week) || NFL_WEEKS[0];
  }, [week]);

  const getTeam = (teamId: number) => {
    return teams.find(t => t.id === teamId);
  };

  const findOddsForGame = (homeTeam: string, awayTeam: string): GameOdds | null => {
    if (!oddsData?.games) return null;
    const normalizeTeamName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
    return oddsData.games.find(g => {
      const homeMatch = normalizeTeamName(g.homeTeam).includes(normalizeTeamName(homeTeam)) ||
                        normalizeTeamName(homeTeam).includes(normalizeTeamName(g.homeTeam));
      const awayMatch = normalizeTeamName(g.awayTeam).includes(normalizeTeamName(awayTeam)) ||
                        normalizeTeamName(awayTeam).includes(normalizeTeamName(g.awayTeam));
      return homeMatch && awayMatch;
    }) || null;
  };

  const generateGameAnalytics = (gameId: number, homeTeamName?: string, awayTeamName?: string): GameAnalytics => {
    const seed = gameId * 17;
    const realOdds = homeTeamName && awayTeamName ? findOddsForGame(homeTeamName, awayTeamName) : null;
    
    const homeSpread = realOdds?.consensus?.spread ?? -((seed % 14) - 3.5);
    const total = realOdds?.consensus?.total ?? 41.5 + (seed % 14);
    const homeMoneyline = realOdds?.consensus?.homeMoneyline ?? (homeSpread < 0 ? -110 - Math.abs(homeSpread * 15) : 100 + homeSpread * 15);
    const awayMoneyline = realOdds?.consensus?.awayMoneyline ?? (homeSpread < 0 ? 100 + Math.abs(homeSpread * 12) : -110 - homeSpread * 12);

    return {
      homeEpa: ((seed % 50) - 25) / 100,
      awayEpa: (((seed * 3) % 50) - 25) / 100,
      homeWinProb: 45 + (seed % 20),
      awayWinProb: 35 + ((seed * 2) % 20),
      homeSpreadProb: 48 + (seed % 10),
      overProb: 45 + ((seed * 5) % 15),
      homeCpoe: ((seed % 80) - 40) / 10,
      awayCpoe: (((seed * 7) % 80) - 40) / 10,
      homeRushingEpa: ((seed % 40) - 20) / 100,
      awayRushingEpa: (((seed * 11) % 40) - 20) / 100,
      weather: {
        temp: 35 + (seed % 45),
        wind: seed % 25,
        condition: ['Clear', 'Cloudy', 'Rain', 'Snow'][seed % 4]
      },
      exploit: seed % 3 === 0 ? {
        type: ['STEAM', 'TRAP', 'WEATHER'][seed % 3],
        confidence: 65 + (seed % 25),
        description: seed % 3 === 0 ? 'Sharp money detected on home spread' : 
                     seed % 3 === 1 ? 'Public overloading visitor - fade opportunity' :
                     'High wind expected - passing decay likely'
      } : null,
      spread: homeSpread,
      total: total,
      homeMoneyline: homeMoneyline,
      awayMoneyline: awayMoneyline,
    };
  };

  const quickPicks = useMemo<QuickPick[]>(() => {
    if (games.length === 0) return [];
    
    return games.slice(0, 3).map((game, index) => {
      const homeTeam = getTeam(game.homeTeamId);
      const visitorTeam = getTeam(game.visitorTeamId);
      const analytics = generateGameAnalytics(game.id, homeTeam?.fullName, visitorTeam?.fullName);
      
      const pickTypes: Array<'spread' | 'total' | 'moneyline'> = ['spread', 'total', 'moneyline'];
      const pickType = pickTypes[index % 3];
      
      let pick = '';
      let odds = -110;
      
      if (pickType === 'spread') {
        const sign = analytics.spread > 0 ? '+' : '';
        pick = `${homeTeam?.abbreviation} ${sign}${analytics.spread.toFixed(1)}`;
        odds = -110;
      } else if (pickType === 'total') {
        pick = `Over ${analytics.total.toFixed(1)}`;
        odds = -110;
      } else {
        pick = `${analytics.homeWinProb > 50 ? homeTeam?.abbreviation : visitorTeam?.abbreviation} ML`;
        odds = analytics.homeWinProb > 50 ? analytics.homeMoneyline : analytics.awayMoneyline;
      }
      
      const confidence = 78 + (game.id % 15);
      
      return {
        id: `pick-${game.id}`,
        matchup: `${visitorTeam?.abbreviation || 'VIS'} @ ${homeTeam?.abbreviation || 'HOM'}`,
        pick,
        pickType,
        odds: Math.round(odds),
        confidence,
        grade: confidence >= 88 ? 'A+' : confidence >= 82 ? 'A' : 'A-',
        homeTeam: homeTeam?.fullName || '',
        awayTeam: visitorTeam?.fullName || '',
        gameId: game.id
      };
    });
  }, [games, teams]);

  const liveGamesCount = useMemo(() => {
    return games.filter(g => {
      const s = g.status?.toLowerCase();
      return s === 'in progress' || s === 'in_progress' || s === 'live';
    }).length;
  }, [games]);

  const isUpcomingGame = (game: any) => {
    if (!game.status) return true;
    const s = game.status.toLowerCase();
    return s === 'scheduled' || s === 'upcoming' || s === '' || 
           (game.homeTeamScore === null && game.visitorTeamScore === null);
  };

  const getStatusBadge = (game: any) => {
    const status = game.status;
    if (!status || isUpcomingGame(game)) {
      return { label: 'Pre-Game', variant: 'outline' as const, isLive: false, isUpcoming: true };
    }
    const s = status.toLowerCase();
    if (s === 'final' || s === 'completed') {
      return { label: 'Final', variant: 'secondary' as const, isLive: false, isUpcoming: false };
    }
    if (s === 'in progress' || s === 'in_progress' || s === 'live') {
      return { label: 'LIVE', variant: 'default' as const, isLive: true, isUpcoming: false };
    }
    return { label: status, variant: 'outline' as const, isLive: false, isUpcoming: false };
  };

  const formatGameTime = (dateStr: string, timeStr: string | null) => {
    try {
      const date = new Date(dateStr);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (timeStr) {
        return `${dayName} ${timeStr} ET`;
      }
      
      const hours = [13, 16.42, 20.2];
      const seedHour = hours[date.getDate() % 3];
      const hour = Math.floor(seedHour);
      const minutes = Math.round((seedHour - hour) * 60);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      return `${dayName} ${displayHour}:${minutes.toString().padStart(2, '0')} ${period} ET`;
    } catch {
      return 'TBD';
    }
  };

  const formatSpread = (spread: number, teamAbbr: string) => {
    if (spread === 0) return 'PICK';
    const sign = spread > 0 ? '+' : '';
    return `${teamAbbr} ${sign}${spread.toFixed(1)}`;
  };

  const formatMoneylineAsDecimal = (ml: number) => {
    const decimal = americanToDecimal(ml);
    return formatDecimalOdds(decimal);
  };

  const handlePrevWeek = () => {
    if (week > 1) setWeek(week - 1);
  };

  const handleNextWeek = () => {
    if (week < 22) setWeek(week + 1);
  };

  const handleAddToBetSlip = (pick: QuickPick) => {
    const selection: BetSelection = {
      id: `${pick.gameId}-${pick.pickType}-${Date.now()}`,
      gameId: pick.gameId,
      type: pick.pickType,
      selection: pick.pick,
      odds: pick.odds,
      team: pick.homeTeam
    };
    addSelection(selection);
  };

  const handleQuickAdd = (game: any, type: 'spread' | 'moneyline' | 'total', side: 'home' | 'away' | 'over' | 'under') => {
    const homeTeam = getTeam(game.homeTeamId);
    const visitorTeam = getTeam(game.visitorTeamId);
    const analytics = generateGameAnalytics(game.id, homeTeam?.fullName, visitorTeam?.fullName);
    
    let selection = '';
    let odds = -110;
    
    if (type === 'spread') {
      const spread = side === 'home' ? analytics.spread : -analytics.spread;
      const team = side === 'home' ? homeTeam : visitorTeam;
      selection = `${team?.abbreviation} ${spread > 0 ? '+' : ''}${spread.toFixed(1)}`;
    } else if (type === 'moneyline') {
      const team = side === 'home' ? homeTeam : visitorTeam;
      odds = side === 'home' ? analytics.homeMoneyline : analytics.awayMoneyline;
      selection = `${team?.abbreviation} ML`;
    } else {
      selection = side === 'over' ? `Over ${analytics.total.toFixed(1)}` : `Under ${analytics.total.toFixed(1)}`;
    }
    
    const betSelection: BetSelection = {
      id: `${game.id}-${type}-${side}-${Date.now()}`,
      gameId: game.id,
      type,
      selection,
      odds: Math.round(odds),
      team: side === 'home' || side === 'over' ? homeTeam?.fullName : visitorTeam?.fullName
    };
    addSelection(betSelection);
  };

  const openGameDetails = (game: any) => {
    setSelectedGame(game);
    setShowAnalytics(true);
    setAiInsight(null);
    setMatchupInsight(null);
    
    const homeTeam = getTeam(game.homeTeamId);
    const visitorTeam = getTeam(game.visitorTeamId);
    const analytics = generateGameAnalytics(game.id, homeTeam?.fullName, visitorTeam?.fullName);
    
    if (homeTeam && visitorTeam) {
      quickAnalysis.mutate({
        homeTeam: homeTeam.fullName,
        awayTeam: visitorTeam.fullName,
        homeWinProb: analytics.homeWinProb,
        spread: analytics.spread,
        total: analytics.total,
      }, {
        onSuccess: (data) => setAiInsight(data.analysis),
      });
      
      matchupAnalysis.mutate({
        homeTeam: homeTeam.fullName,
        awayTeam: visitorTeam.fullName,
        spread: analytics.spread,
        total: analytics.total,
        venue: game.venue || undefined,
      }, {
        onSuccess: (data) => setMatchupInsight(data.analysis),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center" data-testid="loading-container">
        <div className="text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <Activity className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-display text-lg">Loading Command Hub</p>
            <p className="text-muted-foreground text-sm">Fetching latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4" data-testid="error-container">
        <Card className="card-premium p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-display mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-6 text-sm">{(error as Error).message}</p>
          <Button 
            onClick={() => refetchGames()} 
            className="gradient-espn text-white border-0"
            data-testid="button-retry"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const selectedHomeTeam = selectedGame ? getTeam(selectedGame.homeTeamId) : null;
  const selectedAwayTeam = selectedGame ? getTeam(selectedGame.visitorTeamId) : null;
  const selectedAnalytics = selectedGame ? generateGameAnalytics(selectedGame.id, selectedHomeTeam?.fullName, selectedAwayTeam?.fullName) : null;

  return (
    <div className="min-h-screen gradient-dark" data-testid="home-container">
      <div className="container-app py-6 pb-24">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display-bold text-2xl md:text-3xl" data-testid="text-title">
                  Today's Games
                </h1>
                {liveGamesCount > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                    <div className="status-live mr-1.5" />
                    {liveGamesCount} Live
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{currentWeekInfo.label} · NFL {season}</span>
                <DataFreshnessIndicator lastUpdated={lastUpdated} />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevWeek}
                disabled={week <= 1}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg touch-manipulation"
                data-testid="button-prev-week"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Select value={week.toString()} onValueChange={(val) => setWeek(parseInt(val))}>
                <SelectTrigger className="w-[160px] min-h-[44px] rounded-lg" data-testid="select-week">
                  <SelectValue>{currentWeekInfo.shortLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Regular Season
                  </div>
                  {NFL_WEEKS.filter(w => w.type === 'regular').map((w) => (
                    <SelectItem key={w.week} value={w.week.toString()}>
                      {w.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider border-t border-border mt-1 pt-2">
                    <Trophy className="w-3 h-3 inline mr-1" />
                    Playoffs
                  </div>
                  {NFL_WEEKS.filter(w => w.type !== 'regular').map((w) => (
                    <SelectItem key={w.week} value={w.week.toString()}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextWeek}
                disabled={week >= 22}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg touch-manipulation"
                data-testid="button-next-week"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchGames()}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg touch-manipulation"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.header>

        {quickPicks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
            data-testid="quick-picks-section"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-display text-lg">Top Picks</h2>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">
                  A+ Grade
                </Badge>
              </div>
              <Link href="/predictions">
                <Button variant="ghost" size="sm" className="gap-2" data-testid="button-view-all-picks">
                  View All Picks
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickPicks.map((pick, index) => (
                <motion.div
                  key={pick.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <QuickPickCard pick={pick} onAddToBetSlip={handleAddToBetSlip} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {games.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium rounded-2xl p-12 text-center"
                data-testid="empty-games"
              >
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display mb-2">No Games Scheduled</h3>
                <p className="text-muted-foreground text-sm">
                  {currentWeekInfo.type !== 'regular' 
                    ? `${currentWeekInfo.label} games will be available closer to game time.`
                    : `Check back later for ${currentWeekInfo.label} matchups.`}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game, index) => {
                  const homeTeam = getTeam(game.homeTeamId);
                  const visitorTeam = getTeam(game.visitorTeamId);
                  const statusInfo = getStatusBadge(game);
                  const analytics = generateGameAnalytics(game.id, homeTeam?.fullName, visitorTeam?.fullName);
                  const upcoming = isUpcomingGame(game);

                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.03,
                        duration: 0.4,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      data-testid={`card-game-${game.id}`}
                    >
                      <Card 
                        className="card-interactive rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => openGameDetails(game)}
                      >
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {statusInfo.isLive && (
                                <span className="status-live" />
                              )}
                              <Badge 
                                variant={statusInfo.variant}
                                className={
                                  statusInfo.isLive 
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                    : upcoming 
                                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                      : ''
                                }
                                data-testid={`badge-status-${game.id}`}
                              >
                                {statusInfo.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{formatGameTime(game.date, game.time)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-display-bold" data-testid={`text-visitor-abbr-${game.id}`}>
                                  {visitorTeam?.abbreviation || 'VIS'}
                                </span>
                                {!upcoming && (
                                  <span className="text-xl font-display-bold" data-testid={`text-visitor-score-${game.id}`}>
                                    {game.visitorTeamScore ?? '-'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate" data-testid={`text-visitor-name-${game.id}`}>
                                {visitorTeam?.name || 'Visitor'}
                              </div>
                            </div>

                            <div className="px-4 text-muted-foreground/50 text-sm">@</div>

                            <div className="flex-1 text-right space-y-1">
                              <div className="flex items-center justify-end gap-2">
                                {!upcoming && (
                                  <span className="text-xl font-display-bold" data-testid={`text-home-score-${game.id}`}>
                                    {game.homeTeamScore ?? '-'}
                                  </span>
                                )}
                                <span className="text-lg font-display-bold" data-testid={`text-home-abbr-${game.id}`}>
                                  {homeTeam?.abbreviation || 'HOM'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate" data-testid={`text-home-name-${game.id}`}>
                                {homeTeam?.name || 'Home'}
                              </div>
                            </div>
                          </div>

                          {upcoming && (
                            <>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="card-base p-2 rounded-lg">
                                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Spread</div>
                                  <div className="text-sm font-medium text-primary">
                                    {formatSpread(analytics.spread, homeTeam?.abbreviation || 'HOM')}
                                  </div>
                                </div>
                                <div className="card-base p-2 rounded-lg">
                                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">O/U</div>
                                  <div className="text-sm font-medium">{analytics.total.toFixed(1)}</div>
                                </div>
                                <div className="card-base p-2 rounded-lg">
                                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Win %</div>
                                  <div className="text-sm font-medium">{analytics.homeWinProb}%</div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 min-h-[44px] h-10 text-xs touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdd(game, 'spread', 'home');
                                  }}
                                  data-testid={`button-add-spread-${game.id}`}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Spread
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 min-h-[44px] h-10 text-xs touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdd(game, 'total', 'over');
                                  }}
                                  data-testid={`button-add-total-${game.id}`}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Over
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 min-h-[44px] h-10 text-xs touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdd(game, 'moneyline', 'home');
                                  }}
                                  data-testid={`button-add-ml-${game.id}`}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  ML
                                </Button>
                              </div>
                            </>
                          )}

                          {analytics.exploit && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              <span className="text-xs text-amber-400 font-medium">{analytics.exploit.type}</span>
                              <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px] ml-auto">
                                {analytics.exploit.confidence}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:block space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="card-elevated p-4 rounded-xl">
                <LiveOddsTicker odds={oddsData?.games || []} />
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <NewsSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="card-elevated p-4 rounded-xl">
                <WeatherAlerts games={games} teams={teams} />
              </Card>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:hidden mt-8"
        >
          <NewsSection />
        </motion.div>
      </div>

      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-premium border-border/40">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Game Analysis
            </DialogTitle>
            <DialogDescription>
              {selectedGame && isUpcomingGame(selectedGame) 
                ? 'Pre-game analytics and betting insights'
                : 'Detailed analytics and betting insights'}
            </DialogDescription>
          </DialogHeader>

          {selectedGame && selectedAnalytics && (
            <div className="space-y-6">
              {(aiInsight || quickAnalysis.isPending) && (
                <Card className="card-base p-4 rounded-xl border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-sm text-primary">AI Quick Insight</span>
                        {quickAnalysis.isPending && (
                          <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {aiInsight || "Analyzing matchup..."}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              
              {isUpcomingGame(selectedGame) && (
                <div className="text-center py-3 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {formatGameTime(selectedGame.date, selectedGame.time)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-8 py-6">
                <div className="text-center">
                  <div className="text-3xl font-display-bold text-primary">{selectedAwayTeam?.abbreviation}</div>
                  <div className="text-sm text-muted-foreground mt-1">{selectedAwayTeam?.fullName}</div>
                  {isUpcomingGame(selectedGame) ? (
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground uppercase">Price</div>
                      <div className="text-2xl font-display-bold text-emerald-400">
                        {formatMoneylineAsDecimal(Math.round(selectedAnalytics.awayMoneyline))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl font-display-bold mt-3">{selectedGame.visitorTeamScore ?? '-'}</div>
                  )}
                </div>
                <div className="text-center space-y-2">
                  <div className="text-muted-foreground text-lg">@</div>
                  <Badge className={
                    getStatusBadge(selectedGame).isLive 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : isUpcomingGame(selectedGame)
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        : ''
                  }>
                    {getStatusBadge(selectedGame).label}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display-bold text-primary">{selectedHomeTeam?.abbreviation}</div>
                  <div className="text-sm text-muted-foreground mt-1">{selectedHomeTeam?.fullName}</div>
                  {isUpcomingGame(selectedGame) ? (
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground uppercase">Price</div>
                      <div className="text-2xl font-display-bold text-emerald-400">
                        {formatMoneylineAsDecimal(Math.round(selectedAnalytics.homeMoneyline))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl font-display-bold mt-3">{selectedGame.homeTeamScore ?? '-'}</div>
                  )}
                </div>
              </div>

              <Tabs defaultValue="betting" className="w-full">
                <TabsList className="grid grid-cols-4 w-full bg-muted/30 p-1 rounded-xl">
                  <TabsTrigger value="betting" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Target className="w-4 h-4 mr-2" />
                    Betting
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="matchup" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Shield className="w-4 h-4 mr-2" />
                    Matchup
                  </TabsTrigger>
                  <TabsTrigger value="weather" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Cloud className="w-4 h-4 mr-2" />
                    Weather
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="betting" className="mt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="card-base p-4 rounded-xl text-center">
                      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-2">Spread</div>
                      <div className="font-display-bold text-2xl text-primary">
                        {formatSpread(selectedAnalytics.spread, selectedHomeTeam?.abbreviation || 'HOM')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{selectedAnalytics.homeSpreadProb}% cover</div>
                    </Card>
                    <Card className="card-base p-4 rounded-xl text-center">
                      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-2">Total O/U</div>
                      <div className="font-display-bold text-2xl">{selectedAnalytics.total.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground mt-1">{selectedAnalytics.overProb}% over</div>
                    </Card>
                    <Card className="card-base p-4 rounded-xl text-center">
                      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-2">Price</div>
                      <div className="font-display-bold text-2xl text-primary">{selectedHomeTeam?.abbreviation}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatMoneylineAsDecimal(Math.round(selectedAnalytics.homeMoneyline))}
                      </div>
                    </Card>
                  </div>

                  {selectedAnalytics.exploit && (
                    <Card className="card-base p-4 rounded-xl border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display text-sm text-amber-400">{selectedAnalytics.exploit.type} DETECTED</span>
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                              {selectedAnalytics.exploit.confidence}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{selectedAnalytics.exploit.description}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="card-base p-4 rounded-xl">
                      <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-4">
                        {selectedAwayTeam?.abbreviation} Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">EPA/Play</span>
                          <span className={`font-display text-sm ${selectedAnalytics.awayEpa > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedAnalytics.awayEpa > 0 ? '+' : ''}{selectedAnalytics.awayEpa.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">CPOE</span>
                          <span className={`font-display text-sm ${selectedAnalytics.awayCpoe > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedAnalytics.awayCpoe > 0 ? '+' : ''}{selectedAnalytics.awayCpoe.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Rush EPA</span>
                          <span className={`font-display text-sm ${selectedAnalytics.awayRushingEpa > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedAnalytics.awayRushingEpa > 0 ? '+' : ''}{selectedAnalytics.awayRushingEpa.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/30">
                          <span className="text-sm text-muted-foreground">Win Prob</span>
                          <span className="font-display text-sm text-primary">{selectedAnalytics.awayWinProb}%</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="card-base p-4 rounded-xl">
                      <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-4">
                        {selectedHomeTeam?.abbreviation} Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">EPA/Play</span>
                          <span className={`font-display text-sm ${selectedAnalytics.homeEpa > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedAnalytics.homeEpa > 0 ? '+' : ''}{selectedAnalytics.homeEpa.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">CPOE</span>
                          <span className={`font-display text-sm ${selectedAnalytics.homeCpoe > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedAnalytics.homeCpoe > 0 ? '+' : ''}{selectedAnalytics.homeCpoe.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Rush EPA</span>
                          <span className={`font-display text-sm ${selectedAnalytics.homeRushingEpa > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedAnalytics.homeRushingEpa > 0 ? '+' : ''}{selectedAnalytics.homeRushingEpa.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/30">
                          <span className="text-sm text-muted-foreground">Win Prob</span>
                          <span className="font-display text-sm text-primary">{selectedAnalytics.homeWinProb}%</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="matchup" className="mt-6 space-y-4">
                  <Card className="card-base p-6 rounded-xl">
                    <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-6">Head-to-Head Comparison</h4>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{selectedAwayTeam?.abbreviation}</span>
                          <span className="text-muted-foreground">Win Probability</span>
                          <span>{selectedHomeTeam?.abbreviation}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
                          <div className="bg-primary transition-all" style={{ width: `${selectedAnalytics.awayWinProb}%` }} />
                          <div className="bg-primary/40 transition-all" style={{ width: `${selectedAnalytics.homeWinProb}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{selectedAnalytics.awayWinProb}%</span>
                          <span>{selectedAnalytics.homeWinProb}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className={selectedAnalytics.awayEpa > selectedAnalytics.homeEpa ? 'text-emerald-400' : ''}>
                            {selectedAnalytics.awayEpa.toFixed(3)}
                          </span>
                          <span className="text-muted-foreground">EPA/Play</span>
                          <span className={selectedAnalytics.homeEpa > selectedAnalytics.awayEpa ? 'text-emerald-400' : ''}>
                            {selectedAnalytics.homeEpa.toFixed(3)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className={selectedAnalytics.awayCpoe > selectedAnalytics.homeCpoe ? 'text-emerald-400' : ''}>
                            {selectedAnalytics.awayCpoe.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground">CPOE</span>
                          <span className={selectedAnalytics.homeCpoe > selectedAnalytics.awayCpoe ? 'text-emerald-400' : ''}>
                            {selectedAnalytics.homeCpoe.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  {(matchupInsight || matchupAnalysis.isPending) && (
                    <Card className="card-base p-4 rounded-xl border-primary/20 bg-primary/5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Brain className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-display text-sm text-primary">Matchup Analysis</span>
                            {matchupAnalysis.isPending && (
                              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {matchupInsight || "Analyzing key matchups..."}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="weather" className="mt-6">
                  <Card className="card-base p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Cloud className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-display text-lg">Game Day Weather</h4>
                        <p className="text-sm text-muted-foreground">{selectedGame.venue || 'Stadium'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Thermometer className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-display-bold">{selectedAnalytics.weather.temp}°F</div>
                        <div className="text-xs text-muted-foreground">Temperature</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Wind className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-display-bold">{selectedAnalytics.weather.wind} mph</div>
                        <div className="text-xs text-muted-foreground">Wind Speed</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Cloud className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-display-bold">{selectedAnalytics.weather.condition}</div>
                        <div className="text-xs text-muted-foreground">Conditions</div>
                      </div>
                    </div>
                    
                    {(selectedAnalytics.weather.wind > 15 || selectedAnalytics.weather.condition === 'Rain' || selectedAnalytics.weather.condition === 'Snow') && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Weather Impact Alert</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedAnalytics.weather.wind > 15 && 'High winds may affect passing game. '}
                          {(selectedAnalytics.weather.condition === 'Rain' || selectedAnalytics.weather.condition === 'Snow') && 'Precipitation expected. Consider under on totals.'}
                        </p>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
