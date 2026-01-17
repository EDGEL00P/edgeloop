/**
 * Game Updated Event
 * Emitted when a game's status or scores change
 */

import { z } from 'zod';

export const GameUpdatedEventSchema = z.object({
  gameId: z.string(),
  status: z.enum(['scheduled', 'live', 'finished', 'postponed', 'cancelled']),
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  timeRemaining: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type GameUpdatedEvent = z.infer<typeof GameUpdatedEventSchema>;