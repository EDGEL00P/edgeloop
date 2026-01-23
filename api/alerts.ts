import type { IncomingMessage, ServerResponse } from 'http'
import { getOrCreateRequestId, writeJson, errorEnvelope, logError } from '@edgeloop/server'

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

    // No-drift mode: do not emit drift-based alerts.
    writeJson(res, 200, { asOfIso: new Date().toISOString(), alerts: [] }, requestId)
  } catch (err) {
    logError('alerts_handler_error', requestId, err)
    writeJson(
      res,
      500,
      errorEnvelope('internal_error', 'Internal Server Error', requestId),
      requestId,
    )
  }
}
