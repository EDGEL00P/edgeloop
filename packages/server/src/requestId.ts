import { randomBytes, randomUUID } from 'crypto'

function safeRandomId(): string {
  try {
    return randomUUID()
  } catch {
    // randomUUID may not exist in some Node runtimes; fall back.
    return randomBytes(16).toString('hex')
  }
}

export function getOrCreateRequestId(input: unknown): string {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (trimmed.length > 0 && trimmed.length <= 128) {
      return trimmed
    }
  }

  return safeRandomId()
}
