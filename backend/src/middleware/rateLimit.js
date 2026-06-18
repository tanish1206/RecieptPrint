/**
 * @file rateLimit.js
 * @description Rate-limiter middleware for the AI receipt analysis endpoint.
 * Prevents API abuse and Groq quota exhaustion. Applied only to /api/analyze.
 */

/**
 * Simple in-memory rate limiter.
 * Limits each IP to `maxRequests` per `windowMs` milliseconds.
 *
 * @param {{ windowMs?: number, maxRequests?: number }} options
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 10 } = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const store = new Map();

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      // New window
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success:   false,
        error:     'Too many receipt scans. Please wait before trying again.',
        code:      'RATE_LIMITED',
        retryAfter: retryAfterSec,
        timestamp: new Date().toISOString(),
      });
    }

    entry.count += 1;
    next();
  };
}

/** Pre-built limiter: 10 scans per 15 minutes per IP */
export const analysisLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });
