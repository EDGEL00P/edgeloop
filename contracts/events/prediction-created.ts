/**
 * Prediction Created Event
 * Emitted when a new prediction is generated
 */

import { z } from 'zod';

export const PredictionCreatedEventSchema = z.object({
  predictionId: z.string(),
  gameId: z.string(),
  modelType: z.enum(['tda', 'ltc', 'active_inference']),
  prediction: z.object({
    homeWinProbability: z.number().min(0).max(1),
    awayWinProbability: z.number().min(0).max(1),
    overProbability: z.number().min(0).max(1).optional(),
    underProbability: z.number().min(0).max(1).optional(),
  }),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
});

export type PredictionCreatedEvent = z.infer<typeof PredictionCreatedEventSchema>;