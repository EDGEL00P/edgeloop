/**
 * NFL Games Component
 * 
 * Displays NFL games with BALLDONTLIE API data
 */

'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface Game {
  id: number;
  visitor_team: {
    abbreviation: string;
    full_name: string;
  };
  home_team: {
    abbreviation: string;
    full_name: string;
  };
  week: number;
  season: number;
  status: string;
  home_team_score: number | null;
  visitor_team_score: number | null;
  date: string;
}

export default function NFLGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(1);

  useEffect(() => {
    loadGames();
  }, [season, week]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getGames({
        season,
        week,
        per_page: 50,
      });
      setGames(response.data || []);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="card-base p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          NFL Games
        </h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Season</label>
            <input
              type="number"
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="px-3 py-2 bg-input border border-border rounded-md text-foreground"
              min="2002"
              max={new Date().getFullYear()}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Week</label>
            <input
              type="number"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="px-3 py-2 bg-input border border-border rounded-md text-foreground"
              min="1"
              max="18"
            />
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-3">
        {games.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No games found</p>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Game Info */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(game.date)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      game.status === 'Final' ? 'bg-green-500/20 text-green-500' :
                      game.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {game.status}
                    </span>
                  </div>
                  
                  {/* Teams */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {game.visitor_team.abbreviation}
                      </span>
                      {game.visitor_team_score !== null && (
                        <span className="font-bold text-lg">
                          {game.visitor_team_score}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {game.home_team.abbreviation}
                      </span>
                      {game.home_team_score !== null && (
                        <span className="font-bold text-lg">
                          {game.home_team_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <button className="btn-primary text-sm px-4 py-2">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
