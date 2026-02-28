/**
 * Arbetsförmedlingen JobSearch API Integration
 * Realtidsdata om jobb från Platsbanken
 * 
 * ANVÄNDER SUPABASE EDGE FUNCTIONS (ingen CORS!)
 */

// Supabase config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cache för kommun-mapping
let municipalityCache: Map<string, string> | null = null;
let regionCache: Map<string, string> | null = null;

// Svenska län med koder (NUTS nivå 3)
const SWEDISH_REGIONS: Record<string, string> = {
  'stockholms län': 'SE110',
  'uppsala län': 'SE121',
  'södermanlands län': 'SE122',
  'östergötlands län': 'SE123',
  'jönköpings län': 'SE211',
  'kronobergs län': 'SE212',
  'kalmar län': 'SE213',
  'gotlands län': 'SE214',
  'blekinge län': 'SE221',
  'skåne län': 'SE224',
  'hallands län': 'SE231',
  'västra götalands län': 'SE232',
  'värmlands län': 'SE311',
  'örebro län': 'SE124',
  'västmanlands län': 'SE125',
  'dalarnas län': 'SE312',
  'gävleborgs län': 'SE313',
  'västernorrlands län': 'SE321',
  'jämtlands län': 'SE322',
  'västerbottens län': 'SE331',
  'norrbottens län': 'SE332',
};

// Vanliga kommuner (fallback om API inte fungerar)
const COMMON_MUNICIPALITIES: Record<string, string> = {
  'stockholm': '0180',
  'göteborg': '1480',
  'malmö': '1280',
  'uppsala': '0380',
  'linköping': '0580',
  'västerås': '1980',
  'örebro': '1880',
  'helsingborg': '1283',
  'norrköping': '0581',
  'jönköping': '0680',
  'umeå': '2480',
  'lund': '1281',
  'borås': '1490',
  'sundsvall': '2281',
  'gävle': '2180',
  'eskilstuna': '0480',
  'södertälje': '0181',
  'karlstad': '1780',
  'täby': '0160',
  'växjö': '0780',
  'halmstad': '1380',
  'sollentuna': '0163',
  'kalmar': '0880',
  'solna': '0184',
  'östersund': '2380',
  'mölndal': '1481',
  'trollhättan': '1488',
  'luleå': '2580',
  'landskrona': '1282',
  'falun': '2080',
  'tyresö': '0138',
  'haninge': '0136',
  'huddinge': '0126',
  'botkyrka': '0127',
  'nacka': '0182',
  'sundbyberg': '0183',
};

// Typer för Platsbanken-respons
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
  keywords?: {
    enriched?: string[];
  };
  // Bakåtkompatibilitet
  experience_required?: string;
  application_deadline?: string;
  salary_description?: string;
  must_have?: string[];
  nice_to_have?: string[];
}

// Alias för bakåtkompatibilitet
export type JobAd = PlatsbankenJob;

export interface JobSearchResponse {
  total: {
    value: number;
  };
  hits: PlatsbankenJob[];
}

export interface MarketInsights {
  topOccupations: Array<{
    occupation: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  topRegions: Array<{
    region: string;
    count: number;
  }>;
  salaryRanges: Record<string, { min: number; max: number; median: number }>;
  lastUpdated: string;
}

export interface SearchFilters {
  q?: string;
  municipality?: string;
  region?: string;
  occupation?: string;
  employment_type?: string;
  experience_required?: boolean;
  published_after?: string;
  remote?: boolean;
  // AF-specific filters
  occupation_group?: string;  // Yrkesgrupp (SSYK)
  occupation_field?: string;  // Yrkesområde
  skills?: string[];          // Kompetenser
  languages?: string[];       // Språk
  driving_license?: boolean;  // Kräver körkort
  unemployment_benefits?: boolean; // A-kassa erbjuds
  offset?: number;
  limit?: number;
}

export interface CVMatchAnalysis {
  overallMatch: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  locationMatch: number;
  missingSkills: string[];
  matchingSkills: string[];
  suggestions: string[];
  improvements: string[];
}

export interface SkillTrend {
  skill: string;
  demand: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SalaryStats {
  occupation: string;
  median: number;
  range: { min: number; max: number };
}

export interface EducationOption {
  title: string;
  education_type: string;
  duration_months: number;
  provider: string;
}

export interface EntryLevelJob {
  headline: string;
  employer?: { name: string };
}

export interface CareerPath {
  id: string;
  title: string;
  occupation: string;
  steps: string[];
  averageSalary: number;
  timeToAchieve: string;
  required_competencies: string[];
  education_options: EducationOption[];
  entry_level_jobs: EntryLevelJob[];
  salary_range: { min: number; max: number; median?: number };
  demand_trend: 'high' | 'medium' | 'low' | 'increasing' | 'decreasing' | 'stable';
}

// ============ SUPABASE EDGE FUNCTION ============

import { jobCache } from './cacheService';
import { withRetry, fetchWithRetry } from './retryService';

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';

// Testa om Edge Function är tillgänglig
let edgeFunctionAvailable: boolean | null = null;

async function fetchFromJobSearch(endpoint: string, params?: Record<string, string>): Promise<any> {
  const cacheKey = `jobsearch:${endpoint}:${JSON.stringify(params)}`;
  
  // Kolla cache först (2 minuter för jobb)
  const cached = jobCache.get(cacheKey);
  if (cached) {
    console.log('[JobSearch] Cache hit:', endpoint);
    return cached;
  }
  
  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  
  // Om vi vet att Edge Function inte fungerar, använd direkt API
  if (edgeFunctionAvailable === false) {
    return fetchDirectFromAF(endpoint, params);
  }
  
  // Försök med Edge Function först
  const functionUrl = `${SUPABASE_URL}/functions/v1/af-jobsearch${endpoint}${queryParams}`;
  console.log('[JobSearch] Trying Edge Function:', functionUrl);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      edgeFunctionAvailable = true;
      const data = await response.json();
      if (data) {
        jobCache.set(cacheKey, data);
      }
      return data;
    }
    
    // Om Edge Function returnerar fel, markera som otillgänglig
    edgeFunctionAvailable = false;
    throw new Error(`Edge Function error: ${response.status}`);
    
  } catch (error) {
    console.warn('[JobSearch] Edge Function failed, trying direct API:', error);
    edgeFunctionAvailable = false;
    return fetchDirectFromAF(endpoint, params);
  }
}

// Fallback: Anropa Arbetsförmedlingens API direkt
async function fetchDirectFromAF(endpoint: string, params?: Record<string, string>): Promise<any> {
  const cacheKey = `jobsearch:direct:${endpoint}:${JSON.stringify(params)}`;
  
  // Kolla cache
  const cached = jobCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${AF_JOBSEARCH_BASE}${endpoint}${queryParams}`;
  
  console.log('[JobSearch] Fetching directly from AF:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[JobSearch] Direct AF API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (data) {
      jobCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error('[JobSearch] Direct API failed:', error);
    return null;
  }
}

// Sök jobb i Platsbanken
export async function searchPlatsbanken(params: SearchFilters): Promise<JobSearchResponse> {
  try {
    // Mappa våra parametrar till AF:s format
    const afParams: Record<string, string> = {};
    if (params.q) afParams['q'] = params.q;
    if (params.limit) afParams['limit'] = String(params.limit);
    afParams['offset'] = String(params.offset || 0);
    
    // Konvertera kommun-namn till kommun-kod
    if (params.municipality) {
      const code = await getMunicipalityCode(params.municipality);
      if (code) {
        afParams['municipality'] = code;
      }
    }
    
    // Konvertera region-namn till region-kod (län)
    if (params.region) {
      const code = await getRegionCode(params.region);
      if (code) {
        afParams['region'] = code;
      }
    }
    
    // Anställningstyp - konvertera till AF:s format
    if (params.employment_type) {
      afParams['employment-type'] = params.employment_type;
    }
    
    // Yrkesområde (occupation-group)
    if (params.occupation) {
      afParams['occupation-group'] = params.occupation;
    }
    
    // Remote-arbete
    if (params.remote) {
      afParams['remote'] = 'true';
    }
    
    // Publicerad efter (datum i ISO-format)
    if (params.published_after) {
      afParams['published-after'] = params.published_after;
    }
    
    console.log('Sökparametrar till AF:', afParams);
    
    const data = await fetchFromJobSearch('/search', afParams);
    
    // Hantera null/undefined fallback
    if (!data) {
      console.warn('[JobSearch] No data received, returning empty results');
      return {
        total: { value: 0 },
        hits: []
      };
    }
    
    // Returnera i rätt format som matchar JobSearchResponse
    return {
      total: { value: data.total?.value || 0 },
      hits: data.hits || []
    };
  } catch (error) {
    console.error('Fel vid sökning i Platsbanken:', error);
    // Returnera tomma resultat istället för att krascha
    return {
      total: { value: 0 },
      hits: []
    };
  }
}

// Alias för bakåtkompatibilitet
export const searchJobs = searchPlatsbanken;

// Hämta jobbdetaljer
export async function getJobDetails(id: string): Promise<PlatsbankenJob | null> {
  try {
    const data = await fetchFromJobSearch(`/ad/${id}`);
    if (!data) {
      console.warn('[JobSearch] No data for job details:', id);
      return null;
    }
    return {
      id: data.id,
      headline: data.headline,
      description: data.description,
      employer: data.employer,
      workplace_address: data.workplace_address,
      employment_type: data.employment_type,
      occupation: data.occupation,
      application_details: data.application_details,
      publication_date: data.publication_date,
      last_publication_date: data.application_deadline
    };
  } catch (error) {
    console.error('Fel vid hämtning av jobbdetaljer:', error);
    return null;
  }
}

// Autocomplete för sökning
export async function getAutocomplete(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const response = await fetchFromJobSearch('/complete', { q: query });
    if (!response) {
      console.warn('[JobSearch] No autocomplete data received');
      return [];
    }
    return response.typeahead || [];
  } catch (error) {
    return [];
  }
}

// Gap-analys - matcha kompetenser mot efterfrågan
export function analyzeSkillGap(
  userSkills: string[],
  jobRequirements: string[]
): {
  matching: string[];
  missing: string[];
  matchPercentage: number;
  recommendations: string[];
} {
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());
  const normalizedJobReqs = jobRequirements.map(r => r.toLowerCase().trim());
  
  const matching = normalizedJobReqs.filter(req => 
    normalizedUserSkills.some(skill => skill.includes(req) || req.includes(skill))
  );
  
  const missing = normalizedJobReqs.filter(req => 
    !normalizedUserSkills.some(skill => skill.includes(req) || req.includes(skill))
  );
  
  const matchPercentage = normalizedJobReqs.length > 0 
    ? Math.round((matching.length / normalizedJobReqs.length) * 100)
    : 0;
  
  const recommendations: string[] = [];
  if (missing.length > 0) {
    recommendations.push(`Överväg att lägga till dessa kompetenser i ditt CV: ${missing.slice(0, 3).join(', ')}`);
  }
  if (matchPercentage < 50) {
    recommendations.push('Fokusera på att framhäva dina överförbara färdigheter');
  }
  if (matchPercentage >= 80) {
    recommendations.push('Du är väl kvalificerad för denna roll!');
  }
  
  return {
    matching: matching.map(m => jobRequirements[normalizedJobReqs.indexOf(m)]),
    missing: missing.map(m => jobRequirements[normalizedJobReqs.indexOf(m)]),
    matchPercentage,
    recommendations
  };
}

// Hämta marknadsinsikter
export async function getMarketInsights(): Promise<MarketInsights> {
  // Returnera mock data för nu - kan ersättas med riktigt API
  return {
    topOccupations: [
      { occupation: 'Sjuksköterskor', count: 1250, trend: 'up' },
      { occupation: 'Lagerarbetare', count: 980, trend: 'stable' },
      { occupation: 'Systemutvecklare', count: 850, trend: 'up' },
      { occupation: 'Kundtjänst', count: 720, trend: 'down' },
      { occupation: 'Lärare', count: 650, trend: 'stable' }
    ],
    topRegions: [
      { region: 'Stockholm', count: 5200 },
      { region: 'Göteborg', count: 3100 },
      { region: 'Malmö', count: 2100 },
      { region: 'Uppsala', count: 890 },
      { region: 'Linköping', count: 650 }
    ],
    salaryRanges: {
      'IT': { min: 35000, max: 65000, median: 48000 },
      'Vård': { min: 28000, max: 45000, median: 34000 },
      'Bygg': { min: 30000, max: 48000, median: 36000 },
      'Administration': { min: 26000, max: 40000, median: 31000 },
      'Försäljning': { min: 25000, max: 55000, median: 32000 }
    },
    lastUpdated: new Date().toISOString()
  };
}

// Bakåtkompatibilitet - marknadsstatistik
export async function getMarketStats() {
  return getMarketInsights();
}

// Sök efter query
export async function searchByQuery(query: string): Promise<PlatsbankenJob[]> {
  const response = await searchPlatsbanken({ q: query, limit: 10 });
  return response.hits;
}

// Analysera jobbmatch
export async function analyzeJobMatch(jobId: string, cvData: unknown): Promise<CVMatchAnalysis> {
  // Mock-implementation
  return {
    overallMatch: 75,
    skillMatch: 80,
    experienceMatch: 70,
    educationMatch: 75,
    locationMatch: 90,
    missingSkills: ['Python', 'Agila metoder'],
    matchingSkills: ['Kommunikation', 'Teamwork'],
    suggestions: ['Lägg till mer information om dina tekniska färdigheter'],
    improvements: ['Beskriv dina projekt mer detaljerat']
  };
}

// Hämta karriärväg
export async function getCareerPath(occupation: string): Promise<CareerPath> {
  return {
    id: 'mock',
    title: occupation,
    occupation: occupation,
    steps: ['Junior', 'Medior', 'Senior', 'Expert'],
    averageSalary: 45000,
    timeToAchieve: '5-7 år',
    required_competencies: ['Kommunikation', 'Samarbete', 'Problemlösning', 'Organisering'],
    education_options: [
      { title: 'Yrkeshögskoleutbildning', education_type: 'YH', duration_months: 24, provider: 'Yrkeshögskolan' },
      { title: 'Universitetsutbildning', education_type: 'Universitet', duration_months: 36, provider: 'Universitetet' }
    ],
    entry_level_jobs: [
      { headline: `${occupation} - Entry level`, employer: { name: 'Företag AB' } },
      { headline: `Junior ${occupation}`, employer: { name: 'Bolaget AB' } }
    ],
    salary_range: { min: 30000, max: 50000, median: 40000 },
    demand_trend: 'increasing'
  };
}

// Hämta kommuner från AF API
export async function getMunicipalities(): Promise<Array<{ id: string; name: string }>> {
  // Använd Taxonomy Edge Function
  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/af-taxonomy/concepts?type=municipality`;
    
    // Timeout efter 10 sekunder
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return (data?.concepts || []).map((m: any) => ({ id: m.id, name: m.name }));
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    // Fallback till vanliga kommuner
    return Object.entries(COMMON_MUNICIPALITIES).map(([name, id]) => ({ 
      id, 
      name: name.charAt(0).toUpperCase() + name.slice(1) 
    }));
  }
}

// Hämta kommun-kod från kommun-namn
export async function getMunicipalityCode(name: string): Promise<string | null> {
  if (!name) return null;
  
  // Normalisera input (små bokstäver, trimma)
  const normalized = name.toLowerCase().trim();
  
  // Kolla fallback-listan först
  if (COMMON_MUNICIPALITIES[normalized]) {
    return COMMON_MUNICIPALITIES[normalized];
  }
  
  // Prova att hämta från API
  try {
    const municipalities = await getMunicipalities();
    const match = municipalities.find(m => 
      m.name.toLowerCase() === normalized ||
      m.id === normalized
    );
    return match?.id || null;
  } catch (error) {
    console.error('Kunde inte hämta kommuner:', error);
    return null;
  }
}

// Hämta regioner (län)
export async function getRegions(): Promise<Array<{ id: string; name: string }>> {
  return Object.entries(SWEDISH_REGIONS).map(([name, id]) => ({
    id,
    name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }));
}

// Hämta region-kod från region-namn
export async function getRegionCode(name: string): Promise<string | null> {
  if (!name) return null;
  
  const normalized = name.toLowerCase().trim();
  
  // Kolla fallback-listan
  if (SWEDISH_REGIONS[normalized]) {
    return SWEDISH_REGIONS[normalized];
  }
  
  // Prova att matcha utan "län"
  const withoutLan = normalized.replace(' län', '');
  const withLan = `${withoutLan} län`;
  if (SWEDISH_REGIONS[withLan]) {
    return SWEDISH_REGIONS[withLan];
  }
  
  return null;
}

// Optimera CV
export interface CVOptimizationResult {
  optimized: unknown;
  suggestions: string[];
  keywords_to_add: string[];
  skills_to_highlight: string[];
}

export async function optimizeCV(cvData: unknown, jobDescription?: string): Promise<CVOptimizationResult> {
  return {
    optimized: cvData,
    suggestions: ['Använd mer action-orienterade verb', 'Lägg till mätbara resultat'],
    keywords_to_add: jobDescription ? ['kommunikation', 'samarbete'] : [],
    skills_to_highlight: ['ledarskap', 'problemlösning']
  };
}

// Populära sökningar
export const POPULAR_QUERIES = [
  { label: 'Kundtjänst', query: 'kundtjänst', icon: '💬' },
  { label: 'Lager', query: 'lagerarbetare', icon: '📦' },
  { label: 'Vård', query: 'sjuksköterska', icon: '🏥' },
  { label: 'Lärare', query: 'lärare', icon: '🎓' },
  { label: 'IT', query: 'programmerare', icon: '💻' },
];

// Export för bakåtkompatibilitet
export const afApi = {
  searchJobs: searchPlatsbanken,
  getJobDetails,
  getAutocomplete,
  getMarketStats: getMarketInsights,
  searchByQuery,
  analyzeJobMatch,
  getCareerPath,
  getMunicipalities,
  getMunicipalityCode,
  getRegions,
  getRegionCode,
  optimizeCV
};

// Default export
export default {
  searchPlatsbanken,
  searchJobs,
  getJobDetails,
  getAutocomplete,
  analyzeSkillGap,
  getMarketInsights,
  getMarketStats,
  searchByQuery,
  analyzeJobMatch,
  getCareerPath,
  getMunicipalities,
  getRegions,
  optimizeCV,
  POPULAR_QUERIES,
  afApi
};
