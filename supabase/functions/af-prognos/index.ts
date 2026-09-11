// Supabase Edge Function: af-prognos — Arbetsförmedlingens Yrkesbarometer (MK3, 2026-09-12)
//
// Källa: https://data.arbetsformedlingen.se/prognoser/yrkesbarometer.json
//   Öppna data, licens CC0 1.0. 4 818 rader = 219 yrken × (riket "00" + 21 län).
//   Fält: yb_yrke, yb_concept_id, ssyk, ssyk_text, yrkesomrade, lan,
//   jobbmojligheter (små/medelstora/stora/null), rekryteringssituation
//   (överskott/balans/paradox/brist/null), paradox[], prognos (öka/vara
//   oförändrad/minska/null), text_jobbmojligheter, text_rekryteringssituation,
//   hogsta_bedomningsniva, delvis_helt, omgang ("2026-1"), taxonomi_version.
//   Publiceras två gånger om året (juni/december från 2026).
//
// Varför en edge-funktion: filen är 5,7 MB och saknar CORS-huvuden, så
// webbläsaren kan inte hämta den. Här cachas den i minnet i 24 h och
// filtreras per fråga. Ingen modell anropas, inga personuppgifter passerar —
// bara ett yrkesnamn och en länskod. Ingen aiGate behövs.
//
// Ärlighet: vi skickar AF:s egna texter och bedömningar vidare ordagrant och
// räknar inte fram något eget. Saknas yrket svarar vi med tom lista, aldrig
// med en gissning.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { enforceIpRateLimit } from '../_shared/proxyGuard.ts';

const KALLA_URL = 'https://data.arbetsformedlingen.se/prognoser/yrkesbarometer.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_YRKEN = 8;

// Samma origin-lista som af-trends (publik funktion, ingen open proxy).
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.jobin.se',
  'https://jobin.se',
  'https://glannstrom-lab.github.io',
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = allowedOrigins.find((o) => origin === o) || allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
  };
}

interface YbRad {
  yrkesomrade: string;
  yb_yrke: string;
  yb_concept_id: string;
  lan: string;
  ssyk: string;
  ssyk_text: string;
  yb_beskrivning: string | null;
  jobbmojligheter: string | null;
  rekryteringssituation: string | null;
  paradox: string[];
  prognos: string | null;
  text_jobbmojligheter: string;
  text_rekryteringssituation: string;
  hogsta_bedomningsniva: string | null;
  delvis_helt: string | null;
  omgang: string;
  taxonomi_version: number;
}

let cache: { rader: YbRad[]; lastModified: string | null; hamtadAt: number } | null = null;

async function hamtaBarometer(): Promise<{ rader: YbRad[]; lastModified: string | null }> {
  if (cache && Date.now() - cache.hamtadAt < CACHE_TTL_MS) return cache;
  const res = await fetch(KALLA_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    // Gammal cache är bättre än inget om källan hickar — men bara om den finns.
    if (cache) return cache;
    throw new Error(`Yrkesbarometern svarade ${res.status}`);
  }
  const rader = (await res.json()) as YbRad[];
  if (!Array.isArray(rader) || rader.length === 0) throw new Error('Yrkesbarometern gav tom lista');
  cache = { rader, lastModified: res.headers.get('last-modified'), hamtadAt: Date.now() };
  return cache;
}

function normalisera(s: string): string {
  return s.toLowerCase().trim();
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'Bara GET' }, 405);

  const limited = await enforceIpRateLimit(req, 'af-prognos');
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const q = normalisera(url.searchParams.get('q') ?? '');
    const conceptId = (url.searchParams.get('concept_id') ?? '').trim();
    const lan = (url.searchParams.get('lan') ?? '').trim();

    if (q.length < 2 && !conceptId) return json({ error: 'Ange minst två tecken (q) eller concept_id' }, 400);
    if (lan && !/^\d{2}$/.test(lan)) return json({ error: 'lan ska vara en tvåsiffrig länskod' }, 400);

    const { rader, lastModified } = await hamtaBarometer();

    // Vilka yrken matchar? Först exakt concept_id, annars namnträff på
    // yrkesnamnet eller SSYK-texten. Yrken (inte rader) begränsas till MAX_YRKEN.
    const yrkenSet = new Set<string>();
    for (const r of rader) {
      if (r.lan !== '00') continue;
      const traff = conceptId
        ? r.yb_concept_id === conceptId
        : normalisera(r.yb_yrke).includes(q) || normalisera(r.ssyk_text).includes(q);
      if (traff) yrkenSet.add(r.yb_concept_id);
      if (yrkenSet.size >= MAX_YRKEN) break;
    }

    const lanSet = new Set(['00', ...(lan ? [lan] : [])]);
    const traffar = rader
      .filter((r) => yrkenSet.has(r.yb_concept_id) && lanSet.has(r.lan))
      .map((r) => ({
        yb_yrke: r.yb_yrke,
        yb_concept_id: r.yb_concept_id,
        ssyk: r.ssyk,
        ssyk_text: r.ssyk_text,
        yrkesomrade: r.yrkesomrade,
        yb_beskrivning: r.yb_beskrivning,
        lan: r.lan,
        jobbmojligheter: r.jobbmojligheter,
        rekryteringssituation: r.rekryteringssituation,
        paradox: r.paradox ?? [],
        prognos: r.prognos,
        text_jobbmojligheter: r.text_jobbmojligheter,
        text_rekryteringssituation: r.text_rekryteringssituation,
        hogsta_bedomningsniva: r.hogsta_bedomningsniva,
        delvis_helt: r.delvis_helt,
      }));

    const omgang = rader[0]?.omgang ?? null;
    return json({ kalla: KALLA_URL, licens: 'CC0 1.0', omgang, last_modified: lastModified, traffar });
  } catch (error) {
    console.error('[af-prognos] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Okänt fel' }, 502);
  }
});
