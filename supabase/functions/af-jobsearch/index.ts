/**
 * Arbetsförmedlingen JobSearch API Edge Function
 * Proxy för att undvika CORS-restrictions
 * 
 * Endpoints:
 * - GET /search - Sök jobb
 * - GET /ad/{id} - Hämta jobbdetaljer
 * - GET /complete - Autocomplete för sökning
 */

// CORS headers - MÅSTE vara på alla svar
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';

// Hjälpfunktion för att skapa JSON-svar med CORS
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

Deno.serve(async (req) => {
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
        });
      }

      const data = await response.json();
      return jsonResponse(data);
      
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[af-jobsearch] Timeout');
        return jsonResponse({ 
          total: { value: 0 }, 
          hits: [],
          error: 'Timeout - förfrågan tog för lång tid' 
        });
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
    });
  }
});
