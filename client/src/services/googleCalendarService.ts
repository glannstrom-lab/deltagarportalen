/**
 * Google Calendar Integration Service
 * Handles OAuth flow and calendar synchronization
 *
 * Environment variable required:
 * - VITE_GOOGLE_CLIENT_ID
 */

import { supabase } from '@/lib/supabase'

// Google OAuth configuration
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

export interface GoogleCalendarEvent {
  id: string
  googleId?: string
  title: string
  description?: string
  date: string
  time?: string | null
  endTime?: string | null
  location?: string
  type: string
  isAllDay?: boolean
  attendees?: string[]
  googleLink?: string
  source: 'google' | 'local'
}

export interface GoogleCalendarTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  expires_at?: number
}

interface StoredTokens extends GoogleCalendarTokens {
  connected_at: string
}

/**
 * Check if Google Calendar integration is available
 */
export function isGoogleCalendarAvailable(): boolean {
  return !!import.meta.env.VITE_GOOGLE_CLIENT_ID
}

/**
 * Generate random state for OAuth
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Initiate Google OAuth flow
 */
export function initiateGoogleAuth(): void {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    console.error('[GoogleCalendar] Client ID not configured')
    return
  }

  const redirectUri = `${window.location.origin}/calendar/google-callback`
  const state = generateState()

  // Save state for verification
  sessionStorage.setItem('google_oauth_state', state)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  window.location.href = `${GOOGLE_AUTH_URL}?${params}`
}

/**
 * Handle OAuth callback and exchange code for tokens
 */
export async function handleGoogleCallback(
  code: string,
  state: string
): Promise<GoogleCalendarTokens | null> {
  // Verify state
  const savedState = sessionStorage.getItem('google_oauth_state')
  if (state !== savedState) {
    throw new Error('Invalid state parameter')
  }

  sessionStorage.removeItem('google_oauth_state')

  const redirectUri = `${window.location.origin}/calendar/google-callback`

  try {
    const response = await fetch('/api/google-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'exchange',
        code,
        redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to exchange code')
    }

    const tokens = await response.json()

    // Store tokens securely
    await storeTokens({
      ...tokens,
      expires_at: Date.now() + tokens.expires_in * 1000,
      connected_at: new Date().toISOString(),
    })

    return tokens
  } catch (error) {
    console.error('[GoogleCalendar] Callback error:', error)
    throw error
  }
}

/**
 * Store tokens in Supabase (encrypted in user_preferences)
 */
async function storeTokens(tokens: StoredTokens): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('user_preferences').upsert({
      user_id: user.id,
      google_calendar_tokens: tokens,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })
  }

  // Also store locally as backup
  localStorage.setItem('google_calendar_tokens', JSON.stringify(tokens))
}

/**
 * Get stored tokens
 */
async function getStoredTokens(): Promise<StoredTokens | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data } = await supabase
      .from('user_preferences')
      .select('google_calendar_tokens')
      .eq('user_id', user.id)
      .single()

    if (data?.google_calendar_tokens) {
      return data.google_calendar_tokens
    }
  }

  // Fallback to localStorage
  const stored = localStorage.getItem('google_calendar_tokens')
  return stored ? JSON.parse(stored) : null
}

/**
 * Get valid access token, refreshing if needed
 */
async function getAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens()

  if (!tokens) {
    return null
  }

  // Check if token is expired (with 5 min buffer)
  if (tokens.expires_at && tokens.expires_at < Date.now() + 5 * 60 * 1000) {
    if (tokens.refresh_token) {
      try {
        const response = await fetch('/api/google-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'refresh',
            refreshToken: tokens.refresh_token,
          }),
        })

        if (response.ok) {
          const newTokens = await response.json()
          await storeTokens({
            ...tokens,
            access_token: newTokens.access_token,
            expires_at: Date.now() + newTokens.expires_in * 1000,
          })
          return newTokens.access_token
        }
      } catch (error) {
        console.error('[GoogleCalendar] Token refresh failed:', error)
        return null
      }
    }
    return null
  }

  return tokens.access_token
}

/**
 * Check if connected to Google Calendar
 */
export async function isGoogleCalendarConnected(): Promise<boolean> {
  const tokens = await getStoredTokens()
  return !!tokens?.access_token
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('user_preferences').update({
      google_calendar_tokens: null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)
  }

  localStorage.removeItem('google_calendar_tokens')
}

/**
 * List events from Google Calendar
 */
export async function listGoogleEvents(
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('Not connected to Google Calendar')
  }

  const response = await fetch('/api/google-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'list-events',
      accessToken,
      timeMin,
      timeMax,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to list events')
  }

  const data = await response.json()
  return data.events
}

/**
 * Create event in Google Calendar
 */
export async function createGoogleEvent(
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('Not connected to Google Calendar')
  }

  const response = await fetch('/api/google-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-event',
      accessToken,
      event,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create event')
  }

  const data = await response.json()
  return data.event
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleEvent(
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('Not connected to Google Calendar')
  }

  const response = await fetch('/api/google-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update-event',
      accessToken,
      eventId,
      event,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update event')
  }

  const data = await response.json()
  return data.event
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleEvent(eventId: string): Promise<void> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('Not connected to Google Calendar')
  }

  const response = await fetch('/api/google-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete-event',
      accessToken,
      eventId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete event')
  }
}

/**
 * Sync local events with Google Calendar
 * Returns merged events list
 */
export async function syncWithGoogleCalendar(
  localEvents: GoogleCalendarEvent[],
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  const googleEvents = await listGoogleEvents(timeMin, timeMax)

  // Create a map of Google events by ID
  const googleEventMap = new Map(googleEvents.map(e => [e.googleId || e.id, e]))

  // Merge events - prioritize local events that have googleId
  const mergedEvents: GoogleCalendarEvent[] = []
  const processedGoogleIds = new Set<string>()

  for (const localEvent of localEvents) {
    if (localEvent.googleId && googleEventMap.has(localEvent.googleId)) {
      // Event exists in both - use local version but mark source
      mergedEvents.push({
        ...localEvent,
        source: 'local',
      })
      processedGoogleIds.add(localEvent.googleId)
    } else {
      // Local-only event
      mergedEvents.push({
        ...localEvent,
        source: 'local',
      })
    }
  }

  // Add Google-only events
  for (const googleEvent of googleEvents) {
    const googleId = googleEvent.googleId || googleEvent.id
    if (!processedGoogleIds.has(googleId)) {
      mergedEvents.push(googleEvent)
    }
  }

  // Sort by date and time
  mergedEvents.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    if (!a.time) return -1
    if (!b.time) return 1
    return a.time.localeCompare(b.time)
  })

  return mergedEvents
}

export const googleCalendarService = {
  isAvailable: isGoogleCalendarAvailable,
  initiateAuth: initiateGoogleAuth,
  handleCallback: handleGoogleCallback,
  isConnected: isGoogleCalendarConnected,
  disconnect: disconnectGoogleCalendar,
  listEvents: listGoogleEvents,
  createEvent: createGoogleEvent,
  updateEvent: updateGoogleEvent,
  deleteEvent: deleteGoogleEvent,
  sync: syncWithGoogleCalendar,
}

export default googleCalendarService
