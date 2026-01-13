'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/_components/ui/card';
import { Badge } from '@/_components/ui/badge';
import { Button } from '@/_components/ui/button';
import { Progress } from '@/_components/ui/progress';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/_components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Activity,
  Users,
  TrendingDown,
  Calendar,
  User,
  Shield,
  ArrowRight,
  Brain,
  Heart,
  Eye,
  EyeOff,
  ArrowUpDown,
  Zap,
  Target,
  Clock,
  BarChart3,
  ChevronRight,
  X,
} from 'lucide-react';

type InjuryStatus = 'Out' | 'Doubtful' | 'Questionable' | 'Probable';
type PracticeStatus = 'DNP' | 'Limited' | 'Full';
type ImpactLevel = 'High' | 'Medium' | 'Low';
type SortOption = 'impact' | 'return' | 'name' | 'team';

interface InjuryReport {
  id: string;
  playerName: string;
  team: string;
  position: string;
  injuryType: string;
  status: InjuryStatus;
  practiceStatus: PracticeStatus;
  impactLevel: ImpactLevel;
  expectedReturn: string;
  backupPlayer?: string;
  pointDropMetric?: number;
  recoveryProgress?: number;
  gamesPlayed?: number;
  gamesMissed?: number;
  positionImpact?: string;
  historicalRecovery?: string;
  backupRating?: number;
}

const MOCK_INJURIES: InjuryReport[] = [
  {
    id: '1',
    playerName: 'Tua Tagovailoa',
    team: 'MIA',
    position: 'QB',
    injuryType: 'Concussion',
    status: 'Out',
    practiceStatus: 'DNP',
    impactLevel: 'High',
    expectedReturn: 'TBD',
    backupPlayer: 'Skylar Thompson',
    pointDropMetric: 4.5,
    recoveryProgress: 15,
    gamesPlayed: 6,
    gamesMissed: 4,
    positionImpact: 'Critical QB loss forces conservative game script. Expect heavy run focus and reduced deep passing.',
    historicalRecovery: 'Concussion protocol typically 3-6 weeks. Previous history suggests extended timeline.',
    backupRating: 62,
  },
  {
    id: '2',
    playerName: 'Chris Jones',
    team: 'KC',
    position: 'DT',
    injuryType: 'Abdomen',
    status: 'Questionable',
    practiceStatus: 'Limited',
    impactLevel: 'High',
    expectedReturn: 'Week 12',
    backupPlayer: 'Derrick Nnadi',
    pointDropMetric: 2.0,
    recoveryProgress: 75,
    gamesPlayed: 8,
    gamesMissed: 2,
    positionImpact: 'Interior pass rush significantly weakened. Opposing teams can establish run game.',
    historicalRecovery: 'Abdominal injuries typically heal in 2-4 weeks with proper rest.',
    backupRating: 71,
  },
  {
    id: '3',
    playerName: 'Rashawn Slater',
    team: 'LAC',
    position: 'LT',
    injuryType: 'Pectoral',
    status: 'Out',
    practiceStatus: 'DNP',
    impactLevel: 'High',
    expectedReturn: 'Week 14',
    backupPlayer: 'Jamaree Salyer',
    pointDropMetric: 3.5,
    recoveryProgress: 40,
    gamesPlayed: 5,
    gamesMissed: 5,
    positionImpact: 'Blind side protection compromised. Expect quicker throws and additional help.',
    historicalRecovery: 'Pectoral strains range from 4-8 weeks depending on severity.',
    backupRating: 68,
  },
  {
    id: '4',
    playerName: 'Davante Adams',
    team: 'LV',
    position: 'WR',
    injuryType: 'Hamstring',
    status: 'Doubtful',
    practiceStatus: 'DNP',
    impactLevel: 'High',
    expectedReturn: 'Week 11',
    backupPlayer: 'Jakobi Meyers',
    pointDropMetric: 2.5,
    recoveryProgress: 60,
    gamesPlayed: 7,
    gamesMissed: 3,
    positionImpact: 'Primary target removed. Expect coverage to shift to remaining receivers.',
    historicalRecovery: 'Hamstring injuries typically require 2-4 weeks. Re-injury risk is elevated.',
    backupRating: 78,
  },
  {
    id: '5',
    playerName: 'Jonathan Taylor',
    team: 'IND',
    position: 'RB',
    injuryType: 'Ankle',
    status: 'Questionable',
    practiceStatus: 'Limited',
    impactLevel: 'High',
    expectedReturn: 'Week 10',
    backupPlayer: 'Zack Moss',
    pointDropMetric: 2.0,
    recoveryProgress: 80,
    gamesPlayed: 8,
    gamesMissed: 2,
    positionImpact: 'Elite rushing attack diminished. Backup provides capable but less explosive option.',
    historicalRecovery: 'High ankle sprains linger. Low ankle sprains heal faster at 1-2 weeks.',
    backupRating: 74,
  },
  {
    id: '6',
    playerName: 'Tyler Linderbaum',
    team: 'BAL',
    position: 'C',
    injuryType: 'Foot',
    status: 'Probable',
    practiceStatus: 'Full',
    impactLevel: 'Medium',
    expectedReturn: 'This Week',
    recoveryProgress: 95,
    gamesPlayed: 9,
    gamesMissed: 1,
    positionImpact: 'Center of offensive line. Critical for protection calls and run blocking.',
    historicalRecovery: 'Minor foot issues typically resolve within a week.',
    backupRating: 65,
  },
  {
    id: '7',
    playerName: 'Tristan Wirfs',
    team: 'TB',
    position: 'RT',
    injuryType: 'Knee',
    status: 'Questionable',
    practiceStatus: 'Limited',
    impactLevel: 'High',
    expectedReturn: 'Week 11',
    backupPlayer: 'Josh Wells',
    pointDropMetric: 3.0,
    recoveryProgress: 65,
    gamesPlayed: 7,
    gamesMissed: 3,
    positionImpact: 'Elite pass protection on right side. Backup represents significant downgrade.',
    historicalRecovery: 'MCL sprains typically 2-6 weeks. ACL involvement extends significantly.',
    backupRating: 62,
  },
  {
    id: '8',
    playerName: 'Budda Baker',
    team: 'ARI',
    position: 'S',
    injuryType: 'Hamstring',
    status: 'Doubtful',
    practiceStatus: 'DNP',
    impactLevel: 'Medium',
    expectedReturn: 'Week 12',
    backupPlayer: 'Jalen Thompson',
    pointDropMetric: 1.5,
    recoveryProgress: 50,
    gamesPlayed: 6,
    gamesMissed: 4,
    positionImpact: 'Key defensive playmaker. Reduced coverage ability in deep zones.',
    historicalRecovery: 'Hamstring injuries for DBs can linger due to speed requirements.',
    backupRating: 72,
  },
  {
    id: '9',
    playerName: 'Orlando Brown Jr.',
    team: 'CIN',
    position: 'LT',
    injuryType: 'Fibula',
    status: 'Out',
    practiceStatus: 'DNP',
    impactLevel: 'High',
    expectedReturn: 'Week 15',
    backupPlayer: 'Cody Ford',
    pointDropMetric: 3.5,
    recoveryProgress: 25,
    gamesPlayed: 4,
    gamesMissed: 6,
    positionImpact: 'Critical blind side protection. Burrow faces increased pressure.',
    historicalRecovery: 'Fibula injuries typically require 6-8 weeks for full healing.',
    backupRating: 64,
  },
  {
    id: '10',
    playerName: 'Garrett Wilson',
    team: 'NYJ',
    position: 'WR',
    injuryType: 'Ankle',
    status: 'Probable',
    practiceStatus: 'Full',
    impactLevel: 'Low',
    expectedReturn: 'This Week',
    recoveryProgress: 90,
    gamesPlayed: 9,
    gamesMissed: 1,
    positionImpact: 'Primary receiving threat. Full participation suggests no limitations.',
    historicalRecovery: 'Minor ankle tweaks typically resolve in days.',
    backupRating: 70,
  },
  {
    id: '11',
    playerName: 'Frank Ragnow',
    team: 'DET',
    position: 'C',
    injuryType: 'Groin',
    status: 'Out',
    practiceStatus: 'DNP',
    impactLevel: 'High',
    expectedReturn: 'Week 13',
    backupPlayer: 'Graham Glasgow',
    pointDropMetric: 2.5,
    recoveryProgress: 35,
    gamesPlayed: 5,
    gamesMissed: 5,
    positionImpact: 'Elite center loss affects entire line communication and run blocking.',
    historicalRecovery: 'Groin injuries typically 3-6 weeks. Chronic issues can develop.',
    backupRating: 69,
  },
  {
    id: '12',
    playerName: 'DeVonta Smith',
    team: 'PHI',
    position: 'WR',
    injuryType: 'Groin',
    status: 'Questionable',
    practiceStatus: 'Limited',
    impactLevel: 'Medium',
    expectedReturn: 'Week 10',
    backupPlayer: 'Britain Covey',
    pointDropMetric: 1.5,
    recoveryProgress: 70,
    gamesPlayed: 8,
    gamesMissed: 2,
    positionImpact: 'Key route runner. AJ Brown absorbs more coverage attention.',
    historicalRecovery: 'Mild groin strains typically heal in 1-2 weeks.',
    backupRating: 66,
  },
  {
    id: '13',
    playerName: 'Nick Bosa',
    team: 'SF',
    position: 'DE',
    injuryType: 'Hip',
    status: 'Probable',
    practiceStatus: 'Full',
    impactLevel: 'Medium',
    expectedReturn: 'This Week',
    recoveryProgress: 92,
    gamesPlayed: 9,
    gamesMissed: 1,
    positionImpact: 'Elite pass rusher. Full practice suggests no game-day concerns.',
    historicalRecovery: 'Hip soreness typically manages through game week.',
    backupRating: 72,
  },
  {
    id: '14',
    playerName: 'Lane Johnson',
    team: 'PHI',
    position: 'RT',
    injuryType: 'Quad',
    status: 'Doubtful',
    practiceStatus: 'DNP',
    impactLevel: 'High',
    expectedReturn: 'Week 11',
    backupPlayer: 'Fred Johnson',
    pointDropMetric: 3.0,
    recoveryProgress: 45,
    gamesPlayed: 6,
    gamesMissed: 4,
    positionImpact: 'Elite tackle on right side. Backup represents noticeable downgrade.',
    historicalRecovery: 'Quad strains typically 2-4 weeks for complete healing.',
    backupRating: 63,
  },
  {
    id: '15',
    playerName: 'Tyreek Hill',
    team: 'MIA',
    position: 'WR',
    injuryType: 'Ankle',
    status: 'Questionable',
    practiceStatus: 'Limited',
    impactLevel: 'High',
    expectedReturn: 'Week 10',
    backupPlayer: 'Jaylen Waddle',
    pointDropMetric: 2.0,
    recoveryProgress: 75,
    gamesPlayed: 7,
    gamesMissed: 3,
    positionImpact: 'Elite deep threat. Defense can play tighter coverage without speed threat.',
    historicalRecovery: 'Ankle injuries for speed receivers require careful management.',
    backupRating: 85,
  },
];

const STATUS_COLORS: Record<InjuryStatus, string> = {
  Out: 'bg-red-500/90 text-white border-red-600',
  Doubtful: 'bg-orange-500/90 text-white border-orange-600',
  Questionable: 'bg-yellow-500/90 text-black border-yellow-600',
  Probable: 'bg-green-500/90 text-white border-green-600',
};

const STATUS_GLOW: Record<InjuryStatus, string> = {
  Out: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  Doubtful: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
  Questionable: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
  Probable: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
};

const STATUS_BORDER: Record<InjuryStatus, string> = {
  Out: 'border-red-500/50 hover:border-red-500',
  Doubtful: 'border-orange-500/50 hover:border-orange-500',
  Questionable: 'border-yellow-500/50 hover:border-yellow-500',
  Probable: 'border-green-500/50 hover:border-green-500',
};

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  High: 'text-red-400',
  Medium: 'text-yellow-400',
  Low: 'text-green-400',
};

const PROGRESS_COLORS: Record<InjuryStatus, string> = {
  Out: 'bg-red-500',
  Doubtful: 'bg-orange-500',
  Questionable: 'bg-yellow-500',
  Probable: 'bg-green-500',
};

const ALL_TEAMS = Array.from(new Set(MOCK_INJURIES.map((i) => i.team))).sort();
const ALL_POSITIONS = Array.from(new Set(MOCK_INJURIES.map((i) => i.position))).sort();

const getImpactScore = (injury: InjuryReport): number => {
  let score = 0;
  if (injury.status === 'Out') score += 40;
  else if (injury.status === 'Doubtful') score += 30;
  else if (injury.status === 'Questionable') score += 20;
  else score += 10;
  
  if (injury.impactLevel === 'High') score += 30;
  else if (injury.impactLevel === 'Medium') score += 20;
  else score += 10;
  
  score += (injury.pointDropMetric || 0) * 5;
  return score;
};

const getReturnWeek = (expectedReturn: string): number => {
  if (expectedReturn === 'TBD') return 999;
  if (expectedReturn === 'This Week') return 0;
  const match = expectedReturn.match(/Week (\d+)/);
  return match ? parseInt(match[1]) : 500;
};

export default function InjuryIntel() {
  const { reduceMotion } = useSettings();
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('impact');
  const [watchList, setWatchList] = useState<Set<string>>(new Set());
  const [selectedInjury, setSelectedInjury] = useState<InjuryReport | null>(null);
  const [showWatchListOnly, setShowWatchListOnly] = useState(false);

  const toggleWatchList = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWatchList((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredAndSortedInjuries = useMemo(() => {
    let filtered = MOCK_INJURIES.filter((injury) => {
      if (showWatchListOnly && !watchList.has(injury.id)) return false;
      if (teamFilter !== 'all' && injury.team !== teamFilter) return false;
      if (statusFilter !== 'all' && injury.status !== statusFilter) return false;
      if (impactFilter !== 'all' && injury.impactLevel !== impactFilter) return false;
      if (positionFilter !== 'all' && injury.position !== positionFilter) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return getImpactScore(b) - getImpactScore(a);
        case 'return':
          return getReturnWeek(a.expectedReturn) - getReturnWeek(b.expectedReturn);
        case 'name':
          return a.playerName.localeCompare(b.playerName);
        case 'team':
          return a.team.localeCompare(b.team);
        default:
          return 0;
      }
    });
  }, [teamFilter, statusFilter, impactFilter, positionFilter, sortBy, watchList, showWatchListOnly]);

  const cascadeImpacts = useMemo(() => {
    const oLineInjuries = MOCK_INJURIES.filter((i) =>
      ['LT', 'LG', 'C', 'RG', 'RT'].includes(i.position) && 
      (i.status === 'Out' || i.status === 'Doubtful')
    );

    const teamOLineGroups = oLineInjuries.reduce((acc, injury) => {
      if (!acc[injury.team]) acc[injury.team] = [];
      acc[injury.team].push(injury);
      return acc;
    }, {} as Record<string, InjuryReport[]>);

    return Object.entries(teamOLineGroups)
      .filter(([, injuries]) => injuries.length >= 1)
      .map(([team, injuries]) => ({
        team,
        injuries,
        totalPointDrop: injuries.reduce((sum, i) => sum + (i.pointDropMetric || 0), 0),
        clusterAlert: injuries.length >= 2,
        cascadeLevel: injuries.length >= 3 ? 'critical' : injuries.length >= 2 ? 'warning' : 'minor',
      }))
      .sort((a, b) => b.totalPointDrop - a.totalPointDrop);
  }, []);

  const hasCascadeAlert = cascadeImpacts.some((c) => c.clusterAlert);
  const highImpactCount = filteredAndSortedInjuries.filter((i) => i.impactLevel === 'High').length;
  const outCount = filteredAndSortedInjuries.filter((i) => i.status === 'Out').length;

  return (
    <div className="min-h-screen p-4 pb-20 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative py-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5 rounded-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
                  <Brain className="w-7 h-7 text-red-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1
                  className="font-display text-2xl md:text-3xl tracking-wider text-glow-red mb-1 flex items-center gap-2"
                  data-testid="page-title"
                >
                  INJURY INTELLIGENCE CENTER
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-espn-red" />
                  Cascade detection & lineup impact analysis for maximum exploit edge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showWatchListOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowWatchListOnly(!showWatchListOnly)}
                className={cn(
                  'gap-2',
                  showWatchListOnly && 'bg-espn-red hover:bg-espn-red/90'
                )}
                data-testid="toggle-watchlist"
              >
                {showWatchListOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Watch List ({watchList.size})
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-xl border border-border/50">
          <Select
            value={teamFilter}
            onValueChange={setTeamFilter}
            data-testid="select-team-filter"
          >
            <SelectTrigger className="w-28" data-testid="select-team-filter">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {ALL_TEAMS.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={positionFilter}
            onValueChange={setPositionFilter}
            data-testid="select-position-filter"
          >
            <SelectTrigger className="w-28" data-testid="select-position-filter">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {ALL_POSITIONS.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            data-testid="select-status-filter"
          >
            <SelectTrigger className="w-32" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Out">Out</SelectItem>
              <SelectItem value="Doubtful">Doubtful</SelectItem>
              <SelectItem value="Questionable">Questionable</SelectItem>
              <SelectItem value="Probable">Probable</SelectItem>
            </SelectContent>
          </Select>

          <Select value={impactFilter} onValueChange={setImpactFilter}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Impact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impact</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border/50 hidden sm:block" />

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-32 gap-2">
              <ArrowUpDown className="w-3 h-3" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impact">Impact Score</SelectItem>
              <SelectItem value="return">Return Date</SelectItem>
              <SelectItem value="name">Player Name</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass border-border/50 hover:border-espn-red/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                Total Injuries
              </div>
              <div className="text-2xl font-display mt-1">{filteredAndSortedInjuries.length}</div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 hover:border-red-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Out
              </div>
              <div className="text-2xl font-display mt-1 text-red-400">{outCount}</div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 hover:border-espn-red/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingDown className="w-4 h-4 text-espn-red" />
                High Impact
              </div>
              <div className="text-2xl font-display mt-1 text-espn-red">{highImpactCount}</div>
            </CardContent>
          </Card>
          <Card className={cn(
            'glass border-border/50 transition-all',
            hasCascadeAlert && 'border-yellow-500/50 animate-pulse'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="w-4 h-4 text-yellow-400" />
                O-Line Clusters
              </div>
              <div className="text-2xl font-display mt-1 text-yellow-400">
                {cascadeImpacts.filter((c) => c.clusterAlert).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <AnimatePresence>
          {hasCascadeAlert && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <Card className="glass border-2 border-yellow-500/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-red-500/10 animate-pulse" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center animate-pulse">
                      <Zap className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-lg text-yellow-400 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        CASCADE DETECTION ALERT
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Multiple O-Line injuries detected. System recommends <span className="text-yellow-400 font-semibold">Under bias adjustment</span> for affected teams.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cascadeImpacts.filter((c) => c.clusterAlert).map((cascade) => (
                          <div
                            key={cascade.team}
                            className="bg-muted/30 rounded-lg p-3 border border-yellow-500/30"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-display font-bold text-lg">{cascade.team}</span>
                              <Badge className={cn(
                                'text-xs',
                                cascade.cascadeLevel === 'critical' 
                                  ? 'bg-red-500 animate-pulse' 
                                  : 'bg-yellow-500'
                              )}>
                                {cascade.injuries.length} O-LINE OUT
                              </Badge>
                            </div>
                            <div className="space-y-2 mb-3">
                              <div className="text-xs text-muted-foreground">Cascade Impact Meter</div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(cascade.totalPointDrop * 15, 100)}%` }}
                                  className={cn(
                                    'h-full rounded-full',
                                    cascade.cascadeLevel === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                                  )}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Recommended Adjustment</span>
                              <span className="font-display font-bold text-espn-red">
                                UNDER -{cascade.totalPointDrop.toFixed(1)}pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
              <Activity className="w-5 h-5 text-espn-red" />
              INJURY REPORTS
              <Badge variant="outline" className="ml-2 text-xs">
                {filteredAndSortedInjuries.length} players
              </Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAndSortedInjuries.map((injury, index) => (
                <motion.div
                  key={injury.id}
                  initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  data-testid={`injury-card-${injury.id}`}
                >
                  <Card 
                    className={cn(
                      'glass cursor-pointer transition-all h-full group',
                      STATUS_BORDER[injury.status],
                      injury.impactLevel === 'High' && injury.status === 'Out' && 'animate-pulse',
                      watchList.has(injury.id) && 'ring-2 ring-espn-gold/50'
                    )}
                    onClick={() => setSelectedInjury(injury)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-display flex items-center gap-2">
                            {injury.playerName}
                            {injury.impactLevel === 'High' && (
                              <Zap className="w-4 h-4 text-espn-red" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{injury.team}</span>
                            <span>•</span>
                            <span>{injury.position}</span>
                            <span>•</span>
                            <span className={IMPACT_COLORS[injury.impactLevel]}>
                              {injury.impactLevel} Impact
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => toggleWatchList(injury.id, e)}
                            data-testid={`watch-${injury.id}`}
                          >
                            {watchList.has(injury.id) ? (
                              <Eye className="w-4 h-4 text-espn-gold" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Badge
                            className={cn('font-semibold', STATUS_COLORS[injury.status], STATUS_GLOW[injury.status])}
                            data-testid={`status-badge-${injury.status.toLowerCase()}`}
                          >
                            {injury.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Injury:</span>
                          <p className="font-medium">{injury.injuryType}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Practice:</span>
                          <p className="font-medium">{injury.practiceStatus}</p>
                        </div>
                      </div>

                      {injury.recoveryProgress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Heart className="w-3 h-3" /> Recovery
                            </span>
                            <span>{injury.recoveryProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', PROGRESS_COLORS[injury.status])}
                              style={{ width: `${injury.recoveryProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">{injury.expectedReturn}</span>
                        </div>
                        {injury.pointDropMetric && (
                          <Badge variant="outline" className="text-xs border-espn-red/50 text-espn-red">
                            -{injury.pointDropMetric}pts
                          </Badge>
                        )}
                      </div>

                      {injury.backupPlayer && (
                        <div className="bg-muted/30 rounded-lg p-2 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Backup:</span>
                            <span className="font-medium">{injury.backupPlayer}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {filteredAndSortedInjuries.length === 0 && (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  No injuries match the selected filters
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4" data-testid="cascade-panel">
            <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-espn-gold" />
              CASCADE IMPACT
            </h2>
            <Card className="glass border-border/50 box-glow-red">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display tracking-wide text-espn-gold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  O-LINE CLUSTER ALERTS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  2+ O-line injuries = <span className="text-yellow-400">2.5pt Under adjustment</span>. Monitor depth chart cascades.
                </p>
                {cascadeImpacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No O-line clusters detected
                  </p>
                ) : (
                  cascadeImpacts.map((cascade) => (
                    <div
                      key={cascade.team}
                      className={cn(
                        'bg-muted/30 rounded-lg p-3 border-l-2 transition-all',
                        cascade.clusterAlert 
                          ? 'border-espn-red animate-pulse' 
                          : 'border-yellow-500'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-bold">{cascade.team}</span>
                        {cascade.clusterAlert && (
                          <Badge className="bg-espn-red text-white text-xs">
                            CASCADE
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {cascade.injuries.map((injury) => (
                          <div
                            key={injury.id}
                            className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/20 rounded p-1 -mx-1"
                            onClick={() => setSelectedInjury(injury)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{injury.position}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span>{injury.playerName}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                injury.status === 'Out' && 'border-red-500 text-red-400'
                              )}
                            >
                              {injury.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total Point Drop</span>
                        <span className="font-display font-bold text-espn-red">
                          -{cascade.totalPointDrop.toFixed(1)}pts
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-espn-gold" />
                  DEPTH CHART IMPLICATIONS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Key position upgrades when starters are out
                </p>
                {filteredAndSortedInjuries
                  .filter((i) => i.backupPlayer && i.impactLevel === 'High')
                  .slice(0, 5)
                  .map((injury) => (
                    <div
                      key={injury.id}
                      className="flex items-center justify-between text-sm bg-muted/30 rounded-lg p-2 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => setSelectedInjury(injury)}
                    >
                      <div>
                        <span className="font-medium">{injury.backupPlayer}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          ({injury.team} {injury.position})
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs text-green-400 border-green-500">
                        START
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {watchList.size > 0 && (
              <Card className="glass border-espn-gold/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display tracking-wide text-espn-gold flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    YOUR WATCH LIST
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {MOCK_INJURIES.filter((i) => watchList.has(i.id)).map((injury) => (
                    <div
                      key={injury.id}
                      className="flex items-center justify-between text-sm bg-muted/30 rounded-lg p-2 cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedInjury(injury)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{injury.playerName}</span>
                        <span className="text-muted-foreground text-xs">{injury.team}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-xs', STATUS_COLORS[injury.status])}>
                          {injury.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => toggleWatchList(injury.id, e)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedInjury} onOpenChange={() => setSelectedInjury(null)}>
        <DialogContent className="max-w-2xl glass border-border/50">
          {selectedInjury && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="font-display text-2xl flex items-center gap-3">
                      {selectedInjury.playerName}
                      {selectedInjury.impactLevel === 'High' && (
                        <Zap className="w-5 h-5 text-espn-red" />
                      )}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-foreground">{selectedInjury.team}</span>
                      <span>•</span>
                      <span>{selectedInjury.position}</span>
                      <span>•</span>
                      <span className={IMPACT_COLORS[selectedInjury.impactLevel]}>
                        {selectedInjury.impactLevel} Impact
                      </span>
                    </DialogDescription>
                  </div>
                  <Badge
                    className={cn('font-semibold text-sm px-3 py-1', STATUS_COLORS[selectedInjury.status], STATUS_GLOW[selectedInjury.status])}
                  >
                    {selectedInjury.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-display text-espn-red">
                      {selectedInjury.pointDropMetric ? `-${selectedInjury.pointDropMetric}` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Point Drop</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-display">{selectedInjury.gamesPlayed || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Games Played</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-display text-red-400">{selectedInjury.gamesMissed || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Games Missed</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-display">{getImpactScore(selectedInjury)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Impact Score</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Heart className="w-4 h-4 text-red-400" />
                    Recovery Timeline
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Injury Type</span>
                      <span className="font-medium">{selectedInjury.injuryType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Practice Status</span>
                      <Badge variant="outline">{selectedInjury.practiceStatus}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expected Return</span>
                      <span className="font-medium text-espn-gold">{selectedInjury.expectedReturn}</span>
                    </div>
                    {selectedInjury.recoveryProgress !== undefined && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Recovery Progress</span>
                          <span>{selectedInjury.recoveryProgress}%</span>
                        </div>
                        <Progress 
                          value={selectedInjury.recoveryProgress} 
                          className="h-2"
                        />
                      </div>
                    )}
                    {selectedInjury.historicalRecovery && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Historical Data
                        </div>
                        <p className="text-sm">{selectedInjury.historicalRecovery}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="w-4 h-4 text-espn-gold" />
                    Position Impact Analysis
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">{selectedInjury.positionImpact || 'Impact analysis not available.'}</p>
                  </div>
                </div>

                {selectedInjury.backupPlayer && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="w-4 h-4 text-green-400" />
                      Replacement Comparison
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-center flex-1">
                          <div className="text-lg font-display">{selectedInjury.playerName}</div>
                          <div className="text-xs text-muted-foreground">Starter</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground mx-4" />
                        <div className="text-center flex-1">
                          <div className="text-lg font-display">{selectedInjury.backupPlayer}</div>
                          <div className="text-xs text-muted-foreground">Backup</div>
                        </div>
                      </div>
                      {selectedInjury.backupRating && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Backup Rating</span>
                            <span className="font-display">{selectedInjury.backupRating}/100</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                selectedInjury.backupRating >= 80 ? 'bg-green-500' :
                                selectedInjury.backupRating >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              )}
                              style={{ width: `${selectedInjury.backupRating}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground text-center pt-1">
                            {selectedInjury.backupRating >= 80 ? 'Minimal dropoff expected' :
                             selectedInjury.backupRating >= 70 ? 'Moderate downgrade' :
                             'Significant performance drop likely'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <Button
                    variant={watchList.has(selectedInjury.id) ? 'default' : 'outline'}
                    onClick={() => toggleWatchList(selectedInjury.id)}
                    className={cn(
                      'gap-2',
                      watchList.has(selectedInjury.id) && 'bg-espn-gold hover:bg-espn-gold/90 text-black'
                    )}
                  >
                    {watchList.has(selectedInjury.id) ? (
                      <>
                        <Eye className="w-4 h-4" />
                        On Watch List
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Add to Watch List
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedInjury(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
