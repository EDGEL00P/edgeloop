/**
 * ♾️ PROTOCOL OMEGA: EDGELOOP OMNISCIENCE
 * 2035 Surveillance HUD - Reality Engine for Market Fracture Detection
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  TrendingUp, 
  Layers, 
  GitBranch,
  AlertTriangle,
  Zap,
  Activity,
  BarChart3,
} from 'lucide-react';
import { FractureScanner } from './exploits/FractureScanner';
import { DeltaScope } from './exploits/DeltaScope';
import { CorridorMatrix } from './exploits/CorridorMatrix';
import { EntanglementEngine } from './exploits/EntanglementEngine';

interface Game {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  status?: string;
}

export function OmniscienceDashboard() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'critical' | 'warning'; message: string }>>([]);

  // Fetch games from real API
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/odds/nfl?refresh=false');
        if (!response.ok) throw new Error('Failed to fetch games');
        
        const data = await response.json();
        const upcomingGames = (data.games || [])
          .filter((g: any) => {
            const gameTime = new Date(g.commenceTime);
            return gameTime > new Date();
          })
          .slice(0, 10)
          .map((g: any) => ({
            gameId: g.gameId,
            homeTeam: g.homeTeam,
            awayTeam: g.awayTeam,
            commenceTime: g.commenceTime,
            status: g.status,
          }));
        
        setGames(upcomingGames);
        if (upcomingGames.length > 0 && !selectedGame) {
          setSelectedGame(upcomingGames[0]);
        }
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    const interval = setInterval(fetchGames, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedGame]);

  // Module components
  const modules = [
    {
      id: 'fracture-scanner',
      name: 'Fracture Scanner',
      icon: Network,
      description: 'Arbitrage Detection Network',
      color: 'text-cyan',
      borderColor: 'border-cyan',
    },
    {
      id: 'delta-scope',
      name: 'Delta Scope',
      icon: TrendingUp,
      description: 'EV Differential Analysis',
      color: 'text-cyan',
      borderColor: 'border-cyan',
    },
    {
      id: 'corridor-matrix',
      name: 'Corridor Matrix',
      icon: Layers,
      description: 'Middles Range Analyzer',
      color: 'text-cyan',
      borderColor: 'border-cyan',
    },
    {
      id: 'entanglement-engine',
      name: 'Entanglement Engine',
      icon: GitBranch,
      description: 'Correlation Heatmap',
      color: 'text-cyan',
      borderColor: 'border-cyan',
    },
  ];

  const handleModuleClick = (moduleId: string) => {
    if (activeModule === moduleId) {
      setActiveModule(null);
    } else {
      setActiveModule(moduleId);
    }
  };

  return (
    <div className="min-h-screen bg-void relative lens-distortion">
      {/* Micro-labels */}
      <div className="absolute top-4 left-4 micro-label">R_SYS_01</div>
      <div className="absolute top-4 right-4 micro-label">TARGET_LOCK</div>
      <div className="absolute bottom-4 left-4 micro-label">LIVE_FEED</div>
      <div className="absolute bottom-4 right-4 micro-label">OMNISCIENCE_ACTIVE</div>

      <div className="max-w-[1920px] mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <header className="diegetic-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="telemetry-large signal-blinding mb-2">
                EDGELOOP OMNISCIENCE
              </h1>
              <p className="telemetry signal-dim">
                Reality Engine v2.0.35 | Market Fracture Detection System
              </p>
            </div>
            <div className="flex items-center gap-4">
              {selectedGame && (
                <div className="telemetry signal-bright">
                  <div className="text-xs signal-dim mb-1">ACTIVE TARGET</div>
                  <div>{selectedGame.awayTeam} @ {selectedGame.homeTeam}</div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan animate-pulse" />
                <span className="telemetry signal-bright">SYSTEM_NORMAL</span>
              </div>
            </div>
          </div>
        </header>

        {/* Game Selector */}
        <div className="diegetic-panel p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="telemetry signal-dim whitespace-nowrap">SELECT TARGET:</span>
            {loading ? (
              <div className="telemetry signal-dim">Loading games...</div>
            ) : (
              games.map((game) => (
                <button
                  key={game.gameId}
                  onClick={() => setSelectedGame(game)}
                  className={`telemetry px-4 py-2 rounded border transition-all deep-scan ${
                    selectedGame?.gameId === game.gameId
                      ? 'border-cyan bg-void-elevated signal-bright'
                      : 'border-gunmetal signal-dim hover:border-cyan'
                  }`}
                >
                  {game.awayTeam} @ {game.homeTeam}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Exploit Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: modules.indexOf(module) * 0.1 }}
            >
              <button
                onClick={() => handleModuleClick(module.id)}
                className={`exploit-module w-full p-6 text-left transition-all ${
                  activeModule === module.id ? 'active' : ''
                } ${alerts.some(a => a.type === 'critical') ? 'critical' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <module.icon className={`w-6 h-6 ${module.color}`} />
                    <div>
                      <h3 className={`telemetry font-bold ${module.color} mb-1`}>
                        {module.name}
                      </h3>
                      <p className="telemetry text-xs signal-dim">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <div className="breaker-toggle" />
                </div>

                {activeModule === module.id && selectedGame && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    {module.id === 'fracture-scanner' && (
                      <FractureScanner gameId={selectedGame.gameId} />
                    )}
                    {module.id === 'delta-scope' && (
                      <DeltaScope 
                        gameId={selectedGame.gameId}
                        homeTeam={selectedGame.homeTeam}
                        awayTeam={selectedGame.awayTeam}
                      />
                    )}
                    {module.id === 'corridor-matrix' && (
                      <CorridorMatrix 
                        gameId={selectedGame.gameId}
                        homeTeam={selectedGame.homeTeam}
                        awayTeam={selectedGame.awayTeam}
                      />
                    )}
                    {module.id === 'entanglement-engine' && (
                      <EntanglementEngine 
                        gameId={selectedGame.gameId}
                        homeTeam={selectedGame.homeTeam}
                        awayTeam={selectedGame.awayTeam}
                      />
                    )}
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* System Status */}
        <div className="diegetic-panel p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="telemetry">
              <div className="text-xs signal-dim mb-1">DATA_SOURCE</div>
              <div className="signal-bright">BallDontLie API</div>
            </div>
            <div className="telemetry">
              <div className="text-xs signal-dim mb-1">LATENCY</div>
              <div className="signal-bright">&lt; 200ms</div>
            </div>
            <div className="telemetry">
              <div className="text-xs signal-dim mb-1">FRACTURES_DETECTED</div>
              <div className="signal-bright">0</div>
            </div>
            <div className="telemetry">
              <div className="text-xs signal-dim mb-1">SYSTEM_STATUS</div>
              <div className="signal-bright">OPERATIONAL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
