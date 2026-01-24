import type { IncomingMessage, ServerResponse } from 'http'
import { getOrCreateRequestId, writeJson, errorEnvelope, logError } from '@edgeloop/server'

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

function impliedProbFromAmericanOdds(odds: number): number {
  if (!Number.isFinite(odds) || odds === 0) return 0.5
  if (odds > 0) return 100 / (odds + 100)
  return -odds / (-odds + 100)
}

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const requestId = getOrCreateRequestId(req)

  try {
    if ((req.method ?? 'GET').toUpperCase() !== 'GET') {
      res.setHeader('allow', 'GET')
      writeJson(
        res,
        405,
        errorEnvelope('method_not_allowed', 'Method Not Allowed', requestId),
        requestId,
      )
      return
    }

    const modelVersion = 'v0.1-edge'
    const asOfIso = new Date().toISOString()

    const p1WinProbHome = 0.58
    const p1OddsHome = -135
    const p1Implied = impliedProbFromAmericanOdds(p1OddsHome)

    const p2WinProbHome = 0.44
    const p2OddsHome = +120
    const p2Implied = impliedProbFromAmericanOdds(p2OddsHome)

    writeJson(
      res,
      200,
      {
        asOfIso,
        modelVersion,
        predictions: [
          {
            id: 'g1',
            away: 'KC',
            home: 'BUF',
            kickoffIso: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
            winProbHome: p1WinProbHome,
            confidence: 0.74,
            oddsHomeAmerican: p1OddsHome,
            impliedProbHome: round3(p1Implied),
            edgeHome: round3(p1WinProbHome - p1Implied),
            spreadHome: -2.5,
            total: 48.5,
          },
          {
            id: 'g2',
            away: 'SF',
            home: 'DAL',
            kickoffIso: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
            winProbHome: p2WinProbHome,
            confidence: 0.62,
            oddsHomeAmerican: p2OddsHome,
            impliedProbHome: round3(p2Implied),
            edgeHome: round3(p2WinProbHome - p2Implied),
            spreadHome: +1.5,
            total: 44.0,
          },
        ],
      },
      requestId,
    )
  } catch (err) {
    logError('predictions_handler_error', requestId, err)
    writeJson(
      res,
      500,
      errorEnvelope('internal_error', 'Internal Server Error', requestId),
      requestId,
    )
  }
}
