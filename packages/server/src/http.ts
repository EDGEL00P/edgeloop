import type { ServerResponse } from 'http'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { extname, resolve } from 'path'
import { URL } from 'url'

import { errorEnvelope, impliedProbFromAmericanOdds, round3 } from '@edgeloop/shared'

import type { Logger } from './logger'
import { getOrCreateRequestId } from './requestId'

export type ServerContext = {
  startedAtIso: string
  logger: Logger
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue }

const CONTROL_ROOM_CSP =
  "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; img-src 'self' data:; " +
  "style-src 'self'; script-src 'self'; connect-src 'self'"

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader('x-content-type-options', 'nosniff')
  res.setHeader('referrer-policy', 'no-referrer')
  res.setHeader('x-frame-options', 'DENY')
  res.setHeader('permissions-policy', 'geolocation=(), microphone=(), camera=()')
  res.setHeader('cross-origin-opener-policy', 'same-origin')
  res.setHeader('cross-origin-resource-policy', 'same-origin')
}

function setHtmlSecurityHeaders(res: ServerResponse): void {
  setSecurityHeaders(res)
  res.setHeader('content-security-policy', CONTROL_ROOM_CSP)
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
  setSecurityHeaders(res)
  res.end(payload)
}

function contentTypeForFilePath(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.map') return 'application/json; charset=utf-8'
  return 'application/octet-stream'
}

function writeBytes(
  res: ServerResponse,
  statusCode: number,
  body: Buffer,
  contentType: string,
  requestId: string,
): void {
  res.statusCode = statusCode
  res.setHeader('content-type', contentType)
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-request-id', requestId)

  if (contentType.startsWith('text/html')) {
    setHtmlSecurityHeaders(res)
  } else {
    setSecurityHeaders(res)
  }

  res.end(body)
}

function writeRedirect(
  res: ServerResponse,
  statusCode: 307 | 308,
  location: string,
  requestId: string,
): void {
  res.statusCode = statusCode
  res.setHeader('location', location)
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-request-id', requestId)
  setSecurityHeaders(res)
  res.end()
}

export function createBroadcastHttpServer(ctx: ServerContext) {
  const repoRoot = resolve(__dirname, '../../..')
  const controlRoomRoot = resolve(repoRoot, 'apps', 'control-room')
  const controlRoomDistRoot = resolve(controlRoomRoot, 'dist')

  function tryServeControlRoomAsset(
    res: ServerResponse,
    pathname: string,
    method: string,
    requestId: string,
  ): boolean {
    if (method !== 'GET') return false

    // Avoid directory-base URL resolution changing relative asset paths.
    if (pathname === '/control-room/') {
      writeRedirect(res, 308, '/control-room', requestId)
      return true
    }

    let filePath: string | null = null
    if (pathname === '/' || pathname === '/index.html' || pathname === '/control-room') {
      filePath = resolve(controlRoomRoot, 'index.html')
    } else if (pathname === '/styles.css') {
      filePath = resolve(controlRoomRoot, 'styles.css')
    } else if (pathname === '/dist/index.js') {
      filePath = resolve(controlRoomDistRoot, 'index.js')
    } else if (pathname === '/dist/index.js.map') {
      filePath = resolve(controlRoomDistRoot, 'index.js.map')
    }

    if (!filePath) return false

    try {
      const body = readFileSync(filePath)
      writeBytes(res, 200, body, contentTypeForFilePath(filePath), requestId)
    } catch {
      writeJson(
        res,
        404,
        errorEnvelope('not_found', 'Control Room asset not built (run pnpm run build)', requestId),
        requestId,
      )
    }

    return true
  }

  const server = createServer((req, res) => {
    const requestId = getOrCreateRequestId(req.headers['x-request-id'])
    const start = Date.now()

    const method = (req.method ?? 'GET').toUpperCase()
    const url = new URL(req.url ?? '/', 'http://localhost')
    const path = url.pathname

    try {
      if (tryServeControlRoomAsset(res, path, method, requestId)) return

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

        // No-drift mode: pin drift to zero.
        const ps = 0
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

        // No-drift mode: do not emit drift-based alerts.
        writeJson(
          res,
          200,
          {
            asOfIso: new Date().toISOString(),
            alerts: [],
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
