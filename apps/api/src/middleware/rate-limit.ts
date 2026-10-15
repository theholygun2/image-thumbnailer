import { rateLimiter } from "hono-rate-limiter";

/**
 * Rate limits `/api/auth/*` — a public attack surface even pre-launch
 * (sign-in spam, credential stuffing on the test-only email/password
 * provider). Uses the in-memory store, which is fine for a single instance;
 * move to `RedisStore` if this ever runs behind multiple instances, since
 * `MemoryStore` doesn't share counts across processes.
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: "draft-7",
  keyGenerator: (c) => {
    return c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "unknown";
  },
  message: { error: "Too many requests, please try again later." },
});
