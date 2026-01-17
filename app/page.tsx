/**
 * Home Page - ESPN-Grade 2026 Architecture
 * 
 * Server Components for predictions
 * Streaming + Suspense for live data
 * Event-driven state orchestration
 * Fetches real games from API - no hardcoded values
 */

import { Suspense } from 'react';
import Dashboard from './components/Dashboard';
import DashboardSkeleton from './components/DashboardSkeleton';

// Fetches first upcoming game from API
// Can be made dynamic via searchParams for specific games
export default function HomePage({
  searchParams,
}: {
  searchParams?: { homeTeamId?: string; awayTeamId?: string; season?: string; week?: string };
}) {
  const homeTeamId = searchParams?.homeTeamId ? parseInt(searchParams.homeTeamId) : undefined;
  const awayTeamId = searchParams?.awayTeamId ? parseInt(searchParams.awayTeamId) : undefined;
  const season = searchParams?.season ? parseInt(searchParams.season) : undefined;
  const week = searchParams?.week ? parseInt(searchParams.week) : undefined;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard 
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        season={season}
        week={week}
      />
    </Suspense>
  );
}
