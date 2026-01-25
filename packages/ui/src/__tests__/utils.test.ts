import { describe, it, expect } from 'vitest'
import {
  cn,
  formatPercentage,
  formatOdds,
  formatScore,
  getConfidenceTier,
  formatGameTime,
} from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})

describe('formatPercentage', () => {
  it('formats decimal to percentage', () => {
    expect(formatPercentage(0.75)).toBe('75.0%')
  })

  it('respects decimal places', () => {
    expect(formatPercentage(0.756, 2)).toBe('75.60%')
  })

  it('handles zero', () => {
    expect(formatPercentage(0)).toBe('0.0%')
  })

  it('handles 100%', () => {
    expect(formatPercentage(1)).toBe('100.0%')
  })
})

describe('formatOdds', () => {
  it('formats positive odds with plus sign', () => {
    expect(formatOdds(150)).toBe('+150')
  })

  it('formats negative odds without plus sign', () => {
    expect(formatOdds(-200)).toBe('-200')
  })

  it('formats zero', () => {
    expect(formatOdds(0)).toBe('+0')
  })
})

describe('formatScore', () => {
  it('pads single digit scores', () => {
    expect(formatScore(7)).toBe('07')
  })

  it('does not pad double digit scores', () => {
    expect(formatScore(24)).toBe('24')
  })

  it('handles zero', () => {
    expect(formatScore(0)).toBe('00')
  })
})

describe('getConfidenceTier', () => {
  it('returns high for 75%+', () => {
    expect(getConfidenceTier(0.75)).toBe('high')
    expect(getConfidenceTier(0.9)).toBe('high')
    expect(getConfidenceTier(1)).toBe('high')
  })

  it('returns medium for 50-74%', () => {
    expect(getConfidenceTier(0.5)).toBe('medium')
    expect(getConfidenceTier(0.6)).toBe('medium')
    expect(getConfidenceTier(0.74)).toBe('medium')
  })

  it('returns low for <50%', () => {
    expect(getConfidenceTier(0.49)).toBe('low')
    expect(getConfidenceTier(0.3)).toBe('low')
    expect(getConfidenceTier(0)).toBe('low')
  })
})

describe('formatGameTime', () => {
  it('formats time with quarter', () => {
    expect(formatGameTime(342, 4)).toBe('Q4 5:42')
  })

  it('pads seconds', () => {
    expect(formatGameTime(65, 1)).toBe('Q1 1:05')
  })

  it('handles zero time', () => {
    expect(formatGameTime(0, 1)).toBe('Q1 0:00')
  })

  it('handles full quarter', () => {
    expect(formatGameTime(900, 1)).toBe('Q1 15:00')
  })
})
