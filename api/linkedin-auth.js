/**
 * LinkedIn OAuth API Endpoint
 * Handles OAuth token exchange and profile fetching
 *
 * Environment variables required:
 * - LINKEDIN_CLIENT_ID
 * - LINKEDIN_CLIENT_SECRET
 */

export const config = {
  runtime: 'edge',
}

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/me'
const LINKEDIN_EMAIL_URL = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))'

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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
    const { code, redirectUri, action } = await req.json()

    if (action === 'exchange') {
      // Exchange authorization code for access token
      return await exchangeCodeForToken(code, redirectUri)
    } else if (action === 'profile') {
      // Fetch profile with access token
      return await fetchLinkedInProfile(code) // code is actually access token here
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[LinkedIn Auth] Error:', error)
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
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code, redirectUri) {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'LinkedIn credentials not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
    console.error('[LinkedIn Auth] Token exchange failed:', errorData)
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
 * Fetch LinkedIn profile using access token
 */
async function fetchLinkedInProfile(accessToken) {
  // Fetch basic profile
  const profileResponse = await fetch(LINKEDIN_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!profileResponse.ok) {
    const errorData = await profileResponse.text()
    console.error('[LinkedIn Auth] Profile fetch failed:', errorData)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch profile', details: errorData }),
      {
        status: profileResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
      'Access-Control-Allow-Origin': '*',
    },
  })
}
