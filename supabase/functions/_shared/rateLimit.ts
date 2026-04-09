/**
 * Shared Rate Limiting for Edge Functions
 * In-memory rate limiting with configurable limits per endpoint
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage (per function instance)
// Note: In production with multiple instances, consider Redis
const rateLimits = new Map<string, RateLimitEntry>();

// Default limits
const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

// Endpoint-specific limits
const ENDPOINT_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  'ai-cover-letter': { limit: 5, windowMs: 60 * 1000 },
  'ai-cv-writing': { limit: 10, windowMs: 60 * 1000 },
  'cv-analysis': { limit: 5, windowMs: 60 * 1000 },
  'ai-assistant': { limit: 20, windowMs: 60 * 1000 },
  'send-invite-email': { limit: 10, windowMs: 60 * 1000 },
  'learning-recommend': { limit: 30, windowMs: 60 * 1000 },
  'learning-progress': { limit: 50, windowMs: 60 * 1000 },
  'af-jobsearch': { limit: 60, windowMs: 60 * 1000 },
  // AI Career Assistant endpoints
  'ai-career-assistant': { limit: 20, windowMs: 60 * 1000 },
  'ai-company-analysis': { limit: 5, windowMs: 60 * 1000 },
  'ai-industry-radar': { limit: 10, windowMs: 60 * 1000 },
  'ai-commute-planner': { limit: 10, windowMs: 60 * 1000 },
};

/**
 * Check if request should be rate limited
 * @param userId User ID to rate limit
 * @param endpoint Endpoint name for specific limits
 * @returns Object with allowed status and retry-after info
 */
export function checkRateLimit(
  userId: string,
  endpoint?: string
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const config = endpoint && ENDPOINT_LIMITS[endpoint]
    ? ENDPOINT_LIMITS[endpoint]
    : { limit: DEFAULT_LIMIT, windowMs: DEFAULT_WINDOW_MS };

  const key = endpoint ? `${userId}:${endpoint}` : userId;
  const now = Date.now();
  const entry = rateLimits.get(key);

  // No entry or window expired - allow and start new window
  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1 };
  }

  // Within window - check limit
  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  // Allow and increment
  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count };
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(
  retryAfter: number,
  origin: string | null
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
        ...(origin && {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  remaining: number,
  limit: number = DEFAULT_LIMIT
): void {
  headers.set('X-RateLimit-Limit', String(limit));
  headers.set('X-RateLimit-Remaining', String(remaining));
}

/**
 * Cleanup old entries (call periodically to prevent memory leaks)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetTime) {
      rateLimits.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

export default {
  checkRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  cleanupRateLimits,
};
