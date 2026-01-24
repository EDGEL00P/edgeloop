import type { IsoDateTimeString, GameId, TeamCode, PredictionId, AlertId } from './brand'

export type TeamInfo = {
  code: TeamCode
  name: string
  city: string
}

export type GameInfo = {
  id: GameId
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  kickoffAt: IsoDateTimeString
  status: 'scheduled' | 'pregame' | 'in_progress' | 'halftime' | 'final' | 'postponed' | 'cancelled'
  homeScore?: number
  awayScore?: number
  quarter?: number
  timeRemaining?: string
}

export type MarketOdds = {
  provider: string
  moneylineHome: number
  moneylineAway: number
  spreadHome: number
  spreadHomeOdds: number
  total: number
  overOdds: number
  underOdds: number
}

export type PredictionEdges = {
  moneylineHome?: number
  moneylineAway?: number
  spreadHome?: number
  over?: number
  under?: number
}

export type ApiPrediction = {
  id: PredictionId
  game: GameInfo
  winProbHome: number
  winProbAway: number
  confidence: number
  predictedSpread?: number
  predictedTotal?: number
  marketOdds?: MarketOdds
  edges?: PredictionEdges
  createdAt: IsoDateTimeString
}

export type ApiPredictionsResponse = {
  asOfIso: IsoDateTimeString
  modelVersion: string
  predictions: ApiPrediction[]
}

export type DriftInfo = {
  overallPsi: number
  isDrifted: boolean
  featureDrift: {
    feature: string
    psi: number
    isDrifted: boolean
  }[]
}

export type ModelMetrics = {
  accuracy?: number
  logLoss?: number
  brierScore?: number
  calibration?: number
}

export type ApiModelStatusResponse = {
  modelVersion: string
  status: 'training' | 'validating' | 'active' | 'deprecated' | 'failed'
  activatedAt?: IsoDateTimeString
  metrics?: ModelMetrics
  drift?: DriftInfo
  dataAsOfIso: IsoDateTimeString
}

export type ApiAlert = {
  id: AlertId
  severity: 'info' | 'warn' | 'crit'
  type: string
  title: string
  detail?: string
  gameId?: GameId
  modelVersion?: string
  createdAt: IsoDateTimeString
  acknowledgedAt?: IsoDateTimeString
}

export type ApiAlertsResponse = {
  asOfIso: IsoDateTimeString
  alerts: ApiAlert[]
}

export type ApiHealthResponse = {
  status: 'ok'
  startedAt: IsoDateTimeString
}

export type ApiReadyResponse = {
  status: 'ready' | 'not_ready'
  checks: {
    database: boolean
    redis?: boolean
  }
}

export type ApiGamesResponse = {
  asOfIso: IsoDateTimeString
  games: GameInfo[]
  total: number
  page: number
  pageSize: number
}

export type ApiOddsResponse = {
  asOfIso: IsoDateTimeString
  gameId: GameId
  odds: MarketOdds[]
}
