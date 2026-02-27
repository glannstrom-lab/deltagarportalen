// Supabase Edge Function: Proxy för Arbetsförmedlingens JobEd Connect API
// URL: https://<project>.supabase.co/functions/v1/af-jobed

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const JOBED_API_BASE = 'https://jobed-connect-api.jobtechdev.se';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-jobed', '').replace('//', '/');
    const queryString = url.search;
    
    const targetUrl = `${JOBED_API_BASE}${path}${queryString}`;
    
    console.log(`[af-jobed] Proxying: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[af-jobed] API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'JobEd API error', status: response.status }),
        { 
          status: 200,
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
    console.error('[af-jobed] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
