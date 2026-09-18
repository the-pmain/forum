import { createApp } from "./app.ts";
import { config, hasSupabase, isProduction } from "./config.ts";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(
    `Financial Navigator API on :${config.port} (${isProduction ? "production" : "development"}, ${hasSupabase ? "supabase" : "memory"} store)`,
  );
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
