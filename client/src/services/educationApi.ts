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

/**
 * Formen som `education-search`-edgen faktiskt svarar med, mätt mot prod
 * 2026-08-22. Tre fält har tagits bort ur typen eftersom de ALDRIG kom:
 * `durationMonths`, `applicationDeadline` och `sunCode` var hårdkodade
 * `undefined` i edge-funktionen. Kortet ritade ändå en hel gren för
 * "Sista ansökningsdag" — den kunde bara nås av mockdatan, där datumet var
 * påhittat. Ett fält som bara mockdata kan fylla är sämre än inget fält.
 */
export interface Education {
  id: string;
  title: string;
  provider: string;
  providerUrl?: string;
  type: EducationType | string;
  /** Läsbar form ("Yrkeshögskola"), aldrig JobEds råkod ("yh", "vuxgy"). */
  typeLabel: string;
  form?: string;
  formLabel?: string;
  description?: string;
  /** Studielängd i klartext ("2 år"), härledd ur start- och slutdatum. */
  duration?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  /** Alla orter utbildningen ges på. Samma kurs publiceras en gång per
   *  kommun hos JobEd; edgen slår ihop dem till ett kort. */
  locations?: string[];
  municipality?: string;
  region?: string;
  pace?: string;
  pacePercent?: number;
  distance?: boolean;
  url?: string;
  /** Poängen MED enhet ("400 YH-poäng", "180 hp", "1900 poäng"). Kortet
   *  visade tidigare talet två gånger, som "YH-poäng" och som "hp", oavsett
   *  skolform — 1900 gymnasiepoäng lästes som 1900 högskolepoäng. */
  creditsLabel?: string;
  level?: string;
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
  /** `'error'` betyder att anropet föll — INTE att det saknas utbildningar.
   *  Den som ritar listan måste skilja på de två, annars ser ett nätverksfel
   *  ut som ett besked om att inget finns. */
  source: string;
  /** Antal kurstillfällen som slogs ihop bort ur sidan (dubbletter). */
  merged?: number;
  /** Yrket JobEd tolkade fritexten som. */
  matchedOccupation?: string;
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
  options?: { method?: string; body?: unknown }
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

    // Cacha inte ett misslyckat anrop — då blir ett tillfälligt avbrott ett
    // fem minuter långt "det finns inga utbildningar". Samma skäl som i
    // matchEducationsByJobTitle nedan.
    if (result.source !== 'error') {
      defaultCache.set(cacheKey, result, 5 * 60 * 1000);
    }

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
/**
 * Bara poster där BÅDE id och label är strängar släpps vidare.
 *
 * Utan den här vakten kraschade hela utbildningssidan i drift: edgen skickade
 * JobEds `{key, value}`-objekt som `label`, `<option>` fick ett objekt som
 * barn och React kastade #31 så fort någon klickade på "Filter". Edgen är
 * lagad, men en formändring uppströms ska ge en kortare lista — inte en
 * vit sida. Faller allt bort används fallback-listan nedan.
 */
function baraStrangval<T extends { id?: unknown; label?: unknown }>(
  poster: T[] | undefined
): Array<T & { id: string; label: string }> {
  if (!Array.isArray(poster)) return [];
  return poster.filter(
    (p): p is T & { id: string; label: string } =>
      typeof p?.id === 'string' && typeof p?.label === 'string' && p.label.length > 0
  );
}

export async function getEducationTypes(): Promise<EducationTypeOption[]> {
  const cacheKey = 'edu_types';
  const cached = defaultCache.get<EducationTypeOption[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = await fetchFromEducationApi<{ types: EducationTypeOption[] }>('/types');
    const rensade = baraStrangval(result.types);
    if (!rensade.length) throw new Error('Education API: /types gav inga giltiga val');
    defaultCache.set(cacheKey, rensade, 60 * 60 * 1000); // 1h cache
    return rensade;
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
    const rensade = baraStrangval(result.regions);
    if (!rensade.length) throw new Error('Education API: /regions gav inga giltiga val');
    defaultCache.set(cacheKey, rensade, 60 * 60 * 1000);
    return rensade;
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

    // Cacha inte ett misslyckat anrop i 30 minuter — då blir ett tillfälligt
    // avbrott ett halvtimmeslångt "det finns inga utbildningar".
    if (result.source !== 'error') {
      defaultCache.set(cacheKey, result, 30 * 60 * 1000);
    }
    return result;
  } catch (error) {
    console.error('Fel vid matchning av utbildningar:', error);
    return { educations: [], total: 0, hasMore: false, source: 'error' };
  }
}

/*
 * `getEducationsForSkillGaps` och `getEducationsForRIASEC` låg här till
 * 2026-08-22 (~90 rader) med noll anropare i hela repot. Kompetensanalysen och
 * intresseguiden använder `matchByJobTitle`, inte de här. Två döda exporter i
 * en levande fil ser ut som en API-yta någon förlitar sig på.
 */

// ============== EXPORT ==============

export const educationApi = {
  search: searchEducations,
  getById: getEducation,
  getTypes: getEducationTypes,
  getRegions,
  matchByJobTitle: matchEducationsByJobTitle,
};

export default educationApi;
