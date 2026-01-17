/**
 * Trade Executed Event
 * Emitted when a trade/bet is executed
 */

import { z } from 'zod';

export const TradeExecutedEventSchema = z.object({
  tradeId: z.string(),
  userId: z.string(),
  gameId: z.string(),
  betType: z.enum(['spread', 'moneyline', 'total', 'player_prop']),
  selection: z.string(),
  line: z.number().optional(),
  odds: z.number(),
  stake: z.number(),
  expectedValue: z.number().optional(),
  timestamp: z.string().datetime(),
});

export type TradeExecutedEvent = z.infer<typeof TradeExecutedEventSchema>;