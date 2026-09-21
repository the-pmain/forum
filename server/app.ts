import cookieParser from "cookie-parser";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allowlistMiddleware, isTrustedProxyHop } from "./allowlist.ts";
import { api } from "./routes/api.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

export function resolveDist(): string {
  const candidates = [path.join(here, "..", "dist"), path.join(process.cwd(), "dist")];
  return candidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) ?? candidates[0];
}

export function frontendReady(dist = resolveDist()): boolean {
  return fs.existsSync(path.join(dist, "index.html"));
}

export function createApp() {
  const app = express();
  const dist = resolveDist();
  app.disable("x-powered-by");
  app.set("trust proxy", isTrustedProxyHop);
  app.use(allowlistMiddleware);
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));

  app.use("/api", api);

  if (frontendReady(dist)) {
    app.use(express.static(dist, { index: "index.html" }));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.path.startsWith("/api")) return next();
      const nested = path.resolve(dist, `.${req.path}`, "index.html");
      const root = path.resolve(dist);
      const safeNested = nested.startsWith(root + path.sep) ? nested : "";
      if (safeNested && fs.existsSync(safeNested)) {
        res.sendFile(safeNested);
        return;
      }
      res.sendFile(path.join(dist, "index.html"));
    });
  }

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    res.status(400).json({ error: message });
  });

  return app;
}
