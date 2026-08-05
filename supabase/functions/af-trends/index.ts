// Supabase Edge Function: Arbetsmarknadsstatistik via JobSearch API
// Bygger marknadsstatistik från aggregerad jobbdata

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { enforceIpRateLimit } from '../_shared/proxyGuard.ts';

const JOBSEARCH_API_BASE = 'https://jobsearch.api.jobtechdev.se';

// CORS config - allow production and dev origins
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
  const allowedOrigin = allowedOrigins.find(o => origin === o) || allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // A13 (2026-07-23): per-IP-rate-limit — publik funktion, men ingen open proxy
  const limited = await enforceIpRateLimit(req, 'af-trends');
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-trends', '').replace('//', '/') || '/';

    console.log(`[af-trends] Request path: ${path}`);

    // Route to appropriate handler
    if (path === '/market-stats' || path === '/') {
      return await handleMarketStats(corsHeaders);
    } else if (path === '/trending-skills') {
      const limit = url.searchParams.get('limit') || '10';
      return await handleTrendingSkills(parseInt(limit), corsHeaders);
    } else if (path === '/popular-searches') {
      const category = url.searchParams.get('category') || 'occupations';
      const limit = url.searchParams.get('limit') || '10';
      return await handlePopularSearches(category, parseInt(limit), corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unknown endpoint', path }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[af-trends] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Minuter bakåt som `published-after` räknar med i JobSearch-API:t.
const MINUTES_PER_DAY = 60 * 24;
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;

async function fetchJobSearch(url: string): Promise<any> {
  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) {
    throw new Error(`JobSearch API error: ${response.status}`);
  }
  return await response.json();
}

/**
 * Get overall market statistics.
 *
 * B13 (2026-08-05): funktionen returnerade tidigare påhittade tal —
 * `growth_percent: Math.random()`, `new_jobs_today` som 2 % av totalen och
 * `avg_time_to_hire_days: 35` / `competition_index: 6.5` som "industrisnitt"
 * utan källa. Allt sådant är borttaget. Varje tal här kommer nu från ett
 * faktiskt anrop mot Arbetsförmedlingens JobSearch-API. Går något av anropen
 * inte igenom kastar vi (fail closed) i stället för att fylla i en gissning —
 * klienten visar då sitt felläge, vilket är ärligare än en uppfunnen siffra.
 *
 * OBS för framtida läsare: frestelsen att räkna fram tillväxt genom att
 * jämföra `published-after=10080` mot veckan innan går inte att lita på.
 * Indexet innehåller bara *aktiva* annonser, så äldre fönster tappar allt som
 * hunnit gå ut. Mätt 2026-08-05: senaste 7 dygnen 7 841 annonser, föregående
 * 7 dygn 5 054 — det ser ut som +55 % tillväxt men är i praktiken utgångna
 * annonser. Riktig tillväxt kräver en historisk datakälla (jfr af-historical).
 */
async function handleMarketStats(corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Fetch job counts with regional and occupational breakdowns
    const statsUrl = `${JOBSEARCH_API_BASE}/search?limit=0&stats=region&stats=occupation-group`;
    const dayUrl = `${JOBSEARCH_API_BASE}/search?limit=0&published-after=${MINUTES_PER_DAY}`;
    const weekUrl = `${JOBSEARCH_API_BASE}/search?limit=0&published-after=${MINUTES_PER_WEEK}`;
    console.log(`[af-trends] Fetching: ${statsUrl}`);

    const [data, dayData, weekData] = await Promise.all([
      fetchJobSearch(statsUrl),
      fetchJobSearch(dayUrl),
      fetchJobSearch(weekUrl),
    ]);

    // Extract stats
    const regionStats = data.stats?.find((s: any) => s.type === 'region')?.values || [];
    const occupationStats = data.stats?.find((s: any) => s.type === 'occupation-group')?.values || [];

    // Build market stats response — enbart mätta värden
    const marketStats = {
      total_jobs: data.total?.value || 0,
      // Riktiga träffräkningar, inte procent av totalen.
      new_jobs_today: dayData.total?.value || 0,
      new_jobs_week: weekData.total?.value || 0,

      by_region: regionStats.slice(0, 10).map((r: any) => ({
        region: r.term,
        job_count: r.count,
      })),

      by_occupation: occupationStats.slice(0, 10).map((o: any) => ({
        occupation: o.term,
        job_count: o.count,
      })),

      last_updated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(marketStats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[af-trends] Market stats error:', error);
    throw error;
  }
}

// Get trending skills based on occupation fields and common skills mapping
async function handleTrendingSkills(limit: number, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Get occupation field statistics to derive in-demand skills
    const statsUrl = `${JOBSEARCH_API_BASE}/search?limit=0&stats=occupation-field`;
    console.log(`[af-trends] Fetching occupation fields for skills: ${statsUrl}`);

    const response = await fetch(statsUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`JobSearch API error: ${response.status}`);
    }

    const data = await response.json();
    const fieldStats = data.stats?.find((s: any) => s.type === 'occupation-field')?.values || [];

    // Map occupation fields to key skills (based on Swedish labor market)
    const fieldToSkills: Record<string, string[]> = {
      'Hälso- och sjukvård': ['Patientvård', 'Medicinska kunskaper', 'Omvårdnad'],
      'Försäljning, inköp, marknadsföring': ['Försäljning', 'Kundrelationer', 'Förhandling'],
      'Pedagogik': ['Undervisning', 'Pedagogik', 'Kommunikation'],
      'Administration, ekonomi, juridik': ['Excel', 'Ekonomi', 'Administration'],
      'Data/IT': ['Programmering', 'Systemutveckling', 'Databaser'],
      'Yrken med social inriktning': ['Socialt arbete', 'Empati', 'Handledning'],
      'Bygg och anläggning': ['Byggkunskap', 'Ritningsläsning', 'Säkerhet'],
      'Teknik, tillverkning': ['Teknik', 'Produktion', 'Kvalitet'],
      'Transport': ['Körkort', 'Logistik', 'Kundservice'],
      'Hotell, restaurang, storhushåll': ['Matlagning', 'Service', 'Hygien'],
    };

    // Build skills list from top occupation fields.
    //
    // B13 (2026-08-05): posterna bar tidigare tre uppfunna tal —
    // `demand` var en nedräkning (95, 90, 85 …) som visades som "Efterfrågan:
    // 95 %", `trend` sattes efter listposition och `job_count` delade
    // yrkesområdets annonser jämnt över tre handplockade kompetenser.
    // Ingen av dem mätte något. Kvar är det som faktiskt är mätt: vilka
    // yrkesområden som har flest lediga annonser just nu, och hur många.
    //
    // Kompetensnamnen är fortfarande en redaktionell mappning (AF:s
    // JobSearch-API har inget `stats=skill` — enum:t tillåter bara
    // occupation-name, occupation-group, occupation-field, country,
    // municipality, region). Därför följer yrkesområdet med i svaret så att
    // siffran kan tillskrivas rätt sak i gränssnittet.
    const skills: any[] = [];
    const seenSkills = new Set<string>();

    for (const field of fieldStats.slice(0, 8)) {
      const fieldName = field.term;
      const fieldSkills = fieldToSkills[fieldName] || ['Allmänna kunskaper'];

      for (const skill of fieldSkills) {
        if (!seenSkills.has(skill) && skills.length < limit) {
          seenSkills.add(skill);
          skills.push({
            skill,
            occupation_field: fieldName,
            occupation_field_job_count: field.count,
          });
        }
      }
    }

    return new Response(JSON.stringify({ skills: skills.slice(0, limit) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[af-trends] Trending skills error:', error);
    throw error;
  }
}

/**
 * Kategorier vi kan svara på, mappade till JobSearch-API:ts `stats`-enum.
 *
 * Enum:t tillåter bara occupation-name, occupation-group, occupation-field,
 * country, municipality och region. Koden mappade tidigare `skills` → `skill`
 * och `employers` → `employer`, vilka inte finns — AF svarade 400 och
 * funktionen kastade vidare som 500. De kategorierna avvisas nu i stället med
 * ett begripligt fel, så att en anropare inte tror att tjänsten är nere.
 */
const POPULAR_SEARCH_CATEGORIES: Record<string, string> = {
  occupations: 'occupation-group',
  'occupation-names': 'occupation-name',
  fields: 'occupation-field',
  locations: 'region',
  municipalities: 'municipality',
};

// Get popular searches/occupations
async function handlePopularSearches(category: string, limit: number, corsHeaders: Record<string, string>): Promise<Response> {
  const statsType = POPULAR_SEARCH_CATEGORIES[category];
  if (!statsType) {
    return new Response(
      JSON.stringify({
        error: 'Unsupported category',
        category,
        supported: Object.keys(POPULAR_SEARCH_CATEGORIES),
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const statsUrl = `${JOBSEARCH_API_BASE}/search?limit=0&stats=${statsType}`;
    console.log(`[af-trends] Fetching ${category}: ${statsUrl}`);

    const data = await fetchJobSearch(statsUrl);
    const stats = data.stats?.find((s: any) => s.type === statsType)?.values || [];

    // B13 (2026-08-05): `trend` sattes efter listposition och `change_percent`
    // var `Math.random()`. Båda är borta. `count` är AF:s faktiska antal
    // annonser och ordningen är den riktiga rangordningen — inget annat påstås.
    const searches = stats.slice(0, limit).map((s: any) => ({
      term: s.term,
      count: s.count,
    }));

    return new Response(JSON.stringify({ searches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[af-trends] Popular searches error:', error);
    throw error;
  }
}
