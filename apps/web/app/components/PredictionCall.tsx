/**
 * Prediction Call - Server Component
 * 
 * ESPN-style 3D prediction plane
 * Rendered on server for maximum performance
 */

import 'server-only';
import { apiClient } from '@/lib/api/client';

interface PredictionCallProps {
  homeTeamId: number;
  awayTeamId: number;
  season?: number;
  week?: number;
}

interface PredictionData {
  home_team_id: number;
  away_team_id: number;
  predicted_spread: number;
  confidence: number;
  recommendation: string;
}

export async function PredictionCall({
  homeTeamId,
  awayTeamId,
  season = new Date().getFullYear(),
  week,
}: PredictionCallProps) {
  try {
    const prediction = await apiClient.getGenesisPrediction({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      season,
      week,
    });

    const data: PredictionData = {
      home_team_id: prediction.home_team_id,
      away_team_id: prediction.away_team_id,
      predicted_spread: prediction.predicted_spread || 0,
      confidence: prediction.confidence || 0,
      recommendation: prediction.recommendation || 'NO PLAY',
    };
    
    // Calculate edge from confidence (simplified - should come from API)
    const calculatedEdge = data.confidence > 0.7 ? (data.confidence - 0.7) * 10 : 0;

    return (
      <div className="prediction-call-container perspective-1000">
        {/* 3D Prediction Plane - ESPN Style */}
        <div 
          className="studio-panel studio-light-top"
          style={{
            transform: 'perspective(1000px) rotateX(5deg) translateZ(20px)',
            background: 'linear-gradient(180deg, hsl(222 47% 11%) 0%, hsl(222 47% 9%) 100%)',
            border: '2px solid hsl(217 33% 20%)',
          }}
        >
          <div className="broadcast-spacing">
            {/* Header */}
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-mono">
              EDGELOOP CALL
            </div>
            
            {/* Teams */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-2xl font-bold text-white">Away {data.away_team_id}</div>
              <div className="text-lg text-slate-400 mx-4">@</div>
              <div className="text-2xl font-bold text-white">Home {data.home_team_id}</div>
            </div>
            
            {/* Prediction */}
            <div className="flex items-baseline gap-4 mb-4">
              <div className="text-4xl font-bold text-white">
                {data.predicted_spread > 0 ? '+' : ''}{data.predicted_spread}
              </div>
            </div>
            
            {/* Edge & Confidence */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-xs">Edge</span>
                <div className={`text-2xl font-bold mt-1 ${
                  calculatedEdge > 5 ? 'edge-high' : 
                  calculatedEdge > 2 ? 'edge-medium' : 
                  'edge-low'
                }`}>
                  +{calculatedEdge.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-xs">Confidence</span>
                <div className="text-2xl font-bold text-white mt-1">
                  {(data.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            {/* Recommendation Badge */}
            <div className="mt-6 inline-block px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Recommendation</div>
              <div className={`text-lg font-bold ${
                data.recommendation.includes('HOME') || data.recommendation.includes('COVER')
                  ? 'text-green-400'
                  : data.recommendation.includes('AWAY')
                  ? 'text-blue-400'
                  : 'text-slate-400'
              }`}>
                {data.recommendation}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load prediction:', error);
    return (
      <div className="studio-panel broadcast-spacing">
        <div className="text-slate-400">Failed to load prediction</div>
      </div>
    );
  }
}
