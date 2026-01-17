/**
 * Home Page - ESPN-Grade 2026 Architecture
 * 
 * Server Components for predictions
 * Streaming + Suspense for live data
 * Event-driven state orchestration
 */

import { Suspense } from 'react';
import Dashboard from './components/Dashboard';
import DashboardSkeleton from './components/DashboardSkeleton';

// Default game IDs (can be made dynamic via searchParams)
export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard homeTeamId={1} awayTeamId={2} />
    </Suspense>
  );
}
