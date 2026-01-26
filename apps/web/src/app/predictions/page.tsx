import { PredictionCard } from '@/components/PredictionCard';
import { mockPredictions } from '@/lib/mockData';
import { Badge } from '@edgeloop/ui';

export default function PredictionsPage() {
  const highConfidence = mockPredictions.filter(p => p.confidence === 'high');
  const mediumConfidence = mockPredictions.filter(p => p.confidence === 'medium');
  const lowConfidence = mockPredictions.filter(p => p.confidence === 'low');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">NFL Predictions</h1>
        <p className="text-text-secondary">
          Model-driven forecasts with confidence ratings and win probabilities
        </p>
      </div>

      {/* High Confidence Predictions */}
      {highConfidence.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-white">High Confidence</h2>
            <Badge variant="high">{highConfidence.length} PREDICTIONS</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highConfidence.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Confidence Predictions */}
      {mediumConfidence.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-white">Medium Confidence</h2>
            <Badge variant="medium">{mediumConfidence.length} PREDICTIONS</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediumConfidence.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </div>
      )}

      {/* Low Confidence Predictions */}
      {lowConfidence.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-white">Low Confidence</h2>
            <Badge variant="low">{lowConfidence.length} PREDICTIONS</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowConfidence.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
