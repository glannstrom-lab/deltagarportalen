/**
 * LinkedIn OAuth API Endpoint
 * Handles OAuth token exchange and profile fetching
 *
 * Environment variables required:
 * - LINKEDIN_CLIENT_ID
 * - LINKEDIN_CLIENT_SECRET
 */

import { checkRateLimit, getClientIP, rateLimitResponse } from './_utils/rate-limiter.js'

export const config = {
  runtime: 'edge',
}

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/me'
const LINKEDIN_EMAIL_URL = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))'

// Rate limit configuration (stricter for auth endpoints)
const RATE_LIMIT_MAX = 5 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportalen.vercel.app',
  process.env.FRONTEND_URL,
  // Allow localhost in development
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:3000'] : []),
].filter(Boolean)

/**
 * Get CORS headers with origin validation
 */
function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

/**
 * Validate OAuth authorization code
 */
function validateAuthCode(code) {
  if (!code || typeof code !== 'string') return false
  if (code.length < 10 || code.length > 2000) return false
  if (!/^[a-zA-Z0-9_\-|]+$/.test(code)) return false
  return true
}

/**
 * Validate redirect URI against allowed patterns
 */
function validateRedirectUri(uri) {
  if (!uri || typeof uri !== 'string') return false
  try {
    const url = new URL(uri)
    const allowedHosts = [
      'deltagarportalen.se',
      'www.deltagarportalen.se',
      'deltagarportalen.vercel.app',
      'localhost',
    ]
    return allowedHosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))
  } catch {
    return false
  }
}

/**
 * Validate access token format
 */
function validateAccessToken(token) {
  if (!token || typeof token !== 'string') return false
  if (token.length < 20 || token.length > 4000) return false
  return true
}

/**
 * Create secure error response (no internal details exposed)
 */
function secureErrorResponse(message, status, requestOrigin) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(requestOrigin),
      },
    }
  )
}

export default async function handler(req) {
  const requestOrigin = req.headers.get('origin') || ''
  const clientIP = getClientIP(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(requestOrigin),
    })
  }

  if (req.method !== 'POST') {
    return secureErrorResponse('Method not allowed', 405, requestOrigin)
  }

  // Apply rate limiting
  const rateLimit = checkRateLimit(
    `linkedin:${clientIP}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW
  )

  if (!rateLimit.allowed) {
    return rateLimitResponse(requestOrigin, rateLimit.resetIn, getCorsHeaders)
  }

  try {
    const { code, redirectUri, action } = await req.json()

    if (action === 'exchange') {
      // Validate inputs before processing
      if (!validateAuthCode(code)) {
        return secureErrorResponse('Invalid authorization code', 400, requestOrigin)
      }
      if (!validateRedirectUri(redirectUri)) {
        return secureErrorResponse('Invalid redirect URI', 400, requestOrigin)
      }
      return await exchangeCodeForToken(code, redirectUri, requestOrigin)
    } else if (action === 'profile') {
      // code is actually access token here
      if (!validateAccessToken(code)) {
        return secureErrorResponse('Invalid access token', 400, requestOrigin)
      }
      return await fetchLinkedInProfile(code, requestOrigin)
    }

    return secureErrorResponse('Invalid action', 400, requestOrigin)
  } catch (error) {
    console.error('[LinkedIn Auth] Error:', error)
    // Security: Never expose internal error details to client
    return secureErrorResponse('Internal server error', 500, requestOrigin)
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code, redirectUri, requestOrigin) {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[LinkedIn Auth] Missing credentials')
    return secureErrorResponse('Service configuration error', 500, requestOrigin)
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorData = await response.text()
    // Log internally but don't expose to client
    console.error('[LinkedIn Auth] Token exchange failed:', errorData)
    return secureErrorResponse('Failed to exchange code for token', response.status, requestOrigin)
  }

  const tokenData = await response.json()

  return new Response(
    JSON.stringify({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(requestOrigin),
      },
    }
  )
}

/**
 * Fetch LinkedIn profile using access token
 */
async function fetchLinkedInProfile(accessToken, requestOrigin) {
  // Fetch basic profile
  const profileResponse = await fetch(LINKEDIN_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!profileResponse.ok) {
    const errorData = await profileResponse.text()
    console.error('[LinkedIn Auth] Profile fetch failed:', errorData)
    return secureErrorResponse('Failed to fetch profile', profileResponse.status, requestOrigin)
  }

  const profileData = await profileResponse.json()

  // Fetch email
  let email = ''
  try {
    const emailResponse = await fetch(LINKEDIN_EMAIL_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (emailResponse.ok) {
      const emailData = await emailResponse.json()
      email = emailData.elements?.[0]?.['handle~']?.emailAddress || ''
    }
  } catch (emailError) {
    console.warn('[LinkedIn Auth] Email fetch failed:', emailError)
  }

  // Transform to our format
  const profile = {
    id: profileData.id,
    firstName: profileData.localizedFirstName || profileData.firstName?.localized?.en_US || '',
    lastName: profileData.localizedLastName || profileData.lastName?.localized?.en_US || '',
    email,
    headline: profileData.localizedHeadline || '',
    // Note: Full profile data (experience, education, skills) requires additional API access
    // which is restricted to LinkedIn Partners. Basic profile only includes name and headline.
    experience: [],
    education: [],
    skills: [],
    languages: [],
  }

  return new Response(JSON.stringify({ profile }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(requestOrigin),
    },
  })
}
