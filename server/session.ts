import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { config, isProduction } from "./config.ts";

interface SessionPayload {
  sub: "admin";
  exp: number;
}

function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", config.sessionSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", config.sessionSecret).update(body).digest("base64url");
  const left = Buffer.from(expected);
  const right = Buffer.from(sig);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.sub !== "admin" || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response): void {
  const token = sign({ sub: "admin", exp: Date.now() + config.sessionTtlMs });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: config.sessionTtlMs,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.cookieName, { path: "/" });
}

export function isAdmin(req: Request): boolean {
  return Boolean(readSession(req.cookies?.[config.cookieName]));
}

export function requireAdmin(req: Request, res: Response, next: () => void): void {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Admin sign-in is required for this action." });
    return;
  }
  next();
}

export function passwordsMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
