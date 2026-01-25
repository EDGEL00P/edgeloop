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

    writeJson(
      res,
      200,
      {
        modelVersion: 'v0.1-edge',
        dataAsOfIso: new Date().toISOString(),
        drift: { ps: 0 },
      },
      requestId,
    )
  } catch (err) {
    logError('model_status_handler_error', requestId, err)
    writeJson(
      res,
      500,
      errorEnvelope('internal_error', 'Internal Server Error', requestId),
      requestId,
    )
  }
}
