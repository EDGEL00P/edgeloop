/**
 * Next.js App Router API Route Handler
 * Uses Hono adapter for 2027 architecture
 * 
 * This bridges Hono (interim) to Rust (target) backend
 */
import { handle } from '@hono/node-server/nextjs';
import { app } from '../../../server/hono-app';

// Create handler for all HTTP methods
const handler = handle(app);

// Export for Next.js App Router
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
