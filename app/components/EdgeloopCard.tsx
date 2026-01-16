/**
 * EDGELOOP CARD — NFL Game Card Component
 * Modern 2027 design with MeshPortalMaterial and smooth animations
 * 
 * PURPOSE: Prediction analysis & edge identification
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Target, TrendingUp, Zap, Brain, Wind } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Team {
  id: number;
  abbreviation: string;
  name: string;
  fullName: string;
  record?: string;
  logo?: string;
}

interface OddsData {
  spread: number;
  spreadOdds: number;
  total: number;
  overOdds: number;
  underOdds: number;
  homeML: number;
  awayML: number;
}

interface ModelPrediction {
  homeWinProb: number;
  predictedSpread: number;
  predictedTotal: number;
  edge: number;
  confidence: number;
}

interface ScriptBreaker {
  type: 'steam' | 'rlm' | 'sharp' | 'trap' | 'weather';
  description: string;
  confidence: number;
}

interface EdgeloopCardProps {
  gameId: string;
  homeTeam: Team;
  awayTeam: Team;
  gameTime: string;
  venue?: string;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore?: number;
  awayScore?: number;
  odds: OddsData;
  prediction: ModelPrediction;
  scriptBreakers?: ScriptBreaker[];
  onClick?: () => void;
  onTrackPick?: (type: 'spread' | 'total' | 'ml', selection: string, odds: number) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function EdgeloopCard({
  gameId,
  homeTeam,
  awayTeam,
  gameTime,
  venue,
  status,
  homeScore,
  awayScore,
  odds,
  prediction,
  scriptBreakers = [],
  onClick,
  onTrackPick,
}: EdgeloopCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPick, setSelectedPick] = useState<'spread' | 'total' | 'ml' | null>(null);

  const isLive = status === 'in_progress';
  const isFinal = status === 'final';
  const hasEdge = prediction.edge > 2;
  const edgeIntensity = hasEdge ? (prediction.edge > 5 ? 'critical' : 'med') : 'low';

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleTrackPick = (type: 'spread' | 'total' | 'ml', selection: string, oddsValue: number) => {
    setSelectedPick(type);
    if (onTrackPick) {
      onTrackPick(type, selection, oddsValue);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card-3d p-6 cursor-pointer preserve-3d group"
      onClick={handleCardClick}
    >
      {/* Header: Status + Time + Script Breakers */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="px-2 py-1 rounded text-xs font-bold bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              LIVE
            </span>
          )}
          {isFinal && (
            <span className="px-2 py-1 rounded text-xs font-bold bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
              FINAL
            </span>
          )}
          {!isLive && !isFinal && (
            <span className="px-2 py-1 rounded text-xs font-bold bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/30">
              UPCOMING
            </span>
          )}
          <span className="text-xs text-white/50 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {gameTime}
          </span>
        </div>
        {hasEdge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-[#00F5FF] text-xs font-bold"
          >
            <Target className="w-3 h-3" />
            +{prediction.edge.toFixed(1)}% Edge
          </motion.div>
        )}
      </header>

      {/* Matchup */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{awayTeam.fullName}</div>
            <div className="text-xs text-white/60">{awayTeam.record || ''}</div>
          </div>
          {isLive || isFinal ? (
            <div className="text-2xl font-bold text-white tabular-nums">
              {awayScore || 0}
            </div>
          ) : (
            <div className="text-xs text-white/40 font-mono">
              {awayTeam.abbreviation}
            </div>
          )}
        </div>

        <div className="h-px bg-white/10 my-2" />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{homeTeam.fullName}</div>
            <div className="text-xs text-white/60">{homeTeam.record || ''}</div>
          </div>
          {isLive || isFinal ? (
            <div className="text-2xl font-bold text-white tabular-nums">
              {homeScore || 0}
            </div>
          ) : (
            <div className="text-xs text-white/40 font-mono">
              {homeTeam.abbreviation}
            </div>
          )}
        </div>
      </div>

      {/* Odds & Prediction */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-xs text-white/50 mb-1">Spread</div>
          <div className="text-sm font-bold text-white tabular-nums">
            {homeTeam.abbreviation} {odds.spread > 0 ? '+' : ''}{odds.spread}
          </div>
          <div className="text-xs text-[#00F5FF] font-mono">{odds.spreadOdds}</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-xs text-white/50 mb-1">Total</div>
          <div className="text-sm font-bold text-white tabular-nums">{odds.total}</div>
          <div className="text-xs text-[#00F5FF] font-mono">O/U {odds.overOdds}/{odds.underOdds}</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-xs text-white/50 mb-1">ML</div>
          <div className="text-sm font-bold text-white tabular-nums">
            {homeTeam.abbreviation} {odds.homeML > 0 ? '+' : ''}{odds.homeML}
          </div>
          <div className="text-xs text-[#00F5FF] font-mono">{awayTeam.abbreviation} {odds.awayML > 0 ? '+' : ''}{odds.awayML}</div>
        </div>
      </div>

      {/* Model Prediction */}
      <div className="mb-4 p-3 bg-[#00F5FF]/5 rounded-lg border border-[#00F5FF]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#00F5FF] font-bold uppercase tracking-widest">Model Prediction</span>
          <span className="text-xs text-white/60">{(prediction.confidence * 100).toFixed(0)}% confidence</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-white/50">Win Prob: </span>
            <span className="text-white font-bold">{prediction.homeWinProb.toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-white/50">Spread: </span>
            <span className="text-white font-bold">{homeTeam.abbreviation} {prediction.predictedSpread > 0 ? '+' : ''}{prediction.predictedSpread.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Script Breakers */}
      {scriptBreakers.length > 0 && (
        <div className="mb-4 space-y-1">
          {scriptBreakers.map((breaker, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs p-2 bg-white/5 rounded"
            >
              {breaker.type === 'weather' && <Wind className="w-3 h-3 text-[#00F5FF]" />}
              {breaker.type === 'sharp' && <Zap className="w-3 h-3 text-[#FF4D00]" />}
              {breaker.type === 'steam' && <TrendingUp className="w-3 h-3 text-[#FF4D00]" />}
              {breaker.type === 'rlm' && <Brain className="w-3 h-3 text-[#00F5FF]" />}
              <span className="text-white/70">{breaker.description}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Track Pick Buttons */}
      {onTrackPick && !isFinal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-3 gap-2 mt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleTrackPick('spread', `${homeTeam.abbreviation} ${odds.spread > 0 ? '+' : ''}${odds.spread}`, odds.spreadOdds);
              }}
              className="px-3 py-2 text-xs font-bold bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 border border-[#00F5FF]/30 rounded-lg transition-colors"
            >
              Track Spread
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleTrackPick('total', `Over ${odds.total}`, odds.overOdds);
              }}
              className="px-3 py-2 text-xs font-bold bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 border border-[#00F5FF]/30 rounded-lg transition-colors"
            >
              Track Over
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleTrackPick('ml', `${homeTeam.abbreviation} ML`, odds.homeML);
              }}
              className="px-3 py-2 text-xs font-bold bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 border border-[#00F5FF]/30 rounded-lg transition-colors"
            >
              Track ML
            </motion.button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Venue */}
      {venue && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/40">
          <MapPin className="w-3 h-3" />
          {venue}
        </div>
      )}
    </motion.article>
  );
}
