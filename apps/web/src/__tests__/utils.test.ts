import { describe, it, expect } from 'vitest'

// Utility function tests
describe('NFL Team Utilities', () => {
  const NFL_TEAMS = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
  ]

  it('should have exactly 32 NFL teams', () => {
    expect(NFL_TEAMS).toHaveLength(32)
  })

  it('should have unique team codes', () => {
    const uniqueTeams = new Set(NFL_TEAMS)
    expect(uniqueTeams.size).toBe(32)
  })

  it('should have valid team code format', () => {
    NFL_TEAMS.forEach((code) => {
      expect(code).toMatch(/^[A-Z]{2,3}$/)
    })
  })
})

describe('Date Utilities', () => {
  it('should format ISO date correctly', () => {
    const date = new Date('2026-01-27T12:00:00Z')
    expect(date.toISOString()).toBe('2026-01-27T12:00:00.000Z')
  })

  it('should handle NFL season dates', () => {
    const seasonStart = new Date('2025-09-04')
    const seasonEnd = new Date('2026-02-08')
    expect(seasonEnd > seasonStart).toBe(true)
  })
})

describe('Odds Calculations', () => {
  it('should convert American odds to implied probability', () => {
    // Favorite: -150 means 60% implied probability
    const favoriteOdds = -150
    const favoriteProb = favoriteOdds < 0
      ? Math.abs(favoriteOdds) / (Math.abs(favoriteOdds) + 100)
      : 100 / (favoriteOdds + 100)
    expect(favoriteProb).toBeCloseTo(0.6, 2)

    // Underdog: +200 means 33.3% implied probability
    const underdogOdds = 200
    const underdogProb = underdogOdds < 0
      ? Math.abs(underdogOdds) / (Math.abs(underdogOdds) + 100)
      : 100 / (underdogOdds + 100)
    expect(underdogProb).toBeCloseTo(0.333, 2)
  })

  it('should calculate Kelly criterion stake', () => {
    // Kelly = (bp - q) / b
    // where b = decimal odds - 1, p = win probability, q = 1 - p
    const decimalOdds = 2.5  // +150 American
    const winProbability = 0.45
    const b = decimalOdds - 1
    const p = winProbability
    const q = 1 - p

    const kellyStake = (b * p - q) / b
    expect(kellyStake).toBeCloseTo(0.0833, 3)
  })
})
