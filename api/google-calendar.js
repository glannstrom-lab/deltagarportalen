/**
 * Google Calendar OAuth & Sync API Endpoint
 * Handles OAuth token exchange and calendar sync
 *
 * Environment variables required:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 */

import { checkRateLimit, getClientIP, rateLimitResponse } from './_utils/rate-limiter.js'

export const config = {
  runtime: 'edge',
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

// Rate limit configuration
const RATE_LIMIT_MAX = 30 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const AUTH_RATE_LIMIT_MAX = 5 // stricter for auth endpoints
const AUTH_RATE_LIMIT_WINDOW = 60 * 1000

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

/**
 * Validate OAuth authorization code
 */
function validateAuthCode(code) {
  if (!code || typeof code !== 'string') return false
  if (code.length < 10 || code.length > 2000) return false
  // OAuth codes typically contain alphanumeric chars, dashes, underscores, and slashes
  if (!/^[a-zA-Z0-9_\-/+=]+$/.test(code)) return false
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { action } = body

    // Apply rate limiting based on action type
    const isAuthAction = action === 'exchange' || action === 'refresh'
    const rateLimit = checkRateLimit(
      `gcal:${clientIP}:${action}`,
      isAuthAction ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX,
      isAuthAction ? AUTH_RATE_LIMIT_WINDOW : RATE_LIMIT_WINDOW
    )

    if (!rateLimit.allowed) {
      return rateLimitResponse(requestOrigin, rateLimit.resetIn, getCorsHeaders)
    }

    switch (action) {
      case 'exchange':
        // Validate inputs before processing
        if (!validateAuthCode(body.code)) {
          return secureErrorResponse('Invalid authorization code', 400, requestOrigin)
        }
        if (!validateRedirectUri(body.redirectUri)) {
          return secureErrorResponse('Invalid redirect URI', 400, requestOrigin)
        }
        return await exchangeCodeForToken(body.code, body.redirectUri, requestOrigin)
      case 'refresh':
        if (!validateAccessToken(body.refreshToken)) {
          return secureErrorResponse('Invalid refresh token', 400, requestOrigin)
        }
        return await refreshAccessToken(body.refreshToken, requestOrigin)
      case 'list-events':
        if (!validateAccessToken(body.accessToken)) {
          return secureErrorResponse('Invalid access token', 400, requestOrigin)
        }
        return await listEvents(body.accessToken, body.timeMin, body.timeMax, requestOrigin)
      case 'create-event':
        if (!validateAccessToken(body.accessToken)) {
          return secureErrorResponse('Invalid access token', 400, requestOrigin)
        }
        return await createEvent(body.accessToken, body.event, requestOrigin)
      case 'update-event':
        if (!validateAccessToken(body.accessToken)) {
          return secureErrorResponse('Invalid access token', 400, requestOrigin)
        }
        return await updateEvent(body.accessToken, body.eventId, body.event, requestOrigin)
      case 'delete-event':
        if (!validateAccessToken(body.accessToken)) {
          return secureErrorResponse('Invalid access token', 400, requestOrigin)
        }
        return await deleteEvent(body.accessToken, body.eventId, requestOrigin)
      default:
        return secureErrorResponse('Invalid action', 400, requestOrigin)
    }
  } catch (error) {
    console.error('[Google Calendar] Error:', error)
    // Security: Never expose internal error details to client
    return secureErrorResponse('Internal server error', 500, requestOrigin)
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForToken(code, redirectUri, requestOrigin) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[Google Calendar] Missing credentials')
    return secureErrorResponse('Service configuration error', 500, requestOrigin)
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!response.ok) {
    const errorData = await response.text()
    // Log internally but don't expose to client
    console.error('[Google Calendar] Token exchange failed:', errorData)
    return secureErrorResponse('Failed to exchange code for token', response.status, requestOrigin)
  }

  const tokenData = await response.json()

  return new Response(
    JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
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
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken, requestOrigin) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }).toString(),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('[Google Calendar] Token refresh failed:', errorData)
    return secureErrorResponse('Failed to refresh token', response.status, requestOrigin)
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
 * List calendar events
 */
async function listEvents(accessToken, timeMin, timeMax, requestOrigin) {
  const params = new URLSearchParams({
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  })

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    console.error('[Google Calendar] List events failed:', errorData)
    return secureErrorResponse('Failed to list events', response.status, requestOrigin)
  }

  const data = await response.json()

  // Transform Google events to our format
  const events = (data.items || []).map(transformGoogleEvent)

  return new Response(JSON.stringify({ events }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(requestOrigin),
    },
  })
}

/**
 * Create a new calendar event
 */
async function createEvent(accessToken, event, requestOrigin) {
  const googleEvent = transformToGoogleEvent(event)

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    console.error('[Google Calendar] Create event failed:', errorData)
    return secureErrorResponse('Failed to create event', response.status, requestOrigin)
  }

  const data = await response.json()

  return new Response(JSON.stringify({ event: transformGoogleEvent(data) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(requestOrigin),
    },
  })
}

/**
 * Update an existing calendar event
 */
async function updateEvent(accessToken, eventId, event, requestOrigin) {
  const googleEvent = transformToGoogleEvent(event)

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    console.error('[Google Calendar] Update event failed:', errorData)
    return secureErrorResponse('Failed to update event', response.status, requestOrigin)
  }

  const data = await response.json()

  return new Response(JSON.stringify({ event: transformGoogleEvent(data) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(requestOrigin),
    },
  })
}

/**
 * Delete a calendar event
 */
async function deleteEvent(accessToken, eventId, requestOrigin) {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok && response.status !== 204) {
    const errorData = await response.text()
    console.error('[Google Calendar] Delete event failed:', errorData)
    return secureErrorResponse('Failed to delete event', response.status, requestOrigin)
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(requestOrigin),
    },
  })
}

/**
 * Transform Google Calendar event to our format
 */
function transformGoogleEvent(gEvent) {
  const start = gEvent.start?.dateTime || gEvent.start?.date
  const end = gEvent.end?.dateTime || gEvent.end?.date
  const isAllDay = !gEvent.start?.dateTime

  return {
    id: gEvent.id,
    googleId: gEvent.id,
    title: gEvent.summary || 'Utan titel',
    description: gEvent.description || '',
    date: start?.split('T')[0] || '',
    time: isAllDay ? null : start?.split('T')[1]?.substring(0, 5),
    endTime: isAllDay ? null : end?.split('T')[1]?.substring(0, 5),
    location: gEvent.location || '',
    type: 'other',
    isAllDay,
    attendees: (gEvent.attendees || []).map(a => a.email),
    googleLink: gEvent.htmlLink,
    source: 'google',
  }
}

/**
 * Transform our event format to Google Calendar format
 */
function transformToGoogleEvent(event) {
  const startDateTime = event.time
    ? `${event.date}T${event.time}:00`
    : event.date
  const endDateTime = event.endTime
    ? `${event.date}T${event.endTime}:00`
    : event.time
    ? `${event.date}T${addMinutes(event.time, 60)}:00`
    : event.date

  return {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.time
      ? { dateTime: startDateTime, timeZone: 'Europe/Stockholm' }
      : { date: event.date },
    end: event.endTime || event.time
      ? { dateTime: endDateTime, timeZone: 'Europe/Stockholm' }
      : { date: addDays(event.date, 1) },
  }
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
