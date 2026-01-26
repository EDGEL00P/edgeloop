import { Card, Badge } from '@edgeloop/ui';
import type { Prediction } from '@/types';

interface PredictionCardProps {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const { homeTeam, awayTeam, predictedSpread, predictedTotal, confidence, modelWinProbability, gameTime } = prediction;
  
  const gameDate = new Date(gameTime);
  const formattedTime = gameDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short' 
  });

  return (
    <Card className="hover:border-[#3D4558]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-sm text-text-tertiary mb-2">{formattedTime}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: awayTeam.color }}
                />
                <span className="text-white font-semibold">{awayTeam.abbreviation}</span>
              </div>
              <span className="text-text-secondary text-sm">
                {modelWinProbability.away.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: homeTeam.color }}
                />
                <span className="text-white font-semibold">{homeTeam.abbreviation}</span>
              </div>
              <span className="text-text-secondary text-sm">
                {modelWinProbability.home.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <Badge variant={confidence}>{confidence.toUpperCase()}</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-default">
        <div>
          <div className="text-xs text-text-tertiary mb-1">Predicted Spread</div>
          <div className="text-lg font-bold text-white">
            {predictedSpread > 0 ? '+' : ''}{predictedSpread}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-tertiary mb-1">Predicted Total</div>
          <div className="text-lg font-bold text-white">{predictedTotal}</div>
        </div>
      </div>
    </Card>
  );
}
