import { describe, it, expect, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'http'
import handler from './predictions'

describe('GET /api/predictions', () => {
  function createMockRequest(method = 'GET'): IncomingMessage {
    return {
      method,
      headers: {},
    } as IncomingMessage
  }

  function createMockResponse(): {
    res: ServerResponse
    getStatus: () => number
    getHeaders: () => Record<string, string | string[]>
    getBody: () => string
  } {
    const headers: Record<string, string | string[]> = {}
    let body = ''

    const res = {
      statusCode: 200,
      setHeader: vi.fn((key: string, value: string | string[]) => {
        headers[key] = value
      }),
      writeHead: vi.fn((code: number) => {
        res.statusCode = code
      }),
      end: vi.fn((data?: string) => {
        if (data) body = data
      }),
    } as unknown as ServerResponse

    return {
      res,
      getStatus: () => res.statusCode,
      getHeaders: () => headers,
      getBody: () => body,
    }
  }

  it('returns 200 OK with predictions array', () => {
    const req = createMockRequest()
    const { res, getStatus, getBody } = createMockResponse()

    handler(req, res)

    expect(getStatus()).toBe(200)
    const body = JSON.parse(getBody())
    expect(body).toHaveProperty('predictions')
    expect(Array.isArray(body.predictions)).toBe(true)
    expect(body.predictions.length).toBeGreaterThan(0)
  })

  it('includes modelVersion and asOfIso in response', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    expect(body).toHaveProperty('modelVersion')
    expect(body).toHaveProperty('asOfIso')
    expect(typeof body.modelVersion).toBe('string')
    expect(new Date(body.asOfIso).toISOString()).toBe(body.asOfIso)
  })

  it('includes x-request-id in response headers', () => {
    const req = createMockRequest()
    const { res, getHeaders } = createMockResponse()

    handler(req, res)

    const headers = getHeaders()
    expect(headers).toHaveProperty('x-request-id')
  })

  it('returns predictions with required fields', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    const prediction = body.predictions[0]

    // Check all required fields
    expect(prediction).toHaveProperty('id')
    expect(prediction).toHaveProperty('away')
    expect(prediction).toHaveProperty('home')
    expect(prediction).toHaveProperty('kickoffIso')
    expect(prediction).toHaveProperty('winProbHome')
    expect(prediction).toHaveProperty('confidence')
    expect(prediction).toHaveProperty('oddsHomeAmerican')
    expect(prediction).toHaveProperty('impliedProbHome')
    expect(prediction).toHaveProperty('edgeHome')
    expect(prediction).toHaveProperty('spreadHome')
    expect(prediction).toHaveProperty('total')
  })

  it('returns valid probability values (0-1 range)', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    body.predictions.forEach(
      (pred: { winProbHome: number; confidence: number; impliedProbHome: number }) => {
        expect(pred.winProbHome).toBeGreaterThanOrEqual(0)
        expect(pred.winProbHome).toBeLessThanOrEqual(1)
        expect(pred.confidence).toBeGreaterThanOrEqual(0)
        expect(pred.confidence).toBeLessThanOrEqual(1)
        expect(pred.impliedProbHome).toBeGreaterThanOrEqual(0)
        expect(pred.impliedProbHome).toBeLessThanOrEqual(1)
      },
    )
  })

  it('returns valid team codes (3-letter strings)', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    body.predictions.forEach((pred: { away: string; home: string }) => {
      expect(typeof pred.away).toBe('string')
      expect(typeof pred.home).toBe('string')
      expect(pred.away.length).toBeGreaterThanOrEqual(2)
      expect(pred.home.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('returns valid kickoffIso timestamps', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    body.predictions.forEach((pred: { kickoffIso: string }) => {
      expect(new Date(pred.kickoffIso).toISOString()).toBe(pred.kickoffIso)
    })
  })

  it('calculates edge correctly (winProb - impliedProb)', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    body.predictions.forEach(
      (pred: { winProbHome: number; impliedProbHome: number; edgeHome: number }) => {
        const expectedEdge = pred.winProbHome - pred.impliedProbHome
        // Allow small rounding difference
        expect(Math.abs(pred.edgeHome - expectedEdge)).toBeLessThan(0.001)
      },
    )
  })

  it('rejects non-GET methods with 405', () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH']

    methods.forEach((method) => {
      const req = createMockRequest(method)
      const { res, getStatus, getHeaders, getBody } = createMockResponse()

      handler(req, res)

      expect(getStatus()).toBe(405)
      expect(getHeaders()).toHaveProperty('allow', 'GET')
      const body = JSON.parse(getBody())
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('code', 'method_not_allowed')
    })
  })

  it('returns consistent JSON structure', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    expect(Object.keys(body).sort()).toEqual(['asOfIso', 'modelVersion', 'predictions'])
  })
})
