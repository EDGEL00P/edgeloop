export type LogLevel = 'info' | 'error'

export type Logger = {
  info: (message: string, fields?: Record<string, unknown>) => void
  error: (message: string, fields?: Record<string, unknown>) => void
}

function emit(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
  }

  // Intentionally JSON for downstream aggregation.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload))
}

export function createLogger(): Logger {
  return {
    info: (message, fields) => emit('info', message, fields),
    error: (message, fields) => emit('error', message, fields),
  }
}
