import { describe, it, expect } from 'vitest'

describe('App Smoke Tests', () => {
  it('should have correct environment', () => {
    expect(typeof process.env).toBe('object')
  })

  it('should have valid NODE_ENV', () => {
    expect(['test', 'development', 'production']).toContain(process.env.NODE_ENV || 'test')
  })
})

describe('Type Safety', () => {
  it('should validate FetchResult discriminated union', () => {
    type FetchResult<T> =
      | { readonly ok: true; readonly data: T }
      | { readonly ok: false; readonly error: string }

    const successResult: FetchResult<string> = { ok: true, data: 'test' }
    const errorResult: FetchResult<string> = { ok: false, error: 'failed' }

    expect(successResult.ok).toBe(true)
    if (successResult.ok) {
      expect(successResult.data).toBe('test')
    }

    expect(errorResult.ok).toBe(false)
    if (!errorResult.ok) {
      expect(errorResult.error).toBe('failed')
    }
  })
})
