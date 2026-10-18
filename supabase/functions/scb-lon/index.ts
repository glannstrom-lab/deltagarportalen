// Supabase Edge Function: scb-lon — SCB:s lönestrukturstatistik per yrke (MK2, spår KF 2026-10-18)
//
// Källa: SCB, tabell AM0110A / LoneSpridSektYrk4AN — "Genomsnittlig månadslön och
// lönspridning efter sektor, Yrke (SSYK 2012), kön, tabellinnehåll och år", 2023–2025.
// https://api.scb.se/OV0104/v1/doris/sv/ssd/AM/AM0110/AM0110A/LoneSpridSektYrk4AN
// Öppna data, licens CC0 (scb.se/vara-tjanster/oppna-data, läst 2026-10-18); SCB rekommenderar "Källa: SCB".
// Hela arbetsmarknaden, ~5 miljoner anställda.
//
// ⚠️ Tabellen finns i TRE generationer, och alla svarar 200: LoneSpridSektorYrk4 (2005–2013),
// LoneSpridSektorYrk4A (2014–2022), LoneSpridSektYrk4AN (2023–). Använd aldrig de två första —
// då visas tolv år gamla löner som aktuella. Det senaste året läses ur tabellens egen metadata
// vid varje kallstart, inte ur en konstant här.
//
// Varför en edge-funktion: api.scb.se finns inte i portalens CSP, och SCB tillåter
// 30 anrop / 10 s per IP. Här cachas svaret per yrke i 24 h. Inga personuppgifter passerar —
// bara SSYK-koder. Ingen modell anropas.
//
// Ärlighet: SCB:s ".." (för osäker / sekretess) blir null, aldrig en nolla eller en gissning.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { enforceIpRateLimit } from '../_shared/proxyGuard.ts';
import { medFelrapport } from '../_shared/sentry.ts'

const TABELL = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/AM/AM0110/AM0110A/LoneSpridSektYrk4AN';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_YRKEN = 8;
// Median, P10, P25, P75, P90, medianens 95 %-konfidensintervall (± kr).
const INNEHALL = ['000007CE', '000007CF', '000007CG', '000007CH', '000007CI', '000007CK'];

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

export interface LonRad {
  ssyk: string;
  median: number | null;
  p10: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
  medianKonfidens: number | null;
}

function tal(v: string | undefined): number | null {
  if (!v || v.trim() === '..' || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

let senasteAr: { ar: string; hamtadAt: number } | null = null;
const radCache = new Map<string, { rad: LonRad; ar: string; hamtadAt: number }>();

async function hamtaMedTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timeout); }
}

async function hamtaSenasteAr(): Promise<string> {
  if (senasteAr && Date.now() - senasteAr.hamtadAt < CACHE_TTL_MS) return senasteAr.ar;
  const res = await hamtaMedTimeout(TABELL);
  if (!res.ok) { if (senasteAr) return senasteAr.ar; throw new Error(`SCB svarade ${res.status}`); }
  const meta = await res.json() as { variables: Array<{ code: string; values: string[] }> };
  const tid = meta.variables.find((v) => v.code === 'Tid')?.values ?? [];
  const ar = [...tid].sort().at(-1);
  if (!ar) throw new Error('SCB:s tabell saknar år');
  senasteAr = { ar, hamtadAt: Date.now() };
  return ar;
}

async function hamtaRader(ssyk: string[], ar: string): Promise<LonRad[]> {
  const saknas = ssyk.filter((k) => {
    const c = radCache.get(k);
    return !c || c.ar !== ar || Date.now() - c.hamtadAt > CACHE_TTL_MS;
  });
  if (saknas.length) {
    const res = await hamtaMedTimeout(TABELL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: [
          { code: 'Sektor', selection: { filter: 'item', values: ['0'] } },
          { code: 'Yrke2012', selection: { filter: 'item', values: saknas } },
          { code: 'Kon', selection: { filter: 'item', values: ['1+2'] } },
          { code: 'Tid', selection: { filter: 'item', values: [ar] } },
          { code: 'ContentsCode', selection: { filter: 'item', values: INNEHALL } },
        ],
        response: { format: 'json' },
      }),
    });
    // 400 från SCB = minst en kod finns inte i tabellen. Fråga då en i taget så
    // de giltiga ändå kommer med; okända koder får en tom rad.
    if (res.status === 400 && saknas.length > 1) {
      for (const k of saknas) await hamtaRader([k], ar).catch(() => {});
    } else if (!res.ok) {
      if (res.status === 400) {
        radCache.set(saknas[0], { rad: { ssyk: saknas[0], median: null, p10: null, p25: null, p75: null, p90: null, medianKonfidens: null }, ar, hamtadAt: Date.now() });
      } else throw new Error(`SCB svarade ${res.status}`);
    } else {
      const j = await res.json() as { data: Array<{ key: string[]; values: string[] }> };
      for (const r of j.data) {
        const kod = r.key[1];
        const [median, p10, p25, p75, p90, ki] = r.values;
        radCache.set(kod, { rad: { ssyk: kod, median: tal(median), p10: tal(p10), p25: tal(p25), p75: tal(p75), p90: tal(p90), medianKonfidens: tal(ki) }, ar, hamtadAt: Date.now() });
      }
    }
  }
  return ssyk.map((k) => radCache.get(k)?.rad ?? { ssyk: k, median: null, p10: null, p25: null, p75: null, p90: null, medianKonfidens: null });
}

serve(medFelrapport('scb-lon', async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'Bara GET' }, 405);

  const limited = await enforceIpRateLimit(req, 'scb-lon');
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const ssyk = [...new Set((url.searchParams.get('ssyk') ?? '').split(',').map((s) => s.trim()).filter(Boolean))];
    if (ssyk.length === 0) return json({ error: 'Ange ssyk (fyrsiffrig SSYK 2012-kod, kommaseparerat)' }, 400);
    if (ssyk.length > MAX_YRKEN) return json({ error: `Högst ${MAX_YRKEN} yrken per fråga` }, 400);
    if (!ssyk.every((s) => /^\d{4}$/.test(s))) return json({ error: 'ssyk ska vara fyrsiffriga koder' }, 400);

    const ar = await hamtaSenasteAr();
    const rader = await hamtaRader(ssyk, ar);
    return json({ kalla: 'SCB, lönestrukturstatistik (AM0110A)', tabell: TABELL, licens: 'CC0', ar, sektor: 'samtliga sektorer', kon: 'totalt', rader });
  } catch (error) {
    console.error('[scb-lon] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Okänt fel' }, 502);
  }
}));
