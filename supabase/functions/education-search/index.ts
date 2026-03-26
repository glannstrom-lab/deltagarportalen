// Supabase Edge Function: Proxy för Utbildningssökning
// Använder JobEd Connect API från Arbetsförmedlingen/JobTech
// URL: https://<project>.supabase.co/functions/v1/education-search

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// JobEd Connect API - Real Swedish Education Database
const JOBED_API_BASE = 'https://jobed-connect-api.jobtechdev.se/v1';

// Types
interface SearchParams {
  q?: string;
  type?: string;        // education_type: program, kurs, etc.
  form?: string;        // education_form: yrkeshögskoleutbildning, högskoleutbildning, etc.
  region?: string;      // region_code (2 digits)
  municipality?: string; // municipality_code (4 digits)
  distance?: boolean;
  limit?: number;
  offset?: number;
}

interface Education {
  id: string;
  title: string;
  provider: string;
  providerUrl?: string;
  type: string;
  typeLabel: string;
  form?: string;
  formLabel?: string;
  description?: string;
  duration?: string;
  durationMonths?: number;
  startDate?: string;
  endDate?: string;
  applicationDeadline?: string;
  location?: string;
  municipality?: string;
  region?: string;
  pace?: string;
  pacePercent?: number;
  distance?: boolean;
  url?: string;
  credits?: number;
  level?: string;
  qualificationLevel?: string;
}

interface SearchResult {
  educations: Education[];
  total: number;
  hasMore: boolean;
  source: string;
}

// Map education_type codes to readable labels
const TYPE_LABELS: Record<string, string> = {
  'program': 'Program',
  'kurs': 'Kurs',
  'paket': 'Kurspaket',
  'delkurs': 'Delkurs',
};

// Map education_form codes to readable labels
const FORM_LABELS: Record<string, string> = {
  'yrkeshögskoleutbildning': 'Yrkeshögskola',
  'högskoleutbildning': 'Högskola/Universitet',
  'grundläggande_vuxenutbildning': 'Komvux grundläggande',
  'gymnasial_vuxenutbildning': 'Komvux gymnasial',
  'folkhögskoleutbildning': 'Folkhögskola',
  'arbetsmarknadsutbildning': 'Arbetsmarknadsutbildning',
  'konst_och_kulturutbildning': 'Konst och kultur',
  'kompletterande_utbildning': 'Kompletterande utbildning',
};

// Helper to get Swedish text from multi-language array
function getSwedishText(arr: any): string {
  if (!arr) return '';
  if (typeof arr === 'string') return arr;
  if (Array.isArray(arr)) {
    const sweItem = arr.find((item: any) => item.lang === 'swe' || item.lang === 'sv');
    return sweItem?.content || arr[0]?.content || '';
  }
  return '';
}

// Normalize API response to our format
// JobEd Connect returns nested structure: {id, education: {...}, providerSummary, eventSummary}
function normalizeEducation(raw: any): Education {
  // Handle nested education object
  const edu = raw.education || raw;
  const event = raw.eventSummary || {};
  const providerInfo = raw.providerSummary || {};

  const formCode = edu.form?.code || raw.education_form || '';

  // Determine a simplified type for frontend display
  // Use lowercase comparison and handle both Swedish (ö) and ASCII (o)
  const formLower = formCode.toLowerCase();
  let simplifiedType = 'other';
  if (formLower.includes('yrkesh') && (formLower.includes('gskola') || formLower.includes('gskoleutbildning'))) {
    simplifiedType = 'yrkeshogskola';
  } else if (formLower.includes('h') && formLower.includes('gskola') && !formLower.includes('folkh')) {
    simplifiedType = 'hogskola';
  } else if (formLower.includes('universitet')) {
    simplifiedType = 'hogskola';
  } else if (formLower.includes('vuxenutbildning') || formLower.includes('komvux')) {
    simplifiedType = 'komvux';
  } else if (formLower.includes('folkh') && formLower.includes('gskola')) {
    simplifiedType = 'folkhogskola';
  } else if (formLower.includes('arbetsmarknad')) {
    simplifiedType = 'arbetsmarknadsutbildning';
  }

  // Get title - can be array with {lang, content} or string
  const title = getSwedishText(edu.title) || raw.label || 'Namnlös utbildning';

  // Get description
  const description = getSwedishText(edu.description);

  // Get provider from providerSummary.providers array
  const provider = providerInfo.providers?.[0] || edu.provider?.label || 'Okänd utbildningsanordnare';

  // Get start/end from eventSummary.executions
  const execution = event.executions?.[0] || {};

  // Get pace percentage
  const pacePercent = event.paceOfStudyPercentage?.[0] || null;

  // Get credits
  const credits = edu.credits?.credits || edu.credits?.value || null;

  return {
    id: raw.id || edu.identifier || edu.code || `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    provider,
    providerUrl: edu.urls?.[0] || undefined,
    type: simplifiedType,
    typeLabel: FORM_LABELS[formCode] || formCode || 'Utbildning',
    form: formCode,
    formLabel: FORM_LABELS[formCode] || formCode,
    description: description || undefined,
    duration: credits ? `${credits} YH-poäng` : undefined,
    durationMonths: undefined,
    startDate: execution.start || undefined,
    endDate: execution.end || undefined,
    applicationDeadline: undefined,
    location: event.municipalityCode?.[0] || event.regionCode?.[0] || (event.distance ? 'Distans' : undefined),
    municipality: event.municipalityCode?.[0] || undefined,
    region: event.regionCode?.[0] || undefined,
    pace: pacePercent ? `${pacePercent}%` : undefined,
    pacePercent: pacePercent || undefined,
    distance: event.distance === true,
    url: edu.urls?.[0] || undefined,
    credits: credits || undefined,
    level: edu.educationLevel?.code || undefined,
    qualificationLevel: edu.educationLevel?.code || undefined,
  };
}

// Search educations using JobEd Connect API
async function searchEducations(params: SearchParams): Promise<SearchResult> {
  const { q = '', type, form, region, municipality, distance, limit = 20, offset = 0 } = params;

  const queryParams = new URLSearchParams();

  // Free text search
  if (q) {
    queryParams.set('query', q);
  }

  // Filter by education type
  if (type && type !== 'all') {
    // Map our frontend types to API forms
    const typeToFormMap: Record<string, string> = {
      'yrkeshogskola': 'yrkeshögskoleutbildning',
      'hogskola': 'högskoleutbildning',
      'universitet': 'högskoleutbildning',
      'komvux': 'gymnasial_vuxenutbildning',
      'folkhogskola': 'folkhögskoleutbildning',
    };
    const apiForm = typeToFormMap[type];
    if (apiForm) {
      queryParams.append('education_form', apiForm);
    }
  }

  // Filter by form directly
  if (form) {
    queryParams.append('education_form', form);
  }

  // Filter by region (2-digit code)
  if (region) {
    queryParams.set('region_code', region);
  }

  // Filter by municipality (4-digit code)
  if (municipality) {
    queryParams.set('municipality_code', municipality);
  }

  // Filter by distance learning
  if (distance !== undefined) {
    queryParams.set('distance', String(distance));
  }

  // Pagination
  queryParams.set('limit', String(Math.min(limit, 100)));
  queryParams.set('offset', String(offset));

  const url = `${JOBED_API_BASE}/educations?${queryParams.toString()}`;

  console.log(`[education-search] Fetching: ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[education-search] JobEd API error: ${response.status}`);
      throw new Error(`JobEd API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle response - JobEd Connect returns {hits: number, result: array}
    let educations: Education[] = [];
    let total = 0;

    if (Array.isArray(data)) {
      educations = data.map(normalizeEducation);
      total = data.length;
    } else if (data.result && Array.isArray(data.result)) {
      // JobEd Connect format: {hits: number, result: array}
      educations = data.result.map(normalizeEducation);
      total = data.hits || data.total || data.result.length;
    } else if (data.data && Array.isArray(data.data)) {
      educations = data.data.map(normalizeEducation);
      total = data.total || data.count || data.data.length;
    } else if (data.educations && Array.isArray(data.educations)) {
      educations = data.educations.map(normalizeEducation);
      total = data.total || data.educations.length;
    }

    console.log(`[education-search] Found ${educations.length} educations (total: ${total})`);

    return {
      educations,
      total,
      hasMore: offset + educations.length < total,
      source: 'jobed-connect',
    };
  } catch (error) {
    console.error('[education-search] Error:', error);
    // Return fallback data
    return getFallbackEducations(params);
  }
}

// Get education by ID
async function getEducationById(id: string): Promise<Education | null> {
  try {
    const url = `${JOBED_API_BASE}/educations/${encodeURIComponent(id)}`;
    console.log(`[education-search] Fetching education: ${url}`);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`[education-search] Failed to get education ${id}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return normalizeEducation(data);
  } catch (error) {
    console.error('[education-search] Error getting education:', error);
    return null;
  }
}

// Match educations by job title
async function matchByJobTitle(jobTitle: string, params: SearchParams = {}): Promise<SearchResult> {
  try {
    const queryParams = new URLSearchParams();
    if (params.region) queryParams.set('region_code', params.region);
    if (params.limit) queryParams.set('limit', String(params.limit));

    const url = `${JOBED_API_BASE}/educations/match-by-jobtitle?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_title: jobTitle }),
    });

    if (!response.ok) {
      throw new Error(`Match API error: ${response.status}`);
    }

    const data = await response.json();
    const educations = Array.isArray(data) ? data.map(normalizeEducation) : [];

    return {
      educations,
      total: educations.length,
      hasMore: false,
      source: 'jobed-connect-match',
    };
  } catch (error) {
    console.error('[education-search] Match error:', error);
    return { educations: [], total: 0, hasMore: false, source: 'error' };
  }
}

// Get available education types
async function getEducationTypes(): Promise<{ id: string; label: string }[]> {
  try {
    const response = await fetch(`${JOBED_API_BASE}/searchparameters/education_forms`, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const types = [{ id: 'all', label: 'Alla utbildningsformer' }];

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          types.push({
            id: item.id || item.code || item,
            label: FORM_LABELS[item.id || item.code || item] || item.label || item,
          });
        });
      }

      return types;
    }
  } catch (error) {
    console.error('[education-search] Error getting types:', error);
  }

  // Return default types
  return [
    { id: 'all', label: 'Alla utbildningsformer' },
    { id: 'yrkeshogskola', label: 'Yrkeshögskola (YH)' },
    { id: 'hogskola', label: 'Högskola/Universitet' },
    { id: 'komvux', label: 'Komvux' },
    { id: 'folkhogskola', label: 'Folkhögskola' },
  ];
}

// Get available regions
async function getRegions(): Promise<{ id: string; label: string }[]> {
  try {
    const response = await fetch(`${JOBED_API_BASE}/searchparameters/regions`, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const regions = [{ id: '', label: 'Hela Sverige' }];

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          regions.push({
            id: item.region_code || item.code || item.id,
            label: item.label || item.name || item,
          });
        });
      }

      return regions;
    }
  } catch (error) {
    console.error('[education-search] Error getting regions:', error);
  }

  // Return default regions with codes
  return [
    { id: '', label: 'Hela Sverige' },
    { id: '01', label: 'Stockholm' },
    { id: '03', label: 'Uppsala' },
    { id: '04', label: 'Södermanland' },
    { id: '05', label: 'Östergötland' },
    { id: '06', label: 'Jönköping' },
    { id: '07', label: 'Kronoberg' },
    { id: '08', label: 'Kalmar' },
    { id: '09', label: 'Gotland' },
    { id: '10', label: 'Blekinge' },
    { id: '12', label: 'Skåne' },
    { id: '13', label: 'Halland' },
    { id: '14', label: 'Västra Götaland' },
    { id: '17', label: 'Värmland' },
    { id: '18', label: 'Örebro' },
    { id: '19', label: 'Västmanland' },
    { id: '20', label: 'Dalarna' },
    { id: '21', label: 'Gävleborg' },
    { id: '22', label: 'Västernorrland' },
    { id: '23', label: 'Jämtland' },
    { id: '24', label: 'Västerbotten' },
    { id: '25', label: 'Norrbotten' },
  ];
}

// Fallback mock data
function getFallbackEducations(params: SearchParams): SearchResult {
  const mockEducations: Education[] = [
    {
      id: 'mock_yh_1',
      title: 'Webbutvecklare Fullstack',
      provider: 'Nackademin',
      type: 'yrkeshogskola',
      typeLabel: 'Yrkeshögskola',
      description: 'Lär dig moderna webbteknologier som React, Node.js, TypeScript och databaser. Praktik ingår.',
      durationMonths: 24,
      duration: '2 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid (100%)',
      pacePercent: 100,
      distance: false,
      url: 'https://nackademin.se/utbildningar/webbutvecklare/',
      applicationDeadline: '2026-04-15',
    },
    {
      id: 'mock_yh_2',
      title: 'Systemutvecklare Java',
      provider: 'IT-Högskolan',
      type: 'yrkeshogskola',
      typeLabel: 'Yrkeshögskola',
      description: 'Enterprise Java-utveckling med Spring Boot, microservices och cloud. CSN-berättigad.',
      durationMonths: 24,
      duration: '2 år',
      location: 'Göteborg',
      region: 'Västra Götaland',
      pace: 'Heltid (100%)',
      pacePercent: 100,
      distance: true,
      url: 'https://iths.se',
      applicationDeadline: '2026-04-15',
    },
    {
      id: 'mock_yh_3',
      title: 'Data Scientist',
      provider: 'Changemaker Educations',
      type: 'yrkeshogskola',
      typeLabel: 'Yrkeshögskola',
      description: 'Python, Machine Learning, statistik och dataanalys för framtidens arbetsmarknad.',
      durationMonths: 24,
      duration: '2 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid (100%)',
      pacePercent: 100,
      distance: true,
      url: 'https://changemaker.se',
      applicationDeadline: '2026-05-01',
    },
    {
      id: 'mock_yh_4',
      title: 'UX-designer',
      provider: 'Hyper Island',
      type: 'yrkeshogskola',
      typeLabel: 'Yrkeshögskola',
      description: 'Användarcentrerad design, prototyping, research och designsystem.',
      durationMonths: 24,
      duration: '2 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid (100%)',
      pacePercent: 100,
      distance: false,
      url: 'https://hyperisland.com',
      applicationDeadline: '2026-04-01',
    },
    {
      id: 'mock_uni_1',
      title: 'Civilingenjör Datateknik',
      provider: 'KTH',
      type: 'hogskola',
      typeLabel: 'Universitet',
      description: 'Femårig civilingenjörsutbildning inom datateknik och mjukvaruutveckling.',
      durationMonths: 60,
      duration: '5 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid (100%)',
      pacePercent: 100,
      distance: false,
      credits: 300,
      level: 'Avancerad nivå',
      url: 'https://kth.se',
      applicationDeadline: '2026-04-15',
    },
    {
      id: 'mock_uni_2',
      title: 'Sjuksköterskeexamen',
      provider: 'Karolinska Institutet',
      type: 'hogskola',
      typeLabel: 'Universitet',
      description: 'Akademisk utbildning till legitimerad sjuksköterska med verksamhetsförlagd utbildning.',
      durationMonths: 36,
      duration: '3 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid (100%)',
      pacePercent: 100,
      distance: false,
      credits: 180,
      level: 'Grundnivå',
      url: 'https://ki.se',
      applicationDeadline: '2026-04-15',
    },
    {
      id: 'mock_komvux_1',
      title: 'Ekonomi och redovisning',
      provider: 'Hermods',
      type: 'komvux',
      typeLabel: 'Komvux',
      description: 'Gymnasiekurser i ekonomi, bokföring och företagsekonomi. Flexibla starttider.',
      durationMonths: 6,
      duration: '6 månader',
      location: 'Distans',
      region: 'Hela Sverige',
      pace: 'Deltid (50%)',
      pacePercent: 50,
      distance: true,
      url: 'https://hermods.se',
    },
    {
      id: 'mock_folkhogskola_1',
      title: 'Grafisk design och illustration',
      provider: 'Berghs School of Communication',
      type: 'folkhogskola',
      typeLabel: 'Folkhögskola',
      description: 'Kreativ utbildning med fokus på grafisk design, typografi och digital illustration.',
      durationMonths: 12,
      duration: '1 år',
      location: 'Stockholm',
      region: 'Stockholm',
      pace: 'Heltid (100%)',
      pacePercent: 100,
      distance: false,
      url: 'https://berghs.se',
      applicationDeadline: '2026-05-15',
    },
  ];

  // Filter based on params
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
    const regionName = params.region.toLowerCase();
    filtered = filtered.filter(edu =>
      edu.region?.toLowerCase().includes(regionName) ||
      edu.location?.toLowerCase().includes(regionName)
    );
  }

  if (params.distance !== undefined) {
    filtered = filtered.filter(edu => edu.distance === params.distance);
  }

  const offset = params.offset || 0;
  const limit = params.limit || 20;

  return {
    educations: filtered.slice(offset, offset + limit),
    total: filtered.length,
    hasMore: offset + limit < filtered.length,
    source: 'fallback-mock',
  };
}

// Main request handler
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

    console.log(`[education-search] ${req.method} ${path}`);

    // GET /types - Education types
    if (path === '/types' || path === '/categories') {
      const types = await getEducationTypes();
      return new Response(JSON.stringify({ types }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /regions - Available regions
    if (path === '/regions') {
      const regions = await getRegions();
      return new Response(JSON.stringify({ regions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /:id - Single education
    if (path.match(/^\/[^/]+$/) && !path.includes('?')) {
      const id = path.substring(1);
      if (id && id !== 'search') {
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

    // POST /match - Match by job title
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

    // Default: Search educations
    const searchParams: SearchParams = {
      q: params.get('q') || params.get('query') || '',
      type: params.get('type') || 'all',
      form: params.get('form') || undefined,
      region: params.get('region') || undefined,
      municipality: params.get('municipality') || undefined,
      distance: params.has('distance') ? params.get('distance') === 'true' : undefined,
      limit: parseInt(params.get('limit') || '20'),
      offset: parseInt(params.get('offset') || '0'),
    };

    const result = await searchEducations(searchParams);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[education-search] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, educations: [], total: 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
