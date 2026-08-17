/**
 * Shared CORS configuration for Edge Functions
 * SECURITY: Strict origin validation - reject unknown origins
 */

const ALLOWED_ORIGINS = [
  // Production domains
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportal.vercel.app',
  // Legacy domains (if still in use)
  'https://jobin.se',
  'https://www.jobin.se',
  // Supabase preview URLs
  'https://odcvrdkvzyrbdzvdrhkz.supabase.co',
  // Development (localhost)
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Allow localhost in development ONLY
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

/**
 * DR1 (2026-08-17): en saknad `Origin`-header är inte ett angrepp.
 *
 * Bakgrund: `send-inactivity-warning` svarade **403 "Origin not allowed"** för
 * varje verklig anropare. Cron-vakten (`cronAuth.ts`) var korrekt byggd och
 * fail closed — men den fick aldrig avgöra saken, eftersom svaret gick genom
 * `createCorsResponse`, som anropar `getCorsHeaders(null)` och därmed 403:ade
 * innan cron-autentiseringen syntes utåt. Reproducerat:
 *
 *   utan Origin (pg_cron, GitHub Actions, curl) → 403 "Origin not allowed"
 *   med  Origin: https://www.jobin.se           → 503 "Cron authentication not configured"
 *
 * Planen (A25) trodde att felet enbart var att `CRON_SECRET` aldrig sattes.
 * Det stämde, men att sätta den hade inte hjälpt: ingen server-till-server-
 * anropare skickar `Origin` — den headern sätts av webbläsare.
 *
 * **CORS är inte en autentiseringsmekanism.** Den instruerar en webbläsare om
 * den får läsa svaret; en curl-klient struntar i den helt. Att neka en request
 * *utan* Origin ger därför noll säkerhet och bryter alla maskinanropare. Alla
 * åtta funktioner som använder `validateOriginOrReject` har dessutom en egen,
 * verifierad auth-grind (kontrollerat 2026-08-17: `getUser(token)` eller
 * `verifyCronSecret`) — origin-kontrollen var aldrig säkerhetsgränsen.
 *
 * Skillnaden som fortfarande upprätthålls:
 *   - `Origin` saknas helt   → maskinanrop. Släpps igenom, får inga CORS-headers.
 *   - `Origin: "null"`       → sandlådad webbläsarkontext (iframe, data:). NEKAS.
 *   - okänd origin-sträng    → NEKAS, som tidigare.
 *
 * `client/api/job-alerts.js` löste samma sak genom att degradera till en
 * default-origin. Att utelämna headrarna är mer korrekt: en anropare utan
 * Origin har ingen nytta av dem.
 */
export function arServerAnrop(origin: string | null): boolean {
  return origin === null;
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const isDevMode = Deno.env.get('ENVIRONMENT') === 'development';
  const allowedOrigins = isDevMode
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS;

  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for allowed origins
 * Returns null if origin is not allowed
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> | null {
  // Maskinanrop: inga CORS-headers behövs, och inget skäl att neka.
  // Tomt objekt (inte null) så att anropare som gör `if (!headers) → 403`
  // släpper igenom. Se arServerAnrop ovan.
  if (arServerAnrop(requestOrigin)) {
    return {};
  }

  if (!isOriginAllowed(requestOrigin)) {
    // In production, strictly reject unknown origins
    const isDevMode = Deno.env.get('ENVIRONMENT') === 'development';
    if (!isDevMode) {
      return null;
    }
    // In dev, allow but log warning
    console.warn(`[CORS] Unknown origin: ${requestOrigin}`);
  }

  // Use the exact request origin if allowed
  const origin = requestOrigin || ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    'Vary': 'Origin', // Important for caching with multiple origins
  };
}

/**
 * Create CORS rejection response
 */
export function createCorsRejectionResponse(origin: string | null): Response {
  console.warn(`[CORS] Rejected origin: ${origin}`);
  return new Response(
    JSON.stringify({ error: 'Origin not allowed' }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Handle CORS preflight or return null to continue
 */
export function handleCorsPreflightOrNull(req: Request): Response | null {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    const headers = getCorsHeaders(origin);
    if (!headers) {
      return createCorsRejectionResponse(origin);
    }
    return new Response('ok', { headers });
  }

  return null;
}

/**
 * Validate origin and return rejection response if invalid
 * Call at the start of non-OPTIONS requests
 */
export function validateOriginOrReject(req: Request): Response | null {
  const origin = req.headers.get('Origin');
  const isDevMode = Deno.env.get('ENVIRONMENT') === 'development';

  // Maskinanrop passerar hit — funktionens EGEN auth-grind är säkerhetsgränsen,
  // inte den här. Samtliga åtta anropare verifierar användartoken eller
  // cron-hemlighet direkt efter det här anropet (kontrollerat 2026-08-17).
  if (arServerAnrop(origin)) {
    return null;
  }

  // In production, strictly enforce origin
  if (!isDevMode && !isOriginAllowed(origin)) {
    return createCorsRejectionResponse(origin);
  }

  return null;
}

/**
 * Create JSON response with CORS headers
 * Sanitizes error messages in production
 */
export function createCorsResponse(
  body: object,
  status: number = 200,
  requestOrigin: string | null = null
): Response {
  const headers = getCorsHeaders(requestOrigin);

  // If origin not allowed, return 403
  if (!headers) {
    return createCorsRejectionResponse(requestOrigin);
  }

  // Sanitize error messages in production
  let responseBody = body;
  const isDevMode = Deno.env.get('ENVIRONMENT') === 'development';

  if (!isDevMode && status >= 400) {
    // In production, don't expose internal error details
    const safeBody: Record<string, unknown> = {};

    if ('error' in body && typeof body.error === 'string') {
      safeBody.error = body.error;
    } else {
      safeBody.error = 'An error occurred';
    }

    // Remove potentially sensitive fields
    if ('message' in body) {
      // Don't expose internal error messages
      console.error('[Error Details]', (body as Record<string, unknown>).message);
    }
    if ('details' in body) {
      console.error('[Error Details]', (body as Record<string, unknown>).details);
    }

    responseBody = safeBody;
  }

  return new Response(JSON.stringify(responseBody), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create error response with safe error handling
 */
export function createErrorResponse(
  error: Error | unknown,
  requestOrigin: string | null = null,
  defaultMessage: string = 'An unexpected error occurred'
): Response {
  const isDevMode = Deno.env.get('ENVIRONMENT') === 'development';

  // Log full error server-side
  console.error('[Server Error]', error);

  // Return sanitized error to client
  const errorMessage = isDevMode && error instanceof Error
    ? error.message
    : defaultMessage;

  return createCorsResponse(
    { error: errorMessage },
    500,
    requestOrigin
  );
}

export default {
  getCorsHeaders,
  handleCorsPreflightOrNull,
  validateOriginOrReject,
  createCorsResponse,
  createCorsRejectionResponse,
  createErrorResponse,
  isOriginAllowed,
  arServerAnrop,
};
