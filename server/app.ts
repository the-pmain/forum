import cookieParser from "cookie-parser";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isProduction } from "./config.ts";
import { api } from "./routes/api.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));

  app.use("/api", api);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    res.status(400).json({ error: message });
  });

  if (isProduction) {
    app.use(express.static(dist));
    app.get(/.*/, (req, res) => {
      const nested = path.join(dist, req.path, "index.html");
      res.sendFile(nested, (nestedError) => {
        if (!nestedError) return;
        res.sendFile(path.join(dist, "index.html"));
      });
    });
  }

  return app;
}
