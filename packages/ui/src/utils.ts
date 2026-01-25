import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatOdds(odds: number): string {
  if (odds >= 0) {
    return `+${odds}`
  }
  return odds.toString()
}

export function formatScore(score: number): string {
  return score.toString().padStart(2, '0')
}

export function getConfidenceTier(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.75) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

export function formatGameTime(seconds: number, quarter: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `Q${quarter} ${minutes}:${secs.toString().padStart(2, '0')}`
}
