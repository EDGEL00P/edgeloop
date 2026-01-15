import type { NextApiRequest, NextApiResponse } from "next";
import type { Server } from "http";
import { createServer } from "http";
import express, { type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import { registerRoutes } from "../../server/routes";

/**
 * Next.js Pages API catch-all that mounts the existing Express backend.
 */

type ExpressBundle = {
  app: ReturnType<typeof express>;
  httpServer: Server;
  ready: Promise<void>;
};

declare global {
  var __EDGELOOP_EXPRESS__: ExpressBundle | undefined;
}

async function getExpressBundle(): Promise<ExpressBundle> {
  if (global.__EDGELOOP_EXPRESS__) return global.__EDGELOOP_EXPRESS__;

  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: false, limit: "2mb" }));

  const httpServer = createServer(app);

  const ready = (async () => {
    await registerRoutes(httpServer, app);
  })();

  global.__EDGELOOP_EXPRESS__ = { app, httpServer, ready };
  return global.__EDGELOOP_EXPRESS__;
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const bundle = await getExpressBundle();
  await bundle.ready;
  bundle.app(req as unknown as ExpressRequest, res as unknown as ExpressResponse);
}
