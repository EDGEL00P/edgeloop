/**
 * STATS FILTERS - V3 Design System
 * Filter and sort controls with ReactorCard styling
 */

'use client';

import { Filter, Search } from 'lucide-react';
import { ReactorCard } from '../../components/ReactorCard';

interface StatsFiltersProps {
  category: 'passing' | 'rushing' | 'receiving' | 'defense' | 'kicking' | 'all';
  setCategory: (cat: 'passing' | 'rushing' | 'receiving' | 'defense' | 'kicking' | 'all') => void;
  viewMode: 'players' | 'teams' | 'advanced';
  setViewMode: (mode: 'players' | 'teams' | 'advanced') => void;
  season: number;
  setSeason: (season: number) => void;
  week: number | 'all';
  setWeek: (week: number | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export function StatsFilters({
  category,
  setCategory,
  viewMode,
  setViewMode,
  season,
  setSeason,
  week,
  setWeek,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: StatsFiltersProps) {
  const categories = [
    { value: 'all', label: 'All' },
    { value: 'passing', label: 'Passing' },
    { value: 'rushing', label: 'Rushing' },
    { value: 'receiving', label: 'Receiving' },
    { value: 'defense', label: 'Defense' },
    { value: 'kicking', label: 'Kicking' },
  ];

  const viewModes = [
    { value: 'players', label: 'Players' },
    { value: 'teams', label: 'Teams' },
    { value: 'advanced', label: 'Advanced' },
  ];

  return (
    <ReactorCard intensity="low" className="mb-6">
      <div className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-[#00F5FF]" />
          <span className="text-sm font-bold text-[#F0F0F0]/70 uppercase tracking-wider">
            VIEW_MODE
          </span>
          <div className="flex gap-2">
            {viewModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value as typeof viewMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode.value
                    ? 'bg-[#00F5FF] text-[#080808] font-bold'
                    : 'bg-[#0A1A2E]/50 text-[#F0F0F0]/60 hover:bg-[#0A1A2E]/70'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-xs text-[#F0F0F0]/50 mb-2 uppercase tracking-wider">
              CATEGORY
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as typeof category)
              }
              className="w-full px-4 py-2 rounded-lg bg-[#0A1A2E]/50 border border-[#152B47] text-[#F0F0F0] focus:outline-none focus:border-[#00F5FF]/50"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Season/Week */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-[#F0F0F0]/50 mb-2 uppercase tracking-wider">
                SEASON
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2 rounded-lg bg-[#0A1A2E]/50 border border-[#152B47] text-[#F0F0F0] focus:outline-none focus:border-[#00F5FF]/50"
              >
                {Array.from({ length: 5 }, (_, i) => 2021 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#F0F0F0]/50 mb-2 uppercase tracking-wider">
                WEEK
              </label>
              <select
                value={week}
                onChange={(e) =>
                  setWeek(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                }
                className="w-full px-4 py-2 rounded-lg bg-[#0A1A2E]/50 border border-[#152B47] text-[#F0F0F0] focus:outline-none focus:border-[#00F5FF]/50"
              >
                <option value="all">All</option>
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs text-[#F0F0F0]/50 mb-2 uppercase tracking-wider">
              SEARCH
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0F0F0]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players/teams..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#080808]/50 border border-[#2C2F33] text-[#F0F0F0] placeholder:text-[#F0F0F0]/30 focus:outline-none focus:border-[#00F5FF]/50"
              />
            </div>
          </div>
        </div>
      </div>
    </ReactorCard>
  );
}
