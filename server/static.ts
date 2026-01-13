import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Serve Next.js static files
  const nextStaticPath = path.resolve(__dirname, "..", ".next", "static");
  if (fs.existsSync(nextStaticPath)) {
    app.use("/_next/static", express.static(nextStaticPath));
  }

  // Serve public files
  const publicPath = path.resolve(__dirname, "..", "public");
  if (fs.existsSync(publicPath)) {
    app.use("/", express.static(publicPath));
  }

  // For production, we need to serve the Next.js standalone build
  // This will be handled by the Next.js server in standalone mode
  const standalonePath = path.resolve(__dirname, "..", ".next", "standalone");
  if (!fs.existsSync(standalonePath)) {
    throw new Error(
      `Could not find the Next.js standalone build directory: ${standalonePath}, make sure to build the client first`,
    );
  }

  // Import and use the Next.js server handler
  const nextServer = require(path.join(standalonePath, "server.js"));
  app.use("*", nextServer);
}
