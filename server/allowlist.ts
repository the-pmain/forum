import type { NextFunction, Request, Response } from "express";
import { isIP } from "node:net";
import { config, isProduction } from "./config.ts";

const LOOPBACK = new Set(["127.0.0.1", "::1"]);

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

export function normaliseIp(raw: string | undefined): string {
  let ip = (raw || "").trim().toLowerCase();
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  return ip;
}

export function parseAllowedAddresses(raw: string): { allowed: Set<string>; invalid: string[] } {
  const allowed = new Set<string>();
  const invalid: string[] = [];
  for (const part of unquote(raw).split(",")) {
    const ip = normaliseIp(part);
    if (!ip) continue;
    if (isIP(ip)) allowed.add(ip);
    else invalid.push(part.trim());
  }
  return { allowed, invalid };
}

export function isLoopback(ip: string): boolean {
  return LOOPBACK.has(normaliseIp(ip));
}

export function clientIp(req: Pick<Request, "ip"> & { socket?: { remoteAddress?: string } }): string {
  return normaliseIp(req.ip || req.socket?.remoteAddress || "");
}

const parsedAllowlist = parseAllowedAddresses(config.allowedAddresses);
export const allowedAddresses = parsedAllowlist.allowed;
export const invalidAllowedAddresses = parsedAllowlist.invalid;

export function isAllowedIp(ip: string): boolean {
  const normalised = normaliseIp(ip);
  if (!normalised) return false;
  if (allowedAddresses.has(normalised)) return true;
  if (!isProduction && isLoopback(normalised)) return true;
  return false;
}

function isHealthCheck(req: Request): boolean {
  const path = (req.path || "").replace(/\/+$/, "") || "/";
  return (req.method === "GET" || req.method === "HEAD") && path === "/api/health";
}

const DENIED_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Access denied</title>
  </head>
  <body>
    <h1>Access denied</h1>
    <p>This address is not allowed to use the application.</p>
  </body>
</html>`;

export function allowlistMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isHealthCheck(req)) {
    next();
    return;
  }
  const ip = clientIp(req);
  if (isAllowedIp(ip)) {
    next();
    return;
  }
  res.status(403);
  if ((req.path || "").startsWith("/api")) {
    res.json({ error: "Access denied." });
    return;
  }
  res.type("html").send(DENIED_HTML);
}
