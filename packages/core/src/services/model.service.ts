import { eq, desc, and, gte } from 'drizzle-orm'
import { getDb, modelVersions, driftMetrics, type ModelVersion, type DriftMetric, type NewModelVersion, type NewDriftMetric } from '@edgeloop/db'

export async function getActiveModel(): Promise<ModelVersion | null> {
  const db = getDb()

  const result = await db.query.modelVersions.findFirst({
    where: eq(modelVersions.status, 'active'),
    orderBy: [desc(modelVersions.activatedAt)],
  })

  return result ?? null
}

export async function getModelByVersion(version: string): Promise<ModelVersion | null> {
  const db = getDb()

  const result = await db.query.modelVersions.findFirst({
    where: eq(modelVersions.version, version),
  })

  return result ?? null
}

export async function createModelVersion(data: NewModelVersion): Promise<ModelVersion> {
  const db = getDb()

  const [model] = await db.insert(modelVersions).values(data).returning()

  if (!model) {
    throw new Error('Failed to create model version')
  }

  return model
}

export async function activateModel(version: string): Promise<ModelVersion | null> {
  const db = getDb()

  // First, deprecate current active model
  await db
    .update(modelVersions)
    .set({ status: 'deprecated' })
    .where(eq(modelVersions.status, 'active'))

  // Activate the new model
  const [activated] = await db
    .update(modelVersions)
    .set({
      status: 'active',
      activatedAt: new Date(),
    })
    .where(eq(modelVersions.version, version))
    .returning()

  return activated ?? null
}

export async function getLatestDriftMetrics(modelVersion: string): Promise<DriftMetric[]> {
  const db = getDb()

  const result = await db.query.driftMetrics.findMany({
    where: eq(driftMetrics.modelVersion, modelVersion),
    orderBy: [desc(driftMetrics.createdAt)],
    limit: 100, // Get recent metrics
  })

  // Deduplicate by feature name to get latest per feature
  const latestByFeature = new Map<string, DriftMetric>()
  for (const metric of result) {
    const key = metric.featureName ?? '__overall__'
    if (!latestByFeature.has(key)) {
      latestByFeature.set(key, metric)
    }
  }

  return Array.from(latestByFeature.values())
}

export async function saveDriftMetric(data: NewDriftMetric): Promise<DriftMetric> {
  const db = getDb()

  const [metric] = await db.insert(driftMetrics).values(data).returning()

  if (!metric) {
    throw new Error('Failed to save drift metric')
  }

  return metric
}

export async function checkForDrift(modelVersion: string): Promise<{
  isDrifted: boolean
  overallPsi: number
  driftedFeatures: string[]
}> {
  const metrics = await getLatestDriftMetrics(modelVersion)

  const psiMetrics = metrics.filter((m) => m.metricType === 'psi')
  const driftedFeatures = psiMetrics.filter((m) => m.isDrifted).map((m) => m.featureName ?? 'unknown')

  // Calculate overall PSI as average
  const overallPsi =
    psiMetrics.length > 0
      ? psiMetrics.reduce((sum, m) => sum + parseFloat(m.value), 0) / psiMetrics.length
      : 0

  return {
    isDrifted: driftedFeatures.length > 0,
    overallPsi,
    driftedFeatures,
  }
}

export async function getModelHistory(limit = 10): Promise<ModelVersion[]> {
  const db = getDb()

  const result = await db.query.modelVersions.findMany({
    orderBy: [desc(modelVersions.createdAt)],
    limit,
  })

  return result
}
