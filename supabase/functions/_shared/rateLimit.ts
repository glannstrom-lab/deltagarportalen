/**
 * Shared Rate Limiting for Edge Functions — DISTRIBUTED via Supabase
 *
 * 2026-05-15 (C3): Migrerad från in-memory Map till Supabase RPC
 * `check_rate_limit`. In-memory är trasig på serverless eftersom
 * räknaren nollas vid cold start och olika instanser inte delar state.
 *
 * In-memory fallback bevaras för fall där RPC failar (Supabase
 * själv-DDoS-skydd).
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const fallbackStore = new Map<string, RateLimitEntry>()

const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW_MS = 60 * 1000

const ENDPOINT_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  'ai-cover-letter': { limit: 5, windowMs: 60 * 1000 },
  'ai-cv-writing': { limit: 10, windowMs: 60 * 1000 },
  'cv-analysis': { limit: 5, windowMs: 60 * 1000 },
  'ai-assistant': { limit: 20, windowMs: 60 * 1000 },
  'send-invite-email': { limit: 10, windowMs: 60 * 1000 },
  'learning-recommend': { limit: 30, windowMs: 60 * 1000 },
  'learning-progress': { limit: 50, windowMs: 60 * 1000 },
  'af-jobsearch': { limit: 60, windowMs: 60 * 1000 },
  'ai-career-assistant': { limit: 20, windowMs: 60 * 1000 },
  'ai-company-analysis': { limit: 5, windowMs: 60 * 1000 },
  'ai-company-search': { limit: 10, windowMs: 60 * 1000 },
  'ai-industry-radar': { limit: 10, windowMs: 60 * 1000 },
  'ai-commute-planner': { limit: 10, windowMs: 60 * 1000 },
}

let supabaseClient: SupabaseClient | null = null

function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !key) return null
  supabaseClient = createClient(url, key)
  return supabaseClient
}

/**
 * Check rate limit (distributed via Supabase, in-memory fallback).
 *
 * BREAKING CHANGE (C3): Returns Promise — alla callers måste använda await.
 *
 * @param userId User ID (eller IP) att rate-limita
 * @param endpoint Endpoint-namn för specifika limits
 * @returns Promise<{ allowed, retryAfter?, remaining? }>
 */
export async function checkRateLimit(
  userId: string,
  endpoint?: string
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  const config = endpoint && ENDPOINT_LIMITS[endpoint]
    ? ENDPOINT_LIMITS[endpoint]
    : { limit: DEFAULT_LIMIT, windowMs: DEFAULT_WINDOW_MS }

  const supabase = getSupabase()

  if (supabase) {
    try {
      const windowMinutes = Math.max(1, Math.ceil(config.windowMs / 60000))
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: userId,
        p_endpoint: endpoint || 'default',
        p_max_requests: config.limit,
        p_window_minutes: windowMinutes,
      })

      if (error) {
        console.error('[RateLimit] Supabase error, using fallback:', error.message)
        return checkRateLimitFallback(userId, endpoint, config)
      }

      if (data && data.length > 0) {
        const r = data[0]
        const resetIn = r.reset_at
          ? Math.max(0, new Date(r.reset_at).getTime() - Date.now())
          : config.windowMs
        return {
          allowed: r.allowed,
          retryAfter: r.allowed ? undefined : Math.ceil(resetIn / 1000),
          remaining: r.remaining || 0,
        }
      }

      return checkRateLimitFallback(userId, endpoint, config)
    } catch (err) {
      console.error('[RateLimit] RPC threw, using fallback:', err)
      return checkRateLimitFallback(userId, endpoint, config)
    }
  }

  return checkRateLimitFallback(userId, endpoint, config)
}

function checkRateLimitFallback(
  userId: string,
  endpoint: string | undefined,
  config: { limit: number; windowMs: number }
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const key = endpoint ? `${userId}:${endpoint}` : userId
  const now = Date.now()
  const entry = fallbackStore.get(key)

  if (!entry || now > entry.resetTime) {
    fallbackStore.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, remaining: config.limit - 1 }
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfter, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: config.limit - entry.count }
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
  )
}

export function addRateLimitHeaders(
  headers: Headers,
  remaining: number,
  limit: number = DEFAULT_LIMIT
): void {
  headers.set('X-RateLimit-Limit', String(limit))
  headers.set('X-RateLimit-Remaining', String(remaining))
}

/**
 * Cleanup old fallback-store entries (kallas inte aktivt nu — Supabase
 * RPC har egen rensning. Behålls för bakåtkompatibilitet).
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, entry] of fallbackStore.entries()) {
    if (now > entry.resetTime) {
      fallbackStore.delete(key)
    }
  }
}

export default {
  checkRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  cleanupRateLimits,
}
