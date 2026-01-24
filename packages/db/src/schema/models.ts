import { pgTable, uuid, varchar, decimal, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core'

export const modelStatus = ['training', 'validating', 'active', 'deprecated', 'failed'] as const
export type ModelStatus = (typeof modelStatus)[number]

export type ModelHyperparameters = {
  learningRate?: number
  maxDepth?: number
  nEstimators?: number
  subsample?: number
  colsampleBytree?: number
  [key: string]: number | string | boolean | undefined
}

export type ModelMetrics = {
  accuracy?: number
  logLoss?: number
  brierScore?: number
  calibration?: number
  auc?: number
  [key: string]: number | undefined
}

export const modelVersions = pgTable(
  'model_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    version: varchar('version', { length: 50 }).notNull().unique(),
    status: varchar('status', { length: 20 }).notNull().default('training').$type<ModelStatus>(),

    modelType: varchar('model_type', { length: 50 }).notNull(),
    hyperparameters: jsonb('hyperparameters').$type<ModelHyperparameters>(),

    trainingDataFrom: timestamp('training_data_from', { withTimezone: true }),
    trainingDataTo: timestamp('training_data_to', { withTimezone: true }),

    metrics: jsonb('metrics').$type<ModelMetrics>(),

    artifactPath: varchar('artifact_path', { length: 500 }),

    activatedAt: timestamp('activated_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('model_version_status_idx').on(table.status)]
)

export type ModelVersion = typeof modelVersions.$inferSelect
export type NewModelVersion = typeof modelVersions.$inferInsert

export const driftMetricType = ['psi', 'ks', 'wasserstein'] as const
export type DriftMetricType = (typeof driftMetricType)[number]

export const driftMetrics = pgTable(
  'drift_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    modelVersion: varchar('model_version', { length: 50 }).notNull(),

    metricType: varchar('metric_type', { length: 20 }).notNull().$type<DriftMetricType>(),
    featureName: varchar('feature_name', { length: 100 }),

    value: decimal('value', { precision: 10, scale: 6 }).notNull(),
    threshold: decimal('threshold', { precision: 10, scale: 6 }).notNull(),
    isDrifted: boolean('is_drifted').notNull().default(false),

    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('drift_model_version_idx').on(table.modelVersion),
    index('drift_is_drifted_idx').on(table.isDrifted),
  ]
)

export type DriftMetric = typeof driftMetrics.$inferSelect
export type NewDriftMetric = typeof driftMetrics.$inferInsert
