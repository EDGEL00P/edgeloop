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

const connectionString = getDatabaseUrl();

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Database connection cannot be established.");
}

type Database = PostgresJsDatabase<typeof schema>;

function createDb(): Database {
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

export const db: Database = createDb();
