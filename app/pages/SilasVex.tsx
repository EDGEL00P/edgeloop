'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/_components/ui/card';
import { Badge } from '@/_components/ui/badge';
import { Progress } from '@/_components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Brain,
  Clock,
  Activity,
  Target,
  Skull,
  Lock,
  Zap,
} from 'lucide-react';

type LiabilityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type LimitStatus = 'Normal' | 'Reduced' | 'Limited' | 'Banned Risk';

interface Sportsbook {
  id: string;
  name: string;
  liabilityLevel: LiabilityLevel;
  limitStatus: LimitStatus;
  sharpActionPercent: number;
  maxBetSize: string;
  responseTime: string;
}

interface LimitSignal {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  severity: 'warning' | 'danger' | 'critical';
  book: string;
}

interface MarketLine {
  id: string;
  game: string;
  consensus: string;
  books: { name: string; line: string; isOffMarket: boolean }[];
  clvOpportunity: boolean;
}

const SPORTSBOOKS: Sportsbook[] = [
  {
    id: 'draftkings',
    name: 'DraftKings',
    liabilityLevel: 'High',
    limitStatus: 'Reduced',
    sharpActionPercent: 78,
    maxBetSize: '$2,500',
    responseTime: '2.3s delay',
  },
  {
    id: 'fanduel',
    name: 'FanDuel',
    liabilityLevel: 'Medium',
    limitStatus: 'Normal',
    sharpActionPercent: 45,
    maxBetSize: '$10,000',
    responseTime: 'Instant',
  },
  {
    id: 'betmgm',
    name: 'BetMGM',
    liabilityLevel: 'Critical',
    limitStatus: 'Limited',
    sharpActionPercent: 89,
    maxBetSize: '$500',
    responseTime: '5.1s delay',
  },
  {
    id: 'caesars',
    name: 'Caesars',
    liabilityLevel: 'Medium',
    limitStatus: 'Reduced',
    sharpActionPercent: 52,
    maxBetSize: '$5,000',
    responseTime: '1.8s delay',
  },
  {
    id: 'pointsbet',
    name: 'PointsBet',
    liabilityLevel: 'Low',
    limitStatus: 'Normal',
    sharpActionPercent: 23,
    maxBetSize: '$25,000',
    responseTime: 'Instant',
  },
];

const LIMIT_SIGNALS: LimitSignal[] = [
  {
    id: '1',
    type: 'Bet Size Cut',
    description: 'Max bet reduced from $5K to $500 on NFL spreads',
    timestamp: '2 min ago',
    severity: 'critical',
    book: 'BetMGM',
  },
  {
    id: '2',
    type: 'Delayed Acceptance',
    description: 'Consistent 3-5 second delays on all wagers',
    timestamp: '15 min ago',
    severity: 'danger',
    book: 'DraftKings',
  },
  {
    id: '3',
    type: 'Line Reduction',
    description: 'Offered lines 0.5 points worse than market',
    timestamp: '28 min ago',
    severity: 'warning',
    book: 'Caesars',
  },
  {
    id: '4',
    type: 'Account Review',
    description: 'Deposit limits applied, pending compliance check',
    timestamp: '1 hour ago',
    severity: 'danger',
    book: 'BetMGM',
  },
  {
    id: '5',
    type: 'Prop Restriction',
    description: 'Player props no longer available for your account',
    timestamp: '2 hours ago',
    severity: 'critical',
    book: 'DraftKings',
  },
  {
    id: '6',
    type: 'Alt Line Block',
    description: 'Alternate spreads/totals removed from offerings',
    timestamp: '3 hours ago',
    severity: 'warning',
    book: 'Caesars',
  },
  {
    id: '7',
    type: 'Bonus Void',
    description: 'Promotional offers no longer extended to account',
    timestamp: '5 hours ago',
    severity: 'warning',
    book: 'FanDuel',
  },
  {
    id: '8',
    type: 'Sharp Pool Flag',
    description: 'Account moved to sharp bettor pool - reduced limits incoming',
    timestamp: '6 hours ago',
    severity: 'danger',
    book: 'PointsBet',
  },
];

const MARKET_LINES: MarketLine[] = [
  {
    id: '1',
    game: 'KC Chiefs @ BAL Ravens',
    consensus: 'BAL -3.5',
    books: [
      { name: 'DraftKings', line: 'BAL -3.5', isOffMarket: false },
      { name: 'FanDuel', line: 'BAL -3', isOffMarket: true },
      { name: 'BetMGM', line: 'BAL -3.5', isOffMarket: false },
      { name: 'Caesars', line: 'BAL -4', isOffMarket: true },
    ],
    clvOpportunity: true,
  },
  {
    id: '2',
    game: 'SF 49ers @ DAL Cowboys',
    consensus: 'SF -2.5',
    books: [
      { name: 'DraftKings', line: 'SF -2.5', isOffMarket: false },
      { name: 'FanDuel', line: 'SF -2.5', isOffMarket: false },
      { name: 'BetMGM', line: 'SF -3', isOffMarket: true },
      { name: 'Caesars', line: 'SF -2.5', isOffMarket: false },
    ],
    clvOpportunity: true,
  },
  {
    id: '3',
    game: 'BUF Bills @ MIA Dolphins',
    consensus: 'BUF -1',
    books: [
      { name: 'DraftKings', line: 'BUF -1', isOffMarket: false },
      { name: 'FanDuel', line: 'BUF -1.5', isOffMarket: true },
      { name: 'BetMGM', line: 'BUF -1', isOffMarket: false },
      { name: 'Caesars', line: 'BUF -1', isOffMarket: false },
    ],
    clvOpportunity: false,
  },
];

const SILAS_INSIGHTS = [
  "The sportsbooks are nervous tonight. DraftKings has moved their NFL limits down 40% in the past week. They see something.",
  "Pattern detected: BetMGM's delay algorithms are triggering more frequently on prop markets. Sharp money is hitting hard.",
  "Interesting... Caesars just shifted their closing line methodology. They're trying to catch CLV hunters. Adapt accordingly.",
  "I've analyzed 10,000 limit events. The pattern is clear: accounts hitting >55% over 500 bets get flagged within 72 hours.",
  "The consensus line is a lie. FanDuel is 0.5 points off on 3 games tonight. Someone there knows something we don't.",
  "Market inefficiency detected. PointsBet's totals are lagging behind sharp movement by 12 minutes. Window closes soon.",
];

function getLiabilityColor(level: LiabilityLevel) {
  switch (level) {
    case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
}

function getLimitStatusColor(status: LimitStatus) {
  switch (status) {
    case 'Normal': return 'bg-green-500/20 text-green-400';
    case 'Reduced': return 'bg-yellow-500/20 text-yellow-400';
    case 'Limited': return 'bg-orange-500/20 text-orange-400';
    case 'Banned Risk': return 'bg-red-500/20 text-red-400';
  }
}

function getSeverityColor(severity: 'warning' | 'danger' | 'critical') {
  switch (severity) {
    case 'warning': return 'border-l-yellow-500 bg-yellow-500/5';
    case 'danger': return 'border-l-orange-500 bg-orange-500/5';
    case 'critical': return 'border-l-red-500 bg-red-500/5';
  }
}

function getSeverityIcon(severity: 'warning' | 'danger' | 'critical') {
  switch (severity) {
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case 'danger': return <Lock className="w-4 h-4 text-orange-400" />;
    case 'critical': return <Skull className="w-4 h-4 text-red-400" />;
  }
}

export default function SilasVex() {
  const { reduceMotion } = useSettings();
  const [currentInsight, setCurrentInsight] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % SILAS_INSIGHTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-background to-background pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center animate-pulse">
              <Eye className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight text-glow-red">
              SILAS VEX LIABILITY ROOM
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mb-3">
            Sportsbook pattern analysis & limit detection protocols
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-2xl mx-auto italic">
            Silas Vex is an AI that identifies when sportsbooks are nervous about liability exposure.
            The patterns are there. You just need to know where to look.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
          data-testid="silas-analysis"
        >
          <Card className="glass border-red-500/20 bg-gradient-to-r from-red-950/30 to-card overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-red-400" />
                <CardTitle className="text-red-400 font-display">SILAS VEX ANALYSIS</CardTitle>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400/70">LIVE</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                key={currentInsight}
                initial={reduceMotion ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative"
              >
                <div className="absolute -left-4 top-0 h-full w-1 bg-gradient-to-b from-red-500/50 to-transparent" />
                <p className="text-lg text-foreground/90 leading-relaxed font-mono pl-4">
                  "{SILAS_INSIGHTS[currentInsight]}"
                </p>
              </motion.div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-red-500/10">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Insight {currentInsight + 1} of {SILAS_INSIGHTS.length} • Auto-rotating
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
          data-testid="liability-dashboard"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display">Sportsbook Liability Dashboard</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPORTSBOOKS.map((book) => (
              <motion.div
                key={book.id}
                whileHover={reduceMotion ? {} : { scale: 1.02 }}
                data-testid={`sportsbook-card-${book.id}`}
              >
                <Card className="glass border-border/50 hover:border-red-500/30 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{book.name}</CardTitle>
                      <Badge className={cn('text-xs', getLiabilityColor(book.liabilityLevel))}>
                        {book.liabilityLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Limit Status</span>
                      <Badge variant="outline" className={getLimitStatusColor(book.limitStatus)}>
                        {book.limitStatus}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sharp Action</span>
                        <span className={cn(
                          'font-mono font-bold',
                          book.sharpActionPercent >= 70 ? 'text-red-400' : 
                          book.sharpActionPercent >= 40 ? 'text-yellow-400' : 'text-green-400'
                        )}>
                          {book.sharpActionPercent}%
                        </span>
                      </div>
                      <Progress 
                        value={book.sharpActionPercent} 
                        className="h-1.5 bg-muted"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="bg-muted/50 rounded px-2 py-1.5">
                        <span className="text-muted-foreground block">Max Bet</span>
                        <span className="font-mono font-bold">{book.maxBetSize}</span>
                      </div>
                      <div className="bg-muted/50 rounded px-2 py-1.5">
                        <span className="text-muted-foreground block">Response</span>
                        <span className={cn(
                          'font-mono font-bold',
                          book.responseTime !== 'Instant' && 'text-yellow-400'
                        )}>
                          {book.responseTime}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            data-testid="limit-signals-panel"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-display">Limit Detection Signals</h2>
            </div>
            
            <Card className="glass border-border/50">
              <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {LIMIT_SIGNALS.map((signal) => (
                  <motion.div
                    key={signal.id}
                    whileHover={reduceMotion ? {} : { x: 4 }}
                    className={cn(
                      'p-3 rounded-lg border-l-4',
                      getSeverityColor(signal.severity)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(signal.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{signal.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {signal.book}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {signal.description}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/70">
                          <Clock className="w-3 h-3" />
                          {signal.timestamp}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            data-testid="market-consensus"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-display">Market Consensus</h2>
              <Badge className="bg-green-500/20 text-green-400 text-xs ml-auto">
                CLV SCANNER
              </Badge>
            </div>
            
            <Card className="glass border-border/50">
              <CardContent className="p-4 space-y-4">
                {MARKET_LINES.map((line) => (
                  <div
                    key={line.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      line.clvOpportunity 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-border/50 bg-muted/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold">{line.game}</span>
                      {line.clvOpportunity && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          CLV OPP
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <span className="text-muted-foreground">Consensus:</span>
                      <span className="font-mono font-bold text-primary">{line.consensus}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {line.books.map((book) => (
                        <div
                          key={book.name}
                          className={cn(
                            'px-2 py-1.5 rounded text-xs flex items-center justify-between',
                            book.isOffMarket 
                              ? 'bg-yellow-500/10 border border-yellow-500/30' 
                              : 'bg-muted/50'
                          )}
                        >
                          <span className="text-muted-foreground truncate">{book.name}</span>
                          <span className={cn(
                            'font-mono font-bold',
                            book.isOffMarket && 'text-yellow-400'
                          )}>
                            {book.line}
                            {book.isOffMarket && (
                              <TrendingDown className="w-3 h-3 inline ml-1" />
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
            <Eye className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400/80 font-mono">
              SILAS VEX MONITORING • ALL SYSTEMS OPERATIONAL
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
