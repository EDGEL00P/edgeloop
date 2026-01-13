'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeeklyMetrics, useExploitSignals, useNflGames } from '@/lib/api';
import { useSettings } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/_components/ui/card';
import { Badge } from '@/_components/ui/badge';
import { Button } from '@/_components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/_components/ui/select';
import { Progress } from '@/_components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/_components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Wind,
  Zap,
  Target,
  Activity,
  Shield,
  Brain,
  Flame,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Sparkles,
  Radio,
  Eye,
} from 'lucide-react';

const WORKFLOW_CARDS = [
  {
    id: 'rating-reset',
    title: 'Rating Reset',
    day: 'Monday',
    description: 'Update EPA/Play and Success Rate rolling averages. Identify "Lucky" teams to fade.',
    icon: RefreshCw,
    color: 'text-espn-red',
    status: 'completed',
    detailedInstructions: [
      'Pull latest play-by-play data from NFL API',
      'Calculate 4-week rolling EPA/play averages',
      'Identify teams with EPA variance > 0.05 from expected',
      'Flag "Lucky" teams: actual wins > expected wins by 2+',
      'Update team power ratings in database',
    ],
    quickActions: ['Run EPA Update', 'Flag Lucky Teams', 'Export Report'],
  },
  {
    id: 'injury-pivot',
    title: 'Injury Pivot',
    day: 'Wednesday',
    description: 'Calculate Point-Drop Metric for O-Line clusters. 2+ linemen out = 2.5pt Under adjustment.',
    icon: AlertTriangle,
    color: 'text-espn-gold',
    status: 'pending',
    detailedInstructions: [
      'Scrape official injury reports (Wed release)',
      'Calculate O-Line Point-Drop Metric per team',
      'Apply 2.5pt Under adjustment for 2+ linemen out',
      'Update QB pressure vulnerability scores',
      'Cross-reference with weather data for passing games',
    ],
    quickActions: ['Fetch Injuries', 'Calculate PDM', 'Apply Adjustments'],
  },
  {
    id: 'steam-signal',
    title: 'Steam Signal',
    day: 'Friday',
    description: 'Compare opening lines to sharp prices. Key Number crossings on volume = Steam.',
    icon: TrendingUp,
    color: 'text-steam',
    status: 'pending',
    detailedInstructions: [
      'Capture opening lines from 5+ major books',
      'Monitor line movements hourly until Friday 6PM',
      'Flag moves crossing key numbers (3, 7, 10)',
      'Correlate with betting volume data',
      'Classify as Steam (sharp), Trap, or Neutral',
    ],
    quickActions: ['Sync Lines', 'Detect Steam', 'Alert Active'],
  },
  {
    id: 'weather-ref',
    title: 'Weather/Ref Edge Loop',
    day: 'Sunday AM',
    description: 'Check wind >15mph for Passing Decay. Identify high Home Holding ref crews.',
    icon: Wind,
    color: 'text-nfl-blue',
    status: 'pending',
    detailedInstructions: [
      'Pull Sunday forecast for all game locations',
      'Apply Passing Decay formula for wind >15mph',
      'Check referee crew assignments',
      'Calculate Home Holding Rate per crew',
      'Generate final game adjustments',
    ],
    quickActions: ['Weather Check', 'Ref Analysis', 'Final Picks'],
  },
];

const GODMODE_THRESHOLDS = {
  cpoe: { elite: 5.0, fade: -2.0 },
  hdPressure: { warning: 25, danger: 35 },
  redZoneEpa: { elite: 0.15, poor: -0.05 },
  vigFree: { threshold: 3 },
};

const MOCK_HISTORICAL_DATA = {
  cpoe: [
    { week: 14, value: 3.2 },
    { week: 15, value: 4.1 },
    { week: 16, value: 4.8 },
    { week: 17, value: 5.2 },
    { week: 18, value: 4.9 },
  ],
  'hd-pressure': [
    { week: 14, value: 28 },
    { week: 15, value: 31 },
    { week: 16, value: 29 },
    { week: 17, value: 33 },
    { week: 18, value: 35 },
  ],
  'redzone-epa': [
    { week: 14, value: 0.08 },
    { week: 15, value: 0.12 },
    { week: 16, value: 0.14 },
    { week: 17, value: 0.18 },
    { week: 18, value: 0.16 },
  ],
  'vig-free': [
    { week: 14, value: 2.1 },
    { week: 15, value: 2.8 },
    { week: 16, value: 3.2 },
    { week: 17, value: 3.5 },
    { week: 18, value: 3.8 },
  ],
};

const MOCK_TEAM_BREAKDOWN = {
  cpoe: [
    { team: 'KC', value: 8.2, godmode: true },
    { team: 'BUF', value: 6.1, godmode: true },
    { team: 'PHI', value: 5.5, godmode: true },
    { team: 'SF', value: 4.2, godmode: false },
    { team: 'DET', value: 3.8, godmode: false },
  ],
  'hd-pressure': [
    { team: 'CLE', value: 42, godmode: true },
    { team: 'PIT', value: 38, godmode: true },
    { team: 'DAL', value: 35, godmode: true },
    { team: 'MIA', value: 31, godmode: false },
    { team: 'NYJ', value: 28, godmode: false },
  ],
  'redzone-epa': [
    { team: 'DET', value: 0.28, godmode: true },
    { team: 'MIA', value: 0.22, godmode: true },
    { team: 'KC', value: 0.18, godmode: true },
    { team: 'SF', value: 0.15, godmode: false },
    { team: 'PHI', value: 0.12, godmode: false },
  ],
  'vig-free': [
    { team: 'KC', value: 5.2, godmode: true },
    { team: 'BAL', value: 4.8, godmode: true },
    { team: 'BUF', value: 4.1, godmode: true },
    { team: 'SF', value: 3.5, godmode: true },
    { team: 'DET', value: 3.2, godmode: true },
  ],
};

export default function WeeklyControl() {
  const { reduceMotion } = useSettings();
  const [season, setSeason] = useState('2025');
  const [week, setWeek] = useState('18');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  const { data: metrics = [], isLoading: metricsLoading } = useWeeklyMetrics(
    Number(season),
    Number(week)
  );
  const { data: signals = [], isLoading: signalsLoading } = useExploitSignals(
    Number(season),
    Number(week)
  );
  const { data: games = [], isLoading: gamesLoading } = useNflGames(
    Number(season),
    Number(week)
  );

  const isLoading = metricsLoading || signalsLoading || gamesLoading;

  const steamMoves = signals.filter((s) => s.signalType === 'steam');
  const trapLines = signals.filter((s) => s.signalType === 'trap');
  const weatherImpacts = signals.filter((s) => s.signalType === 'weather');

  const avgCpoe = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + Number(m.cpoe ?? 0), 0) / metrics.length
    : 0;
  const avgHdPressure = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + Number(m.hdPressureRate ?? 0), 0) / metrics.length
    : 0;
  const avgRedZoneEpa = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + Number(m.redZoneEpa ?? 0), 0) / metrics.length
    : 0;
  const avgVigFree = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + Number(m.vigFreePercent ?? 0), 0) / metrics.length
    : 0;

  const isGodmodeCpoe = avgCpoe >= GODMODE_THRESHOLDS.cpoe.elite;
  const isGodmodeRedZone = avgRedZoneEpa >= GODMODE_THRESHOLDS.redZoneEpa.elite;
  const isGodmodeVigFree = avgVigFree >= GODMODE_THRESHOLDS.vigFree.threshold;
  const isGodmodePressure = avgHdPressure >= GODMODE_THRESHOLDS.hdPressure.danger;

  const godmodeCount = [isGodmodeCpoe, isGodmodeRedZone, isGodmodeVigFree, isGodmodePressure].filter(Boolean).length;
  const systemHealth = godmodeCount >= 3 ? 'OPTIMAL' : godmodeCount >= 2 ? 'ACTIVE' : godmodeCount >= 1 ? 'MONITORING' : 'STANDBY';
  const healthColor = godmodeCount >= 3 ? 'text-godmode' : godmodeCount >= 2 ? 'text-steam' : godmodeCount >= 1 ? 'text-espn-gold' : 'text-muted-foreground';

  const omniMetrics = [
    {
      id: 'cpoe',
      label: 'CPOE',
      value: avgCpoe.toFixed(2),
      description: 'Completion % Over Expected',
      godmode: isGodmodeCpoe,
      threshold: `Elite: >${GODMODE_THRESHOLDS.cpoe.elite}, Fade: <${GODMODE_THRESHOLDS.cpoe.fade}`,
      progress: Math.min(100, Math.max(0, (avgCpoe + 10) * 5)),
      thresholdExplanation: 'CPOE measures quarterback accuracy beyond expected completion percentage. Values above 5.0 indicate elite precision; below -2.0 suggests regression candidates.',
    },
    {
      id: 'hd-pressure',
      label: 'H-D Pressure',
      value: `${avgHdPressure.toFixed(1)}%`,
      description: 'High-Danger Pressure Rate',
      godmode: isGodmodePressure,
      threshold: `Warning: >${GODMODE_THRESHOLDS.hdPressure.warning}%, Danger: >${GODMODE_THRESHOLDS.hdPressure.danger}%`,
      progress: avgHdPressure,
      thresholdExplanation: 'High-Danger Pressure Rate tracks pass rush efficiency. Above 35% correlates with 2.3x increase in QB sacks and a 15% decrease in completion rate.',
    },
    {
      id: 'redzone-epa',
      label: 'Red Zone EPA',
      value: avgRedZoneEpa.toFixed(3),
      description: 'Efficiency inside the 20',
      godmode: isGodmodeRedZone,
      threshold: `Elite: >${GODMODE_THRESHOLDS.redZoneEpa.elite}, Poor: <${GODMODE_THRESHOLDS.redZoneEpa.poor}`,
      progress: Math.min(100, Math.max(0, (avgRedZoneEpa + 0.5) * 100)),
      thresholdExplanation: 'Red Zone EPA measures scoring efficiency inside the 20. Elite teams convert red zone trips at 68%+ TD rate with positive expected points added per play.',
    },
    {
      id: 'vig-free',
      label: 'Vig-Free %',
      value: `${avgVigFree.toFixed(1)}%`,
      description: 'Edge over implied probability',
      godmode: isGodmodeVigFree,
      threshold: `Godmode: >${GODMODE_THRESHOLDS.vigFree.threshold}% over bookie odds`,
      progress: Math.min(100, avgVigFree * 10),
      thresholdExplanation: 'Vig-Free Edge represents our model\'s advantage after removing bookmaker margin. Above 3% indicates strong betting opportunities with +EV.',
    },
  ];

  const getSignalRecommendation = (signal: any) => {
    const conf = signal.confidence;
    if (conf >= 0.8) return { betSize: '3 Units', direction: 'STRONG', color: 'text-godmode' };
    if (conf >= 0.65) return { betSize: '2 Units', direction: 'MODERATE', color: 'text-steam' };
    return { betSize: '1 Unit', direction: 'LIGHT', color: 'text-espn-gold' };
  };

  return (
    <div className="min-h-screen p-4 pb-20 relative">
      <motion.div
        initial={reduceMotion ? {} : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="fixed top-20 right-4 z-50 floating-indicator"
        data-testid="omni-status-indicator"
      >
        <div className={cn(
          'glass-strong rounded-xl p-4 border border-border/50 min-w-[180px]',
          godmodeCount >= 2 && 'gradient-border-godmode glow-ring'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Radio className={cn('w-4 h-4 status-online', healthColor)} />
            <span className="text-xs font-display tracking-wider text-muted-foreground">OMNI STATUS</span>
          </div>
          <div className={cn('text-lg font-display tracking-wide', healthColor)}>
            {systemHealth}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all',
                  i <= godmodeCount ? 'bg-godmode' : 'bg-muted/30'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {godmodeCount}/4 Godmode Metrics
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8 text-espn-red" />
              <h1 className="font-display text-3xl tracking-wider text-glow-red" data-testid="page-title">
                OMNI-WEEKLY EXPLOIT ENGINE
              </h1>
              <Sparkles className="w-6 h-6 text-espn-gold animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-espn-red" />
              Extract maximum liquidity with the Edge Loop framework
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={season} onValueChange={setSeason} data-testid="select-season">
                <SelectTrigger className="w-24" data-testid="trigger-season">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025" data-testid="option-season-2025">2025</SelectItem>
                  <SelectItem value="2024" data-testid="option-season-2024">2024</SelectItem>
                  <SelectItem value="2023" data-testid="option-season-2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Select value={week} onValueChange={setWeek} data-testid="select-week">
                <SelectTrigger className="w-24" data-testid="trigger-week">
                  <SelectValue placeholder="Week" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                    <SelectItem key={w} value={String(w)} data-testid={`option-week-${w}`}>
                      Week {w}
                    </SelectItem>
                  ))}
                  <SelectItem value="19" data-testid="option-week-19">Wild Card</SelectItem>
                  <SelectItem value="20" data-testid="option-week-20">Divisional</SelectItem>
                  <SelectItem value="21" data-testid="option-week-21">Conference</SelectItem>
                  <SelectItem value="22" data-testid="option-week-22">Super Bowl</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <section data-testid="section-workflow">
          <h2 className="font-display text-xl tracking-wide mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-espn-red" />
            WEEKLY WORKFLOW
            <Badge variant="outline" className="ml-2 text-xs">Click to expand</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKFLOW_CARDS.map((card, index) => (
              <motion.div
                key={card.id}
                initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    'glass border-border/50 hover:border-espn-red/50 transition-all h-full cursor-pointer gradient-border-red',
                    expandedWorkflow === card.id && 'box-glow-red border-espn-red/70'
                  )}
                  onClick={() => setExpandedWorkflow(expandedWorkflow === card.id ? null : card.id)}
                  data-testid={`card-workflow-${card.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <card.icon className={cn('w-6 h-6', card.color)} />
                        {card.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-godmode" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs" data-testid={`badge-day-${card.id}`}>
                          {card.day}
                        </Badge>
                        {expandedWorkflow === card.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-display">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                    
                    <AnimatePresence>
                      {expandedWorkflow === card.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={card.status === 'completed' ? 'bg-godmode text-black' : 'bg-muted'}>
                              {card.status === 'completed' ? 'COMPLETED' : 'PENDING'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <p className="text-xs font-display tracking-wide text-muted-foreground">INSTRUCTIONS:</p>
                            <ul className="space-y-1">
                              {card.detailedInstructions.map((instruction, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="text-espn-red mt-0.5">•</span>
                                  {instruction}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {card.quickActions.map((action) => (
                              <Button
                                key={action}
                                size="sm"
                                variant="outline"
                                className="text-xs border-espn-red/30 hover:bg-espn-red/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Running: ${action}...`);
                                }}
                                data-testid={`button-action-${action.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <Zap className="w-3 h-3 mr-1" />
                                {action}
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section data-testid="section-omni-metrics">
          <h2 className="font-display text-xl tracking-wide mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-espn-red" />
            OMNI-METRIC DASHBOARD
            <Badge variant="outline" className="ml-2 text-xs">Click for details</Badge>
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="glass border-border/50 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted/30 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {omniMetrics.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedMetric(metric.id)}
                >
                  <Card
                    className={cn(
                      'glass border-border/50 transition-all h-full relative overflow-hidden cursor-pointer',
                      metric.godmode && 'gradient-border-godmode pulse-godmode',
                      !metric.godmode && 'hover:border-espn-red/50'
                    )}
                    data-testid={`card-metric-${metric.id}`}
                  >
                    {metric.godmode && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          className="bg-godmode text-black font-bold animate-pulse"
                          data-testid={`badge-godmode-${metric.id}`}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          GODMODE
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle
                        className={cn(
                          'text-sm font-display tracking-wide flex items-center gap-2',
                          metric.godmode && 'text-glow-godmode'
                        )}
                      >
                        {metric.label}
                        <Eye className="w-3 h-3 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={cn(
                          'text-3xl font-display mb-2',
                          metric.godmode ? 'text-godmode' : 'text-foreground'
                        )}
                        data-testid={`value-${metric.id}`}
                      >
                        {metric.value}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{metric.description}</p>
                      <Progress
                        value={metric.progress}
                        className={cn('h-2', metric.godmode && '[&>div]:bg-godmode')}
                      />
                      <p className="text-xs text-muted-foreground mt-2 opacity-70">{metric.threshold}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="glass-strong max-w-2xl border-espn-red/30">
            {selectedMetric && (() => {
              const metric = omniMetrics.find(m => m.id === selectedMetric);
              const historical = MOCK_HISTORICAL_DATA[selectedMetric as keyof typeof MOCK_HISTORICAL_DATA] || [];
              const teams = MOCK_TEAM_BREAKDOWN[selectedMetric as keyof typeof MOCK_TEAM_BREAKDOWN] || [];
              
              return metric ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 font-display text-xl">
                      <Brain className="w-6 h-6 text-espn-red" />
                      {metric.label} Analysis
                      {metric.godmode && (
                        <Badge className="bg-godmode text-black animate-pulse">
                          <Zap className="w-3 h-3 mr-1" />
                          GODMODE ACTIVE
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>{metric.description}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    <div className={cn(
                      'p-4 rounded-lg',
                      metric.godmode ? 'bg-godmode/10 border border-godmode/30' : 'bg-muted/20'
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Current Value</span>
                        <span className={cn('text-2xl font-display', metric.godmode && 'text-godmode text-glow-godmode')}>
                          {metric.value}
                        </span>
                      </div>
                      <Progress value={metric.progress} className={cn('h-3', metric.godmode && '[&>div]:bg-godmode')} />
                    </div>

                    <div>
                      <h4 className="font-display text-sm tracking-wide mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-espn-red" />
                        HISTORICAL TREND (Last 5 Weeks)
                      </h4>
                      <div className="flex items-end gap-2 h-20">
                        {historical.map((h, i) => (
                          <div key={h.week} className="flex-1 flex flex-col items-center">
                            <div
                              className={cn(
                                'w-full rounded-t transition-all',
                                i === historical.length - 1 ? 'bg-espn-red' : 'bg-muted'
                              )}
                              style={{ height: `${(h.value / Math.max(...historical.map(x => x.value))) * 60}px` }}
                            />
                            <span className="text-xs text-muted-foreground mt-1">W{h.week}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-display text-sm tracking-wide mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-espn-red" />
                        TOP 5 TEAMS
                      </h4>
                      <div className="space-y-2">
                        {teams.map((team, i) => (
                          <div key={team.team} className="flex items-center justify-between p-2 rounded bg-muted/20">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                              <span className="font-display">{team.team}</span>
                              {team.godmode && <Zap className="w-3 h-3 text-godmode" />}
                            </div>
                            <span className={cn('font-mono', team.godmode && 'text-godmode')}>
                              {typeof team.value === 'number' && team.value % 1 !== 0 ? team.value.toFixed(2) : team.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-espn-red/10 border border-espn-red/20">
                      <h4 className="font-display text-sm tracking-wide mb-2 text-espn-red">THRESHOLD EXPLANATION</h4>
                      <p className="text-sm text-muted-foreground">{metric.thresholdExplanation}</p>
                    </div>
                  </div>
                </>
              ) : null;
            })()}
          </DialogContent>
        </Dialog>

        <section data-testid="section-exploit-signals">
          <h2 className="font-display text-xl tracking-wide mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-espn-red" />
            EXPLOIT SIGNALS
            <Badge variant="outline" className="ml-2 text-xs">Click for analysis</Badge>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="glass border-border/50 gradient-border-steam" data-testid="card-steam-moves">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="w-5 h-5 text-steam steam-indicator" />
                  Steam Moves
                  <Badge variant="secondary" className="ml-auto" data-testid="count-steam">
                    {steamMoves.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {signalsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted/30 rounded" />
                    ))}
                  </div>
                ) : steamMoves.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No steam moves detected this week
                  </p>
                ) : (
                  steamMoves.map((signal) => (
                    <motion.div
                      key={signal.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSignal(signal)}
                      className="bg-muted/30 rounded-lg p-3 border-l-2 border-steam cursor-pointer hover:bg-muted/50 transition-all pulse-exploit"
                      data-testid={`signal-steam-${signal.id}`}
                    >
                      <p className="text-sm font-medium">{signal.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={signal.thresholdMet ? 'default' : 'outline'}
                          className={cn(signal.thresholdMet && 'bg-steam')}
                        >
                          {(signal.confidence * 100).toFixed(0)}% Conf
                        </Badge>
                        <span className="text-xs text-muted-foreground">{signal.status}</span>
                        <Eye className="w-3 h-3 text-muted-foreground ml-auto" />
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="glass border-border/50" data-testid="card-trap-lines">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-trap" />
                  Trap Lines
                  <Badge variant="secondary" className="ml-auto" data-testid="count-trap">
                    {trapLines.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {signalsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted/30 rounded" />
                    ))}
                  </div>
                ) : trapLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No trap lines identified this week
                  </p>
                ) : (
                  trapLines.map((signal) => (
                    <motion.div
                      key={signal.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSignal(signal)}
                      className="bg-muted/30 rounded-lg p-3 border-l-2 border-trap cursor-pointer hover:bg-muted/50 transition-all"
                      data-testid={`signal-trap-${signal.id}`}
                    >
                      <p className="text-sm font-medium">{signal.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={signal.thresholdMet ? 'default' : 'outline'}
                          className={cn(signal.thresholdMet && 'bg-trap text-black')}
                        >
                          {(signal.confidence * 100).toFixed(0)}% Conf
                        </Badge>
                        <span className="text-xs text-muted-foreground">{signal.status}</span>
                        <Eye className="w-3 h-3 text-muted-foreground ml-auto" />
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="glass border-border/50" data-testid="card-weather-impacts">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wind className="w-5 h-5 text-nfl-blue" />
                  Weather Impacts
                  <Badge variant="secondary" className="ml-auto" data-testid="count-weather">
                    {weatherImpacts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {signalsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted/30 rounded" />
                    ))}
                  </div>
                ) : weatherImpacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No weather impacts for this week
                  </p>
                ) : (
                  weatherImpacts.map((signal) => (
                    <motion.div
                      key={signal.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSignal(signal)}
                      className="bg-muted/30 rounded-lg p-3 border-l-2 border-nfl-blue cursor-pointer hover:bg-muted/50 transition-all"
                      data-testid={`signal-weather-${signal.id}`}
                    >
                      <p className="text-sm font-medium">{signal.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={signal.thresholdMet ? 'default' : 'outline'}
                          className={cn(signal.thresholdMet && 'bg-nfl-blue')}
                        >
                          {(signal.confidence * 100).toFixed(0)}% Conf
                        </Badge>
                        <span className="text-xs text-muted-foreground">{signal.status}</span>
                        <Eye className="w-3 h-3 text-muted-foreground ml-auto" />
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <Dialog open={!!selectedSignal} onOpenChange={() => setSelectedSignal(null)}>
          <DialogContent className="glass-strong max-w-lg border-espn-red/30">
            {selectedSignal && (() => {
              const rec = getSignalRecommendation(selectedSignal);
              const signalTypeColors: Record<string, string> = {
                steam: 'text-steam',
                trap: 'text-trap',
                weather: 'text-nfl-blue',
              };
              
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 font-display text-xl">
                      <Target className="w-6 h-6 text-espn-red" />
                      Signal Analysis
                      <Badge className={cn('ml-2', signalTypeColors[selectedSignal.signalType])}>
                        {selectedSignal.signalType.toUpperCase()}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>{selectedSignal.description}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    <div className="p-4 rounded-lg bg-muted/20">
                      <h4 className="font-display text-sm tracking-wide mb-3">CONFIDENCE VISUALIZATION</h4>
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="35"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-muted/30"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="35"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${selectedSignal.confidence * 220} 220`}
                              className={signalTypeColors[selectedSignal.signalType]}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-lg font-display">
                            {(selectedSignal.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Model confidence based on historical pattern matching and current market conditions.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-godmode/10 border border-godmode/30">
                      <h4 className="font-display text-sm tracking-wide mb-3 text-godmode flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        RECOMMENDED ACTION
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Bet Size</span>
                          <p className={cn('text-xl font-display', rec.color)}>{rec.betSize}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Direction</span>
                          <p className={cn('text-xl font-display flex items-center gap-2', rec.color)}>
                            {selectedSignal.signalType === 'trap' ? (
                              <>FADE <ArrowDown className="w-5 h-5" /></>
                            ) : (
                              <>FOLLOW <ArrowUp className="w-5 h-5" /></>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/20">
                      <h4 className="font-display text-sm tracking-wide mb-3">HISTORICAL ACCURACY</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Similar Signals (Season)</span>
                          <span className="font-mono">47 instances</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hit Rate</span>
                          <span className="font-mono text-godmode">68.1%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg ROI</span>
                          <span className="font-mono text-godmode">+7.2%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-espn-red hover:bg-espn-red/90"
                        onClick={() => alert('Signal added to Betting Portal!')}
                        data-testid="button-add-to-portal"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Add to Betting Portal
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-espn-red/30"
                        onClick={() => alert('Viewing detailed signal analysis...')}
                        data-testid="button-view-signal"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6 border border-border/50 text-center gradient-border-red"
          data-testid="section-games-summary"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Shield className="w-5 h-5 text-espn-red" />
            <span className="font-display tracking-wide">WEEK {week} GAMES</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {gamesLoading
              ? 'Loading games...'
              : games.length === 0
              ? 'No games scheduled for this week'
              : `${games.length} games scheduled • Season ${season}`}
          </p>
          <Button
            variant="outline"
            className="mt-4 border-espn-red/50 hover:bg-espn-red/10"
            onClick={() => window.location.href = '/'}
            data-testid="button-view-games"
          >
            <Zap className="w-4 h-4 mr-2" />
            View Full Schedule
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
