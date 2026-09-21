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

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const start = trimmed[0];
    const end = trimmed[trimmed.length - 1];
    if ((start === '"' && end === '"') || (start === "'" && end === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "dev-only-session-secret-change-me",
  adminPass: unquote(process.env.ADMIN_PASS || ""),
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  allowedAddresses: process.env.ALLOWED_ADDRESSES || "",
  cookieName: "fn_session",
  sessionTtlMs: 12 * 60 * 60 * 1000,
};

export const isProduction = config.nodeEnv === "production";
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);

const WEAK_SECRETS = new Set(["", "dev-only-session-secret-change-me", "change-me-to-a-long-random-string", "change-me"]);

export function assertProductionConfig(): void {
  if (!isProduction) return;
  if (!process.env.SESSION_SECRET || WEAK_SECRETS.has(process.env.SESSION_SECRET) || process.env.SESSION_SECRET.length < 24) {
    throw new Error("Set SESSION_SECRET to a random string of at least 24 characters before starting in production.");
  }
  if (unquote(process.env.ADMIN_PASS || "").length < 8) {
    throw new Error("Set ADMIN_PASS to a password of at least 8 characters before starting in production.");
  }
}
