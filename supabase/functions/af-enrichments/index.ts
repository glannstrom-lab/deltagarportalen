// Supabase Edge Function: Proxy för Arbetsförmedlingens JobAd Enrichments API
// URL: https://<project>.supabase.co/functions/v1/af-enrichments

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ENRICHMENTS_API_BASE = 'https://jobad-enrichments-api.jobtechdev.se/v1';

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
    const path = url.pathname.replace('/af-enrichments', '');
    const queryString = url.search;
    
    const targetUrl = `${ENRICHMENTS_API_BASE}${path}${queryString}`;
    
    console.log(`Proxying request to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Enrichments API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
