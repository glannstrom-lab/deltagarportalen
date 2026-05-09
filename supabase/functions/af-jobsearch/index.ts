/**
 * Arbetsförmedlingen JobSearch API Edge Function
 * Proxy för att undvika CORS-restrictions
 * 
 * Endpoints:
 * - GET /search - Sök jobb
 * - GET /ad/{id} - Hämta jobbdetaljer
 * - GET /complete - Autocomplete för sökning
 */

// Tillåtna origins — matchar Vercel-lagrets allowlist. Wildcard '*' var en
// öppen-proxy-risk (kvotutbrytning). 2026-05-09: stängt.
const ALLOWED_ORIGINS = new Set([
  'https://jobin.se',
  'https://www.jobin.se',
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportalen.vercel.app',
  'https://deltagarportal.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
]);

const VERCEL_PREVIEW_RE = /^https:\/\/deltagarportal(en)?-[a-z0-9]+-[\w-]+\.vercel\.app$/;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW_RE.test(origin);
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? (origin as string) : 'https://jobin.se',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    'Vary': 'Origin',
  };
}

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';

// Hjälpfunktion för att skapa JSON-svar med CORS
function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);

  // Handle CORS preflight först
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Extrahera path efter /af-jobsearch
    let path = url.pathname;
    if (path.startsWith('/af-jobsearch')) {
      path = path.substring('/af-jobsearch'.length);
    }
    if (!path || path === '/') {
      path = '/search';
    }
    
    // Bygg target URL
    const targetUrl = `${AF_JOBSEARCH_BASE}${path}${url.search}`;
    
    console.log(`[af-jobsearch] ${req.method} ${path}${url.search}`);

    // Anropa Arbetsförmedlingen API med timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 sekunder timeout
    
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[af-jobsearch] AF API error: ${response.status} - ${errorText}`);
        return jsonResponse({
          total: { value: 0 },
          hits: [],
          error: 'Arbetsförmedlingen API error',
          status: response.status
        }, 200, corsHeaders);
      }

      const data = await response.json();
      return jsonResponse(data, 200, corsHeaders);

    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[af-jobsearch] Timeout');
        return jsonResponse({
          total: { value: 0 },
          hits: [],
          error: 'Timeout - förfrågan tog för lång tid'
        }, 200, corsHeaders);
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('[af-jobsearch] Error:', error);
    return jsonResponse({
      total: { value: 0 },
      hits: [],
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500, corsHeaders);
  }
});
