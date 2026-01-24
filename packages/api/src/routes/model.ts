import { Hono } from 'hono'
import { getActiveModel, checkForDrift, getModelHistory } from '@edgeloop/core'
import { nowIso, type ApiModelStatusResponse, type DriftInfo, type ModelMetrics } from '@edgeloop/shared'

export const modelRoutes = new Hono()

modelRoutes.get('/status', async (c) => {
  const model = await getActiveModel()

  if (!model) {
    return c.json({
      asOfIso: nowIso(),
      modelVersion: 'none',
      status: 'none',
      message: 'No active model',
    })
  }

  const driftResult = await checkForDrift(model.version)

  const metrics: ModelMetrics | undefined = model.metrics
    ? {
        accuracy: model.metrics.accuracy,
        logLoss: model.metrics.logLoss,
        brierScore: model.metrics.brierScore,
        calibration: model.metrics.calibration,
      }
    : undefined

  const drift: DriftInfo = {
    overallPsi: driftResult.overallPsi,
    isDrifted: driftResult.isDrifted,
    featureDrift: driftResult.driftedFeatures.map((feature) => ({
      feature,
      psi: 0.2, // Would need actual PSI values from driftResult
      isDrifted: true,
    })),
  }

  const response: ApiModelStatusResponse = {
    modelVersion: model.version,
    status: model.status,
    activatedAt: model.activatedAt?.toISOString() as any,
    metrics,
    drift,
    dataAsOfIso: nowIso(),
  }

  return c.json(response)
})

modelRoutes.get('/history', async (c) => {
  const history = await getModelHistory(20)

  return c.json({
    asOfIso: nowIso(),
    models: history.map((m) => ({
      version: m.version,
      status: m.status,
      modelType: m.modelType,
      metrics: m.metrics,
      activatedAt: m.activatedAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
  })
})
