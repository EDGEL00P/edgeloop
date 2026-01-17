/**
 * Dashboard Component
 * 
 * Main dashboard with mobile-first responsive layout
 */

'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import NFLGames from './NFLGames';
import PredictionEngine from './PredictionEngine';

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check API connection
    apiClient.health()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Professional Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                EDGELOOP GENESIS
              </h1>
              <p className="text-slate-400 text-sm md:text-base font-medium">
                Advanced NFL Prediction Engine • TDA • LTC • Active Inference
              </p>
            </div>
            
            {/* API Status Badge */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-300 font-medium">
                {isConnected ? 'ENGINE ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </header>

        {/* Genesis Predictions - Primary Feature */}
        <div className="mb-10">
          <PredictionEngine />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/30 p-6 hover:border-blue-600/50 transition-all cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <h3 className="text-lg font-bold text-blue-300 mb-2">Kelly Calculator</h3>
              <p className="text-sm text-slate-400">
                Optimal bet sizing algorithm
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30 p-6 hover:border-purple-600/50 transition-all cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <h3 className="text-lg font-bold text-purple-300 mb-2">Live Odds</h3>
              <p className="text-sm text-slate-400">
                Real-time sportsbook feeds
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-700/30 p-6 hover:border-cyan-600/50 transition-all cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <h3 className="text-lg font-bold text-cyan-300 mb-2">Team Analytics</h3>
              <p className="text-sm text-slate-400">
                Robustness & form metrics
              </p>
            </div>
          </div>
        </div>

        {/* NFL Games */}
        <div className="mt-8">
          <NFLGames />
        </div>

      </div>
    </div>
  );
}
