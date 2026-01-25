// Model calibration utilities

export interface CalibrationBin {
  binStart: number
  binEnd: number
  predictedProb: number
  actualProb: number
  count: number
}

export function calculateCalibrationBins(
  predictions: number[],
  outcomes: boolean[],
  numBins = 10
): CalibrationBin[] {
  if (predictions.length !== outcomes.length) {
    throw new Error('Predictions and outcomes must have same length')
  }

  const bins: CalibrationBin[] = []

  for (let i = 0; i < numBins; i++) {
    const binStart = i / numBins
    const binEnd = (i + 1) / numBins

    const inBin = predictions
      .map((p, idx) => ({ pred: p, outcome: outcomes[idx]! }))
      .filter((x) => x.pred >= binStart && x.pred < binEnd)

    if (inBin.length > 0) {
      const predictedProb = inBin.reduce((sum, x) => sum + x.pred, 0) / inBin.length
      const actualProb = inBin.filter((x) => x.outcome).length / inBin.length

      bins.push({
        binStart,
        binEnd,
        predictedProb,
        actualProb,
        count: inBin.length,
      })
    }
  }

  return bins
}

export function calculateExpectedCalibrationError(
  predictions: number[],
  outcomes: boolean[],
  numBins = 10
): number {
  const bins = calculateCalibrationBins(predictions, outcomes, numBins)
  const totalCount = predictions.length

  let ece = 0
  for (const bin of bins) {
    const weight = bin.count / totalCount
    const error = Math.abs(bin.predictedProb - bin.actualProb)
    ece += weight * error
  }

  return ece
}

export function calculateBrierScore(
  predictions: number[],
  outcomes: boolean[]
): number {
  if (predictions.length !== outcomes.length) {
    throw new Error('Predictions and outcomes must have same length')
  }

  let sumSquaredError = 0
  for (let i = 0; i < predictions.length; i++) {
    const outcome = outcomes[i]! ? 1 : 0
    sumSquaredError += Math.pow(predictions[i]! - outcome, 2)
  }

  return sumSquaredError / predictions.length
}

export function calculateLogLoss(
  predictions: number[],
  outcomes: boolean[]
): number {
  if (predictions.length !== outcomes.length) {
    throw new Error('Predictions and outcomes must have same length')
  }

  const epsilon = 1e-15
  let logLoss = 0

  for (let i = 0; i < predictions.length; i++) {
    const p = Math.max(epsilon, Math.min(1 - epsilon, predictions[i]!))
    const y = outcomes[i]! ? 1 : 0

    logLoss -= y * Math.log(p) + (1 - y) * Math.log(1 - p)
  }

  return logLoss / predictions.length
}

// Platt scaling for calibration
export function plattScale(
  predictions: number[],
  outcomes: boolean[],
  learningRate = 0.01,
  iterations = 1000
): { a: number; b: number } {
  let a = 1
  let b = 0

  for (let iter = 0; iter < iterations; iter++) {
    let gradA = 0
    let gradB = 0

    for (let i = 0; i < predictions.length; i++) {
      const logit = a * predictions[i]! + b
      const calibrated = 1 / (1 + Math.exp(-logit))
      const y = outcomes[i]! ? 1 : 0

      gradA += (calibrated - y) * predictions[i]!
      gradB += calibrated - y
    }

    a -= (learningRate * gradA) / predictions.length
    b -= (learningRate * gradB) / predictions.length
  }

  return { a, b }
}

export function applyPlattScaling(
  prediction: number,
  a: number,
  b: number
): number {
  const logit = a * prediction + b
  return 1 / (1 + Math.exp(-logit))
}
