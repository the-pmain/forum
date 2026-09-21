import path from "node:path";
import { allowedAddresses, invalidAllowedAddresses } from "./allowlist.ts";
import { createApp, frontendReady, resolveDist } from "./app.ts";
import { assertProductionConfig, config, hasSupabase, isProduction } from "./config.ts";
import { ensureCountries } from "./supabase.ts";

assertProductionConfig();

if (invalidAllowedAddresses.length) {
  console.warn(`ALLOWED_ADDRESSES skipped invalid entries: ${invalidAllowedAddresses.join(", ")}`);
}
if (isProduction && allowedAddresses.size === 0) {
  throw new Error("Set ALLOWED_ADDRESSES to a comma-separated list of client IPs before starting in production.");
}

const dist = resolveDist();
if (isProduction && !frontendReady(dist)) {
  throw new Error(`Production build is missing ${path.join(dist, "index.html")}. Railway must run npm run build before npm start.`);
}

const app = createApp();

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(
    `Financial Navigator API on :${config.port} (${isProduction ? "production" : "development"}, directory from seed.json, comments ${hasSupabase ? "supabase" : "memory"}, frontend ${frontendReady(dist) ? dist : "missing"}, allowlist ${allowedAddresses.size})`,
  );
  if (hasSupabase) void ensureCountries();
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
