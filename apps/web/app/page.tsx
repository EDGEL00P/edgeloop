/**
 * Home Page - Mobile-First Design
 * 
 * Responsive dashboard for NFL analytics and predictions
 */

'use client';

import { Suspense } from 'react';
import { apiClient } from '@/lib/api/client';
import DashboardSkeleton from './components/DashboardSkeleton';
import Dashboard from './components/Dashboard';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
