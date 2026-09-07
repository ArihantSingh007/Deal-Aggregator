import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting for auth endpoints (login attempts, registration spam).
 *
 * Why Upstash specifically: on Vercel/Netlify, each request can hit a
 * different serverless function instance with its own memory, so an
 * in-process counter (a plain Map/object) does NOT reliably rate-limit
 * anything in production — it only works by accident on a single long-lived
 * server. Upstash's Redis is REST-based (works from edge/serverless) and has
 * a genuinely free tier, making it the standard low-effort fix for this.
 *
 * Gracefully disabled if not configured: sign-up works during local dev
 * without any extra setup, and simply isn't rate-limited until you add the
 * two env vars below. See DEPLOYMENT.md for the 2-minute Upstash setup.
 */

const isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let loginLimiter: Ratelimit | null = null;
let registerLimiter: Ratelimit | null = null;

if (isConfigured) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // 10 login attempts per IP per 10 minutes — generous enough for a real user
  // who mistypes a password a few times, tight enough to blunt brute-forcing.
  loginLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    prefix: "ratelimit:login",
  });

  // 5 new-account attempts per IP per hour — stops automated registration spam
  // without meaningfully affecting real signups.
  registerLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "ratelimit:register",
  });
} else if (process.env.NODE_ENV === "production") {
  // Only warn in production — noisy locally where nobody sets this up.
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN are not set — login and registration " +
      "endpoints are NOT rate-limited. See DEPLOYMENT.md to enable this before going live."
  );
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/** Extracts the caller's IP from standard proxy headers (works on Vercel, Netlify, Render). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Same extraction, but for NextAuth's `authorize(credentials, req)` callback,
 * where `req.headers` is a plain object (Node-style), not a Fetch API
 * `Headers` instance with `.get()` — so it needs its own accessor.
 */
export function getClientIpFromPlainHeaders(headers: Record<string, string | string[] | undefined> | undefined): string {
  const raw = headers?.["x-forwarded-for"] ?? headers?.["x-real-ip"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value ? value.split(",")[0].trim() : "unknown";
}

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  if (!loginLimiter) return { success: true, remaining: Infinity }; // not configured — allow through
  const result = await loginLimiter.limit(ip);
  return { success: result.success, remaining: result.remaining };
}

export async function checkRegisterRateLimit(ip: string): Promise<RateLimitResult> {
  if (!registerLimiter) return { success: true, remaining: Infinity };
  const result = await registerLimiter.limit(ip);
  return { success: result.success, remaining: result.remaining };
}
