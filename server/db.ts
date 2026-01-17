import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Universal database URL detection - works with any PostgreSQL provider
function getDatabaseUrl(): string {
  // Try all common environment variable names used by different platforms
  const possibleUrls = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_CONNECTION_STRING,
    process.env.PG_CONNECTION_STRING,
    // Railway
    process.env.RAILWAY_DATABASE_URL,
    // Render
    process.env.RENDER_DATABASE_URL,
    // Heroku
    process.env.HEROKU_POSTGRESQL_URL,
    // Fly.io
    process.env.FLY_POSTGRES_URL,
    // Supabase
    process.env.SUPABASE_DB_URL,
    // Neon
    process.env.NEON_DATABASE_URL,
  ].filter(Boolean);

  return possibleUrls[0] || "";
}

// Lazy evaluation - only get connection string when needed
// This prevents build-time errors when DATABASE_URL is not set
function getConnectionString(): string {
  return getDatabaseUrl();
}

type Database = PostgresJsDatabase<typeof schema>;

function createDb(): Database {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Database connection cannot be established.");
  }

  const client = postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    idle_timeout: 20,
    connect_timeout: 10,
    // Auto-detect SSL requirement from connection string
    ssl:
      connectionString.includes("sslmode=require") ||
      connectionString.includes("ssl=true") ||
      (process.env.NODE_ENV === "production" && !connectionString.includes("localhost"))
        ? { rejectUnauthorized: false }
        : false,
    connection: {
      application_name: "edgeloop",
    },
  });

  return drizzle(client, { schema });
}

// Lazy initialization - prevents build-time connection errors
// Connection is only created when db is actually accessed at runtime
let dbInstance: Database | undefined;

function getDb(): Database {
  if (!dbInstance) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      // Check if we're in a build context
      // During Next.js build, DATABASE_URL may not be available
      // We'll allow the module to load but throw when actually accessed
      const isBuildTime = 
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.NEXT_PHASE === 'phase-development-build' ||
        !process.env.DATABASE_URL;
      
      if (isBuildTime) {
        // During build, we can't connect, but we also shouldn't throw
        // until the database is actually used. However, since Next.js
        // evaluates modules during build, we need to provide a fallback.
        // The best approach is to throw a more descriptive error that
        // indicates this is a build-time issue.
        throw new Error(
          "DATABASE_URL is not set. Database connection cannot be established. " +
          "This error may occur during build time. Ensure DATABASE_URL is set in your build environment."
        );
      }
      throw new Error("DATABASE_URL is not set. Database connection cannot be established.");
    }
    dbInstance = createDb();
  }
  return dbInstance;
}

// Proxy to defer database connection until first access
// This prevents errors during Next.js build when DATABASE_URL may not be set
// The connection is only established when the database is actually accessed at runtime
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    // Check if we're in a build context where DATABASE_URL might not be available
    const isBuildContext = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-development-build' ||
      (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL);
    
    // Only attempt to connect if we have a connection string or we're not in build context
    const connectionString = getConnectionString();
    
    if (!connectionString && isBuildContext) {
      // During build, return a stub that allows the module to be imported
      // but will throw a helpful error if actually used
      if (typeof prop === 'string') {
        // Return a function stub for database operations
        return function stub(...args: unknown[]) {
          throw new Error(
            `Database operation '${prop}' is not available during build time. ` +
            `DATABASE_URL must be set in your environment variables for database operations. ` +
            `This is expected during Next.js build and will work at runtime when DATABASE_URL is configured.`
          );
        };
      }
      // For non-function properties, return undefined
      return undefined;
    }
    
    // At runtime, get the actual database connection
    try {
      const db = getDb();
      const value = db[prop as keyof Database];
      // Bind functions to preserve 'this' context
      return typeof value === 'function' ? value.bind(db) : value;
    } catch (error) {
      // If connection fails, throw a helpful error
      if (error instanceof Error && error.message.includes('DATABASE_URL')) {
        throw new Error(
          `Database connection failed: ${error.message}. ` +
          `Ensure DATABASE_URL is set in your environment variables.`
        );
      }
      throw error;
    }
  }
});
