'use client';

/**
 * PICKS TRACKER — 2026 UX/UI COMPONENT
 * Track predictions, analyze performance, identify edges
 * 
 * PURPOSE: Prediction tracking & analysis (NOT betting)
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  Target,
  TrendingUp,
  TrendingDown,
  Check,
  BarChart3,
  Clock,
  Star,
  StarOff,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TrackedPick {
  id: string;
  gameId: string;
  type: 'spread' | 'total' | 'moneyline' | 'prop';
  selection: string;
  line?: number;
  odds: number;
  team?: string;
  description: string;
  modelConfidence: number;
  edge: number;
  timestamp: Date;
  starred?: boolean;
  result?: 'win' | 'loss' | 'push' | 'pending';
}

interface PicksTrackerProps {
  picks: TrackedPick[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onToggleStar: (id: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function formatOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

function getEdgeColor(edge: number): string {
  if (edge >= 5) return 'text-[hsl(145_80%_55%)]';
  if (edge >= 2) return 'text-[hsl(185_100%_60%)]';
  if (edge >= 0) return 'text-[hsl(45_100%_55%)]';
  return 'text-[hsl(348_100%_65%)]';
}

function getEdgeBg(edge: number): string {
  if (edge >= 5) return 'bg-[hsl(145_80%_42%/0.15)]';
  if (edge >= 2) return 'bg-[hsl(185_100%_50%/0.15)]';
  if (edge >= 0) return 'bg-[hsl(45_100%_50%/0.15)]';
  return 'bg-[hsl(348_100%_55%/0.15)]';
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PicksTracker({
  picks,
  onRemove,
  onClear,
  onToggleStar,
}: PicksTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'edge' | 'confidence'>('edge');

  // Sort picks
  const sortedPicks = useMemo(() => {
    return [...picks].sort((a, b) => {
      if (sortBy === 'edge') return b.edge - a.edge;
      if (sortBy === 'confidence') return b.modelConfidence - a.modelConfidence;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [picks, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const starredCount = picks.filter((p) => p.starred).length;
    const avgEdge = picks.length > 0
      ? picks.reduce((acc, p) => acc + p.edge, 0) / picks.length
      : 0;
    const avgConfidence = picks.length > 0
      ? picks.reduce((acc, p) => acc + p.modelConfidence, 0) / picks.length
      : 0;
    
    return { starredCount, avgEdge, avgConfidence };
  }, [picks]);

  // Handle swipe to dismiss
  const handleDragEnd = (info: PanInfo) => {
    if (info.offset.y > 100) {
      setIsExpanded(false);
    }
  };

  if (picks.length === 0) {
    return null;
  }

  return (
    <>
      {/* Collapsed indicator */}
      {!isExpanded && (
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 
                     flex items-center gap-3 px-6 py-4
                     bg-[hsl(185_100%_50%)] text-[hsl(220_20%_4%)]
                     rounded-full font-bold shadow-lg
                     hover:scale-105 transition-transform"
          style={{
            boxShadow: '0 0 30px hsl(185 100% 50% / 0.4)',
          }}
          onClick={() => setIsExpanded(true)}
        >
          <Target className="w-5 h-5" />
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {picks.length}
          </span>
          <span>Tracked Picks</span>
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}

      {/* Expanded panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => handleDragEnd(info)}
            className="fixed bottom-0 left-0 right-0 z-50 
                       max-h-[85vh] overflow-hidden
                       bg-[hsl(220_18%_8%/0.95)] backdrop-blur-xl
                       border-t border-[hsl(0_0%_100%/0.1)]
                       rounded-t-3xl shadow-2xl"
            style={{
              boxShadow: '0 -20px 60px hsl(0 0% 0% / 0.5)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-[hsl(185_100%_60%)]" />
                <h2 className="text-lg font-bold">Tracked Picks</h2>
                <span className="badge-neon badge-cyan">
                  {picks.length} {picks.length === 1 ? 'Pick' : 'Picks'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClear}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 
                           hover:text-white transition-colors"
                  title="Clear all picks"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 
                           hover:text-white transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Starred</div>
                  <div className="font-mono font-bold text-[hsl(45_100%_60%)]">
                    {stats.starredCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Avg Edge</div>
                  <div className={`font-mono font-bold ${getEdgeColor(stats.avgEdge)}`}>
                    {stats.avgEdge > 0 ? '+' : ''}{stats.avgEdge.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Avg Confidence</div>
                  <div className="font-mono font-bold text-[hsl(185_100%_60%)]">
                    {Math.round(stats.avgConfidence * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Sort options */}
            <div className="px-6 pb-4">
              <div className="flex gap-2">
                {(['edge', 'confidence', 'time'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                              ${sortBy === option
                                ? 'bg-[hsl(185_100%_50%)] text-[hsl(220_20%_4%)]'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                  >
                    {option === 'edge' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                    {option === 'confidence' && <BarChart3 className="w-3 h-3 inline mr-1" />}
                    {option === 'time' && <Clock className="w-3 h-3 inline mr-1" />}
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Picks list */}
            <div className="px-6 overflow-y-auto max-h-[45vh] space-y-3 pb-6">
              {sortedPicks.map((pick) => (
                <motion.div
                  key={pick.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`p-4 rounded-xl border transition-all
                            ${pick.starred
                              ? 'bg-[hsl(45_100%_50%/0.05)] border-[hsl(45_100%_50%/0.3)]'
                              : 'bg-white/5 border-white/10'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{pick.selection}</span>
                        <span className="font-mono text-[hsl(185_100%_60%)]">
                          {formatOdds(pick.odds)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono
                                        ${getEdgeBg(pick.edge)} ${getEdgeColor(pick.edge)}`}>
                          {pick.edge > 0 ? '+' : ''}{pick.edge.toFixed(1)}% EDGE
                        </span>
                      </div>
                      <p className="text-sm text-white/60">{pick.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleStar(pick.id)}
                        className={`p-1.5 rounded-lg transition-colors
                                  ${pick.starred
                                    ? 'text-[hsl(45_100%_60%)] hover:bg-[hsl(45_100%_50%/0.1)]'
                                    : 'text-white/40 hover:bg-white/10 hover:text-white'}`}
                      >
                        {pick.starred ? (
                          <Star className="w-4 h-4 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onRemove(pick.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 
                                 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pick metrics */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/60">Confidence:</span>
                      <span className="font-mono font-bold text-[hsl(185_100%_60%)]">
                        {Math.round(pick.modelConfidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/40 font-mono">
                        {new Date(pick.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {pick.result && pick.result !== 'pending' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
                                  ${pick.result === 'win'
                                    ? 'bg-[hsl(145_80%_42%/0.15)] text-[hsl(145_80%_55%)]'
                                    : pick.result === 'loss'
                                      ? 'bg-[hsl(348_100%_55%/0.15)] text-[hsl(348_100%_65%)]'
                                      : 'bg-white/10 text-white/60'}`}
                      >
                        {pick.result}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer note */}
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
              <p className="text-xs text-center text-white/40">
                <Target className="w-3.5 h-3.5 inline mr-1" />
                Track predictions • Analyze edges • Study results
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
