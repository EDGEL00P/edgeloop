// Feature drift detection utilities
import type { DriftReport } from '../types'

export function calculatePSI(
  reference: number[],
  current: number[],
  bins = 10
): number {
  if (reference.length === 0 || current.length === 0) {
    return 0
  }

  const min = Math.min(...reference, ...current)
  const max = Math.max(...reference, ...current)

  if (min === max) {
    return 0
  }

  const binWidth = (max - min) / bins
  const refCounts = new Array(bins).fill(0)
  const curCounts = new Array(bins).fill(0)

  for (const val of reference) {
    const bin = Math.min(Math.floor((val - min) / binWidth), bins - 1)
    refCounts[bin]++
  }

  for (const val of current) {
    const bin = Math.min(Math.floor((val - min) / binWidth), bins - 1)
    curCounts[bin]++
  }

  // Convert to proportions with small epsilon to avoid log(0)
  const epsilon = 0.0001
  const refProps = refCounts.map((c) => c / reference.length + epsilon)
  const curProps = curCounts.map((c) => c / current.length + epsilon)

  // Calculate PSI
  let psi = 0
  for (let i = 0; i < bins; i++) {
    psi += (curProps[i]! - refProps[i]!) * Math.log(curProps[i]! / refProps[i]!)
  }

  return psi
}

export function isDrifted(psi: number, threshold = 0.2): boolean {
  return psi > threshold
}

export function detectDrift(
  featureName: string,
  reference: number[],
  current: number[],
  threshold = 0.2
): DriftReport {
  const psi = calculatePSI(reference, current)

  return {
    featureName,
    psi,
    isDrifted: isDrifted(psi, threshold),
    referenceDistribution: reference,
    currentDistribution: current,
    threshold,
  }
}

export function batchDetectDrift(
  features: Record<string, { reference: number[]; current: number[] }>,
  threshold = 0.2
): DriftReport[] {
  return Object.entries(features).map(([name, data]) =>
    detectDrift(name, data.reference, data.current, threshold)
  )
}
