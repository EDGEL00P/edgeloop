export type Brand<K, T extends string> = K & { readonly __brand: T }

export type IsoDateTimeString = Brand<string, 'IsoDateTimeString'>

export function asIsoDateTimeString(value: string): IsoDateTimeString {
  // Minimal invariant for now; Task 6 can tighten validation rules.
  return value as IsoDateTimeString
}

export type ErrorCode = 'not_found' | 'method_not_allowed' | 'internal_error'

export type ErrorEnvelope = {
  error: {
    code: ErrorCode
    message: string
    requestId: string
  }
}

export function errorEnvelope(code: ErrorCode, message: string, requestId: string): ErrorEnvelope {
  return {
    error: {
      code,
      message,
      requestId,
    },
  }
}

export * from './api'
