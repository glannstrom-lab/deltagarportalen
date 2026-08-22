// Supabase Edge Function: Proxy för Utbildningssökning
// Använder JobEd Connect API från Arbetsförmedlingen/JobTech
// URL: https://<project>.supabase.co/functions/v1/education-search
//
// OMSKRIVEN 2026-08-22. Funktionen normaliserade aldrig JobEds faktiska
// svarsformat, och fem fel följde av samma rot:
//
//   1. /types och /regions skickade vidare JobEds `{key, value}`-objekt som
//      `id` och `label`. Sidan renderade dem i <option> → React error #31 →
//      hela utbildningssidan kraschade så fort någon klickade på "Filter".
//   2. `education_form` filtrerades på LÅNGA formnamn ('yrkeshögskoleutbildning').
//      API:t tar KORTA koder (yh, hs, vuxgy, vuxgr, fhs, kku,
//      "af arbetsmarknadsutbildning"). Varje typfilter gav noll träffar.
//   3. `url`/`providerUrl` skickades som `{lang, content}` → href="[object Object]".
//   4. `credits` kallades alltid "YH-poäng" — även 1900 gymnasiepoäng och 5 hp.
//   5. `location` var kommunKODEN ("2518") bredvid en kartnål.
//
// Allt mätt mot prod och mot jobed-connect-api.jobtechdev.se 2026-08-22.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildProxyCorsHeaders, enforceIpRateLimit } from '../_shared/proxyGuard.ts';
import {
  TYP_TILL_FORM,
  normalizeEducation,
  normalizeMatchHit,
  slaIhopDubbletter,
  typerFranApi,
  regionerFranApi,
  TYPER_FALLBACK,
  REGIONER_FALLBACK,
  type Education,
  type SearchParams,
  type SearchResult,
  type Val,
} from './normalisera.ts';

// JobEd Connect API - Real Swedish Education Database
const JOBED_API_BASE = 'https://jobed-connect-api.jobtechdev.se/v1';


// ── Sökning ──────────────────────────────────────────────────────────────

async function searchEducations(params: SearchParams): Promise<SearchResult> {
  const { q = '', type, form, region, municipality, distance, limit = 20, offset = 0 } = params;

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('query', q);

  // Typfiltret: KORTA koder. Långformerna gav noll träffar i drift.
  if (type && type !== 'all') {
    for (const kod of TYP_TILL_FORM[type] || []) {
      queryParams.append('education_form', kod);
    }
  }
  if (form) queryParams.append('education_form', form);
  if (region) queryParams.set('region_code', region);
  if (municipality) queryParams.set('municipality_code', municipality);
  // Bara `true` skickas — `distance=false` har ingen verkan uppströms och
  // såg ut att filtrera bort närutbildningar.
  if (distance === true) queryParams.set('distance', 'true');

  queryParams.set('limit', String(Math.min(limit, 100)));
  queryParams.set('offset', String(offset));

  const url = `${JOBED_API_BASE}/educations?${queryParams.toString()}`;
  console.log(`[education-search] Fetching: ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[education-search] JobEd API error: ${response.status}`);
      throw new Error(`JobEd API error: ${response.status}`);
    }

    const data = await response.json();

    let raa: any[] = [];
    let total = 0;

    if (Array.isArray(data)) {
      raa = data;
      total = data.length;
    } else if (data?.result && Array.isArray(data.result)) {
      // JobEd Connect: {hits: number, result: array}
      raa = data.result;
      total = data.hits ?? data.total ?? data.result.length;
    } else if (data?.data && Array.isArray(data.data)) {
      raa = data.data;
      total = data.total ?? data.count ?? data.data.length;
    } else if (data?.educations && Array.isArray(data.educations)) {
      raa = data.educations;
      total = data.total ?? data.educations.length;
    }

    const { unika, borttagna } = slaIhopDubbletter(raa.map(normalizeEducation));

    console.log(`[education-search] ${raa.length} träffar → ${unika.length} unika (total: ${total})`);

    return {
      educations: unika,
      total,
      // Räknas på de RÅA träffarna — `offset` går mot JobEds paginering,
      // inte mot vår hopslagna lista.
      hasMore: offset + raa.length < total,
      source: 'jobed-connect',
      merged: borttagna,
    };
  } catch (error) {
    console.error('[education-search] Error:', error);
    // Inget mockregister. Det gamla svarade med åtta påhittade utbildningar
    // — KTH, Karolinska, Nackademin — med påhittade och redan passerade
    // ansökningsdatum, märkta bara med en liten parentes "(Demodata)".
    // Ett avbrott ska säga att det är ett avbrott.
    return { educations: [], total: 0, hasMore: false, source: 'error' };
  }
}

async function getEducationById(id: string): Promise<Education | null> {
  try {
    const url = `${JOBED_API_BASE}/educations/${encodeURIComponent(id)}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      console.error(`[education-search] Failed to get education ${id}: ${response.status}`);
      return null;
    }
    return normalizeEducation(await response.json());
  } catch (error) {
    console.error('[education-search] Error getting education:', error);
    return null;
  }
}

async function matchByJobTitle(jobTitle: string, params: SearchParams = {}): Promise<SearchResult> {
  const rensat = (jobTitle || '').trim();
  if (!rensat) {
    return { educations: [], total: 0, hasMore: false, source: 'empty-query' };
  }

  try {
    // JobEd vill ha yrkestiteln som QUERY-parameter `jobtitle` och inget
    // request body alls.
    const queryParams = new URLSearchParams();
    queryParams.set('jobtitle', rensat);
    if (params.region) queryParams.set('region_code', params.region);
    queryParams.set('limit', String(params.limit || 10));

    const url = `${JOBED_API_BASE}/educations/match-by-jobtitle?${queryParams.toString()}`;
    const response = await fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' } });

    if (!response.ok) {
      throw new Error(`Match API error: ${response.status}`);
    }

    // Svaret är ett OBJEKT — {mapped_occupation_for_match, hits_total, hits}.
    const data = await response.json();
    const hits = Array.isArray(data?.hits) ? data.hits : [];
    const traffar = hits
      .map(normalizeMatchHit)
      .filter((e: Education) => e.title !== 'Namnlös utbildning');
    const { unika, borttagna } = slaIhopDubbletter(traffar);

    if (!unika.length) {
      // Yrket kunde inte matchas är inte samma sak som att anropet föll.
      return {
        educations: [],
        total: 0,
        hasMore: false,
        source: 'no-match',
        matchedOccupation: data?.mapped_occupation_for_match?.occupation_label || undefined,
      };
    }

    return {
      educations: unika,
      total: typeof data?.hits_total === 'number' ? data.hits_total : unika.length,
      // Matchvägen tar inget offset — det finns ingen väg att hämta sida 2.
      // `hasMore: true` lovade en knapp som inte kan finnas.
      hasMore: false,
      source: 'jobed-connect-match',
      merged: borttagna,
      matchedOccupation: data?.mapped_occupation_for_match?.occupation_label || undefined,
    };
  } catch (error) {
    console.error('[education-search] Match error:', error);
    return { educations: [], total: 0, hasMore: false, source: 'error' };
  }
}

// ── Sökparametrar ────────────────────────────────────────────────────────
//
// JobEd svarar `[{key, value}]` på båda. Den gamla koden gjorde
// `item.id || item.code || item` — alla tre undefined, så `|| item` gav
// tillbaka HELA objektet som både id och label. React fick ett objekt som
// barn i <option> och kastade #31: hela sidan dog vid klick på "Filter".
// `rensaVal` och `TYPER_FALLBACK` bor i normalisera.ts (testbara).

async function getEducationTypes(): Promise<Val[]> {
  try {
    const response = await fetch(`${JOBED_API_BASE}/searchparameters/education_forms`, {
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const typer = typerFranApi(await response.json());
      if (typer) return typer;
    }
  } catch (error) {
    console.error('[education-search] Error getting types:', error);
  }
  return TYPER_FALLBACK;
}

async function getRegions(): Promise<Val[]> {
  try {
    const response = await fetch(`${JOBED_API_BASE}/searchparameters/regions`, {
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const regioner = regionerFranApi(await response.json());
      if (regioner) return regioner;
    }
  } catch (error) {
    console.error('[education-search] Error getting regions:', error);
  }
  return REGIONER_FALLBACK;
}

// ── Router ───────────────────────────────────────────────────────────────

serve(async (req) => {
  // A13 (2026-07-23): allowlistad CORS + per-IP-rate-limit i stället för öppen proxy
  const corsHeaders = buildProxyCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const limited = await enforceIpRateLimit(req, 'education-search');
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/education-search', '').replace('//', '/') || '/';
    const params = new URLSearchParams(url.search);

    console.log(`[education-search] ${req.method} ${path}`);

    if (path === '/types' || path === '/categories') {
      const types = await getEducationTypes();
      return new Response(JSON.stringify({ types }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === '/regions') {
      const regions = await getRegions();
      return new Response(JSON.stringify({ regions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /:id - Single education
    //
    // Metodkontrollen saknades, och `/^\/[^/]+$/` matchar även `/match`.
    if (req.method === 'GET' && path.match(/^\/[^/]+$/) && !path.includes('?')) {
      const id = path.substring(1);
      if (id && id !== 'search' && id !== 'match') {
        const education = await getEducationById(id);
        if (education) {
          return new Response(JSON.stringify(education), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ error: 'Education not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path === '/match' && req.method === 'POST') {
      const body = await req.json();
      const result = await matchByJobTitle(body.jobTitle || body.job_title, {
        region: body.region,
        limit: body.limit || 10,
      });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchParams: SearchParams = {
      q: params.get('q') || params.get('query') || '',
      type: params.get('type') || 'all',
      form: params.get('form') || undefined,
      region: params.get('region') || undefined,
      municipality: params.get('municipality') || undefined,
      distance: params.get('distance') === 'true' ? true : undefined,
      limit: parseInt(params.get('limit') || '20'),
      offset: parseInt(params.get('offset') || '0'),
    };

    const result = await searchEducations(searchParams);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[education-search] Error:', error);
    // `source: 'error'` så klienten kan säga "vi når inte registret" i
    // stället för "det finns inga utbildningar".
    return new Response(
      JSON.stringify({ educations: [], total: 0, hasMore: false, source: 'error' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
