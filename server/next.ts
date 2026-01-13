import { type Express } from "express";
import next from "next";
import { type Server } from "http";

export async function setupNext(server: Server, app: Express) {
  const nextApp = next({
    dev: true,
    hostname: "0.0.0.0",
    port: 5000,
  });

  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  // Let Next.js handle all other requests
  app.use("*", async (req, res) => {
    await handle(req, res);
  });
}
