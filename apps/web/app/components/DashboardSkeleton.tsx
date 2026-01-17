/**
 * Dashboard Loading Skeleton
 * Mobile-first responsive skeleton loader
 */

export default function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="h-12 bg-muted animate-pulse rounded-lg" />

      {/* Cards grid - responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
