/**
 * Dashboard - ESPN-Grade 2026 Architecture
 * 
 * Uses Server Components for:
 * - Prediction Call
 * - Analyst Summary
 * 
 * Uses Client Components for:
 * - Risk Strip (event-driven)
 * - Interactive elements
 * 
 * Fetches real games from API - no hardcoded values
 */

import { Suspense } from 'react';
import VirtualDesk from './VirtualDesk';
import RiskStrip from './RiskStrip';
import { PredictionCall } from './PredictionCall';
import { AnalystSummary } from './AnalystSummary';
import NFLGames from './NFLGames';
import DashboardSkeleton from './DashboardSkeleton';
import { apiClient } from '@/lib/api/client';

interface DashboardProps {
  homeTeamId?: number;
  awayTeamId?: number;
  season?: number;
  week?: number;
}

// Server Component to fetch first upcoming game
async function FeaturedGame({ season, week }: { season?: number; week?: number }) {
  try {
    const currentSeason = season || new Date().getFullYear();
    const currentWeek = week || Math.ceil(new Date().getDate() / 7) || 1;
    
    // Fetch games from API
    const gamesResponse = await apiClient.getGames({
      season: currentSeason,
      week: currentWeek,
      per_page: 1,
    });

    const firstGame = gamesResponse.data?.[0];
    
    if (!firstGame) {
      return null;
    }

    return {
      homeTeamId: firstGame.home_team?.id || firstGame.home_team_id,
      awayTeamId: firstGame.visitor_team?.id || firstGame.visitor_team_id,
      season: firstGame.season || currentSeason,
      week: firstGame.week || currentWeek,
    };
  } catch (error) {
    console.error('Failed to fetch featured game:', error);
    return null;
  }
}

export default async function Dashboard({
  homeTeamId: providedHomeTeamId,
  awayTeamId: providedAwayTeamId,
  season: providedSeason,
  week: providedWeek,
}: DashboardProps) {
  // Use provided IDs or fetch from API
  let homeTeamId = providedHomeTeamId;
  let awayTeamId = providedAwayTeamId;
  let season = providedSeason;
  let week = providedWeek;

  // If no team IDs provided, fetch first upcoming game from API
  if (!homeTeamId || !awayTeamId) {
    const featuredGame = await FeaturedGame({ season, week });
    if (featuredGame) {
      homeTeamId = featuredGame.homeTeamId;
      awayTeamId = featuredGame.awayTeamId;
      season = featuredGame.season;
      week = featuredGame.week;
    } else {
      // Fallback: fetch any available game
      try {
        const gamesResponse = await apiClient.getGames({
          season: season || new Date().getFullYear(),
          per_page: 1,
        });
        const firstGame = gamesResponse.data?.[0];
        if (firstGame) {
          homeTeamId = firstGame.home_team?.id || firstGame.home_team_id;
          awayTeamId = firstGame.visitor_team?.id || firstGame.visitor_team_id;
          season = firstGame.season || season;
          week = firstGame.week || week;
        }
      } catch (error) {
        console.error('Failed to fetch fallback game:', error);
      }
    }
  }

  // If still no valid IDs, show error state
  if (!homeTeamId || !awayTeamId) {
    return (
      <VirtualDesk>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="studio-panel broadcast-spacing text-slate-400">
            No games available. Please check API connection.
          </div>
        </div>
      </VirtualDesk>
    );
  }

  return (
    <VirtualDesk>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header - Flat, Fast, Familiar */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                EDGELOOP
              </h1>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                NFL Prediction Intelligence
              </p>
            </div>
          </div>
        </header>

        {/* Risk Strip - Event-Driven */}
        <div className="mb-6">
          <RiskStrip />
        </div>

        {/* Prediction Call - Server Component (Real API Data) */}
        <div className="mb-8">
          <Suspense fallback={<div className="studio-panel broadcast-spacing animate-pulse h-48" />}>
            <PredictionCall
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              season={season}
              week={week}
            />
          </Suspense>
        </div>

        {/* Analyst Summary - Server Component (Real API Data) */}
        <div className="mb-8">
          <Suspense fallback={<div className="studio-panel broadcast-spacing animate-pulse h-32" />}>
            <AnalystSummary
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              season={season}
              week={week}
            />
          </Suspense>
        </div>

        {/* Lower-Third Stats - Flat (Important!) - Real API Data */}
        <div className="mt-8">
          <Suspense fallback={<DashboardSkeleton />}>
            <NFLGames />
          </Suspense>
        </div>
      </div>
    </VirtualDesk>
  );
}
