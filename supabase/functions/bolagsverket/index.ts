/**
 * Bolagsverket API Edge Function
 * Proxy för Värdefulla Datamängder API
 *
 * Endpoints:
 * - GET /company/{orgNumber} - Hämta företagsinformation
 * - GET /company/{orgNumber}/documents - Lista årsredovisningar
 * - GET /document/{dokumentId} - Ladda ner årsredovisning (ZIP)
 *
 * OAuth2 Client Credentials Grant för autentisering
 */

import { createCorsResponse, handleCorsPreflightOrNull, createErrorResponse, getCorsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Per-user rate-limit: 30 anrop / 15 min. Bolagsverket-quota delas
// projekt-globalt — utan per-user-limit kan en användare bränna alla
// projektets requests för dagen (alla deltagare drabbas).
const RATE_LIMIT_PER_USER_PER_WINDOW = 30;
const RATE_LIMIT_WINDOW_MINUTES = 15;

const BOLAGSVERKET_TOKEN_URL = 'https://portal.api.bolagsverket.se/oauth2/token';
const BOLAGSVERKET_API_BASE = 'https://gw.api.bolagsverket.se/vardefulla-datamangder/v1';

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token using Client Credentials Grant
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get('BOLAGSVERKET_CLIENT_ID');
  const clientSecret = Deno.env.get('BOLAGSVERKET_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Bolagsverket credentials not configured');
  }

  console.log('[bolagsverket] Fetching new access token...');

  // Use Basic Auth header as recommended by Bolagsverket
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(BOLAGSVERKET_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=vardefulla-datamangder:read vardefulla-datamangder:ping',
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
 * Uses POST /organisationer with identitetsbeteckning in body
 */
async function fetchCompanyInfo(orgNumber: string): Promise<object | null> {
  const normalized = normalizeOrgNumber(orgNumber);

  if (!isValidOrgNumber(normalized)) {
    throw new Error('Invalid organization number format. Expected 10 digits.');
  }

  const token = await getAccessToken();

  const url = `${BOLAGSVERKET_API_BASE}/organisationer`;
  console.log('[bolagsverket] Fetching company:', normalized);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      identitetsbeteckning: normalized,
    }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[bolagsverket] API error:', response.status, errorText);
    throw new Error(`Bolagsverket API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();

  // API returns { organisationer: [...] } array
  if (data.organisationer && data.organisationer.length > 0) {
    return data.organisationer[0];
  }

  return null;
}

/**
 * Transform Bolagsverket response to a cleaner format
 * API returns deeply nested Swedish field names
 */
function transformCompanyData(raw: Record<string, unknown>): object {
  // Extract org number from organisationsidentitet.identitetsbeteckning
  const orgIdentitet = raw.organisationsidentitet as Record<string, unknown> | undefined;
  const orgNumber = orgIdentitet?.identitetsbeteckning as string || '';

  // Extract company name from organisationsnamn.organisationsnamnLista[0].namn
  const orgNamn = raw.organisationsnamn as Record<string, unknown> | undefined;
  const namnLista = orgNamn?.organisationsnamnLista as Array<Record<string, unknown>> | undefined;
  // Find the main company name (FORETAGSNAMN) or use first entry
  const mainName = namnLista?.find(n =>
    (n.organisationsnamntyp as Record<string, unknown>)?.kod === 'FORETAGSNAMN'
  ) || namnLista?.[0];
  const name = (mainName?.namn as string) || '';

  // Extract legal form from organisationsform or juridiskForm
  const orgForm = raw.organisationsform as Record<string, unknown> | undefined;
  const jurForm = raw.juridiskForm as Record<string, unknown> | undefined;
  const legalForm = orgForm?.klartext as string || jurForm?.klartext as string || '';

  // Extract address from postadressOrganisation.postadress
  const postAddrOrg = raw.postadressOrganisation as Record<string, unknown> | undefined;
  const postAddr = postAddrOrg?.postadress as Record<string, unknown> | undefined;

  // Extract SNI codes from naringsgrenOrganisation.sni
  const naringsgrenOrg = raw.naringsgrenOrganisation as Record<string, unknown> | undefined;
  const sniArray = naringsgrenOrg?.sni as Array<Record<string, unknown>> | undefined;
  const sniCodes = sniArray?.map(sni => ({
    code: sni.kod as string,
    description: sni.klartext as string,
  })) || [];

  // Extract business description from verksamhetsbeskrivning.beskrivning
  const verksamhet = raw.verksamhetsbeskrivning as Record<string, unknown> | undefined;
  const businessDescription = verksamhet?.beskrivning as string || '';

  // Extract registration date from organisationsdatum.registreringsdatum
  const orgDatum = raw.organisationsdatum as Record<string, unknown> | undefined;
  const registrationDate = orgDatum?.registreringsdatum as string || '';

  return {
    orgNumber,
    name,
    legalForm,
    address: {
      street: postAddr?.utdelningsadress as string || '',
      postalCode: postAddr?.postnummer as string || '',
      city: postAddr?.postort as string || '',
    },
    sniCodes,
    businessDescription: businessDescription.trim(),
    registrationDate,
    // Include raw data for debugging/additional fields
    _raw: raw,
  };
}

/**
 * Fetch list of annual reports for a company
 */
async function fetchDocumentList(orgNumber: string): Promise<object[]> {
  const normalized = normalizeOrgNumber(orgNumber);

  if (!isValidOrgNumber(normalized)) {
    throw new Error('Invalid organization number format. Expected 10 digits.');
  }

  const token = await getAccessToken();

  const url = `${BOLAGSVERKET_API_BASE}/dokumentlista`;
  console.log('[bolagsverket] Fetching document list for:', normalized);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      identitetsbeteckning: normalized,
    }),
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[bolagsverket] Document list error:', response.status, errorText);
    throw new Error(`Bolagsverket API error: ${response.status}`);
  }

  const data = await response.json();

  // Transform document list
  const documents = data.dokument || [];
  return documents.map((doc: Record<string, unknown>) => ({
    id: doc.dokumentId,
    format: doc.filformat,
    periodEnd: doc.rapporteringsperiodTom,
    registrationDate: doc.registreringstidpunkt,
  }));
}

/**
 * Fetch a specific document (annual report) as binary
 */
async function fetchDocument(dokumentId: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  const token = await getAccessToken();

  const url = `${BOLAGSVERKET_API_BASE}/dokument/${dokumentId}`;
  console.log('[bolagsverket] Fetching document:', dokumentId);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/zip',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[bolagsverket] Document fetch error:', response.status, errorText);
    throw new Error(`Bolagsverket API error: ${response.status}`);
  }

  const data = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') || 'application/zip';

  return { data, contentType };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightOrNull(req);
  if (preflightResponse) {
    return preflightResponse;
  }

  const origin = req.headers.get('Origin');

  // ---------- AUTH + per-user rate-limit ----------
  // Audit M7 (2026-05-14): Tidigare ingen explicit user-JWT-check och
  // ingen per-user rate-limit → omöjligt att spåra missbruk + delad
  // Bolagsverket-quota förbrukas projekt-globalt.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return createCorsResponse({ error: 'Unauthorized' }, 401, origin);
  }
  const token = authHeader.substring(7);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return createCorsResponse({ error: 'Server misconfigured' }, 500, origin);
  }
  const supabase = createClient(supabaseUrl, anonKey);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return createCorsResponse({ error: 'Invalid token' }, 401, origin);
  }

  // Distribuerad rate-limit (samma RPC som Vercel-vägen)
  try {
    const { data: rlData, error: rlErr } = await supabase.rpc('check_rate_limit', {
      p_identifier: user.id,
      p_endpoint: 'bolagsverket',
      p_max_requests: RATE_LIMIT_PER_USER_PER_WINDOW,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });
    if (!rlErr && rlData && rlData.length > 0 && !rlData[0].allowed) {
      const resetIn = rlData[0].reset_at
        ? Math.max(0, new Date(rlData[0].reset_at).getTime() - Date.now())
        : RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      const headers = getCorsHeaders(origin) || {};
      return new Response(JSON.stringify({
        error: 'För många Bolagsverket-anrop. Försök igen om en stund.',
        retryAfter: Math.ceil(resetIn / 1000),
      }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) },
      });
    }
  } catch (e) {
    console.error('[bolagsverket] rate-limit-check failed (allowing):', e);
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname;

    // Remove function prefix from path
    if (path.startsWith('/bolagsverket')) {
      path = path.substring('/bolagsverket'.length);
    }

    console.log(`[bolagsverket] ${req.method} ${path} user=${user.id}`);

    // Route: GET /company/{orgNumber}/documents - List annual reports
    if (req.method === 'GET' && path.match(/^\/company\/[^/]+\/documents$/)) {
      const orgNumber = path.replace('/company/', '').replace('/documents', '').trim();

      if (!orgNumber || !isValidOrgNumber(orgNumber)) {
        return createCorsResponse(
          { error: 'Invalid organization number format' },
          400,
          origin
        );
      }

      const documents = await fetchDocumentList(orgNumber);

      return createCorsResponse(
        { success: true, documents, orgNumber: normalizeOrgNumber(orgNumber) },
        200,
        origin
      );
    }

    // Route: GET /document/{dokumentId} - Download annual report
    if (req.method === 'GET' && path.startsWith('/document/')) {
      const dokumentId = path.replace('/document/', '').trim();

      if (!dokumentId) {
        return createCorsResponse(
          { error: 'Document ID is required' },
          400,
          origin
        );
      }

      const { data, contentType } = await fetchDocument(dokumentId);

      const headers = getCorsHeaders(origin) || {};
      return new Response(data, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${dokumentId}.zip"`,
        },
      });
    }

    // Route: GET /company/{orgNumber} - Get company info
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
      { error: 'Not found', availableRoutes: [
        'GET /company/{orgNumber}',
        'GET /company/{orgNumber}/documents',
        'GET /document/{dokumentId}',
        'GET /health'
      ]},
      404,
      origin
    );

  } catch (error) {
    // A15 (2026-07-23): var en "temporarily" detaljerad felhanterare med
    // CORS-fallback '*' som läckte råa felmeddelanden i prod (gamla
    // MEDIUM-007). Nu samma sanerade svar som övriga funktioner.
    return createErrorResponse(error, origin, 'Något gick fel vid hämtningen från Bolagsverket.');
  }
});
