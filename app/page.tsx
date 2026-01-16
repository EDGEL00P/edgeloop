'use client';

import { Suspense } from 'react';
import Dashboard from './dashboard';

// Protocol Omega Skeleton loader
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A1A2E] relative">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="card-3d p-6 animate-pulse">
          <div className="h-8 w-64 bg-nfl-gunmetal mb-2" />
          <div className="h-4 w-96 bg-nfl-gunmetal" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-3d p-6 animate-pulse">
              <div className="h-6 w-3/4 bg-nfl-gunmetal mb-4" />
              <div className="h-4 w-full bg-nfl-gunmetal mb-2" />
              <div className="h-20 w-full bg-nfl-gunmetal rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
