import { describe, it, expect, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'http'
import handler from './readyz'

describe('GET /readyz', () => {
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

  it('returns 200 OK with ready status', () => {
    const req = createMockRequest()
    const { res, getStatus, getBody } = createMockResponse()

    handler(req, res)

    expect(getStatus()).toBe(200)
    const body = JSON.parse(getBody())
    expect(body).toHaveProperty('status', 'ready')
  })

  it('includes x-request-id in response headers', () => {
    const req = createMockRequest()
    const { res, getHeaders } = createMockResponse()

    handler(req, res)

    const headers = getHeaders()
    expect(headers).toHaveProperty('x-request-id')
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
    expect(Object.keys(body)).toContain('status')
  })
})
