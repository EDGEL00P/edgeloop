import { pgTable, uuid, varchar, decimal, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
export const modelStatus = ['training', 'validating', 'active', 'deprecated', 'failed'];
export const modelVersions = pgTable('model_versions', {
    id: uuid('id').defaultRandom().primaryKey(),
    version: varchar('version', { length: 50 }).notNull().unique(),
    status: varchar('status', { length: 20 }).notNull().default('training').$type(),
    modelType: varchar('model_type', { length: 50 }).notNull(),
    hyperparameters: jsonb('hyperparameters').$type(),
    trainingDataFrom: timestamp('training_data_from', { withTimezone: true }),
    trainingDataTo: timestamp('training_data_to', { withTimezone: true }),
    metrics: jsonb('metrics').$type(),
    artifactPath: varchar('artifact_path', { length: 500 }),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [index('model_version_status_idx').on(table.status)]);
export const driftMetricType = ['psi', 'ks', 'wasserstein'];
export const driftMetrics = pgTable('drift_metrics', {
    id: uuid('id').defaultRandom().primaryKey(),
    modelVersion: varchar('model_version', { length: 50 }).notNull(),
    metricType: varchar('metric_type', { length: 20 }).notNull().$type(),
    featureName: varchar('feature_name', { length: 100 }),
    value: decimal('value', { precision: 10, scale: 6 }).notNull(),
    threshold: decimal('threshold', { precision: 10, scale: 6 }).notNull(),
    isDrifted: boolean('is_drifted').notNull().default(false),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('drift_model_version_idx').on(table.modelVersion),
    index('drift_is_drifted_idx').on(table.isDrifted),
]);
