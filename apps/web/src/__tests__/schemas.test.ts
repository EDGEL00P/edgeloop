import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// API Schema validation tests
describe('API Schemas', () => {
  const GameSchema = z.object({
    id: z.string(),
    homeTeam: z.string().min(2).max(3),
    awayTeam: z.string().min(2).max(3),
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
    status: z.enum(['scheduled', 'in_progress', 'final', 'postponed']),
    startTime: z.string().datetime(),
  })

  const PredictionSchema = z.object({
    gameId: z.string(),
    homeWinProbability: z.number().min(0).max(1),
    awayWinProbability: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    modelVersion: z.string(),
  })

  describe('GameSchema', () => {
    it('should validate valid game data', () => {
      const validGame = {
        id: 'game-123',
        homeTeam: 'KC',
        awayTeam: 'BUF',
        status: 'scheduled',
        startTime: '2026-01-27T18:00:00Z',
      }
      expect(() => GameSchema.parse(validGame)).not.toThrow()
    })

    it('should reject invalid team codes', () => {
      const invalidGame = {
        id: 'game-123',
        homeTeam: 'KANSASCITY', // Too long
        awayTeam: 'BUF',
        status: 'scheduled',
        startTime: '2026-01-27T18:00:00Z',
      }
      expect(() => GameSchema.parse(invalidGame)).toThrow()
    })

    it('should reject invalid status', () => {
      const invalidGame = {
        id: 'game-123',
        homeTeam: 'KC',
        awayTeam: 'BUF',
        status: 'unknown',
        startTime: '2026-01-27T18:00:00Z',
      }
      expect(() => GameSchema.parse(invalidGame)).toThrow()
    })
  })

  describe('PredictionSchema', () => {
    it('should validate valid prediction', () => {
      const validPrediction = {
        gameId: 'game-123',
        homeWinProbability: 0.65,
        awayWinProbability: 0.35,
        confidence: 0.82,
        modelVersion: 'v2.1.0',
      }
      expect(() => PredictionSchema.parse(validPrediction)).not.toThrow()
    })

    it('should ensure probabilities are between 0 and 1', () => {
      const invalidPrediction = {
        gameId: 'game-123',
        homeWinProbability: 1.5, // Invalid
        awayWinProbability: 0.35,
        confidence: 0.82,
        modelVersion: 'v2.1.0',
      }
      expect(() => PredictionSchema.parse(invalidPrediction)).toThrow()
    })
  })
})
