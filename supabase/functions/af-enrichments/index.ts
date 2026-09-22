// Supabase Edge Function: Proxy för Arbetsförmedlingens JobAd Enrichments API
// URL: https://<project>.supabase.co/functions/v1/af-enrichments

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildProxyCorsHeaders, enforceIpRateLimit } from '../_shared/proxyGuard.ts';
import { medFelrapport } from '../_shared/sentry.ts'

/**
 * Meddelandet ur ett okänt kastat värde.
 *
 * `catch (error)` ger `unknown`. Att läsa `.message` rakt av kastar när
 * något annat än ett Error kastas — mitt i det catch-block som skulle ha
 * returnerat felsvaret med CORS-headrarna. Utan headrarna ser anroparen ett
 * CORS-fel i stället för orsaken.
 */
function felText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const ENRICHMENTS_API_BASE = 'https://jobad-enrichments-api.jobtechdev.se/v1';

serve(medFelrapport('af-enrichments', async (req) => {
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

    // Timeout — samma mönster som af-jobsearch (A15, 2026-07-23): en
    // hängande Enrichments-anslutning fick tidigare hålla instansen till
    // plattformens maxtid utan att abortera. Den här filen saknade den fixen.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

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
      JSON.stringify({ error: felText(error) }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}));
