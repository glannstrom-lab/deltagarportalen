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

// Kommunkoder för Sverige (vanligaste kommunerna)
const MUNICIPALITY_CODES: Record<string, string> = {
  // Stora städer
  'stockholm': '0180',
  'göteborg': '1480',
  'goteborg': '1480',
  'malmö': 'malmo',
  'malmo': '1280',
  'uppsala': '0380',
  'linköping': '0580',
  'linkoping': '0580',
  'västerås': '1980',
  'vasteras': '1980',
  'örebro': '1880',
  'orebro': '1880',
  'helsingborg': '1283',
  'norrköping': '0581',
  'norrkoping': '0581',
  'jönköping': '0680',
  'jonkoping': '0680',
  'umeå': '2480',
  'umea': '2480',
  'lund': '1281',
  'borås': '1490',
  'boras': '1490',
  'sundsvall': '2281',
  'gävle': '2180',
  'gavle': '2180',
  'eskilstuna': '0480',
  'karlstad': '1780',
  'växjö': '0780',
  'vaxjo': '0780',
  'halmstad': '1380',
  'östersund': '2380',
  'ostersund': '2380',
  'trollhättan': '1488',
  'trollhattan': '1488',
  'luleå': '2580',
  'lulea': '2580',
  'kalmar': '0880',
  'falun': '2080',
  'karlskrona': '1080',
  'kristianstad': '1290',
  'skellefteå': '2482',
  'skelleftea': '2482',
  'uddevalla': '1485',
  'nyköping': '0480',
  'nykoping': '0480',
  'mölndal': '1481',
  'molndal': '1481',
  // Stockholmområdet
  'södertälje': '0181',
  'sodertalje': '0181',
  'täby': '0160',
  'taby': '0160',
  'upplands väsby': '0114',
  'upplands vasby': '0114',
  'lidingö': '0186',
  'lidingo': '0186',
  'värmdö': '0120',
  'varmdo': '0120',
  'nacka': '0182',
  'sollentuna': '0163',
  'solna': '0184',
  'sundbyberg': '0183',
  'danderyd': '0162',
  'tyresö': '0138',
  'tyreso': '0138',
  'haninge': '0136',
  'botkyrka': '0127',
  'huddinge': '0126',
  'salems kommun': '0128',
  'salem': '0128',
  'ekero': '0125',
  'ekerö': '0125',
  // Göteborgsområdet
  'kungsbacka': '1384',
  'kungälv': '1482',
  'kungalv': '1482',
  'lerum': '1441',
  'partille': '1402',
  'öckerö': '1407',
  'ockerö': '1407',
  'stenungsund': '1415',
  'tjörn': '1419',
  'tjorn': '1419',
  // Malmöområdet
  'landskrona': '1282',
  'helsingborg': '1283',
  'lund': '1281',
  'staffanstorp': '1230',
  'lomma': '1262',
  'burlöv': '1231',
  'burlov': '1231',
  'vellinge': '1233',
  'trelleborg': '1287',
  'ystad': '1286',
  'eslöv': '1285',
  'eslov': '1285',
  'kävlinge': '1261',
  'kavlinge': '1261',
  // Övriga
  'örnsköldsvik': '2284',
  'ornskoldsvik': '2284',
  'kiruna': '2581',
  'piteå': '2581',
  'pitea': '2581',
  'sandviken': '2181',
  'tierp': '0360',
  'enköping': '0381',
  'enkoping': '0381',
  'knivsta': '0330',
  'alvkarleby': '0319',
  'älvkarleby': '0319',
  'habo': '0643',
  'mullsjö': '0642',
  'mullsjo': '0642',
  'borgholm': '0885',
  'mörbylånga': '0840',
  'morbylanga': '0840',
};

// Län-koder (regioner)
const REGION_CODES: Record<string, string> = {
  'stockholms län': 'SE110',
  'uppsala län': 'SE121',
  'södermanlands län': 'SE122',
  'sodermanlands lan': 'SE122',
  'östergötlands län': 'SE123',
  'ostergotlands lan': 'SE123',
  'jönköpings län': 'SE211',
  'jonkopings lan': 'SE211',
  'kronobergs län': 'SE212',
  'kalmar län': 'SE213',
  'gotlands län': 'SE214',
  'blekinge län': 'SE221',
  'skåne län': 'SE224',
  'skane lan': 'SE224',
  'hallands län': 'SE231',
  'västra götalands län': 'SE232',
  'vastra gotalands lan': 'SE232',
  'värmlands län': 'SE311',
  'varmlands lan': 'SE311',
  'örebro län': 'SE124',
  'orebro lan': 'SE124',
  'västmanlands län': 'SE125',
  'vastmanlands lan': 'SE125',
  'dalarnas län': 'SE312',
  'dalarnas lan': 'SE312',
  'gävleborgs län': 'SE313',
  'gavleborgs lan': 'SE313',
  'västernorrlands län': 'SE321',
  'vasternorrlands lan': 'SE321',
  'jämtlands län': 'SE322',
  'jamtlands lan': 'SE322',
  'västerbottens län': 'SE331',
  'vasterbottens lan': 'SE331',
  'norrbottens län': 'SE332',
  'norrbottens lan': 'SE332',
};

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

// Hjälpfunktion för att normalisera strängar
function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

// Slå upp kommunkod från ortnamn
export function getMunicipalityCode(location: string): string | null {
  const normalized = normalizeString(location);
  
  // Exakt match
  if (MUNICIPALITY_CODES[normalized]) {
    return MUNICIPALITY_CODES[normalized];
  }
  
  // Delmatch - kolla om orten innehåller någon av våra kommuner
  for (const [name, code] of Object.entries(MUNICIPALITY_CODES)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return code;
    }
  }
  
  return null;
}

// Slå upp länskod
export function getRegionCode(region: string): string | null {
  const normalized = normalizeString(region);
  
  if (REGION_CODES[normalized]) {
    return REGION_CODES[normalized];
  }
  
  // Prova utan "län"
  const withoutLan = normalized.replace(/\s*l[aä]n\s*$/, '');
  const withLan = `${withoutLan} län`;
  
  if (REGION_CODES[withLan]) {
    return REGION_CODES[withLan];
  }
  
  return null;
}

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
    
    // Huvudsökning
    if (params.q) searchParams.set('q', params.q);
    
    // Kommun - konvertera namn till kod
    if (params.municipality) {
      const code = getMunicipalityCode(params.municipality);
      if (code) {
        console.log('[AF API] Kommun:', params.municipality, '-> kod:', code);
        searchParams.set('municipality', code);
      } else {
        // Om vi inte hittar koden, lägg till i fritextsökningen
        console.log('[AF API] Kommun-kod ej hittad för:', params.municipality);
      }
    }
    
    // Län/region
    if (params.region) {
      const code = getRegionCode(params.region);
      if (code) {
        console.log('[AF API] Region:', params.region, '-> kod:', code);
        searchParams.set('region', code);
      }
    }
    
    // Anställningstyp
    if (params.employment_type) {
      searchParams.set('employment-type', params.employment_type);
    }
    
    // Publiceringsdatum
    if (params.published_after) {
      searchParams.set('published-after', params.published_after);
    }
    
    // Paginering
    searchParams.set('limit', String(params.limit || 20));
    searchParams.set('offset', String(params.offset || 0));

    const url = `${AF_JOBSEARCH_BASE}/search?${searchParams.toString()}`;
    console.log('[AF API] URL:', url);
    
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

// Hämta alla kommuner (för autocomplete)
export async function getMunicipalities(): Promise<Array<{id: string, name: string}>> {
  try {
    const url = `${AF_JOBSEARCH_BASE}/taxonomy/concepts?type=municipality`;
    const data = await fetchWithCache(url);
    return (data.concepts || []).map((c: any) => ({ id: c.id, name: c.name }));
  } catch (error) {
    console.error('[AF API] Get municipalities error:', error);
    // Fallback till vår lista
    return Object.entries(MUNICIPALITY_CODES).map(([name, id]) => ({ id, name }));
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
  getMunicipalities,
  getMarketStats: getMarketInsights,
};

export default {
  searchPlatsbanken,
  searchJobs,
  getJobDetails,
  getAutocomplete,
  getMunicipalities,
  analyzeSkillGap,
  getMarketInsights,
  POPULAR_QUERIES,
  afApi,
};
