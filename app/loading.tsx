/**
 * edgeloop LOADING STATE
 * Streaming UI with Skeleton Screens for instant perceived performance
 */

import { SkeletonCard } from './components/SkeletonCard';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Skeleton */}
        <div className="mb-12">
          <div className="h-8 w-64 skeleton mb-4" />
          <div className="h-4 w-96 skeleton mb-2" />
          <div className="h-4 w-80 skeleton" />
        </div>

        {/* Bento Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} delay={i * 50} />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <div className="h-6 w-48 skeleton" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-edgeloop p-6 space-y-4">
                <div className="h-5 w-32 skeleton" />
                <div className="h-4 w-full skeleton" />
                <div className="h-4 w-5/6 skeleton" />
                <div className="h-4 w-4/6 skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
