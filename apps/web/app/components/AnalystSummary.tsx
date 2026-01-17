/**
 * Analyst Summary - Server Component
 * 
 * Breakdown points as 3D studio panels (Halftime Style)
 * Rendered on server
 */

import 'server-only';
import { apiClient } from '@/lib/api/client';

interface AnalystSummaryProps {
  homeTeamId: number;
  awayTeamId: number;
  season?: number;
  week?: number;
}

interface BreakdownPoint {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'pressure' | 'injury' | 'market' | 'form' | 'matchup';
}

export async function AnalystSummary({
  homeTeamId,
  awayTeamId,
  season = new Date().getFullYear(),
  week,
}: AnalystSummaryProps) {
  try {
    const prediction = await apiClient.getGenesisPrediction({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      season,
      week,
    });

    // Generate breakdown points from prediction data
    const breakdowns: BreakdownPoint[] = [];
    
    // Pressure mismatch analysis
    if (Math.abs(prediction.home_robustness - prediction.away_robustness) > 0.15) {
      breakdowns.push({
        title: 'PRESSURE MISMATCH',
        description: prediction.home_robustness > prediction.away_robustness
          ? `Home team (${prediction.home_team_id}) has multiple offensive pathways`
          : `Away team (${prediction.away_team_id}) offense more predictable`,
        severity: 'high',
        category: 'pressure',
      });
    }
    
    // Form analysis
    if (Math.abs(prediction.home_form - prediction.away_form) > 0.1) {
      breakdowns.push({
        title: 'FORM DISCREPANCY',
        description: prediction.home_form > prediction.away_form
          ? 'Home team showing better form and rest indicators'
          : 'Away team displaying fatigue signals',
        severity: 'medium',
        category: 'form',
      });
    }
    
    // Market lag (if confidence indicates edge)
    const calculatedEdge = prediction.confidence > 0.7 ? (prediction.confidence - 0.7) * 10 : 0;
    if (calculatedEdge > 3) {
      breakdowns.push({
        title: 'MARKET LAG',
        description: `Current line not reflecting ${calculatedEdge.toFixed(1)}% edge`,
        severity: 'medium',
        category: 'market',
      });
    }
    
    // Confidence indicator
    if (prediction.confidence < 0.6) {
      breakdowns.push({
        title: 'LOW CONFIDENCE',
        description: 'Multiple conflicting signals in model output',
        severity: 'low',
        category: 'matchup',
      });
    }

    return (
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-mono">
          ANALYST BREAKDOWN
        </div>
        
        <div className="grid gap-4">
          {breakdowns.map((breakdown, index) => (
            <div
              key={index}
              className="studio-panel studio-light-rim"
              style={{
                transform: `translateZ(${index * 5}px)`,
              }}
            >
              <div className="broadcast-spacing">
                <div className={`text-xs uppercase tracking-wider font-bold mb-2 ${
                  breakdown.severity === 'high' ? 'risk-high' :
                  breakdown.severity === 'medium' ? 'text-orange-400' :
                  'text-slate-400'
                }`}>
                  {breakdown.title}
                </div>
                <div className="text-sm text-slate-300">
                  {breakdown.description}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {breakdowns.length === 0 && (
          <div className="studio-panel broadcast-spacing text-slate-400 text-sm">
            No significant breakdown points identified
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Failed to load analyst summary:', error);
    return (
      <div className="studio-panel broadcast-spacing text-slate-400">
        Failed to load analyst breakdown
      </div>
    );
  }
}
