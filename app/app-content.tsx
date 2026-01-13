'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from "@/_components/ui/toaster";
import { Navigation } from "@/_components/Navigation";
import { AIChat } from "@/_components/AIChat";
import { MobileBottomNav } from "@/_components/MobileBottomNav";
import { FloatingBetSlip } from "@/_components/FloatingBetSlip";
import { useSettings } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import Landing from "@/pages/Landing";

function LoadingScreen() {
  return (
    <div 
      className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"
      data-testid="loading-screen"
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          width="60"
          height="60"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-spin"
        >
          <path
            d="M40 8C22.327 8 8 22.327 8 40C8 57.673 22.327 72 40 72"
            stroke="#CD1141"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M40 72C57.673 72 72 57.673 72 40C72 22.327 57.673 8 40 8"
            stroke="#1e3a5f"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { reduceMotion, themeIntensity } = useSettings();

  return (
    <div 
      className={cn(
        "min-h-screen bg-background dark",
        reduceMotion && "reduce-motion",
        themeIntensity === 'low' && "intensity-low",
        themeIntensity === 'high' && "intensity-high"
      )}
    >
      <Navigation />
      <main className="min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <Toaster />
      <AIChat />
      <FloatingBetSlip />
      <MobileBottomNav />
    </div>
  );
}

export function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp>{children}</AuthenticatedApp>;
}
