/**
 * Arbetsförmedlingen JobSearch API Integration
 * Realtidsdata om jobb från Platsbanken
 * 
 * ANROPER AF API DIREKT - CORS är tillåtet!
 */

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';

// Cache för att minska antal anrop
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuter

// Typer
export interface PlatsbankenJob {
  id: string;
  headline: string;
  description: {
    text: string;
    text_formatted: string;
  };
  employer: {
    name: string;
    workplace?: string;
  };
  workplace_address?: {
    municipality: string;
    region: string;
    country: string;
  };
  employment_type?: {
    label: string;
  };
  occupation?: {
    label: string;
  };
  application_details?: {
    reference?: string;
    email?: string;
    url?: string;
  };
  publication_date: string;
  last_publication_date: string;
  salary_type?: {
    label: string;
  };
}

export interface JobSearchResponse {
  total: { value: number };
  hits: PlatsbankenJob[];
}

export interface SearchFilters {
  q?: string;
  municipality?: string;
  region?: string;
  employment_type?: string;
  published_after?: string;
  limit?: number;
  offset?: number;
}

// Populära sökningar
export const POPULAR_QUERIES = [
  { label: 'Kundtjänst', query: 'kundtjänst', icon: '💬' },
  { label: 'Lager', query: 'lagerarbetare', icon: '📦' },
  { label: 'Vård', query: 'sjuksköterska', icon: '🏥' },
  { label: 'Lärare', query: 'lärare', icon: '🎓' },
  { label: 'IT', query: 'programmerare', icon: '💻' },
];

// Hjälpfunktion för fetch med cache
async function fetchWithCache(url: string): Promise<any> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[AF API] Cache hit:', url);
    return cached.data;
  }

  console.log('[AF API] Fetching:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

// SÖK JOBB - Huvudfunktionen
export async function searchPlatsbanken(params: SearchFilters): Promise<JobSearchResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.q) searchParams.set('q', params.q);
    if (params.municipality) searchParams.set('municipality', params.municipality);
    if (params.region) searchParams.set('region', params.region);
    if (params.employment_type) searchParams.set('employment-type', params.employment_type);
    if (params.published_after) searchParams.set('published-after', params.published_after);
    searchParams.set('limit', String(params.limit || 20));
    searchParams.set('offset', String(params.offset || 0));

    const url = `${AF_JOBSEARCH_BASE}/search?${searchParams.toString()}`;
    const data = await fetchWithCache(url);

    return {
      total: { value: data.total?.value || 0 },
      hits: data.hits || [],
    };
  } catch (error) {
    console.error('[AF API] Search error:', error);
    return { total: { value: 0 }, hits: [] };
  }
}

// Hämta jobbdetaljer
export async function getJobDetails(id: string): Promise<PlatsbankenJob | null> {
  try {
    const url = `${AF_JOBSEARCH_BASE}/ad/${id}`;
    return await fetchWithCache(url);
  } catch (error) {
    console.error('[AF API] Get job details error:', error);
    return null;
  }
}

// Autocomplete för sökning
export async function getAutocomplete(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const url = `${AF_JOBSEARCH_BASE}/complete?q=${encodeURIComponent(query)}`;
    const data = await fetchWithCache(url);
    return data.typeahead || [];
  } catch (error) {
    console.error('[AF API] Autocomplete error:', error);
    return [];
  }
}

// Marknadsinsikter (mock för nu)
export async function getMarketInsights() {
  return {
    topOccupations: [
      { occupation: 'Sjuksköterskor', count: 1250, trend: 'up' },
      { occupation: 'Lagerarbetare', count: 980, trend: 'stable' },
      { occupation: 'Systemutvecklare', count: 850, trend: 'up' },
      { occupation: 'Kundtjänst', count: 720, trend: 'down' },
    ],
    topRegions: [
      { region: 'Stockholm', count: 5200 },
      { region: 'Göteborg', count: 3100 },
      { region: 'Malmö', count: 2100 },
    ],
    salaryRanges: {
      'IT': { min: 35000, max: 65000, median: 48000 },
      'Vård': { min: 28000, max: 45000, median: 34000 },
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Gap-analys - matcha kompetenser
export function analyzeSkillGap(
  userSkills: string[],
  jobRequirements: string[]
): {
  matching: string[];
  missing: string[];
  matchPercentage: number;
  recommendations: string[];
} {
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());
  const normalizedJobReqs = jobRequirements.map((r) => r.toLowerCase().trim());

  const matching = normalizedJobReqs.filter((req) =>
    normalizedUserSkills.some((skill) => skill.includes(req) || req.includes(skill))
  );

  const missing = normalizedJobReqs.filter(
    (req) =>
      !normalizedUserSkills.some((skill) => skill.includes(req) || req.includes(skill))
  );

  const matchPercentage =
    normalizedJobReqs.length > 0
      ? Math.round((matching.length / normalizedJobReqs.length) * 100)
      : 0;

  const recommendations: string[] = [];
  if (missing.length > 0) {
    recommendations.push(
      `Överväg att lägga till: ${missing.slice(0, 3).join(', ')}`
    );
  }
  if (matchPercentage < 50) {
    recommendations.push('Fokusera på överförbara färdigheter');
  }
  if (matchPercentage >= 80) {
    recommendations.push('Du är väl kvalificerad!');
  }

  return {
    matching: matching.map((m) => jobRequirements[normalizedJobReqs.indexOf(m)]),
    missing: missing.map((m) => jobRequirements[normalizedJobReqs.indexOf(m)]),
    matchPercentage,
    recommendations,
  };
}

// Alias för bakåtkompatibilitet
export const searchJobs = searchPlatsbanken;
export const afApi = {
  searchJobs: searchPlatsbanken,
  getJobDetails,
  getAutocomplete,
  getMarketStats: getMarketInsights,
};

export default {
  searchPlatsbanken,
  searchJobs,
  getJobDetails,
  getAutocomplete,
  analyzeSkillGap,
  getMarketInsights,
  POPULAR_QUERIES,
  afApi,
};
