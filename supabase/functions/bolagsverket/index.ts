/**
 * Bolagsverket API Edge Function
 * Proxy för Värdefulla Datamängder API
 *
 * Endpoints:
 * - GET /company/{orgNumber} - Hämta företagsinformation
 *
 * OAuth2 Client Credentials Grant för autentisering
 */

import { createCorsResponse, handleCorsPreflightOrNull, createErrorResponse } from '../_shared/cors.ts';

const BOLAGSVERKET_TOKEN_URL = 'https://portal.api.bolagsverket.se/oauth2/token';
const BOLAGSVERKET_API_BASE = 'https://portal.api.bolagsverket.se/vardefulla-datamangder/v1';

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token using Client Credentials Grant
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get('BOLAGSVERKET_CLIENT_ID');
  const clientSecret = Deno.env.get('BOLAGSVERKET_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Bolagsverket credentials not configured');
  }

  console.log('[bolagsverket] Fetching new access token...');

  const response = await fetch(BOLAGSVERKET_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[bolagsverket] Token error:', response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();

  // Cache the token (expires_in is in seconds)
  const expiresIn = data.expires_in || 3600;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn * 1000),
  };

  console.log('[bolagsverket] Got new token, expires in', expiresIn, 'seconds');

  return data.access_token;
}

/**
 * Normalize organization number to 10 digits without dash
 */
function normalizeOrgNumber(orgNumber: string): string {
  return orgNumber.replace(/[-\s]/g, '').trim();
}

/**
 * Validate organization number format (10 digits)
 */
function isValidOrgNumber(orgNumber: string): boolean {
  const normalized = normalizeOrgNumber(orgNumber);
  return /^\d{10}$/.test(normalized);
}

/**
 * Fetch company information from Bolagsverket
 */
async function fetchCompanyInfo(orgNumber: string): Promise<object | null> {
  const normalized = normalizeOrgNumber(orgNumber);

  if (!isValidOrgNumber(normalized)) {
    throw new Error('Invalid organization number format. Expected 10 digits.');
  }

  const token = await getAccessToken();

  const url = `${BOLAGSVERKET_API_BASE}/organisationer/${normalized}`;
  console.log('[bolagsverket] Fetching:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[bolagsverket] API error:', response.status, errorText);
    throw new Error(`Bolagsverket API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Transform Bolagsverket response to a cleaner format
 */
function transformCompanyData(raw: Record<string, unknown>): object {
  // The API response structure may vary - adapt as needed
  return {
    orgNumber: raw.organisationsnummer || raw.org_number,
    name: raw.namn || raw.name,
    legalForm: raw.organisationsform || raw.legal_form,
    address: {
      street: raw.adress || raw.street_address,
      postalCode: raw.postnummer || raw.postal_code,
      city: raw.postort || raw.city,
    },
    sniCodes: raw.snikoder || raw.sni_codes || [],
    businessDescription: raw.verksamhetsbeskrivning || raw.business_description,
    registrationDate: raw.registreringsdatum || raw.registration_date,
    // Include raw data for debugging/additional fields
    _raw: raw,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightOrNull(req);
  if (preflightResponse) {
    return preflightResponse;
  }

  const origin = req.headers.get('Origin');

  try {
    const url = new URL(req.url);
    let path = url.pathname;

    // Remove function prefix from path
    if (path.startsWith('/bolagsverket')) {
      path = path.substring('/bolagsverket'.length);
    }

    console.log(`[bolagsverket] ${req.method} ${path}`);

    // Route: GET /company/{orgNumber}
    if (req.method === 'GET' && path.startsWith('/company/')) {
      const orgNumber = path.replace('/company/', '').trim();

      if (!orgNumber) {
        return createCorsResponse(
          { error: 'Organization number is required' },
          400,
          origin
        );
      }

      if (!isValidOrgNumber(orgNumber)) {
        return createCorsResponse(
          { error: 'Invalid organization number format. Expected 10 digits (e.g., 5560747551 or 556074-7551)' },
          400,
          origin
        );
      }

      const rawData = await fetchCompanyInfo(orgNumber);

      if (!rawData) {
        return createCorsResponse(
          { error: 'Company not found', orgNumber: normalizeOrgNumber(orgNumber) },
          404,
          origin
        );
      }

      const company = transformCompanyData(rawData as Record<string, unknown>);

      return createCorsResponse(
        { success: true, company },
        200,
        origin
      );
    }

    // Route: GET /health - Health check
    if (req.method === 'GET' && (path === '/health' || path === '/' || path === '')) {
      // Test that we can get a token
      try {
        await getAccessToken();
        return createCorsResponse(
          { status: 'healthy', service: 'bolagsverket' },
          200,
          origin
        );
      } catch {
        return createCorsResponse(
          { status: 'unhealthy', error: 'Cannot authenticate with Bolagsverket' },
          503,
          origin
        );
      }
    }

    // Unknown route
    return createCorsResponse(
      { error: 'Not found', availableRoutes: ['GET /company/{orgNumber}', 'GET /health'] },
      404,
      origin
    );

  } catch (error) {
    console.error('[bolagsverket] Error:', error);
    return createErrorResponse(
      error,
      origin,
      'Failed to fetch company information'
    );
  }
});
