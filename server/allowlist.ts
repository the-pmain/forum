import type { IncomingMessage, ServerResponse } from "node:http";
import type { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import { isIP } from "node:net";
import path from "node:path";
import { config, isProduction } from "./config.ts";

const LOOPBACK = new Set(["127.0.0.1", "::1"]);
const IP_HEADERS = ["cf-connecting-ip", "true-client-ip", "x-real-ip", "x-client-ip", "x-forwarded-for"] as const;
export const ACCESS_DENIED = "Access denied.";

type IpRequest = {
  ip?: string;
  ips?: string[];
  method?: string;
  path?: string;
  url?: string;
  headers?: IncomingMessage["headers"];
  socket?: { remoteAddress?: string };
};

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
  const zone = ip.indexOf("%");
  if (zone > 0) ip = ip.slice(0, zone);
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  const portSplit = ip.lastIndexOf(":");
  if (portSplit > -1 && ip.includes(".") && /^\d+$/.test(ip.slice(portSplit + 1))) {
    ip = ip.slice(0, portSplit);
  }
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
  const normalised = normaliseIp(ip);
  return LOOPBACK.has(normalised) || normalised.startsWith("127.");
}

function isPrivateOrLoopback(ip: string): boolean {
  const normalised = normaliseIp(ip);
  if (!normalised) return false;
  if (isLoopback(normalised)) return true;
  if (/^10\./.test(normalised)) return true;
  if (/^192\.168\./.test(normalised)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalised)) return true;
  if (/^169\.254\./.test(normalised)) return true;
  if (normalised === "::" || normalised === "0.0.0.0") return true;
  if (normalised.startsWith("fc") || normalised.startsWith("fd") || normalised.startsWith("fe80:")) return true;
  return false;
}

export function isTrustedProxyHop(address: string): boolean {
  return isPrivateOrLoopback(address);
}

function headerValues(headers: IncomingMessage["headers"] | undefined, name: string): string[] {
  if (!headers) return [];
  const raw = headers[name];
  if (!raw) return [];
  const chunks = Array.isArray(raw) ? raw : [raw];
  return chunks.flatMap((value) => value.split(",")).map((part) => normaliseIp(part)).filter((ip) => Boolean(ip) && isIP(ip));
}

export function requestIps(req: IpRequest): string[] {
  const found = new Set<string>();
  const add = (value: string | undefined) => {
    const ip = normaliseIp(value);
    if (ip && isIP(ip)) found.add(ip);
  };
  for (const header of IP_HEADERS) {
    for (const ip of headerValues(req.headers, header)) add(ip);
  }
  add(req.ip);
  for (const ip of req.ips || []) add(ip);
  add(req.socket?.remoteAddress);
  return [...found];
}

function readAllowedAddressesRaw(): string {
  const envFile = path.join(process.cwd(), ".env");
  try {
    if (fs.existsSync(envFile)) {
      let text = fs.readFileSync(envFile, "utf8");
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 0) continue;
        if (trimmed.slice(0, eq).trim() === "ALLOWED_ADDRESSES") {
          return trimmed.slice(eq + 1).trim();
        }
      }
    }
  } catch {
    /* process.env is the production source */
  }
  return process.env.ALLOWED_ADDRESSES || config.allowedAddresses || "";
}

export function loadAllowlist(): { allowed: Set<string>; invalid: string[] } {
  return parseAllowedAddresses(readAllowedAddressesRaw());
}

export function isAllowedIp(ip: string, allowed = loadAllowlist().allowed): boolean {
  const normalised = normaliseIp(ip);
  if (!normalised) return false;
  if (allowed.has(normalised)) return true;
  if (!isProduction && isLoopback(normalised)) return true;
  return false;
}

export function isAllowedRequest(req: IpRequest, allowed = loadAllowlist().allowed): boolean {
  const ips = requestIps(req);
  if (ips.some((ip) => isAllowedIp(ip, allowed))) return true;
  if (!isProduction && ips.some((ip) => isLoopback(ip))) return true;
  return false;
}

function requestPath(req: IpRequest): string {
  const raw = req.path || req.url || "/";
  return raw.split("?")[0].replace(/\/+$/, "") || "/";
}

function isHealthCheck(req: IpRequest): boolean {
  return (req.method === "GET" || req.method === "HEAD") && requestPath(req) === "/api/health";
}

export const DENIED_HTML = `<!doctype html>
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

function deny(req: IpRequest, writeJson: boolean, send: (status: number, body: string, type: string) => void): void {
  const ips = requestIps(req).join(", ") || "unknown";
  console.warn(`Blocked ${req.method || "GET"} ${requestPath(req)} from ${ips}`);
  if (writeJson) {
    send(403, JSON.stringify({ error: ACCESS_DENIED }), "application/json; charset=utf-8");
    return;
  }
  send(403, DENIED_HTML, "text/html; charset=utf-8");
}

export function allowlistMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isHealthCheck(req)) {
    next();
    return;
  }
  if (isAllowedRequest(req)) {
    next();
    return;
  }
  deny(req, requestPath(req).startsWith("/api"), (status, body, type) => {
    res.status(status);
    res.setHeader("Content-Type", type);
    res.send(body);
  });
}

export function connectAllowlist(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  if (isHealthCheck(req)) {
    next();
    return;
  }
  if (isAllowedRequest(req)) {
    next();
    return;
  }
  deny(req, requestPath(req).startsWith("/api"), (status, body, type) => {
    res.statusCode = status;
    res.setHeader("Content-Type", type);
    res.end(body);
  });
}
