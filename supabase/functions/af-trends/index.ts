// Supabase Edge Function: Proxy för Arbetsförmedlingens JobSearch Trends API
// URL: https://<project>.supabase.co/functions/v1/af-trends

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TRENDS_API_BASE = 'https://jobsearch-trends-api.jobtechdev.se';

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
    const path = url.pathname.replace('/af-trends', '').replace('//', '/');
    const queryString = url.search;
    
    const targetUrl = `${TRENDS_API_BASE}${path}${queryString}`;
    
    console.log(`[af-trends] Proxying: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[af-trends] API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Trends API error', status: response.status }),
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
    console.error('[af-trends] Error:', error);
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
