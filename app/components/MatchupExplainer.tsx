'use client';

/**
 * MATCHUP EXPLAINER — Feature contribution visualization
 * Shows WHY the model made its prediction with SHAP-style bars
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowUp, ArrowDown, Info, AlertTriangle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FeatureContribution {
  feature: string;
  value: number; // The raw value of the feature
  contribution: number; // SHAP/contribution value (-100 to 100 scale for display)
  description: string;
  category: 'offense' | 'defense' | 'special_teams' | 'situational' | 'market';
  confidence?: number;
}

interface MatchupExplainerProps {
  contributions: FeatureContribution[];
  homeTeam: string;
  awayTeam: string;
  predictionType: 'spread' | 'total' | 'moneyline';
  predictedValue: number;
  marketValue: number;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_CONFIG = {
  offense: { 
    color: 'hsl(145, 80%, 55%)', 
    bgColor: 'hsl(145, 80%, 55%, 0.1)',
    label: 'Offense' 
  },
  defense: { 
    color: 'hsl(185, 100%, 55%)', 
    bgColor: 'hsl(185, 100%, 55%, 0.1)',
    label: 'Defense' 
  },
  special_teams: { 
    color: 'hsl(45, 100%, 55%)', 
    bgColor: 'hsl(45, 100%, 55%, 0.1)',
    label: 'Special Teams' 
  },
  situational: { 
    color: 'hsl(280, 80%, 60%)', 
    bgColor: 'hsl(280, 80%, 60%, 0.1)',
    label: 'Situational' 
  },
  market: { 
    color: 'hsl(30, 100%, 55%)', 
    bgColor: 'hsl(30, 100%, 55%, 0.1)',
    label: 'Market' 
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FeatureBarProps {
  contribution: FeatureContribution;
  maxAbsContribution: number;
  index: number;
}

function FeatureBar({ contribution, maxAbsContribution, index }: FeatureBarProps) {
  const config = CATEGORY_CONFIG[contribution.category];
  const isPositive = contribution.contribution > 0;
  const absWidth = Math.min(100, (Math.abs(contribution.contribution) / maxAbsContribution) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isPositive ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
    >
      <div className="flex items-center gap-3">
        {/* Feature name */}
        <div className="w-32 text-right flex-shrink-0">
          <span className="text-xs text-white/70 truncate">{contribution.feature}</span>
        </div>
        
        {/* Bar container */}
        <div className="flex-1 flex items-center h-6">
          {/* Negative side */}
          <div className="flex-1 flex justify-end">
            {!isPositive && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${absWidth}%` }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                className="h-5 rounded-l-sm flex items-center justify-start pl-1"
                style={{ backgroundColor: 'hsl(348, 100%, 60%, 0.3)' }}
              >
                <span className="text-[10px] font-mono text-[hsl(348_100%_65%)]">
                  {contribution.contribution.toFixed(1)}
                </span>
              </motion.div>
            )}
          </div>
          
          {/* Center line */}
          <div className="w-px h-8 bg-white/20 flex-shrink-0" />
          
          {/* Positive side */}
          <div className="flex-1 flex justify-start">
            {isPositive && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${absWidth}%` }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                className="h-5 rounded-r-sm flex items-center justify-end pr-1"
                style={{ backgroundColor: 'hsl(145, 80%, 55%, 0.3)' }}
              >
                <span className="text-[10px] font-mono text-[hsl(145_80%_55%)]">
                  +{contribution.contribution.toFixed(1)}
                </span>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Value */}
        <div className="w-16 flex-shrink-0">
          <span className="text-xs font-mono text-white/50">
            {typeof contribution.value === 'number' 
              ? contribution.value.toFixed(1) 
              : contribution.value}
          </span>
        </div>
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 
                    opacity-0 group-hover:opacity-100 transition-opacity
                    bg-[hsl(220_18%_8%)] border border-white/10 rounded-lg p-2
                    shadow-xl z-10 pointer-events-none w-64">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: config.color }} 
          />
          <span className="text-xs font-bold">{contribution.feature}</span>
        </div>
        <p className="text-xs text-white/60">{contribution.description}</p>
        {contribution.confidence && (
          <div className="mt-1 text-[10px] text-white/40">
            Confidence: {(contribution.confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function MatchupExplainer({
  contributions,
  homeTeam,
  awayTeam,
  predictionType,
  predictedValue,
  marketValue,
  className = '',
}: MatchupExplainerProps) {
  // Sort by absolute contribution
  const sortedContributions = useMemo(() => {
    return [...contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }, [contributions]);

  // Max absolute contribution for scaling
  const maxAbsContribution = useMemo(() => {
    return Math.max(...contributions.map((c) => Math.abs(c.contribution)), 1);
  }, [contributions]);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    contributions.forEach((c) => {
      totals[c.category] = (totals[c.category] || 0) + c.contribution;
    });
    return totals;
  }, [contributions]);

  // Net contribution
  const netContribution = useMemo(() => {
    return contributions.reduce((sum, c) => sum + c.contribution, 0);
  }, [contributions]);

  // Edge calculation
  const edge = predictedValue - marketValue;
  const hasEdge = Math.abs(edge) > 1;

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[hsl(45_100%_60%)]" />
          <h3 className="font-bold">Why This Prediction?</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">
            {predictionType === 'spread' ? 'Spread' : 
             predictionType === 'total' ? 'Total' : 'Win Prob'}
          </span>
        </div>
      </div>

      {/* Prediction vs Market */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-white/[0.03] text-center">
          <div className="text-xs text-white/50 mb-1">Model</div>
          <div className="text-xl font-mono font-bold text-[hsl(185_100%_60%)]">
            {predictionType === 'spread' && predictedValue > 0 && '+'}
            {predictedValue.toFixed(1)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] text-center">
          <div className="text-xs text-white/50 mb-1">Market</div>
          <div className="text-xl font-mono font-bold text-white/70">
            {predictionType === 'spread' && marketValue > 0 && '+'}
            {marketValue.toFixed(1)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] text-center">
          <div className="text-xs text-white/50 mb-1">Edge</div>
          <div className={`text-xl font-mono font-bold ${
            hasEdge ? (edge > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]') : 'text-white/50'
          }`}>
            {edge > 0 ? '+' : ''}{edge.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Category breakdown pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(categoryTotals).map(([category, total]) => {
          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
          if (!config) return null;
          
          return (
            <div
              key={category}
              className="flex items-center gap-2 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: config.bgColor }}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: config.color }} 
              />
              <span style={{ color: config.color }}>{config.label}</span>
              <span className={`font-mono ${total > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                {total > 0 ? '+' : ''}{total.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Feature bars */}
      <div className="space-y-2 mb-4">
        {/* Header */}
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <div className="w-32 text-right">FACTOR</div>
          <div className="flex-1 flex items-center">
            <div className="flex-1 text-right pr-2">← {awayTeam}</div>
            <div className="w-px" />
            <div className="flex-1 text-left pl-2">{homeTeam} →</div>
          </div>
          <div className="w-16">VALUE</div>
        </div>
        
        {/* Bars */}
        {sortedContributions.slice(0, 8).map((contribution, index) => (
          <FeatureBar
            key={contribution.feature}
            contribution={contribution}
            maxAbsContribution={maxAbsContribution}
            index={index}
          />
        ))}
      </div>

      {/* Net summary */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white/50" />
            <span className="text-sm">Net Factor Advantage</span>
          </div>
          <div className={`flex items-center gap-1 font-mono font-bold ${
            netContribution > 0 ? 'text-[hsl(145_80%_55%)]' : 
            netContribution < 0 ? 'text-[hsl(348_100%_60%)]' : 'text-white/50'
          }`}>
            {netContribution > 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : netContribution < 0 ? (
              <ArrowDown className="w-4 h-4" />
            ) : null}
            <span>{netContribution > 0 ? '+' : ''}{netContribution.toFixed(1)}</span>
          </div>
        </div>
        
        {hasEdge && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${edge > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(45_100%_60%)]'}`} />
            <span className="text-xs text-white/60">
              {edge > 0 
                ? `Model sees ${Math.abs(edge).toFixed(1)} point value on ${homeTeam}` 
                : `Model sees ${Math.abs(edge).toFixed(1)} point value on ${awayTeam}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateMockContributions(
  homeTeam: string,
  awayTeam: string
): FeatureContribution[] {
  return [
    {
      feature: 'Offensive EPA',
      value: 0.15,
      contribution: 3.2,
      description: `${homeTeam} ranks 5th in offensive EPA per play this season`,
      category: 'offense',
      confidence: 0.85,
    },
    {
      feature: 'Defensive DVOA',
      value: -8.2,
      contribution: 2.8,
      description: `${homeTeam} defense ranks 8th in DVOA, limiting opponents`,
      category: 'defense',
      confidence: 0.82,
    },
    {
      feature: 'Pass Rush Rate',
      value: 42,
      contribution: -1.5,
      description: `${awayTeam} generates pressure on 42% of dropbacks`,
      category: 'defense',
      confidence: 0.78,
    },
    {
      feature: 'Red Zone TD%',
      value: 68,
      contribution: 1.8,
      description: `${homeTeam} converts 68% of red zone trips to touchdowns`,
      category: 'offense',
      confidence: 0.75,
    },
    {
      feature: 'Turnover Margin',
      value: 8,
      contribution: 2.1,
      description: `${homeTeam} is +8 in turnover margin this season`,
      category: 'situational',
      confidence: 0.72,
    },
    {
      feature: 'Home Field Adj',
      value: 2.5,
      contribution: 2.5,
      description: 'Historical home field advantage adjustment',
      category: 'situational',
      confidence: 0.90,
    },
    {
      feature: 'Sharp Money',
      value: 65,
      contribution: 1.2,
      description: '65% of sharp money on this side',
      category: 'market',
      confidence: 0.68,
    },
    {
      feature: 'Rest Advantage',
      value: 3,
      contribution: 0.8,
      description: `${homeTeam} has 3 extra days rest`,
      category: 'situational',
      confidence: 0.65,
    },
    {
      feature: 'QB Rating',
      value: 98.5,
      contribution: -0.5,
      description: `${awayTeam} QB has 98.5 passer rating on season`,
      category: 'offense',
      confidence: 0.80,
    },
    {
      feature: 'Special Teams',
      value: 2.1,
      contribution: 0.6,
      description: `${homeTeam} ranks 6th in special teams DVOA`,
      category: 'special_teams',
      confidence: 0.60,
    },
  ];
}
