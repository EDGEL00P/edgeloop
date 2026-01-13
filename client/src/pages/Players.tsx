import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Ruler,
  Weight,
  Calendar,
  Target,
  Zap,
  Brain,
  X,
  ArrowUpDown,
  Users,
  Star,
  Crown,
  Shield,
  Heart,
  BarChart3,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Legend
} from 'recharts';

type PlayerRating = 'elite' | 'pro-bowl' | 'starter' | 'backup';
type PlayerTrend = 'improving' | 'stable' | 'declining';

interface InjuryHistoryEntry {
  date: string;
  injury: string;
  gamesOut: number;
}

interface PositionMetrics {
  qbr?: number;
  completionPct?: number;
  yardsPerAttempt?: number;
  yardsAfterContact?: number;
  brokenTackles?: number;
  yardsPerCarry?: number;
  separation?: number;
  catchPct?: number;
  yardsPerRoute?: number;
  blockingGrade?: number;
  yardsAfterCatch?: number;
}

interface FantasyProjection {
  week: number;
  projectedPoints: number;
  floor: number;
  ceiling: number;
}

interface PlayerProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  jerseyNumber: number;
  height: string;
  weight: number;
  experience: number;
  college: string;
  injuryStatus: 'healthy' | 'questionable' | 'doubtful' | 'out';
  rating: PlayerRating;
  trend: PlayerTrend;
  overallScore: number;
  stats: {
    targets?: number;
    receptions?: number;
    receivingYards?: number;
    carries?: number;
    rushingYards?: number;
    completions?: number;
    attempts?: number;
    passingYards?: number;
    passingTDs?: number;
    interceptions?: number;
    touchdowns?: number;
  };
  positionMetrics: PositionMetrics;
  fantasyProjections: FantasyProjection[];
  injuryHistory: InjuryHistoryEntry[];
  weeklyTrend: { week: number; value: number }[];
}

const MOCK_PLAYERS: PlayerProfile[] = [
  {
    id: 'p1',
    name: 'Justin Jefferson',
    team: 'MIN',
    position: 'WR',
    jerseyNumber: 18,
    height: "6'1\"",
    weight: 195,
    experience: 5,
    college: 'LSU',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'improving',
    overallScore: 96,
    stats: { targets: 142, receptions: 103, receivingYards: 1456, touchdowns: 10 },
    positionMetrics: { separation: 3.2, catchPct: 72.5, yardsPerRoute: 2.8, yardsAfterCatch: 5.4 },
    fantasyProjections: [
      { week: 6, projectedPoints: 21.5, floor: 14.2, ceiling: 32.1 },
      { week: 7, projectedPoints: 19.8, floor: 12.5, ceiling: 28.4 },
      { week: 8, projectedPoints: 22.3, floor: 15.1, ceiling: 33.2 }
    ],
    injuryHistory: [
      { date: '2024-10-12', injury: 'Hamstring strain', gamesOut: 2 }
    ],
    weeklyTrend: [{ week: 1, value: 112 }, { week: 2, value: 98 }, { week: 3, value: 145 }, { week: 4, value: 89 }, { week: 5, value: 134 }]
  },
  {
    id: 'p2',
    name: 'Tyreek Hill',
    team: 'MIA',
    position: 'WR',
    jerseyNumber: 10,
    height: "5'10\"",
    weight: 191,
    experience: 9,
    college: 'West Alabama',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'stable',
    overallScore: 95,
    stats: { targets: 156, receptions: 112, receivingYards: 1542, touchdowns: 12 },
    positionMetrics: { separation: 3.8, catchPct: 71.8, yardsPerRoute: 3.1, yardsAfterCatch: 7.2 },
    fantasyProjections: [
      { week: 6, projectedPoints: 23.1, floor: 15.8, ceiling: 35.2 },
      { week: 7, projectedPoints: 21.4, floor: 14.2, ceiling: 31.8 },
      { week: 8, projectedPoints: 22.8, floor: 15.5, ceiling: 34.1 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 145 }, { week: 2, value: 132 }, { week: 3, value: 98 }, { week: 4, value: 167 }, { week: 5, value: 122 }]
  },
  {
    id: 'p3',
    name: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    jerseyNumber: 15,
    height: "6'2\"",
    weight: 225,
    experience: 8,
    college: 'Texas Tech',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'stable',
    overallScore: 98,
    stats: { completions: 401, attempts: 597, passingYards: 4839, passingTDs: 38, interceptions: 12 },
    positionMetrics: { qbr: 74.2, completionPct: 67.2, yardsPerAttempt: 8.1 },
    fantasyProjections: [
      { week: 6, projectedPoints: 24.5, floor: 18.2, ceiling: 34.1 },
      { week: 7, projectedPoints: 23.8, floor: 17.5, ceiling: 32.8 },
      { week: 8, projectedPoints: 25.2, floor: 19.1, ceiling: 35.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 312 }, { week: 2, value: 289 }, { week: 3, value: 345 }, { week: 4, value: 278 }, { week: 5, value: 356 }]
  },
  {
    id: 'p4',
    name: 'Josh Allen',
    team: 'BUF',
    position: 'QB',
    jerseyNumber: 17,
    height: "6'5\"",
    weight: 237,
    experience: 7,
    college: 'Wyoming',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'improving',
    overallScore: 97,
    stats: { completions: 385, attempts: 567, passingYards: 4567, passingTDs: 35, interceptions: 10 },
    positionMetrics: { qbr: 71.8, completionPct: 67.9, yardsPerAttempt: 8.05 },
    fantasyProjections: [
      { week: 6, projectedPoints: 26.2, floor: 19.5, ceiling: 38.4 },
      { week: 7, projectedPoints: 25.1, floor: 18.8, ceiling: 36.2 },
      { week: 8, projectedPoints: 27.3, floor: 20.2, ceiling: 39.8 }
    ],
    injuryHistory: [
      { date: '2024-09-28', injury: 'Elbow soreness', gamesOut: 0 }
    ],
    weeklyTrend: [{ week: 1, value: 287 }, { week: 2, value: 312 }, { week: 3, value: 298 }, { week: 4, value: 345 }, { week: 5, value: 267 }]
  },
  {
    id: 'p5',
    name: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB',
    jerseyNumber: 23,
    height: "5'11\"",
    weight: 205,
    experience: 8,
    college: 'Stanford',
    injuryStatus: 'questionable',
    rating: 'elite',
    trend: 'declining',
    overallScore: 94,
    stats: { carries: 272, rushingYards: 1459, targets: 67, receptions: 58, receivingYards: 489, touchdowns: 21 },
    positionMetrics: { yardsAfterContact: 3.2, brokenTackles: 28, yardsPerCarry: 5.4 },
    fantasyProjections: [
      { week: 6, projectedPoints: 18.5, floor: 8.2, ceiling: 28.1 },
      { week: 7, projectedPoints: 20.8, floor: 12.5, ceiling: 32.4 },
      { week: 8, projectedPoints: 22.3, floor: 14.1, ceiling: 34.2 }
    ],
    injuryHistory: [
      { date: '2025-01-02', injury: 'Calf strain', gamesOut: 1 },
      { date: '2024-11-15', injury: 'Achilles tendinitis', gamesOut: 3 }
    ],
    weeklyTrend: [{ week: 1, value: 134 }, { week: 2, value: 156 }, { week: 3, value: 98 }, { week: 4, value: 167 }, { week: 5, value: 112 }]
  },
  {
    id: 'p6',
    name: 'Travis Kelce',
    team: 'KC',
    position: 'TE',
    jerseyNumber: 87,
    height: "6'5\"",
    weight: 250,
    experience: 12,
    college: 'Cincinnati',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'stable',
    overallScore: 92,
    stats: { targets: 121, receptions: 93, receivingYards: 984, touchdowns: 8 },
    positionMetrics: { separation: 2.4, catchPct: 76.9, yardsPerRoute: 2.1, blockingGrade: 78.5 },
    fantasyProjections: [
      { week: 6, projectedPoints: 14.5, floor: 9.2, ceiling: 22.1 },
      { week: 7, projectedPoints: 13.8, floor: 8.5, ceiling: 20.8 },
      { week: 8, projectedPoints: 15.2, floor: 10.1, ceiling: 23.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 78 }, { week: 2, value: 92 }, { week: 3, value: 67 }, { week: 4, value: 105 }, { week: 5, value: 88 }]
  },
  {
    id: 'p7',
    name: 'Derrick Henry',
    team: 'BAL',
    position: 'RB',
    jerseyNumber: 22,
    height: "6'3\"",
    weight: 247,
    experience: 9,
    college: 'Alabama',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'improving',
    overallScore: 93,
    stats: { carries: 325, rushingYards: 1783, touchdowns: 16 },
    positionMetrics: { yardsAfterContact: 4.1, brokenTackles: 42, yardsPerCarry: 5.5 },
    fantasyProjections: [
      { week: 6, projectedPoints: 19.5, floor: 13.2, ceiling: 28.1 },
      { week: 7, projectedPoints: 18.8, floor: 12.5, ceiling: 26.8 },
      { week: 8, projectedPoints: 20.2, floor: 14.1, ceiling: 29.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 112 }, { week: 2, value: 145 }, { week: 3, value: 178 }, { week: 4, value: 134 }, { week: 5, value: 156 }]
  },
  {
    id: 'p8',
    name: 'Ja\'Marr Chase',
    team: 'CIN',
    position: 'WR',
    jerseyNumber: 1,
    height: "6'0\"",
    weight: 201,
    experience: 4,
    college: 'LSU',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'improving',
    overallScore: 94,
    stats: { targets: 134, receptions: 98, receivingYards: 1356, touchdowns: 11 },
    positionMetrics: { separation: 2.9, catchPct: 73.1, yardsPerRoute: 2.6, yardsAfterCatch: 6.1 },
    fantasyProjections: [
      { week: 6, projectedPoints: 20.5, floor: 13.8, ceiling: 30.2 },
      { week: 7, projectedPoints: 19.2, floor: 12.5, ceiling: 28.1 },
      { week: 8, projectedPoints: 21.8, floor: 14.5, ceiling: 32.4 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 89 }, { week: 2, value: 123 }, { week: 3, value: 145 }, { week: 4, value: 112 }, { week: 5, value: 98 }]
  },
  {
    id: 'p9',
    name: 'CeeDee Lamb',
    team: 'DAL',
    position: 'WR',
    jerseyNumber: 88,
    height: "6'2\"",
    weight: 198,
    experience: 5,
    college: 'Oklahoma',
    injuryStatus: 'healthy',
    rating: 'pro-bowl',
    trend: 'stable',
    overallScore: 89,
    stats: { targets: 148, receptions: 107, receivingYards: 1389, touchdowns: 9 },
    positionMetrics: { separation: 2.7, catchPct: 72.3, yardsPerRoute: 2.4, yardsAfterCatch: 5.8 },
    fantasyProjections: [
      { week: 6, projectedPoints: 18.5, floor: 12.2, ceiling: 26.8 },
      { week: 7, projectedPoints: 17.8, floor: 11.5, ceiling: 25.2 },
      { week: 8, projectedPoints: 19.2, floor: 13.1, ceiling: 28.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 98 }, { week: 2, value: 112 }, { week: 3, value: 89 }, { week: 4, value: 156 }, { week: 5, value: 123 }]
  },
  {
    id: 'p10',
    name: 'Lamar Jackson',
    team: 'BAL',
    position: 'QB',
    jerseyNumber: 8,
    height: "6'2\"",
    weight: 212,
    experience: 7,
    college: 'Louisville',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'improving',
    overallScore: 96,
    stats: { completions: 342, attempts: 512, passingYards: 4123, passingTDs: 32, interceptions: 8, carries: 134, rushingYards: 967 },
    positionMetrics: { qbr: 72.5, completionPct: 66.8, yardsPerAttempt: 8.05 },
    fantasyProjections: [
      { week: 6, projectedPoints: 28.5, floor: 21.2, ceiling: 42.1 },
      { week: 7, projectedPoints: 27.2, floor: 20.5, ceiling: 40.8 },
      { week: 8, projectedPoints: 29.8, floor: 22.1, ceiling: 43.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 298 }, { week: 2, value: 312 }, { week: 3, value: 287 }, { week: 4, value: 345 }, { week: 5, value: 312 }]
  },
  {
    id: 'p11',
    name: 'Bijan Robinson',
    team: 'ATL',
    position: 'RB',
    jerseyNumber: 7,
    height: "5'11\"",
    weight: 220,
    experience: 2,
    college: 'Texas',
    injuryStatus: 'healthy',
    rating: 'pro-bowl',
    trend: 'improving',
    overallScore: 88,
    stats: { carries: 248, rushingYards: 1234, targets: 78, receptions: 65, receivingYards: 567, touchdowns: 12 },
    positionMetrics: { yardsAfterContact: 3.5, brokenTackles: 32, yardsPerCarry: 4.98 },
    fantasyProjections: [
      { week: 6, projectedPoints: 17.5, floor: 11.2, ceiling: 26.1 },
      { week: 7, projectedPoints: 18.2, floor: 12.5, ceiling: 27.8 },
      { week: 8, projectedPoints: 19.5, floor: 13.1, ceiling: 29.2 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 98 }, { week: 2, value: 112 }, { week: 3, value: 134 }, { week: 4, value: 89 }, { week: 5, value: 145 }]
  },
  {
    id: 'p12',
    name: 'Jalen Hurts',
    team: 'PHI',
    position: 'QB',
    jerseyNumber: 1,
    height: "6'1\"",
    weight: 223,
    experience: 5,
    college: 'Oklahoma',
    injuryStatus: 'questionable',
    rating: 'pro-bowl',
    trend: 'declining',
    overallScore: 87,
    stats: { completions: 356, attempts: 534, passingYards: 3987, passingTDs: 28, interceptions: 9, carries: 156, rushingYards: 678 },
    positionMetrics: { qbr: 65.2, completionPct: 66.7, yardsPerAttempt: 7.47 },
    fantasyProjections: [
      { week: 6, projectedPoints: 20.5, floor: 12.2, ceiling: 32.1 },
      { week: 7, projectedPoints: 22.8, floor: 15.5, ceiling: 34.8 },
      { week: 8, projectedPoints: 23.2, floor: 16.1, ceiling: 35.5 }
    ],
    injuryHistory: [
      { date: '2025-01-05', injury: 'Knee contusion', gamesOut: 0 }
    ],
    weeklyTrend: [{ week: 1, value: 267 }, { week: 2, value: 289 }, { week: 3, value: 312 }, { week: 4, value: 245 }, { week: 5, value: 298 }]
  },
  {
    id: 'p13',
    name: 'A.J. Brown',
    team: 'PHI',
    position: 'WR',
    jerseyNumber: 11,
    height: "6'1\"",
    weight: 226,
    experience: 6,
    college: 'Ole Miss',
    injuryStatus: 'healthy',
    rating: 'pro-bowl',
    trend: 'stable',
    overallScore: 90,
    stats: { targets: 138, receptions: 96, receivingYards: 1289, touchdowns: 10 },
    positionMetrics: { separation: 2.6, catchPct: 69.6, yardsPerRoute: 2.3, yardsAfterCatch: 6.5 },
    fantasyProjections: [
      { week: 6, projectedPoints: 17.5, floor: 11.2, ceiling: 26.1 },
      { week: 7, projectedPoints: 16.8, floor: 10.5, ceiling: 24.8 },
      { week: 8, projectedPoints: 18.2, floor: 12.1, ceiling: 27.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 112 }, { week: 2, value: 89 }, { week: 3, value: 134 }, { week: 4, value: 98 }, { week: 5, value: 123 }]
  },
  {
    id: 'p14',
    name: 'Davante Adams',
    team: 'NYJ',
    position: 'WR',
    jerseyNumber: 17,
    height: "6'1\"",
    weight: 215,
    experience: 11,
    college: 'Fresno State',
    injuryStatus: 'doubtful',
    rating: 'starter',
    trend: 'declining',
    overallScore: 78,
    stats: { targets: 112, receptions: 78, receivingYards: 987, touchdowns: 7 },
    positionMetrics: { separation: 2.1, catchPct: 69.6, yardsPerRoute: 1.9, yardsAfterCatch: 4.2 },
    fantasyProjections: [
      { week: 6, projectedPoints: 10.5, floor: 4.2, ceiling: 18.1 },
      { week: 7, projectedPoints: 12.8, floor: 6.5, ceiling: 20.8 },
      { week: 8, projectedPoints: 14.2, floor: 8.1, ceiling: 22.5 }
    ],
    injuryHistory: [
      { date: '2025-01-08', injury: 'Hamstring strain', gamesOut: 1 },
      { date: '2024-11-20', injury: 'Hamstring strain', gamesOut: 2 }
    ],
    weeklyTrend: [{ week: 1, value: 89 }, { week: 2, value: 78 }, { week: 3, value: 67 }, { week: 4, value: 98 }, { week: 5, value: 56 }]
  },
  {
    id: 'p15',
    name: 'George Kittle',
    team: 'SF',
    position: 'TE',
    jerseyNumber: 85,
    height: "6'4\"",
    weight: 250,
    experience: 8,
    college: 'Iowa',
    injuryStatus: 'healthy',
    rating: 'pro-bowl',
    trend: 'stable',
    overallScore: 88,
    stats: { targets: 98, receptions: 72, receivingYards: 856, touchdowns: 6 },
    positionMetrics: { separation: 2.2, catchPct: 73.5, yardsPerRoute: 1.8, blockingGrade: 85.2 },
    fantasyProjections: [
      { week: 6, projectedPoints: 12.5, floor: 7.2, ceiling: 20.1 },
      { week: 7, projectedPoints: 11.8, floor: 6.5, ceiling: 18.8 },
      { week: 8, projectedPoints: 13.2, floor: 8.1, ceiling: 21.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 67 }, { week: 2, value: 89 }, { week: 3, value: 78 }, { week: 4, value: 92 }, { week: 5, value: 84 }]
  },
  {
    id: 'p16',
    name: 'Breece Hall',
    team: 'NYJ',
    position: 'RB',
    jerseyNumber: 20,
    height: "6'1\"",
    weight: 220,
    experience: 3,
    college: 'Iowa State',
    injuryStatus: 'healthy',
    rating: 'starter',
    trend: 'stable',
    overallScore: 82,
    stats: { carries: 234, rushingYards: 1123, targets: 65, receptions: 52, receivingYards: 412, touchdowns: 9 },
    positionMetrics: { yardsAfterContact: 2.8, brokenTackles: 22, yardsPerCarry: 4.8 },
    fantasyProjections: [
      { week: 6, projectedPoints: 14.5, floor: 9.2, ceiling: 22.1 },
      { week: 7, projectedPoints: 15.2, floor: 10.5, ceiling: 23.8 },
      { week: 8, projectedPoints: 15.8, floor: 11.1, ceiling: 24.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 89 }, { week: 2, value: 112 }, { week: 3, value: 78 }, { week: 4, value: 134 }, { week: 5, value: 98 }]
  },
  {
    id: 'p17',
    name: 'Nico Collins',
    team: 'HOU',
    position: 'WR',
    jerseyNumber: 12,
    height: "6'4\"",
    weight: 215,
    experience: 4,
    college: 'Michigan',
    injuryStatus: 'out',
    rating: 'starter',
    trend: 'declining',
    overallScore: 75,
    stats: { targets: 89, receptions: 62, receivingYards: 945, touchdowns: 8 },
    positionMetrics: { separation: 2.4, catchPct: 69.7, yardsPerRoute: 2.2, yardsAfterCatch: 5.1 },
    fantasyProjections: [
      { week: 6, projectedPoints: 0, floor: 0, ceiling: 0 },
      { week: 7, projectedPoints: 0, floor: 0, ceiling: 0 },
      { week: 8, projectedPoints: 15.2, floor: 9.1, ceiling: 24.5 }
    ],
    injuryHistory: [
      { date: '2025-01-02', injury: 'Hamstring tear', gamesOut: 4 }
    ],
    weeklyTrend: [{ week: 1, value: 123 }, { week: 2, value: 145 }, { week: 3, value: 112 }, { week: 4, value: 0 }, { week: 5, value: 0 }]
  },
  {
    id: 'p18',
    name: 'Joe Burrow',
    team: 'CIN',
    position: 'QB',
    jerseyNumber: 9,
    height: "6'4\"",
    weight: 221,
    experience: 5,
    college: 'LSU',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'stable',
    overallScore: 95,
    stats: { completions: 378, attempts: 556, passingYards: 4456, passingTDs: 34, interceptions: 11 },
    positionMetrics: { qbr: 70.8, completionPct: 68.0, yardsPerAttempt: 8.01 },
    fantasyProjections: [
      { week: 6, projectedPoints: 22.5, floor: 16.2, ceiling: 32.1 },
      { week: 7, projectedPoints: 21.8, floor: 15.5, ceiling: 30.8 },
      { week: 8, projectedPoints: 23.2, floor: 17.1, ceiling: 33.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 289 }, { week: 2, value: 312 }, { week: 3, value: 278 }, { week: 4, value: 334 }, { week: 5, value: 298 }]
  },
  {
    id: 'p19',
    name: 'Saquon Barkley',
    team: 'PHI',
    position: 'RB',
    jerseyNumber: 26,
    height: "6'0\"",
    weight: 232,
    experience: 7,
    college: 'Penn State',
    injuryStatus: 'healthy',
    rating: 'elite',
    trend: 'improving',
    overallScore: 95,
    stats: { carries: 312, rushingYards: 1678, targets: 56, receptions: 48, receivingYards: 389, touchdowns: 14 },
    positionMetrics: { yardsAfterContact: 3.8, brokenTackles: 38, yardsPerCarry: 5.4 },
    fantasyProjections: [
      { week: 6, projectedPoints: 20.5, floor: 14.2, ceiling: 30.1 },
      { week: 7, projectedPoints: 19.8, floor: 13.5, ceiling: 28.8 },
      { week: 8, projectedPoints: 21.2, floor: 15.1, ceiling: 31.5 }
    ],
    injuryHistory: [],
    weeklyTrend: [{ week: 1, value: 134 }, { week: 2, value: 156 }, { week: 3, value: 112 }, { week: 4, value: 178 }, { week: 5, value: 145 }]
  },
  {
    id: 'p20',
    name: 'Mark Andrews',
    team: 'BAL',
    position: 'TE',
    jerseyNumber: 89,
    height: "6'5\"",
    weight: 256,
    experience: 7,
    college: 'Oklahoma',
    injuryStatus: 'questionable',
    rating: 'starter',
    trend: 'declining',
    overallScore: 79,
    stats: { targets: 87, receptions: 65, receivingYards: 756, touchdowns: 5 },
    positionMetrics: { separation: 1.9, catchPct: 74.7, yardsPerRoute: 1.6, blockingGrade: 62.5 },
    fantasyProjections: [
      { week: 6, projectedPoints: 9.5, floor: 4.2, ceiling: 16.1 },
      { week: 7, projectedPoints: 10.8, floor: 5.5, ceiling: 18.8 },
      { week: 8, projectedPoints: 11.2, floor: 6.1, ceiling: 19.5 }
    ],
    injuryHistory: [
      { date: '2025-01-08', injury: 'Knee soreness', gamesOut: 0 }
    ],
    weeklyTrend: [{ week: 1, value: 56 }, { week: 2, value: 78 }, { week: 3, value: 45 }, { week: 4, value: 89 }, { week: 5, value: 67 }]
  }
];

const TEAMS = ['All Teams', 'ATL', 'BAL', 'BUF', 'CIN', 'DAL', 'HOU', 'KC', 'MIA', 'MIN', 'NYJ', 'PHI', 'SF'];
const POSITIONS = ['All Positions', 'QB', 'RB', 'WR', 'TE'];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'overallScore', label: 'Overall Score' },
  { value: 'team', label: 'Team' },
  { value: 'experience', label: 'Experience' }
];

const POSITION_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  QB: { bg: 'from-purple-500/20 to-purple-900/10', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  RB: { bg: 'from-emerald-500/20 to-emerald-900/10', border: 'border-emerald-500/50', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' },
  WR: { bg: 'from-orange-500/20 to-orange-900/10', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'shadow-orange-500/30' },
  TE: { bg: 'from-cyan-500/20 to-cyan-900/10', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' }
};

export default function Players() {
  const { reduceMotion } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All Teams');
  const [positionFilter, setPositionFilter] = useState('All Positions');
  const [sortBy, setSortBy] = useState('overallScore');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [comparePlayers, setComparePlayers] = useState<PlayerProfile[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const filteredPlayers = useMemo(() => {
    let players = MOCK_PLAYERS.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = teamFilter === 'All Teams' || player.team === teamFilter;
      const matchesPosition = positionFilter === 'All Positions' || player.position === positionFilter;
      return matchesSearch && matchesTeam && matchesPosition;
    });

    players.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'overallScore':
          return b.overallScore - a.overallScore;
        case 'team':
          return a.team.localeCompare(b.team);
        case 'experience':
          return b.experience - a.experience;
        default:
          return 0;
      }
    });

    return players;
  }, [searchQuery, teamFilter, positionFilter, sortBy]);

  const toggleComparePlayer = (player: PlayerProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparePlayers.find(p => p.id === player.id)) {
      setComparePlayers(comparePlayers.filter(p => p.id !== player.id));
    } else if (comparePlayers.length < 2) {
      setComparePlayers([...comparePlayers, player]);
    }
  };

  const getInjuryBadge = (status: PlayerProfile['injuryStatus']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Healthy</Badge>;
      case 'questionable':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Questionable</Badge>;
      case 'doubtful':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Doubtful</Badge>;
      case 'out':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Out</Badge>;
    }
  };

  const getRatingBadge = (rating: PlayerRating) => {
    switch (rating) {
      case 'elite':
        return (
          <Badge className="bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-500/50 gap-1">
            <Crown className="w-3 h-3" /> Elite
          </Badge>
        );
      case 'pro-bowl':
        return (
          <Badge className="bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-300 border-blue-500/50 gap-1">
            <Star className="w-3 h-3" /> Pro Bowl
          </Badge>
        );
      case 'starter':
        return (
          <Badge className="bg-gradient-to-r from-slate-500/30 to-gray-500/30 text-slate-300 border-slate-500/50 gap-1">
            <Shield className="w-3 h-3" /> Starter
          </Badge>
        );
      case 'backup':
        return (
          <Badge className="bg-muted/50 text-muted-foreground border-border/50">Backup</Badge>
        );
    }
  };

  const getTrendIndicator = (trend: PlayerTrend) => {
    switch (trend) {
      case 'improving':
        return (
          <div className="flex items-center gap-1 text-emerald-400 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>Rising</span>
          </div>
        );
      case 'declining':
        return (
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <TrendingDown className="w-3 h-3" />
            <span>Falling</span>
          </div>
        );
      case 'stable':
        return (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Activity className="w-3 h-3" />
            <span>Stable</span>
          </div>
        );
    }
  };

  const getStatLabel = (position: string) => {
    switch (position) {
      case 'QB':
        return 'Passing Yards';
      case 'RB':
        return 'Rushing Yards';
      case 'WR':
      case 'TE':
        return 'Receiving Yards';
      default:
        return 'Yards';
    }
  };

  const renderPlayerStats = (player: PlayerProfile) => {
    const { position, stats } = player;
    
    if (position === 'QB') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Completions</span>
            <div className="font-mono text-lg">{stats.completions}/{stats.attempts}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Pass Yards</span>
            <div className="font-mono text-lg">{stats.passingYards?.toLocaleString()}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Pass TDs</span>
            <div className="font-mono text-lg text-green-400">{stats.passingTDs}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">INTs</span>
            <div className="font-mono text-lg text-red-400">{stats.interceptions}</div>
          </div>
          {stats.rushingYards && (
            <>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground">Rush Yards</span>
                <div className="font-mono text-lg">{stats.rushingYards}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground">Carries</span>
                <div className="font-mono text-lg">{stats.carries}</div>
              </div>
            </>
          )}
        </div>
      );
    }
    
    if (position === 'RB') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Carries</span>
            <div className="font-mono text-lg">{stats.carries}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Rush Yards</span>
            <div className="font-mono text-lg">{stats.rushingYards?.toLocaleString()}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Receptions</span>
            <div className="font-mono text-lg">{stats.receptions}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Rec Yards</span>
            <div className="font-mono text-lg">{stats.receivingYards}</div>
          </div>
          <div className="col-span-2 bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Total TDs</span>
            <div className="font-mono text-lg text-green-400">{stats.touchdowns}</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <span className="text-xs text-muted-foreground">Targets</span>
          <div className="font-mono text-lg">{stats.targets}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <span className="text-xs text-muted-foreground">Receptions</span>
          <div className="font-mono text-lg">{stats.receptions}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <span className="text-xs text-muted-foreground">Rec Yards</span>
          <div className="font-mono text-lg">{stats.receivingYards?.toLocaleString()}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <span className="text-xs text-muted-foreground">TDs</span>
          <div className="font-mono text-lg text-green-400">{stats.touchdowns}</div>
        </div>
      </div>
    );
  };

  const renderPositionMetrics = (player: PlayerProfile) => {
    const { position, positionMetrics } = player;

    if (position === 'QB') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center gap-1 text-xs text-purple-400 mb-1">
              <Brain className="w-3 h-3" />
              QBR
            </div>
            <div className="font-mono text-xl text-purple-300">{positionMetrics.qbr}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center gap-1 text-xs text-purple-400 mb-1">
              <Target className="w-3 h-3" />
              Comp %
            </div>
            <div className="font-mono text-xl text-purple-300">{positionMetrics.completionPct}%</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center gap-1 text-xs text-purple-400 mb-1">
              <Zap className="w-3 h-3" />
              Y/A
            </div>
            <div className="font-mono text-xl text-purple-300">{positionMetrics.yardsPerAttempt}</div>
          </div>
        </div>
      );
    }

    if (position === 'RB') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-lg p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
              <Zap className="w-3 h-3" />
              YAC
            </div>
            <div className="font-mono text-xl text-emerald-300">{positionMetrics.yardsAfterContact}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-lg p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
              <Activity className="w-3 h-3" />
              Broken Tkl
            </div>
            <div className="font-mono text-xl text-emerald-300">{positionMetrics.brokenTackles}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-lg p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
              <Target className="w-3 h-3" />
              Y/C
            </div>
            <div className="font-mono text-xl text-emerald-300">{positionMetrics.yardsPerCarry}</div>
          </div>
        </div>
      );
    }

    if (position === 'WR') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg p-3 border border-orange-500/20">
            <div className="flex items-center gap-1 text-xs text-orange-400 mb-1">
              <Target className="w-3 h-3" />
              Separation
            </div>
            <div className="font-mono text-xl text-orange-300">{positionMetrics.separation} yds</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg p-3 border border-orange-500/20">
            <div className="flex items-center gap-1 text-xs text-orange-400 mb-1">
              <Activity className="w-3 h-3" />
              Catch %
            </div>
            <div className="font-mono text-xl text-orange-300">{positionMetrics.catchPct}%</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg p-3 border border-orange-500/20">
            <div className="flex items-center gap-1 text-xs text-orange-400 mb-1">
              <Zap className="w-3 h-3" />
              Y/Route
            </div>
            <div className="font-mono text-xl text-orange-300">{positionMetrics.yardsPerRoute}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg p-3 border border-orange-500/20">
            <div className="flex items-center gap-1 text-xs text-orange-400 mb-1">
              <TrendingUp className="w-3 h-3" />
              YAC
            </div>
            <div className="font-mono text-xl text-orange-300">{positionMetrics.yardsAfterCatch}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-lg p-3 border border-cyan-500/20">
          <div className="flex items-center gap-1 text-xs text-cyan-400 mb-1">
            <Target className="w-3 h-3" />
            Separation
          </div>
          <div className="font-mono text-xl text-cyan-300">{positionMetrics.separation} yds</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-lg p-3 border border-cyan-500/20">
          <div className="flex items-center gap-1 text-xs text-cyan-400 mb-1">
            <Activity className="w-3 h-3" />
            Catch %
          </div>
          <div className="font-mono text-xl text-cyan-300">{positionMetrics.catchPct}%</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-lg p-3 border border-cyan-500/20">
          <div className="flex items-center gap-1 text-xs text-cyan-400 mb-1">
            <Shield className="w-3 h-3" />
            Block Grade
          </div>
          <div className="font-mono text-xl text-cyan-300">{positionMetrics.blockingGrade}</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-lg p-3 border border-cyan-500/20">
          <div className="flex items-center gap-1 text-xs text-cyan-400 mb-1">
            <Zap className="w-3 h-3" />
            Y/Route
          </div>
          <div className="font-mono text-xl text-cyan-300">{positionMetrics.yardsPerRoute}</div>
        </div>
      </div>
    );
  };

  const getPositionColor = (position: string) => {
    return POSITION_COLORS[position] || POSITION_COLORS.WR;
  };

  const renderComparisonView = () => {
    if (comparePlayers.length !== 2) return null;
    const [player1, player2] = comparePlayers;
    const posColor1 = getPositionColor(player1.position);
    const posColor2 = getPositionColor(player2.position);

    const radarData = [
      { subject: 'Overall', p1: player1.overallScore, p2: player2.overallScore, fullMark: 100 },
      { subject: 'Experience', p1: Math.min(player1.experience * 10, 100), p2: Math.min(player2.experience * 10, 100), fullMark: 100 },
      { subject: 'TDs', p1: Math.min((player1.stats.touchdowns || player1.stats.passingTDs || 0) * 3, 100), p2: Math.min((player2.stats.touchdowns || player2.stats.passingTDs || 0) * 3, 100), fullMark: 100 },
    ];

    return (
      <Dialog open={comparePlayers.length === 2} onOpenChange={() => setComparePlayers([])}>
        <DialogContent className="max-w-4xl bg-card/95 backdrop-blur-xl border-border/50" data-testid="modal-player-comparison">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-[#CD1141]" />
              Player Comparison
            </DialogTitle>
            <DialogDescription>Side-by-side analysis of selected players</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className={cn("rounded-xl p-4 border", posColor1.border, `bg-gradient-to-br ${posColor1.bg}`)}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border", posColor1.border, posColor1.text)}>
                  <span className="font-display text-xl">#{player1.jerseyNumber}</span>
                </div>
                <div>
                  <div className="font-display text-lg">{player1.name}</div>
                  <div className="text-sm text-muted-foreground">{player1.team} • {player1.position}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Score</span>
                  <span className="font-mono font-bold">{player1.overallScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  {getRatingBadge(player1.rating)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trend</span>
                  {getTrendIndicator(player1.trend)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  {getInjuryBadge(player1.injuryStatus)}
                </div>
              </div>
            </div>

            <div className={cn("rounded-xl p-4 border", posColor2.border, `bg-gradient-to-br ${posColor2.bg}`)}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border", posColor2.border, posColor2.text)}>
                  <span className="font-display text-xl">#{player2.jerseyNumber}</span>
                </div>
                <div>
                  <div className="font-display text-lg">{player2.name}</div>
                  <div className="text-sm text-muted-foreground">{player2.team} • {player2.position}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Score</span>
                  <span className="font-mono font-bold">{player2.overallScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  {getRatingBadge(player2.rating)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trend</span>
                  {getTrendIndicator(player2.trend)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  {getInjuryBadge(player2.injuryStatus)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-muted/20 rounded-xl p-4">
            <h4 className="text-sm font-display mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#CD1141]" />
              Attribute Comparison
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <Radar name={player1.name} dataKey="p1" stroke="#CD1141" fill="#CD1141" fillOpacity={0.3} />
                  <Radar name={player2.name} dataKey="p2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-display mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#CD1141]" />
              Fantasy Projections Comparison
            </h4>
            <div className="h-48 bg-muted/20 rounded-xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={player1.fantasyProjections.map((p, i) => ({
                  week: `Week ${p.week}`,
                  [player1.name]: p.projectedPoints,
                  [player2.name]: player2.fantasyProjections[i]?.projectedPoints || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey={player1.name} fill="#CD1141" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={player2.name} fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <h1 className="font-display text-3xl tracking-wider text-glow-red mb-2 flex items-center justify-center gap-3">
            <Brain className="w-8 h-8 text-[#CD1141]" />
            PLAYER INTELLIGENCE
          </h1>
          <p className="text-muted-foreground text-sm">
            Advanced analytics, performance metrics, and predictive insights
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl p-4 border border-border/50"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players or teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-[44px] bg-muted/30 border-border/50"
                data-testid="input-search-player"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="wait">
                {POSITIONS.slice(1).map((pos) => (
                  <motion.div
                    key={pos}
                    initial={reduceMotion ? {} : { scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      variant={positionFilter === pos ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPositionFilter(positionFilter === pos ? 'All Positions' : pos)}
                      className={cn(
                        "transition-all min-h-[44px] px-4 touch-manipulation",
                        positionFilter === pos && getPositionColor(pos).border,
                        positionFilter === pos && "shadow-lg"
                      )}
                      data-testid={`button-filter-${pos.toLowerCase()}`}
                    >
                      {pos}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full lg:w-[140px] min-h-[44px] bg-muted/30 border-border/50" data-testid="select-team-filter">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.map((team) => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[160px] min-h-[44px] bg-muted/30 border-border/50" data-testid="select-sort">
                <ArrowUpDown className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Showing {filteredPlayers.length} of {MOCK_PLAYERS.length} players
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isCompareMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsCompareMode(!isCompareMode);
                  if (isCompareMode) setComparePlayers([]);
                }}
                className="text-xs min-h-[44px] px-4 touch-manipulation"
                data-testid="button-compare-mode"
              >
                <Users className="w-4 h-4 mr-1.5" />
                {isCompareMode ? `Compare (${comparePlayers.length}/2)` : 'Compare'}
              </Button>
              {comparePlayers.length === 2 && (
                <Button
                  size="sm"
                  className="text-xs min-h-[44px] px-4 bg-[#CD1141] hover:bg-[#CD1141]/80 touch-manipulation"
                  onClick={() => {}}
                  data-testid="button-view-comparison"
                >
                  View Comparison
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {comparePlayers.length > 0 && isCompareMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 flex-wrap"
            >
              {comparePlayers.map((player) => (
                <Badge
                  key={player.id}
                  className="bg-[#CD1141]/20 text-[#CD1141] border-[#CD1141]/30 gap-1 pr-1"
                >
                  {player.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setComparePlayers(comparePlayers.filter(p => p.id !== player.id))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player, index) => {
            const posColor = getPositionColor(player.position);
            const isElite = player.rating === 'elite';
            const isTrending = player.trend === 'improving';
            const isSelected = comparePlayers.find(p => p.id === player.id);

            return (
              <motion.div
                key={player.id}
                initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={reduceMotion ? {} : { scale: 1.02, y: -4 }}
                className={cn(
                  "rounded-xl p-5 transition-all cursor-pointer relative overflow-hidden group",
                  "border-2",
                  isSelected ? "border-[#CD1141] shadow-[0_0_20px_rgba(205,17,65,0.3)]" : posColor.border,
                  isElite && !reduceMotion && "pulse-godmode",
                  `bg-gradient-to-br ${posColor.bg}`,
                  "hover:shadow-lg",
                  isElite && `hover:${posColor.glow}`
                )}
                onClick={() => !isCompareMode && setSelectedPlayer(player)}
                data-testid={`player-card-${player.id}`}
              >
                {isElite && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/20 to-transparent" />
                )}
                {isTrending && !reduceMotion && (
                  <div className="absolute top-2 right-2">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  </div>
                )}
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center border-2",
                        posColor.border,
                        `bg-gradient-to-br ${posColor.bg}`
                      )}>
                        <span className={cn("font-display text-xl", posColor.text)}>#{player.jerseyNumber}</span>
                      </div>
                      <div>
                        <div className="font-display tracking-wide text-sm">{player.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className={posColor.text}>{player.position}</span>
                          <span>•</span>
                          <span>{player.team}</span>
                        </div>
                        <div className="mt-1">
                          {getTrendIndicator(player.trend)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-mono text-2xl font-bold",
                        player.overallScore >= 90 ? "text-amber-400" :
                        player.overallScore >= 80 ? "text-blue-400" :
                        "text-muted-foreground"
                      )}>
                        {player.overallScore}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">OVR</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {getRatingBadge(player.rating)}
                    {getInjuryBadge(player.injuryStatus)}
                  </div>

                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ruler className="w-3 h-3" />
                      <span>{player.height}</span>
                      <span className="text-border/50">|</span>
                      <Weight className="w-3 h-3" />
                      <span>{player.weight} lbs</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{player.experience} years</span>
                      <span className="text-border/50">|</span>
                      <GraduationCap className="w-3 h-3" />
                      <span className="truncate">{player.college}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    {isCompareMode ? (
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "text-xs w-full min-h-[44px] touch-manipulation",
                          isSelected && "bg-[#CD1141] hover:bg-[#CD1141]/80"
                        )}
                        onClick={(e) => toggleComparePlayer(player, e)}
                        disabled={comparePlayers.length >= 2 && !isSelected}
                        data-testid={`button-compare-${player.id}`}
                      >
                        {isSelected ? 'Selected' : 'Select to Compare'}
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Target className="w-3 h-3" />
                          <span>Fantasy: {player.fantasyProjections[0]?.projectedPoints.toFixed(1)} pts</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("text-xs min-h-[44px] px-3 touch-manipulation", posColor.text, `hover:${posColor.text} hover:bg-white/5`)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayer(player);
                          }}
                          data-testid={`button-view-player-${player.id}`}
                        >
                          Details <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No players found matching your filters</p>
          </div>
        )}
      </div>

      {renderComparisonView()}

      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-xl border-border/50" data-testid="modal-player-detail">
          {selectedPlayer && (
            <ScrollArea className="max-h-[85vh]">
              <DialogHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-20 h-20 rounded-xl flex items-center justify-center border-2",
                    getPositionColor(selectedPlayer.position).border,
                    `bg-gradient-to-br ${getPositionColor(selectedPlayer.position).bg}`
                  )}>
                    <span className={cn("font-display text-3xl", getPositionColor(selectedPlayer.position).text)}>
                      #{selectedPlayer.jerseyNumber}
                    </span>
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-display flex items-center gap-2">
                      {selectedPlayer.name}
                      {selectedPlayer.rating === 'elite' && (
                        <Crown className="w-5 h-5 text-amber-400" />
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-sm flex items-center gap-2">
                      <span className={getPositionColor(selectedPlayer.position).text}>{selectedPlayer.position}</span>
                      <span>•</span>
                      <span>{selectedPlayer.team}</span>
                      <span>•</span>
                      <span>{selectedPlayer.experience} Year{selectedPlayer.experience !== 1 ? 's' : ''}</span>
                    </DialogDescription>
                    <div className="flex gap-2 mt-2">
                      {getRatingBadge(selectedPlayer.rating)}
                      {getInjuryBadge(selectedPlayer.injuryStatus)}
                      {getTrendIndicator(selectedPlayer.trend)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "font-mono text-4xl font-bold",
                      selectedPlayer.overallScore >= 90 ? "text-amber-400 text-glow-gold" :
                      selectedPlayer.overallScore >= 80 ? "text-blue-400" :
                      "text-muted-foreground"
                    )}>
                      {selectedPlayer.overallScore}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Overall Rating</div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="stats" className="mt-4">
                <TabsList className="grid w-full grid-cols-4 bg-muted/30">
                  <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                  <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
                  <TabsTrigger value="fantasy" className="text-xs">Fantasy</TabsTrigger>
                  <TabsTrigger value="injuries" className="text-xs">Injuries</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-[#CD1141]" />
                      <div>
                        <div className="text-xs text-muted-foreground">Height</div>
                        <div className="font-mono">{selectedPlayer.height}</div>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                      <Weight className="w-4 h-4 text-[#CD1141]" />
                      <div>
                        <div className="text-xs text-muted-foreground">Weight</div>
                        <div className="font-mono">{selectedPlayer.weight} lbs</div>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#CD1141]" />
                      <div>
                        <div className="text-xs text-muted-foreground">Experience</div>
                        <div className="font-mono">{selectedPlayer.experience} yrs</div>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#CD1141]" />
                      <div>
                        <div className="text-xs text-muted-foreground">College</div>
                        <div className="font-mono text-xs">{selectedPlayer.college}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#CD1141]" />
                      Season Statistics
                    </h3>
                    {renderPlayerStats(selectedPlayer)}
                  </div>

                  <div>
                    <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#CD1141]" />
                      5-Week {getStatLabel(selectedPlayer.position)} Trend
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedPlayer.weeklyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="week" 
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                            tickFormatter={(value) => `Wk ${value}`}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            labelFormatter={(value) => `Week ${value}`}
                            formatter={(value: number) => [`${value} yards`, getStatLabel(selectedPlayer.position)]}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#CD1141"
                            strokeWidth={2}
                            dot={{ fill: '#CD1141', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: '#CD1141' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-6 mt-4">
                  <div>
                    <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#CD1141]" />
                      Position-Specific Metrics
                    </h3>
                    {renderPositionMetrics(selectedPlayer)}
                  </div>
                </TabsContent>

                <TabsContent value="fantasy" className="space-y-6 mt-4">
                  <div>
                    <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#CD1141]" />
                      Fantasy Projections
                    </h3>
                    <div className="space-y-3">
                      {selectedPlayer.fantasyProjections.map((proj) => (
                        <div key={proj.week} className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Week {proj.week}</span>
                            <span className="font-mono text-lg text-[#CD1141]">{proj.projectedPoints.toFixed(1)} pts</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Floor: <span className="text-red-400 font-mono">{proj.floor.toFixed(1)}</span></span>
                            <span>Ceiling: <span className="text-green-400 font-mono">{proj.ceiling.toFixed(1)}</span></span>
                          </div>
                          <div className="mt-2 h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 via-[#CD1141] to-green-500 rounded-full"
                              style={{ 
                                marginLeft: `${(proj.floor / proj.ceiling) * 100}%`,
                                width: `${((proj.projectedPoints - proj.floor) / (proj.ceiling - proj.floor)) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="injuries" className="space-y-6 mt-4">
                  <div>
                    <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#CD1141]" />
                      Injury History
                    </h3>
                    {selectedPlayer.injuryHistory.length > 0 ? (
                      <div className="space-y-3">
                        {selectedPlayer.injuryHistory.map((injury, idx) => (
                          <div key={idx} className="bg-muted/30 rounded-lg p-4 border-l-4 border-red-500/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{injury.injury}</div>
                                <div className="text-xs text-muted-foreground">{injury.date}</div>
                              </div>
                              <Badge variant="outline" className="text-red-400 border-red-500/30">
                                {injury.gamesOut === 0 ? 'Did not miss' : `${injury.gamesOut} games`}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-center">
                        <Shield className="w-8 h-8 mx-auto text-green-400 mb-2" />
                        <div className="text-sm text-green-400">No significant injury history</div>
                      </div>
                    )}
                  </div>

                  {selectedPlayer.injuryStatus !== 'healthy' && (
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                      <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Current Status</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Player is currently listed as <span className="text-yellow-400 font-medium">{selectedPlayer.injuryStatus}</span>. 
                        Monitor updates before lineup decisions.
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
