// Supabase Edge Function: Proxy för Arbetsförmedlingens Taxonomi API
// URL: https://<project>.supabase.co/functions/v1/af-taxonomy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAXONOMY_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Remove the function name from path to get the actual API path
    const path = url.pathname.replace('/af-taxonomy', '').replace('//', '/');
    const queryString = url.search;
    
    const targetUrl = `${TAXONOMY_API_BASE}${path}${queryString}`;
    
    console.log(`[af-taxonomy] Proxying: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[af-taxonomy] API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Taxonomy API error', status: response.status, details: errorText }),
        { 
          status: 200, // Return 200 to frontend, error details in body
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[af-taxonomy] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 200, // Return 200 to frontend
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
