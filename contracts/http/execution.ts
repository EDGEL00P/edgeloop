/**
 * Execution Service HTTP Contracts
 * Trade execution + risk checks
 */

import { z } from 'zod';

export const AnalyzeGameRequestSchema = z.object({
  gameId: z.number().int(),
  homeTeamId: z.number().int(),
  awayTeamId: z.number().int(),
  season: z.number().int(),
  week: z.number().int().min(1).max(18),
  marketOdds: z.object({
    spread: z.number().optional(),
    total: z.number().optional(),
    homeMoneyline: z.number().optional(),
    awayMoneyline: z.number().optional(),
  }),
  weather: z.object({
    temperature: z.number().optional(),
    windSpeed: z.number().optional(),
    precipitation: z.string().optional(),
  }).optional(),
  injuries: z.array(z.object({
    playerId: z.number(),
    playerName: z.string(),
    status: z.string(),
  })).optional(),
});

export const BettingAnalysisResponseSchema = z.object({
  gameId: z.number(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  modelPrediction: z.object({
    gameId: z.number(),
    homeWinProbability: z.number(),
    awayWinProbability: z.number(),
    spreadPrediction: z.number(),
    totalPrediction: z.number(),
  }),
  recommendedBet: z.object({
    betType: z.enum(['spread', 'moneyline', 'total']),
    selection: z.string(),
    edge: z.number(),
    confidence: z.number(),
  }).optional(),
  recommendation: z.object({
    action: z.enum(['bet', 'no_bet', 'pass']),
    confidence: z.number(),
    reason: z.string(),
  }),
});

// Type exports
export type AnalyzeGameRequest = z.infer<typeof AnalyzeGameRequestSchema>;
export type BettingAnalysisResponse = z.infer<typeof BettingAnalysisResponseSchema>;