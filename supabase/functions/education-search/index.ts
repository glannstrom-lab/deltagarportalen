// Supabase Edge Function: Proxy för Skolverkets Susa-navet API v3
// Söker utbildningar från Sveriges nationella utbildningsdatabas
// URL: https://<project>.supabase.co/functions/v1/education-search

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Susa-navet API v3 (ny version som ersätter v2 från april 2026)
const SUSA_API_BASE = 'https://api.skolverket.se/susa-navet/v3';

// Utbildningsformer som stöds
type EducationType =
  | 'komvux'
  | 'folkhogskola'
  | 'yrkeshogskola'
  | 'hogskola'
  | 'universitet'
  | 'all';

interface SearchParams {
  q?: string;           // Sökterm
  type?: EducationType; // Utbildningsform
  region?: string;      // Län/kommun
  limit?: number;       // Max antal resultat
  offset?: number;      // Pagination offset
}

interface Education {
  id: string;
  title: string;
  provider: string;
  providerUrl?: string;
  type: string;
  typeLabel: string;
  description?: string;
  duration?: string;
  durationMonths?: number;
  startDate?: string;
  endDate?: string;
  applicationDeadline?: string;
  location?: string;
  municipality?: string;
  region?: string;
  pace?: string;         // Studietakt (heltid, deltid)
  distance?: boolean;    // Distansutbildning
  url?: string;          // Länk till utbildningen
  sunCode?: string;      // SUN-klassificering
  credits?: number;      // Högskolepoäng
  level?: string;        // Nivå (grundnivå, avancerad, etc.)
}

interface SearchResult {
  educations: Education[];
  total: number;
  hasMore: boolean;
  source: string;
}

// Mappning av utbildningstyper till svenska etiketter
const TYPE_LABELS: Record<string, string> = {
  'komvux': 'Kommunal vuxenutbildning',
  'folkhogskola': 'Folkhögskola',
  'yrkeshogskola': 'Yrkeshögskola',
  'hogskola': 'Högskola',
  'universitet': 'Universitet',
  'gymnasieskola': 'Gymnasieskola',
  'grundskola': 'Grundskola',
};

function normalizeEducation(raw: any): Education {
  // Normalisera data från Susa-navet till vårt format
  const typeKey = raw.utbildningsform?.toLowerCase() || raw.type || 'okänd';

  return {
    id: raw.id || raw.utbildningsId || `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: raw.benamning || raw.namn || raw.title || 'Namnlös utbildning',
    provider: raw.utbildningsanordnare?.namn || raw.anordnare || raw.provider || 'Okänd anordnare',
    providerUrl: raw.utbildningsanordnare?.webbplats || raw.providerUrl,
    type: typeKey,
    typeLabel: TYPE_LABELS[typeKey] || raw.utbildningsform || typeKey,
    description: raw.beskrivning || raw.description,
    duration: raw.omfattning?.text || raw.duration,
    durationMonths: raw.omfattning?.manader || raw.durationMonths,
    startDate: raw.startdatum || raw.startDate,
    endDate: raw.slutdatum || raw.endDate,
    applicationDeadline: raw.sista_ansokan || raw.applicationDeadline,
    location: raw.studieort || raw.ort || raw.location,
    municipality: raw.kommun?.namn || raw.municipality,
    region: raw.lan?.namn || raw.region,
    pace: raw.studietakt || raw.pace,
    distance: raw.distans === true || raw.distans === 'ja' || raw.distance,
    url: raw.webbplats || raw.url,
    sunCode: raw.sun_kod || raw.sunCode,
    credits: raw.hogskolepoang || raw.credits,
    level: raw.niva || raw.level,
  };
}

async function searchSusaNavet(params: SearchParams): Promise<SearchResult> {
  const { q = '', type = 'all', region, limit = 20, offset = 0 } = params;

  // Bygg query-parametrar för Susa-navet API
  const queryParams = new URLSearchParams();

  if (q) {
    queryParams.set('sok', q);
  }

  if (type && type !== 'all') {
    // Mappa till Susa-navets utbildningsformskoder
    const typeMap: Record<string, string> = {
      'komvux': 'KOMVUX',
      'folkhogskola': 'FHS',
      'yrkeshogskola': 'YH',
      'hogskola': 'HO',
      'universitet': 'UNI',
    };
    if (typeMap[type]) {
      queryParams.set('utbildningsform', typeMap[type]);
    }
  }

  if (region) {
    queryParams.set('lan', region);
  }

  queryParams.set('antal', String(Math.min(limit, 100)));
  queryParams.set('start', String(offset));

  const url = `${SUSA_API_BASE}/utbildningar?${queryParams.toString()}`;

  console.log(`[education-search] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[education-search] Susa-navet error: ${response.status}`);
      throw new Error(`Susa-navet API error: ${response.status}`);
    }

    const data = await response.json();

    // Hantera olika responsformat från API:et
    let educations: Education[] = [];
    let total = 0;

    if (Array.isArray(data)) {
      educations = data.map(normalizeEducation);
      total = data.length;
    } else if (data.utbildningar) {
      educations = data.utbildningar.map(normalizeEducation);
      total = data.totalt || data.utbildningar.length;
    } else if (data.results) {
      educations = data.results.map(normalizeEducation);
      total = data.total || data.results.length;
    }

    return {
      educations,
      total,
      hasMore: offset + educations.length < total,
      source: 'susa-navet-v3',
    };
  } catch (error) {
    console.error('[education-search] Error:', error);
    // Returnera fallback med mock-data vid fel
    return getFallbackEducations(params);
  }
}

// Fallback-data när API:et inte är tillgängligt
function getFallbackEducations(params: SearchParams): SearchResult {
  const mockEducations: Education[] = [
    {
      id: 'mock_1',
      title: 'Webbutvecklare',
      provider: 'Nackademin',
      type: 'yrkeshogskola',
      typeLabel: 'Yrkeshögskola',
      description: 'Lär dig moderna webbteknologier som React, Node.js och databaser.',
      durationMonths: 24,
      duration: '2 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid',
      distance: false,
      url: 'https://nackademin.se',
    },
    {
      id: 'mock_2',
      title: 'Systemutvecklare Java',
      provider: 'IT-Högskolan',
      type: 'yrkeshogskola',
      typeLabel: 'Yrkeshögskola',
      description: 'Utbildning i Java-programmering med fokus på enterprise-system.',
      durationMonths: 24,
      duration: '2 år',
      location: 'Göteborg',
      region: 'Västra Götaland',
      pace: 'Heltid',
      distance: true,
      url: 'https://iths.se',
    },
    {
      id: 'mock_3',
      title: 'Data Scientist',
      provider: 'Changemaker Educations',
      type: 'yrkeshogskola',
      typeLabel: 'Yrkeshögskola',
      description: 'Analysera data och bygg AI-modeller för framtidens arbetsmarknad.',
      durationMonths: 24,
      duration: '2 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid',
      distance: true,
      url: 'https://changemaker.se',
    },
    {
      id: 'mock_4',
      title: 'Ekonomi och redovisning',
      provider: 'Komvux Stockholm',
      type: 'komvux',
      typeLabel: 'Kommunal vuxenutbildning',
      description: 'Grundläggande kurser i ekonomi, bokföring och redovisning.',
      durationMonths: 6,
      duration: '6 månader',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Deltid',
      distance: true,
    },
    {
      id: 'mock_5',
      title: 'Sjuksköterskeexamen',
      provider: 'Karolinska Institutet',
      type: 'universitet',
      typeLabel: 'Universitet',
      description: 'Akademisk utbildning till sjuksköterska med legitimation.',
      durationMonths: 36,
      duration: '3 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid',
      distance: false,
      credits: 180,
      level: 'Grundnivå',
    },
    {
      id: 'mock_6',
      title: 'Projektledning och organisation',
      provider: 'Folkuniversitetet',
      type: 'folkhogskola',
      typeLabel: 'Folkhögskola',
      description: 'Lär dig leda projekt och team i moderna organisationer.',
      durationMonths: 12,
      duration: '1 år',
      location: 'Malmö',
      region: 'Skåne',
      pace: 'Heltid',
      distance: false,
    },
  ];

  // Filtrera baserat på sökparametrar
  let filtered = mockEducations;

  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(edu =>
      edu.title.toLowerCase().includes(query) ||
      edu.description?.toLowerCase().includes(query) ||
      edu.provider.toLowerCase().includes(query)
    );
  }

  if (params.type && params.type !== 'all') {
    filtered = filtered.filter(edu => edu.type === params.type);
  }

  if (params.region) {
    const region = params.region.toLowerCase();
    filtered = filtered.filter(edu =>
      edu.region?.toLowerCase().includes(region) ||
      edu.location?.toLowerCase().includes(region)
    );
  }

  return {
    educations: filtered.slice(params.offset || 0, (params.offset || 0) + (params.limit || 20)),
    total: filtered.length,
    hasMore: false,
    source: 'fallback-mock',
  };
}

// Hämta utbildningstyper/kategorier
async function getEducationTypes(): Promise<{ id: string; label: string; count?: number }[]> {
  return [
    { id: 'all', label: 'Alla utbildningsformer' },
    { id: 'yrkeshogskola', label: 'Yrkeshögskola (YH)' },
    { id: 'hogskola', label: 'Högskola' },
    { id: 'universitet', label: 'Universitet' },
    { id: 'komvux', label: 'Komvux' },
    { id: 'folkhogskola', label: 'Folkhögskola' },
  ];
}

// Hämta regioner/län
async function getRegions(): Promise<{ id: string; label: string }[]> {
  return [
    { id: '', label: 'Hela Sverige' },
    { id: 'stockholm', label: 'Stockholm' },
    { id: 'vastra-gotaland', label: 'Västra Götaland' },
    { id: 'skane', label: 'Skåne' },
    { id: 'ostergotland', label: 'Östergötland' },
    { id: 'uppsala', label: 'Uppsala' },
    { id: 'jonkoping', label: 'Jönköping' },
    { id: 'halland', label: 'Halland' },
    { id: 'orebro', label: 'Örebro' },
    { id: 'sodermanland', label: 'Södermanland' },
    { id: 'gavleborg', label: 'Gävleborg' },
    { id: 'dalarna', label: 'Dalarna' },
    { id: 'vastmanland', label: 'Västmanland' },
    { id: 'varmland', label: 'Värmland' },
    { id: 'kronoberg', label: 'Kronoberg' },
    { id: 'kalmar', label: 'Kalmar' },
    { id: 'vasterbotten', label: 'Västerbotten' },
    { id: 'norrbotten', label: 'Norrbotten' },
    { id: 'blekinge', label: 'Blekinge' },
    { id: 'vasternorrland', label: 'Västernorrland' },
    { id: 'jamtland', label: 'Jämtland' },
    { id: 'gotland', label: 'Gotland' },
  ];
}

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
    const path = url.pathname.replace('/education-search', '').replace('//', '/') || '/';
    const params = new URLSearchParams(url.search);

    console.log(`[education-search] Request: ${path}`);

    // Route handling
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

    // Default: search educations
    const searchParams: SearchParams = {
      q: params.get('q') || params.get('query') || '',
      type: (params.get('type') || 'all') as EducationType,
      region: params.get('region') || '',
      limit: parseInt(params.get('limit') || '20'),
      offset: parseInt(params.get('offset') || '0'),
    };

    const result = await searchSusaNavet(searchParams);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[education-search] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, educations: [], total: 0 }),
      {
        status: 200, // Return 200 with error in body to avoid CORS issues
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
