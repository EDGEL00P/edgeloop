/**
 * edgeloop STATS DASHBOARD
 * Automated NFL statistics with ESPN/NFL.com-inspired design
 * Real-time updates with advanced metrics (EPA, CPOE, Success Rate)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Zap,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Award,
  Activity,
} from 'lucide-react';
import { StatsTable } from './components/StatsTable';
import { StatsFilters } from './components/StatsFilters';
import { AdvancedMetrics } from './components/AdvancedMetrics';
import { TeamStatsOverview } from './components/TeamStatsOverview';
import { NeuralWeb } from '../components/NeuralWeb';
import { ReactorCard } from '../components/ReactorCard';
import { NFLScanlines } from '../components/NFLScanlines';
import { NFLFieldLines } from '../components/NFLFieldLines';

// Types
type StatCategory = 'passing' | 'rushing' | 'receiving' | 'defense' | 'kicking' | 'all';
type ViewMode = 'players' | 'teams' | 'advanced';
type Season = number;
type Week = number | 'all';

interface StatsData {
  players: PlayerStat[];
  teams: TeamStat[];
  lastUpdated: string;
}

interface PlayerStat {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
  advanced?: {
    epa?: number;
    successRate?: number;
    cpoe?: number;
  };
}

interface TeamStat {
  id: string;
  name: string;
  abbreviation: string;
  stats: Record<string, number>;
  record: { wins: number; losses: number; ties: number };
}

export default function StatsPage() {
  const [category, setCategory] = useState<StatCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('players');
  const [season, setSeason] = useState<Season>(2025);
  const [week, setWeek] = useState<Week>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('yards');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch stats data
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          season: season.toString(),
          ...(week !== 'all' && { week: week.toString() }),
          category,
        });

        const response = await fetch(`/api/stats?${params}`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();
        setStatsData(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to mock data
        setStatsData(getMockStatsData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Auto-refresh every 5 minutes if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [category, season, week, autoRefresh]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!statsData) return null;

    if (viewMode === 'players') {
      let data = [...statsData.players];
      if (searchQuery) {
        data = data.filter((item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
        );
      }
      // Sort
      data = data.sort((a, b) => {
        const aVal = a.stats[sortBy] ?? 0;
        const bVal = b.stats[sortBy] ?? 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
      return { players: data, teams: [] };
    } else {
      let data = [...statsData.teams];
      if (searchQuery) {
        data = data.filter((item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
        );
      }
      // Sort
      data = data.sort((a, b) => {
        const aVal = a.stats[sortBy] ?? 0;
        const bVal = b.stats[sortBy] ?? 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
      return { players: [], teams: data };
    }
  }, [statsData, viewMode, searchQuery, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        season: season.toString(),
        ...(week !== 'all' && { week: week.toString() }),
        category,
        refresh: 'true',
      });

      const response = await fetch(`/api/stats?${params}`);
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1A2E] pt-20 relative">
      {/* NFL HUD Visual Effects Layer */}
      <div className="fixed inset-0 z-0">
        <NeuralWeb state="idle" intensity={0.6} />
        <NFLFieldLines />
        <NFLScanlines />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3 text-bio-rhythm game-state-active">
                <BarChart3 className="w-10 h-10 text-[#00F5FF]" />
                NFL Statistics
              </h1>
              <p className="text-[#F0F0F0]/60 font-mono text-sm">
                [AUTO_STATS] Advanced analytics • Automated updates • Real-time data
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#152B47] hover:bg-[#152B47]/80 border border-[#152B47] text-[#F0F0F0] transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#152B47] hover:bg-[#152B47]/80 border border-[#152B47] text-[#F0F0F0] transition-all">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Status Bar */}
          {statsData && (
            <div className="flex items-center gap-4 text-sm text-[#F0F0F0]/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse" />
                <span>Last updated: {new Date(statsData.lastUpdated).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00F5FF]" />
                <span>
                  {viewMode === 'players'
                    ? `${filteredData?.players.length || 0} players`
                    : `${filteredData?.teams.length || 0} teams`}
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>
            </div>
          )}
        </motion.div>

        {/* Filters & View Toggle */}
        <StatsFilters
          category={category}
          setCategory={setCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          season={season}
          setSeason={setSeason}
          week={week}
          setWeek={setWeek}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* Team Overview (when viewing teams) */}
        {viewMode === 'teams' && statsData && (
          <TeamStatsOverview teams={statsData.teams} />
        )}

        {/* Advanced Metrics View */}
        {viewMode === 'advanced' && statsData && (
          <AdvancedMetrics players={statsData.players} />
        )}

        {/* Main Stats Table */}
        {viewMode !== 'advanced' && (
          <ReactorCard intensity="low" className="overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
            {isLoading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00F5FF]" />
                <p className="text-[#F0F0F0]/60">Loading statistics...</p>
              </div>
            ) : filteredData && (filteredData.players.length > 0 || filteredData.teams.length > 0) ? (
              <StatsTable
                data={(viewMode === 'players' ? filteredData.players : filteredData.teams) as unknown as Array<Record<string, unknown>>}
                viewMode={viewMode}
                category={category}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(field) => {
                  if (sortBy === field) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(field);
                    setSortOrder('desc');
                  }
                }}
              />
            ) : (
              <div className="p-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-[#F0F0F0]/30" />
                <p className="text-[#F0F0F0]/60">No statistics found</p>
              </div>
            )}
            </motion.div>
          </ReactorCard>
        )}
      </div>
    </div>
  );
}

// Mock data fallback
function getMockStatsData(): StatsData {
  return {
    players: [
      {
        id: '1',
        name: 'Patrick Mahomes',
        team: 'KC',
        position: 'QB',
        stats: {
          yards: 4250,
          touchdowns: 32,
          interceptions: 8,
          completions: 385,
          attempts: 560,
          rating: 105.2,
        },
        advanced: {
          epa: 0.28,
          successRate: 0.52,
          cpoe: 4.2,
        },
      },
      {
        id: '2',
        name: 'Josh Allen',
        team: 'BUF',
        position: 'QB',
        stats: {
          yards: 4100,
          touchdowns: 30,
          interceptions: 12,
          completions: 370,
          attempts: 545,
          rating: 98.5,
        },
        advanced: {
          epa: 0.25,
          successRate: 0.50,
          cpoe: 3.8,
        },
      },
    ],
    teams: [
      {
        id: '1',
        name: 'Kansas City Chiefs',
        abbreviation: 'KC',
        stats: {
          pointsFor: 451,
          pointsAgainst: 311,
          totalYards: 6250,
          passingYards: 4250,
          rushingYards: 2000,
        },
        record: { wins: 14, losses: 3, ties: 0 },
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}
