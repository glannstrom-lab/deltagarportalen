/**
 * Distributed Rate Limiter using Supabase
 *
 * Uses Supabase database for persistent rate limiting that works
 * across serverless instances and cold starts.
 *
 * Falls back to in-memory if Supabase call fails.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase client for rate limiting (uses anon key, function handles security)
let supabaseClient = null

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (url && key) {
      supabaseClient = createClient(url, key)
    }
  }
  return supabaseClient
}

// Fallback in-memory store (used if Supabase fails)
const fallbackStore = new Map()
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupFallbackStore() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - 60 * 1000
  for (const [key, data] of fallbackStore.entries()) {
    if (data.windowStart < cutoff) {
      fallbackStore.delete(key)
    }
  }
}

/**
 * Check rate limit using Supabase (distributed)
 * Falls back to in-memory if Supabase is unavailable
 *
 * @param {string} identifier - Unique identifier (IP or user ID)
 * @param {number} maxRequests - Maximum requests allowed (default: 10)
 * @param {number} windowMs - Time window in milliseconds (default: 60000)
 * @param {string} endpoint - Optional endpoint name for tracking
 * @returns {Promise<{ allowed: boolean, remaining: number, resetIn: number }>}
 */
export async function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000, endpoint = 'default') {
  const supabase = getSupabase()

  if (supabase) {
    try {
      // Convert windowMs to minutes for the database function
      const windowMinutes = Math.max(1, Math.ceil(windowMs / 60000))

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes
      })

      if (error) {
        console.error('[RateLimit] Supabase error, using fallback:', error.message)
        return checkRateLimitFallback(identifier, maxRequests, windowMs)
      }

      if (data && data.length > 0) {
        const result = data[0]
        const resetIn = result.reset_at
          ? Math.max(0, new Date(result.reset_at).getTime() - Date.now())
          : windowMs

        return {
          allowed: result.allowed,
          remaining: result.remaining || 0,
          resetIn
        }
      }

      // Unexpected response format, use fallback
      console.warn('[RateLimit] Unexpected response format, using fallback')
      return checkRateLimitFallback(identifier, maxRequests, windowMs)

    } catch (err) {
      console.error('[RateLimit] Error calling Supabase:', err.message)
      return checkRateLimitFallback(identifier, maxRequests, windowMs)
    }
  }

  // No Supabase configured, use fallback
  return checkRateLimitFallback(identifier, maxRequests, windowMs)
}

/**
 * Synchronous in-memory fallback rate limiter
 */
function checkRateLimitFallback(identifier, maxRequests, windowMs) {
  cleanupFallbackStore()

  const now = Date.now()
  const key = `rate:${identifier}`

  let data = fallbackStore.get(key)

  if (!data || (now - data.windowStart) > windowMs) {
    data = { windowStart: now, count: 0 }
  }

  data.count++
  fallbackStore.set(key, data)

  const remaining = Math.max(0, maxRequests - data.count)
  const resetIn = Math.max(0, windowMs - (now - data.windowStart))

  return {
    allowed: data.count <= maxRequests,
    remaining,
    resetIn
  }
}

/**
 * Synchronous version for edge runtime compatibility
 * Uses in-memory only (for cases where async isn't possible)
 */
export function checkRateLimitSync(identifier, maxRequests = 10, windowMs = 60000) {
  return checkRateLimitFallback(identifier, maxRequests, windowMs)
}

/**
 * Get client IP from request headers
 * @param {Request} req - The incoming request
 * @returns {string} - Client IP address
 */
export function getClientIP(req) {
  // Handle both Edge Runtime (headers.get) and Node.js (headers object)
  const getHeader = (name) => {
    if (typeof req.headers?.get === 'function') {
      return req.headers.get(name)
    }
    return req.headers?.[name] || req.headers?.[name.toLowerCase()]
  }

  // Vercel/Cloudflare headers
  const forwarded = getHeader('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnecting = getHeader('cf-connecting-ip')
  if (cfConnecting) return cfConnecting

  // Vercel
  const realIP = getHeader('x-real-ip')
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
        'X-RateLimit-Remaining': '0',
        ...getCorsHeaders(requestOrigin),
      },
    }
  )
}

/**
 * Create rate limit response for Node.js (res.json style)
 */
export function sendRateLimitResponse(res, resetIn, corsHeaders = {}) {
  const retryAfter = Math.ceil(resetIn / 1000)

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
  res.setHeader('Retry-After', String(retryAfter))
  res.setHeader('X-RateLimit-Remaining', '0')

  return res.status(429).json({
    error: 'Too many requests. Please try again later.',
    retryAfter
  })
}

export default {
  checkRateLimit,
  checkRateLimitSync,
  getClientIP,
  rateLimitResponse,
  sendRateLimitResponse
}
