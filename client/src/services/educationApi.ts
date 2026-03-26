/**
 * Education API Service
 * Integrerar med JobEd Connect API (Arbetsförmedlingen/JobTech)
 * för att söka svenska utbildningar
 */

import { defaultCache } from './cacheService';

// Supabase config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============== TYPES ==============

export type EducationType =
  | 'all'
  | 'yrkeshogskola'
  | 'hogskola'
  | 'universitet'
  | 'komvux'
  | 'folkhogskola';

export interface Education {
  id: string;
  title: string;
  provider: string;
  providerUrl?: string;
  type: EducationType | string;
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
  sunCode?: string;
  credits?: number;
  level?: string;
  qualificationLevel?: string;
}

export interface SearchParams {
  query?: string;
  type?: EducationType;
  region?: string;
  municipality?: string;
  distance?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  educations: Education[];
  total: number;
  hasMore: boolean;
  source: string;
}

export interface EducationTypeOption {
  id: string;
  label: string;
  count?: number;
}

export interface RegionOption {
  id: string;
  label: string;
}

// Koppling mellan yrke och utbildning
export interface OccupationEducationMatch {
  occupationId: string;
  occupationLabel: string;
  educations: Array<{
    code: string;
    title: string;
    type: string;
    matchScore: number;
    description?: string;
    duration?: string;
  }>;
}

// ============== API FUNCTIONS ==============

async function fetchFromEducationApi<T>(
  endpoint: string,
  params?: Record<string, string>,
  options?: { method?: string; body?: any }
): Promise<T> {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${SUPABASE_URL}/functions/v1/education-search${endpoint}${queryString}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Education API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Education API timeout');
    }
    throw error;
  }
}

/**
 * Sök utbildningar
 */
export async function searchEducations(params: SearchParams): Promise<SearchResult> {
  const cacheKey = `edu_search_${JSON.stringify(params)}`;

  // Check cache first (5 min TTL)
  const cached = defaultCache.get<SearchResult>(cacheKey);
  if (cached) {
    console.log('[educationApi] Cache hit for search');
    return cached;
  }

  try {
    const queryParams: Record<string, string> = {};

    if (params.query) queryParams.q = params.query;
    if (params.type && params.type !== 'all') queryParams.type = params.type;
    if (params.region) queryParams.region = params.region;
    if (params.municipality) queryParams.municipality = params.municipality;
    if (params.distance !== undefined) queryParams.distance = String(params.distance);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.offset) queryParams.offset = String(params.offset);

    const result = await fetchFromEducationApi<SearchResult>('', queryParams);

    // Cache results for 5 minutes
    defaultCache.set(cacheKey, result, 5 * 60 * 1000);

    return result;
  } catch (error) {
    console.error('Fel vid sökning av utbildningar:', error);
    return {
      educations: [],
      total: 0,
      hasMore: false,
      source: 'error',
    };
  }
}

/**
 * Hämta enskild utbildning
 */
export async function getEducation(id: string): Promise<Education | null> {
  const cacheKey = `edu_${id}`;
  const cached = defaultCache.get<Education>(cacheKey);
  if (cached) return cached;

  try {
    const result = await fetchFromEducationApi<Education>(`/${encodeURIComponent(id)}`);
    defaultCache.set(cacheKey, result, 30 * 60 * 1000); // 30 min cache
    return result;
  } catch {
    return null;
  }
}

/**
 * Hämta utbildningstyper/kategorier
 */
export async function getEducationTypes(): Promise<EducationTypeOption[]> {
  const cacheKey = 'edu_types';
  const cached = defaultCache.get<EducationTypeOption[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = await fetchFromEducationApi<{ types: EducationTypeOption[] }>('/types');
    defaultCache.set(cacheKey, result.types, 60 * 60 * 1000); // 1h cache
    return result.types;
  } catch {
    // Fallback
    return [
      { id: 'all', label: 'Alla utbildningsformer' },
      { id: 'yrkeshogskola', label: 'Yrkeshögskola (YH)' },
      { id: 'hogskola', label: 'Högskola/Universitet' },
      { id: 'komvux', label: 'Komvux' },
      { id: 'folkhogskola', label: 'Folkhögskola' },
    ];
  }
}

/**
 * Hämta regioner/län
 */
export async function getRegions(): Promise<RegionOption[]> {
  const cacheKey = 'edu_regions';
  const cached = defaultCache.get<RegionOption[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = await fetchFromEducationApi<{ regions: RegionOption[] }>('/regions');
    defaultCache.set(cacheKey, result.regions, 60 * 60 * 1000);
    return result.regions;
  } catch {
    // Fallback with region codes
    return [
      { id: '', label: 'Hela Sverige' },
      { id: '01', label: 'Stockholm' },
      { id: '03', label: 'Uppsala' },
      { id: '12', label: 'Skåne' },
      { id: '14', label: 'Västra Götaland' },
      { id: '05', label: 'Östergötland' },
    ];
  }
}

/**
 * Matcha utbildningar med yrke/jobbtitel
 */
export async function matchEducationsByJobTitle(
  jobTitle: string,
  options?: { region?: string; limit?: number }
): Promise<SearchResult> {
  const cacheKey = `edu_match_${jobTitle}_${options?.region || ''}`;
  const cached = defaultCache.get<SearchResult>(cacheKey);
  if (cached) return cached;

  try {
    const result = await fetchFromEducationApi<SearchResult>('/match', undefined, {
      method: 'POST',
      body: {
        jobTitle,
        region: options?.region,
        limit: options?.limit || 10,
      },
    });

    defaultCache.set(cacheKey, result, 30 * 60 * 1000);
    return result;
  } catch (error) {
    console.error('Fel vid matchning av utbildningar:', error);
    return { educations: [], total: 0, hasMore: false, source: 'error' };
  }
}

/**
 * Hämta rekommenderade utbildningar baserat på kompetensgap
 */
export async function getEducationsForSkillGaps(
  skills: string[]
): Promise<Education[]> {
  if (skills.length === 0) return [];

  // Sök efter utbildningar som matchar saknade kompetenser
  const searchPromises = skills.slice(0, 3).map(skill =>
    searchEducations({ query: skill, limit: 5 })
  );

  try {
    const results = await Promise.all(searchPromises);

    // Kombinera och deduplicera resultat
    const educationMap = new Map<string, Education>();

    results.forEach(result => {
      result.educations.forEach(edu => {
        if (!educationMap.has(edu.id)) {
          educationMap.set(edu.id, edu);
        }
      });
    });

    return Array.from(educationMap.values()).slice(0, 10);
  } catch (error) {
    console.error('Fel vid hämtning av utbildningar för kompetensgap:', error);
    return [];
  }
}

/**
 * Hämta utbildningsrekommendationer baserat på RIASEC-resultat
 */
export async function getEducationsForRIASEC(
  riasecCode: string
): Promise<Education[]> {
  // Mappa RIASEC-koder till söktermer
  const riasecSearchTerms: Record<string, string[]> = {
    'R': ['teknik', 'bygg', 'el', 'mekanik', 'verkstad'],
    'I': ['vetenskap', 'forskning', 'analys', 'data', 'matematik'],
    'A': ['design', 'konst', 'musik', 'media', 'kreativ'],
    'S': ['vård', 'socialt arbete', 'lärare', 'pedagog', 'omsorg'],
    'E': ['ledarskap', 'försäljning', 'entreprenör', 'affär', 'management'],
    'C': ['administration', 'ekonomi', 'redovisning', 'kontor', 'organisation'],
  };

  // Ta de två första bokstäverna i RIASEC-koden
  const primaryCode = riasecCode.charAt(0).toUpperCase();
  const secondaryCode = riasecCode.charAt(1)?.toUpperCase();

  const searchTerms = [
    ...(riasecSearchTerms[primaryCode] || []),
    ...(riasecSearchTerms[secondaryCode] || []),
  ];

  if (searchTerms.length === 0) {
    return [];
  }

  // Sök med de två första termerna
  const searchPromises = searchTerms.slice(0, 2).map(term =>
    searchEducations({ query: term, limit: 5 })
  );

  try {
    const results = await Promise.all(searchPromises);

    const educationMap = new Map<string, Education>();
    results.forEach(result => {
      result.educations.forEach(edu => {
        if (!educationMap.has(edu.id)) {
          educationMap.set(edu.id, edu);
        }
      });
    });

    return Array.from(educationMap.values()).slice(0, 8);
  } catch (error) {
    console.error('Fel vid hämtning av utbildningar för RIASEC:', error);
    return [];
  }
}

/**
 * Populära sökningar (snabbval)
 */
export const POPULAR_SEARCHES = [
  { query: 'webbutvecklare', label: 'Webbutveckling', type: 'yrkeshogskola' as EducationType },
  { query: 'sjuksköterska', label: 'Vård & Omsorg', type: 'hogskola' as EducationType },
  { query: 'ekonomi redovisning', label: 'Ekonomi', type: 'all' as EducationType },
  { query: 'design ux', label: 'Design & UX', type: 'yrkeshogskola' as EducationType },
  { query: 'projektledare', label: 'Projektledning', type: 'all' as EducationType },
  { query: 'data scientist ai', label: 'AI & Data', type: 'yrkeshogskola' as EducationType },
];

// ============== EXPORT ==============

export const educationApi = {
  search: searchEducations,
  getById: getEducation,
  getTypes: getEducationTypes,
  getRegions,
  matchByJobTitle: matchEducationsByJobTitle,
  getForSkillGaps: getEducationsForSkillGaps,
  getForRIASEC: getEducationsForRIASEC,
};

export default educationApi;
