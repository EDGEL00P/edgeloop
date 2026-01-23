import type { IsoDateTimeString } from './index'

export type AlertSeverity = 'info' | 'warn' | 'crit'

export type ApiAlert = {
  id: string
  tsIso: IsoDateTimeString
  severity: AlertSeverity
  title: string
  detail: string
  source: string
}

export type ApiAlertsResponse = {
  asOfIso: IsoDateTimeString
  alerts: ApiAlert[]
}

export type ApiPrediction = {
  id: string
  away: string
  home: string
  kickoffIso: IsoDateTimeString

  // Model outputs
  winProbHome: number // 0..1
  confidence: number // 0..1

  // Market snapshot (American odds)
  oddsHomeAmerican: number
  impliedProbHome: number // derived
  edgeHome: number // winProbHome - impliedProbHome

  // Extra surfaces
  spreadHome: number
  total: number
}

export type ApiPredictionsResponse = {
  asOfIso: IsoDateTimeString
  modelVersion: string
  predictions: ApiPrediction[]
}

export type ApiModelStatusResponse = {
  modelVersion: string
  dataAsOfIso: IsoDateTimeString
  drift: {
    ps: number
  }
}

export function impliedProbFromAmericanOdds(odds: number): number {
  // Positive odds: +150 means win 150 on 100
  // Negative odds: -150 means risk 150 to win 100
  if (!Number.isFinite(odds) || odds === 0) return 0.5
  if (odds > 0) return 100 / (odds + 100)
  return -odds / (-odds + 100)
}
