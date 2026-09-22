// Supabase Edge Function: Hämtar yrken från Arbetsförmedlingens Taxonomy API
// ANONYM TILLGÅNG - ingen auth krävs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildProxyCorsHeaders, enforceIpRateLimit } from '../_shared/proxyGuard.ts';
import { medFelrapport } from '../_shared/sentry.ts'
import { fetchMedTimeout, TIDSGRANS_EXTERN_MS } from '../_shared/fetchMedTimeout.ts'
import { arYrkestyp, getOccupations, TAXONOMY_API_BASE } from './kallor.ts'

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

/** `limit` ur query-strängen: heltal 1–50, annars 10. `parseInt('abc')` gav NaN rakt in i URL:en. */
function tolkaLimit(raw: string | null): number {
  const n = parseInt(raw ?? '', 10)
  return Number.isFinite(n) ? Math.min(50, Math.max(1, n)) : 10
}

serve(medFelrapport('af-taxonomy', async (req) => {
  // A13 (2026-07-23): allowlistad CORS + per-IP-rate-limit i stället för öppen proxy
  const corsHeaders = buildProxyCorsHeaders(req.headers.get('origin'));
  const json = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const limited = await enforceIpRateLimit(req, 'af-taxonomy');
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-taxonomy', '').replace('//', '/');
    const params = new URLSearchParams(url.search);

    if (path === '/concepts' || path === '') {
      // 2026-09-22: `type` ignorerades — type=skill gav yrken med 200.
      if (!arYrkestyp(params.get('type'))) {
        return new Response(
          JSON.stringify({ error: 'Bara yrken (type=occupation) stöds av /concepts', concepts: [], total: 0 }),
          { status: 400, headers: json }
        );
      }
      const query = params.get('q') || '';
      const limit = tolkaLimit(params.get('limit'));

      const { concepts, source, allaFel } = await getOccupations(query, limit);

      // ST4 (2026-09-22): när alla tre källorna kastade svarade funktionen
      // 200 med tom lista — samma svar som "inga träffar". Klienten cachade
      // det i en timme och föll aldrig tillbaka på sin lista med vanliga yrken.
      if (allaFel) {
        return new Response(
          JSON.stringify({ error: 'Arbetsförmedlingens yrkesregister svarar inte just nu', concepts: [], total: 0, source: 'error' }),
          { status: 502, headers: json }
        );
      }

      return new Response(
        JSON.stringify({ concepts, total: concepts.length, source }),
        { headers: json }
      );
    }

    // Proxy övriga anrop. Statusen följer med: ett 404/500 från Jobtech
    // skickades tidigare vidare som 200.
    const targetUrl = `${TAXONOMY_API_BASE}${path}${url.search}`;
    const response = await fetchMedTimeout(targetUrl, {
      method: req.method,
      headers: { 'Accept': 'application/json' },
    }, TIDSGRANS_EXTERN_MS);

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { status: response.status, headers: json }
    );

  } catch (error) {
    // Var status 200 — ett fel ska synas som fel, och medFelrapport
    // rapporterar bara ≥ 500 till Sentry.
    console.error('[af-taxonomy] Error:', felText(error));
    return new Response(
      JSON.stringify({ error: 'Yrkesuppslaget misslyckades', concepts: [], total: 0 }),
      { status: 500, headers: json }
    );
  }
}));
