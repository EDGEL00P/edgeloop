/**
 * Data Domain API Contracts
 */

import { z } from 'zod';

export const GetTeamsRequestSchema = z.object({
  season: z.number().int().min(2000).max(2100).optional(),
});

export const TeamSchema = z.object({
  id: z.string(),
  abbreviation: z.string().optional(),
  name: z.string().optional(),
  fullName: z.string().optional(),
  location: z.string().optional(),
});

export const GetTeamsResponseSchema = z.object({
  data: z.array(TeamSchema),
});

export const GetGamesRequestSchema = z.object({
  season: z.number().int().min(2000).max(2100),
  week: z.number().int().min(1).max(18).optional(),
});

export const GameSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  status: z.string().optional(),
  home_team: z.object({
    team: z.object({
      id: z.string().optional(),
      abbreviation: z.string().optional(),
      displayName: z.string().optional(),
    }).optional(),
    score: z.number().nullable().optional(),
    homeAway: z.enum(['home', 'away']).optional(),
  }).optional(),
  away_team: z.object({
    team: z.object({
      id: z.string().optional(),
      abbreviation: z.string().optional(),
      displayName: z.string().optional(),
    }).optional(),
    score: z.number().nullable().optional(),
    homeAway: z.enum(['home', 'away']).optional(),
  }).optional(),
  venue: z.string().optional(),
});

export const GetGamesResponseSchema = z.object({
  data: z.array(GameSchema),
});

export const GetPlayerStatsRequestSchema = z.object({
  playerId: z.string(),
  season: z.number().int().optional(),
});

export const GetPlayerStatsResponseSchema = z.object({
  data: z.unknown(),
});

// Type exports
export type Team = z.infer<typeof TeamSchema>;
export type GetTeamsRequest = z.infer<typeof GetTeamsRequestSchema>;
export type GetTeamsResponse = z.infer<typeof GetTeamsResponseSchema>;
export type Game = z.infer<typeof GameSchema>;
export type GetGamesRequest = z.infer<typeof GetGamesRequestSchema>;
export type GetGamesResponse = z.infer<typeof GetGamesResponseSchema>;
export type GetPlayerStatsRequest = z.infer<typeof GetPlayerStatsRequestSchema>;
export type GetPlayerStatsResponse = z.infer<typeof GetPlayerStatsResponseSchema>;