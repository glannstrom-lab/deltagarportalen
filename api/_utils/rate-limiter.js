/**
 * Simple Rate Limiter for Edge Runtime
 *
 * Note: This uses in-memory storage which resets on each cold start.
 * For production with high traffic, consider using Upstash Redis or similar.
 *
 * This provides basic protection against brute-force attacks.
 */

// In-memory store for rate limiting (per edge instance)
const rateLimitStore = new Map()

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupOldEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  const cutoff = now - 60 * 1000 // Remove entries older than 1 minute

  for (const [key, data] of rateLimitStore.entries()) {
    if (data.windowStart < cutoff) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Check if request should be rate limited
 * @param {string} identifier - Unique identifier (usually IP address)
 * @param {number} maxRequests - Maximum requests allowed in window (default: 10)
 * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  cleanupOldEntries()

  const now = Date.now()
  const key = `rate:${identifier}`

  let data = rateLimitStore.get(key)

  // If no existing data or window expired, create new window
  if (!data || (now - data.windowStart) > windowMs) {
    data = {
      windowStart: now,
      count: 0,
    }
  }

  // Increment count
  data.count++
  rateLimitStore.set(key, data)

  const remaining = Math.max(0, maxRequests - data.count)
  const resetIn = Math.max(0, windowMs - (now - data.windowStart))

  return {
    allowed: data.count <= maxRequests,
    remaining,
    resetIn,
  }
}

/**
 * Get client IP from request headers
 * @param {Request} req - The incoming request
 * @returns {string} - Client IP address
 */
export function getClientIP(req) {
  // Vercel/Cloudflare headers
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnecting = req.headers.get('cf-connecting-ip')
  if (cfConnecting) return cfConnecting

  // Vercel
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP

  return 'unknown'
}

/**
 * Create rate limit response with proper headers
 * @param {string} requestOrigin - Origin for CORS headers
 * @param {number} resetIn - Milliseconds until rate limit resets
 * @param {function} getCorsHeaders - Function to get CORS headers
 * @returns {Response}
 */
export function rateLimitResponse(requestOrigin, resetIn, getCorsHeaders) {
  const retryAfter = Math.ceil(resetIn / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        ...getCorsHeaders(requestOrigin),
      },
    }
  )
}
