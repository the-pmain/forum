import fs from "node:fs";
import path from "node:path";

const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "dev-only-session-secret-change-me",
  adminPassword: process.env.ADMIN_PASSWORD || "dev-admin",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  cookieName: "fn_session",
  sessionTtlMs: 12 * 60 * 60 * 1000,
};

export const isProduction = config.nodeEnv === "production";
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
