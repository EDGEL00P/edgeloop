import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
// Configure for serverless environment
neonConfig.fetchConnectionCache = true;
function getDbUrl() {
    const url = process.env['DATABASE_URL'];
    if (!url) {
        throw new Error('DATABASE_URL environment variable is required');
    }
    return url;
}
// Create a singleton database client
let dbInstance = null;
function createDb() {
    const sql = neon(getDbUrl());
    return drizzle(sql, { schema });
}
export function getDb() {
    if (!dbInstance) {
        dbInstance = createDb();
    }
    return dbInstance;
}
// For one-off queries or testing
export function createFreshDb() {
    return createDb();
}
