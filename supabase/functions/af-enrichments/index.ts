// Supabase Edge Function: Proxy för Arbetsförmedlingens JobAd Enrichments API
// URL: https://<project>.supabase.co/functions/v1/af-enrichments

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildProxyCorsHeaders, enforceIpRateLimit } from '../_shared/proxyGuard.ts';

const ENRICHMENTS_API_BASE = 'https://jobad-enrichments-api.jobtechdev.se/v1';

serve(async (req) => {
  // A13 (2026-07-23): allowlistad CORS + per-IP-rate-limit i stället för öppen proxy
  const corsHeaders = buildProxyCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const limited = await enforceIpRateLimit(req, 'af-enrichments');
  if (limited) return limited;

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
