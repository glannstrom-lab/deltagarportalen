/**
 * Arbetsförmedlingen JobSearch API Edge Function
 * Proxy för att undvika CORS-restrictions
 * 
 * Endpoints:
 * - GET /search - Sök jobb
 * - GET /ad/{id} - Hämta jobbdetaljer
 * - GET /complete - Autocomplete för sökning
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-jobsearch', '').replace('//', '/');
    
    // Bygg target URL
    const targetUrl = `${AF_JOBSEARCH_BASE}${path}${url.search}`;
    
    console.log(`[af-jobsearch] ${req.method} ${path}${url.search}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[af-jobsearch] AF API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Arbetsförmedlingen API error', status: response.status }),
        { 
          status: 200, // Return 200 to frontend
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('[af-jobsearch] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 200, // Return 200 to frontend
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
