import path from "node:path";
import { createApp, frontendReady, resolveDist } from "./app.ts";
import { assertProductionConfig, config, hasSupabase, isProduction } from "./config.ts";

assertProductionConfig();

const dist = resolveDist();
if (isProduction && !frontendReady(dist)) {
  throw new Error(`Production build is missing ${path.join(dist, "index.html")}. Railway must run npm run build before npm start.`);
}

const app = createApp();

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(
    `Financial Navigator API on :${config.port} (${isProduction ? "production" : "development"}, ${hasSupabase ? "supabase" : "memory"} store, frontend ${frontendReady(dist) ? dist : "missing"})`,
  );
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

function shutdown() {
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
