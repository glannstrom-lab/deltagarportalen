// Shared CORS configuration for Edge Functions
// SECURITY: Restrict to known domains instead of wildcard

const ALLOWED_ORIGINS = [
  'https://jobin.se',
  'https://www.jobin.se',
  'https://app.jobin.se',
  // Supabase preview URLs
  'https://odcvrdkvzyrbdzvdrhkz.supabase.co',
]

// Allow localhost in development
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const isDevMode = Deno.env.get('ENVIRONMENT') === 'development'
  const allowedOrigins = isDevMode
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS

  // Check if the request origin is allowed
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0] // Default to main domain

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  }
}

// Helper to handle CORS preflight
export function handleCorsPreflightOrNull(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin')
    return new Response('ok', { headers: getCorsHeaders(origin) })
  }
  return null
}

// Helper to create JSON response with CORS
export function createCorsResponse(
  body: object,
  status: number = 200,
  requestOrigin: string | null = null
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(requestOrigin),
      'Content-Type': 'application/json'
    },
  })
}
