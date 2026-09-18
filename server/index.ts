import { createApp } from "./app.ts";
import { assertProductionConfig, config, hasSupabase, isProduction } from "./config.ts";

assertProductionConfig();

const app = createApp();

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(
    `Financial Navigator API on :${config.port} (${isProduction ? "production" : "development"}, ${hasSupabase ? "supabase" : "memory"} store)`,
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
