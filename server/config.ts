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

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

const rawPin = digitsOnly(process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || "");

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "dev-only-session-secret-change-me",
  adminPin: rawPin.length === 4 ? rawPin : "2580",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  cookieName: "fn_session",
  sessionTtlMs: 12 * 60 * 60 * 1000,
};

export const isProduction = config.nodeEnv === "production";
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);

const WEAK_SECRETS = new Set(["", "dev-only-session-secret-change-me", "change-me-to-a-long-random-string", "change-me"]);
const WEAK_PINS = new Set(["0000", "1111", "1234", "4321", "1212", "2580", "0001", "9999"]);

export function assertProductionConfig(): void {
  if (!isProduction) return;
  if (!process.env.SESSION_SECRET || WEAK_SECRETS.has(process.env.SESSION_SECRET) || process.env.SESSION_SECRET.length < 24) {
    throw new Error("Set SESSION_SECRET to a random string of at least 24 characters before starting in production.");
  }
  const pin = digitsOnly(process.env.ADMIN_PIN || "");
  if (!/^\d{4}$/.test(pin) || WEAK_PINS.has(pin)) {
    throw new Error("Set ADMIN_PIN to four digits that are not a trivial sequence before starting in production.");
  }
}
