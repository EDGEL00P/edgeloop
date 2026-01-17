/**
 * Identity Service - Authentication Domain
 * Extracted from server/auth/
 */

import session from "express-session";
import type { Express, Request, Response, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "../../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

/**
 * Configure session middleware with PostgreSQL store
 */
export function getSession(): RequestHandler {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("SESSION_SECRET is required in production");
    }
  }
  
  return session({
    secret: sessionSecret || "edgeloop-secret-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

/**
 * Setup authentication middleware
 */
export async function setupAuth(app: Express): Promise<void> {
  app.set("trust proxy", 1);
  app.use(getSession());
}

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

/**
 * Register authentication routes
 */
export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!db) {
        return res.status(503).json({ message: "Database unavailable" });
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }
      if (!db) {
        return res.status(503).json({ message: "Database unavailable" });
      }
      
      let [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        const [newUser] = await db.insert(users).values({ email }).returning();
        user = newUser;
      }
      
      req.session.userId = user.id;
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
}