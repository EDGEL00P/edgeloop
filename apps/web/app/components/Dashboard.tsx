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
 * Streaming + Suspense for live data
 */

import { Suspense } from 'react';
import VirtualDesk from './VirtualDesk';
import RiskStrip from './RiskStrip';
import { PredictionCall } from './PredictionCall';
import { AnalystSummary } from './AnalystSummary';
import NFLGames from './NFLGames';
import DashboardSkeleton from './DashboardSkeleton';

interface DashboardProps {
  homeTeamId?: number;
  awayTeamId?: number;
  season?: number;
  week?: number;
}

export default function Dashboard({
  homeTeamId = 1,
  awayTeamId = 2,
  season,
  week,
}: DashboardProps) {
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

        {/* Prediction Call - Server Component */}
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

        {/* Analyst Summary - Server Component */}
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

        {/* Lower-Third Stats - Flat (Important!) */}
        <div className="mt-8">
          <Suspense fallback={<DashboardSkeleton />}>
            <NFLGames />
          </Suspense>
        </div>
      </div>
    </VirtualDesk>
  );
}
