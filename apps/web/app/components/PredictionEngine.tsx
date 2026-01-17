/**
 * Genesis Prediction Engine Dashboard
 * Professional Sports Analytics Interface
 */

'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface Prediction {
  game_id: string;
  home_team: string;
  away_team: string;
  home_robustness: number;
  away_robustness: number;
  home_form: number;
  away_form: number;
  predicted_spread: number;
  confidence: number;
  recommendation: string;
}

export default function PredictionEngine() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load predictions from Genesis engine
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      // Load actual games first, then get predictions
      const gamesResponse = await apiClient.getGames({
        season: new Date().getFullYear(),
        week: new Date().getDate() < 15 ? Math.ceil(new Date().getDate() / 7) : 1,
        per_page: 10,
      });

      // Get predictions for first few games
      const gamePredictions = await Promise.all(
        (gamesResponse.data || []).slice(0, 5).map(async (game: any) => {
          try {
            const prediction = await apiClient.getGenesisPrediction({
              home_team_id: game.home_team?.id || 0,
              away_team_id: game.visitor_team?.id || 0,
              season: game.season,
              week: game.week,
            });

            return {
              game_id: game.id?.toString() || '0',
              home_team: game.home_team?.abbreviation || 'HOME',
              away_team: game.visitor_team?.abbreviation || 'AWAY',
              home_robustness: prediction.home_robustness,
              away_robustness: prediction.away_robustness,
              home_form: prediction.home_form,
              away_form: prediction.away_form,
              predicted_spread: prediction.predicted_spread,
              confidence: prediction.confidence,
              recommendation: prediction.recommendation,
            };
          } catch (err) {
            console.error('Failed to get prediction for game:', err);
            return null;
          }
        })
      );

      setPredictions(gamePredictions.filter((p): p is Prediction => p !== null));
    } catch (error) {
      console.error('Failed to load predictions:', error);
      // Fallback to empty array on error
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => (value * 100).toFixed(0);

  if (loading) {
    return (
      <div className="w-full animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Genesis Predictions
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            TDA + LTC + Active Inference Engine
          </p>
        </div>
        {predictions.length > 0 && (
          <div className="text-right">
            <div className="text-xs text-slate-400">Confidence</div>
            <div className="text-2xl font-bold text-green-400">
              {formatPercentage(predictions[0]?.confidence || 0)}%
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {predictions.map((pred) => (
          <div
            key={pred.game_id}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 backdrop-blur-sm"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-50" />
            
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-slate-300">
                    {pred.away_team}
                  </div>
                  <div className="text-2xl font-bold text-white">@</div>
                  <div className="text-sm font-medium text-slate-300">
                    {pred.home_team}
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                  pred.recommendation.includes('HOME') 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {pred.recommendation}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {/* Robustness */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Robustness
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${formatPercentage(pred.home_robustness)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white w-12 text-right">
                      {formatPercentage(pred.home_robustness)}%
                    </span>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Form
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${formatPercentage(pred.home_form)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white w-12 text-right">
                      {formatPercentage(pred.home_form)}%
                    </span>
                  </div>
                </div>

                {/* Predicted Spread */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Spread
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {pred.predicted_spread > 0 ? '+' : ''}{pred.predicted_spread}
                  </div>
                </div>

                {/* Confidence */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Confidence
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${formatPercentage(pred.confidence)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white w-12 text-right">
                      {formatPercentage(pred.confidence)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <div className="text-xs text-slate-400 space-y-1">
                  <div>
                    <span className="font-medium text-slate-300">TDA Analysis:</span>{' '}
                    {pred.home_robustness > pred.away_robustness 
                      ? 'Home team has multiple offensive pathways (Robust)'
                      : 'Away team more predictable (Fragile)'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-300">LTC Analysis:</span>{' '}
                    {pred.home_form > pred.away_form
                      ? 'Home team in better form with adequate rest'
                      : 'Away team showing fatigue indicators'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
