import type { NextFunction, Request, Response } from "express";

interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.reset <= now) buckets.delete(key);
  }
}, 60_000).unref();

export function rateLimit(windowMs: number, max: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || "unknown"}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.reset <= now) {
      buckets.set(key, { count: 1, reset: now + windowMs });
      next();
      return;
    }
    if (bucket.count >= max) {
      res.setHeader("Retry-After", Math.ceil((bucket.reset - now) / 1000));
      res.status(429).json({ error: "Too many requests. Wait a moment and try again." });
      return;
    }
    bucket.count += 1;
    next();
  };
}
