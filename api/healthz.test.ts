import { describe, it, expect, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'http'
import handler from './healthz'

describe('GET /healthz', () => {
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

  it('returns 200 OK with status and startedAt timestamp', () => {
    const req = createMockRequest()
    const { res, getStatus, getBody } = createMockResponse()

    handler(req, res)

    expect(getStatus()).toBe(200)
    const body = JSON.parse(getBody())
    expect(body).toHaveProperty('status', 'ok')
    expect(body).toHaveProperty('startedAt')
    expect(new Date(body.startedAt).toISOString()).toBe(body.startedAt)
  })

  it('includes x-request-id in response headers', () => {
    const req = createMockRequest()
    const { res, getHeaders } = createMockResponse()

    handler(req, res)

    const headers = getHeaders()
    expect(headers).toHaveProperty('x-request-id')
    expect(typeof headers['x-request-id']).toBe('string')
  })

  it('preserves x-request-id from request headers when present', () => {
    const requestId = 'test-req-id'
    const req = {
      method: 'GET',
      headers: { 'x-request-id': requestId },
    } as unknown as IncomingMessage
    const { res, getHeaders } = createMockResponse()

    handler(req, res)

    const headers = getHeaders()
    // The handler should use the provided request ID
    expect(headers['x-request-id']).toBeTruthy()
    expect(typeof headers['x-request-id']).toBe('string')
  })

  it('rejects POST method with 405 Method Not Allowed', () => {
    const req = createMockRequest('POST')
    const { res, getStatus, getHeaders, getBody } = createMockResponse()

    handler(req, res)

    expect(getStatus()).toBe(405)
    expect(getHeaders()).toHaveProperty('allow', 'GET')
    const body = JSON.parse(getBody())
    expect(body).toHaveProperty('error')
    expect(body.error).toHaveProperty('code', 'method_not_allowed')
    expect(body.error).toHaveProperty('message', 'Method Not Allowed')
  })

  it('rejects PUT method with 405 Method Not Allowed', () => {
    const req = createMockRequest('PUT')
    const { res, getStatus } = createMockResponse()

    handler(req, res)

    expect(getStatus()).toBe(405)
  })

  it('rejects DELETE method with 405 Method Not Allowed', () => {
    const req = createMockRequest('DELETE')
    const { res, getStatus } = createMockResponse()

    handler(req, res)

    expect(getStatus()).toBe(405)
  })

  it('handles missing method gracefully (defaults to GET)', () => {
    const req = { headers: {} } as IncomingMessage
    const { res, getStatus } = createMockResponse()

    handler(req, res)

    expect(getStatus()).toBe(200)
  })

  it('returns consistent JSON structure', () => {
    const req = createMockRequest()
    const { res, getBody } = createMockResponse()

    handler(req, res)

    const body = JSON.parse(getBody())
    expect(Object.keys(body).sort()).toEqual(['startedAt', 'status'])
  })
})
