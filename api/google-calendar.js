/**
 * Google Calendar OAuth & Sync API Endpoint
 * Handles OAuth token exchange and calendar sync
 *
 * Environment variables required:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 */

export const config = {
  runtime: 'edge',
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
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

    switch (action) {
      case 'exchange':
        return await exchangeCodeForToken(body.code, body.redirectUri)
      case 'refresh':
        return await refreshAccessToken(body.refreshToken)
      case 'list-events':
        return await listEvents(body.accessToken, body.timeMin, body.timeMax)
      case 'create-event':
        return await createEvent(body.accessToken, body.event)
      case 'update-event':
        return await updateEvent(body.accessToken, body.eventId, body.event)
      case 'delete-event':
        return await deleteEvent(body.accessToken, body.eventId)
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('[Google Calendar] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForToken(code, redirectUri) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Google credentials not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
    console.error('[Google Calendar] Token exchange failed:', errorData)
    return new Response(
      JSON.stringify({ error: 'Failed to exchange code for token', details: errorData }),
      {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
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
    return new Response(
      JSON.stringify({ error: 'Failed to refresh token', details: errorData }),
      {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}

/**
 * List calendar events
 */
async function listEvents(accessToken, timeMin, timeMax) {
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
    return new Response(
      JSON.stringify({ error: 'Failed to list events', details: errorData }),
      {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const data = await response.json()

  // Transform Google events to our format
  const events = (data.items || []).map(transformGoogleEvent)

  return new Response(JSON.stringify({ events }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

/**
 * Create a new calendar event
 */
async function createEvent(accessToken, event) {
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
    return new Response(
      JSON.stringify({ error: 'Failed to create event', details: errorData }),
      {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const data = await response.json()

  return new Response(JSON.stringify({ event: transformGoogleEvent(data) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

/**
 * Update an existing calendar event
 */
async function updateEvent(accessToken, eventId, event) {
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
    return new Response(
      JSON.stringify({ error: 'Failed to update event', details: errorData }),
      {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const data = await response.json()

  return new Response(JSON.stringify({ event: transformGoogleEvent(data) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

/**
 * Delete a calendar event
 */
async function deleteEvent(accessToken, eventId) {
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
    return new Response(
      JSON.stringify({ error: 'Failed to delete event', details: errorData }),
      {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
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
