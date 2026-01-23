import type { ServerResponse } from 'http'
import { createServer } from 'http'
import { URL } from 'url'

import { errorEnvelope } from '@edgeloop/shared'

import type { Logger } from './logger'
import { getOrCreateRequestId } from './requestId'

export type ServerContext = {
  startedAtIso: string
  logger: Logger
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue }

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

function impliedProbFromAmericanOdds(odds: number): number {
  if (!Number.isFinite(odds) || odds === 0) return 0.5
  if (odds > 0) return 100 / (odds + 100)
  return -odds / (-odds + 100)
}

function writeJson(
  res: ServerResponse,
  statusCode: number,
  body: JsonValue,
  requestId: string,
): void {
  const payload = JSON.stringify(body)

  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-request-id', requestId)
  res.end(payload)
}

export function createBroadcastHttpServer(ctx: ServerContext) {
  const server = createServer((req, res) => {
    const requestId = getOrCreateRequestId(req.headers['x-request-id'])
    const start = Date.now()

    const method = (req.method ?? 'GET').toUpperCase()
    const url = new URL(req.url ?? '/', 'http://localhost')
    const path = url.pathname

    try {
      if (path === '/healthz') {
        if (method !== 'GET') {
          res.setHeader('allow', 'GET')
          writeJson(
            res,
            405,
            errorEnvelope('method_not_allowed', 'Method Not Allowed', requestId),
            requestId,
          )
          return
        }

        writeJson(
          res,
          200,
          {
            status: 'ok',
            startedAt: ctx.startedAtIso,
          },
          requestId,
        )
        return
      }

      if (path === '/readyz') {
        if (method !== 'GET') {
          res.setHeader('allow', 'GET')
          writeJson(
            res,
            405,
            errorEnvelope('method_not_allowed', 'Method Not Allowed', requestId),
            requestId,
          )
          return
        }

        // Placeholder: Task 6 will gate readiness on real dependencies.
        writeJson(res, 200, { status: 'ready' }, requestId)
        return
      }

      if (path === '/api/model-status') {
        if (method !== 'GET') {
          res.setHeader('allow', 'GET')
          writeJson(
            res,
            405,
            errorEnvelope('method_not_allowed', 'Method Not Allowed', requestId),
            requestId,
          )
          return
        }

        const t = Date.now()
        const ps = round3(Math.abs(Math.sin(t / 8000)) * 0.22)
        writeJson(
          res,
          200,
          {
            modelVersion: 'v0.1-edge',
            dataAsOfIso: new Date().toISOString(),
            drift: { ps },
          },
          requestId,
        )
        return
      }

      if (path === '/api/predictions') {
        if (method !== 'GET') {
          res.setHeader('allow', 'GET')
          writeJson(
            res,
            405,
            errorEnvelope('method_not_allowed', 'Method Not Allowed', requestId),
            requestId,
          )
          return
        }

        // Stubbed data for now; next step is real data ingestion + modeling.
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
        return
      }

      if (path === '/api/alerts') {
        if (method !== 'GET') {
          res.setHeader('allow', 'GET')
          writeJson(
            res,
            405,
            errorEnvelope('method_not_allowed', 'Method Not Allowed', requestId),
            requestId,
          )
          return
        }

        const t = Date.now()
        const seq = Math.floor(t / 8000)
        const ps = round3(Math.abs(Math.sin(t / 8000)) * 0.22)
        const sev = ps > 0.16 ? 'warn' : 'info'

        writeJson(
          res,
          200,
          {
            asOfIso: new Date().toISOString(),
            alerts: [
              {
                id: `a-${seq}`,
                tsIso: new Date().toISOString(),
                severity: sev,
                title: 'Prediction distribution shift',
                detail: `ps=${ps}`,
                source: 'model',
              },
            ],
          },
          requestId,
        )
        return
      }

      writeJson(res, 404, errorEnvelope('not_found', 'Not Found', requestId), requestId)
    } catch (err) {
      ctx.logger.error('request_handler_error', {
        requestId,
        error: String(err),
      })
      writeJson(
        res,
        500,
        errorEnvelope('internal_error', 'Internal Server Error', requestId),
        requestId,
      )
    } finally {
      const durationMs = Date.now() - start
      ctx.logger.info('request', {
        requestId,
        method,
        path,
        statusCode: res.statusCode,
        durationMs,
      })
    }
  })

  // Reliability defaults: avoid slowloris/hung connections consuming capacity.
  // Values chosen to be conservative and easy to tune later.
  server.keepAliveTimeout = 5_000
  server.headersTimeout = 10_000
  server.requestTimeout = 30_000

  return server
}
