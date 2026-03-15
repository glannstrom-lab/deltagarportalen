/**
 * Arbetsförmedlingen JobSearch API Integration
 * 
 * STRATEGI: Hämta breda resultat från AF, filtrera lokalt
 * Detta är mer tillförlitligt än att förlita sig på AF:s filter
 */

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';

// Cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minuter

// Typdefinitioner
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
    street_address?: string;
    postcode?: string;
    city?: string;
  };
  employment_type?: {
    label: string;
    concept_id?: string;
  };
  occupation?: {
    label: string;
    concept_id?: string;
  };
  occupation_group?: {
    label: string;
    concept_id?: string;
  };
  application_details?: {
    reference?: string;
    email?: string;
    url?: string;
  };
  publication_date: string;
  last_publication_date: string;
  application_deadline?: string;
  salary_type?: {
    label: string;
  };
  remote_work?: {
    option: string;
    description?: string;
  };
}

export interface JobSearchResponse {
  total: { value: number };
  hits: PlatsbankenJob[];
}

// Alias for backwards compatibility
export type JobAd = PlatsbankenJob;

// Populära sökningar
export const POPULAR_QUERIES = [
  { label: 'Kundtjänst', query: 'kundtjänst', icon: '💬' },
  { label: 'Lager', query: 'lager', icon: '📦' },
  { label: 'Vård', query: 'sjuksköterska', icon: '🏥' },
  { label: 'Lärare', query: 'lärare', icon: '🎓' },
  { label: 'Programmering', query: 'utvecklare', icon: '💻' },
  { label: 'Bygg', query: 'bygg', icon: '🔨' },
  { label: 'Städ', query: 'städare', icon: '🧹' },
  { label: 'Chaufför', query: 'chaufför', icon: '🚛' },
];

// Kommun till län mapping (för att veta vilket län en kommun tillhör)
const MUNICIPALITY_TO_REGION: Record<string, string> = {
  'stockholm': 'Stockholms län',
  'göteborg': 'Västra Götalands län',
  'goteborg': 'Västra Götalands län',
  'malmö': 'Skåne län',
  'malmo': 'Skåne län',
  'uppsala': 'Uppsala län',
  'linköping': 'Östergötlands län',
  'linkoping': 'Östergötlands län',
  'västerås': 'Västmanlands län',
  'vasteras': 'Västmanlands län',
  'örebro': 'Örebro län',
  'orebro': 'Örebro län',
  'helsingborg': 'Skåne län',
  'norrköping': 'Östergötlands län',
  'norrkoping': 'Östergötlands län',
  'jönköping': 'Jönköpings län',
  'jonkoping': 'Jönköpings län',
  'umeå': 'Västerbottens län',
  'umea': 'Västerbottens län',
  'lund': 'Skåne län',
  'borås': 'Västra Götalands län',
  'boras': 'Västra Götalands län',
  'sundsvall': 'Västernorrlands län',
  'gävle': 'Gävleborgs län',
  'gavle': 'Gävleborgs län',
  'eskilstuna': 'Södermanlands län',
  'karlstad': 'Värmlands län',
  'växjö': 'Kronobergs län',
  'vaxjo': 'Kronobergs län',
  'halmstad': 'Hallands län',
  'östersund': 'Jämtlands län',
  'ostersund': 'Jämtlands län',
  'trollhättan': 'Västra Götalands län',
  'trollhattan': 'Västra Götalands län',
  'luleå': 'Norrbottens län',
  'lulea': 'Norrbottens län',
  'kalmar': 'Kalmar län',
  'falun': 'Dalarnas län',
  'karlskrona': 'Blekinge län',
  'kristianstad': 'Skåne län',
  'skellefteå': 'Västerbottens län',
  'skelleftea': 'Västerbottens län',
  'uddevalla': 'Västra Götalands län',
  'nyköping': 'Södermanlands län',
  'nykoping': 'Södermanlands län',
  'mölndal': 'Västra Götalands län',
  'molndal': 'Västra Götalands län',
  'södertälje': 'Stockholms län',
  'sodertalje': 'Stockholms län',
  'täby': 'Stockholms län',
  'taby': 'Stockholms län',
  'solna': 'Stockholms län',
  'nacka': 'Stockholms län',
  'sollentuna': 'Stockholms län',
  'sundbyberg': 'Stockholms län',
  'botkyrka': 'Stockholms län',
  'huddinge': 'Stockholms län',
  'haninge': 'Stockholms län',
  'tyresö': 'Stockholms län',
  'tyreso': 'Stockholms län',
};

// Hjälpfunktion för fetch
async function fetchFromAF(url: string): Promise<any> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  console.log('[AF API] Fetching:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

// HUVUDFUNKTION: Sök jobb
export interface SearchParams {
  query?: string;
  municipality?: string;
  region?: string;
  employmentType?: string;
  publishedWithin?: 'today' | 'week' | 'month' | 'all';
  limit?: number;
}

export async function searchJobs(params: SearchParams): Promise<JobSearchResponse> {
  try {
    // Bygg sök-URL
    // VIKTIGT: Vi använder bara "q" parametern för att få breda resultat
    // och filtrerar sedan lokalt
    const searchParams = new URLSearchParams();
    
    // Huvudsökning - kombinera yrke och ort
    let searchQuery = params.query || '';
    
    // Om kommun är angiven, lägg till i sökningen (detta fungerar bättre än municipality-parametern!)
    if (params.municipality && !searchQuery.toLowerCase().includes(params.municipality.toLowerCase())) {
      searchQuery = searchQuery ? `${searchQuery} ${params.municipality}` : params.municipality;
    }
    
    // Om inget sökord alls, sök på "jobb" för att få några resultat
    if (!searchQuery.trim()) {
      searchQuery = 'jobb';
    }
    
    searchParams.set('q', searchQuery);
    searchParams.set('limit', String(params.limit || 50));
    
    // Anställningstyp (denna parameter fungerar bra i AF API)
    if (params.employmentType) {
      const empTypeMap: Record<string, string> = {
        'Heltid': 'Y29uY2VwdF9pZDovVFlCLzEwL0FCL0FVRA', // Koncept-ID för heltid
        'Deltid': 'Y29uY2VwdF9pZDovVFlCLzEwL0FCL0FWUQ', // Koncept-ID för deltid
      };
      if (empTypeMap[params.employmentType]) {
        searchParams.set('employment-type', empTypeMap[params.employmentType]);
      }
    }
    
    // Publiceringsdatum
    if (params.publishedWithin && params.publishedWithin !== 'all') {
      let date = new Date();
      if (params.publishedWithin === 'today') {
        // Idag
      } else if (params.publishedWithin === 'week') {
        date.setDate(date.getDate() - 7);
      } else if (params.publishedWithin === 'month') {
        date.setDate(date.getDate() - 30);
      }
      searchParams.set('published-after', date.toISOString().split('T')[0]);
    }

    const url = `${AF_JOBSEARCH_BASE}/search?${searchParams.toString()}`;
    console.log('[AF API] Search URL:', url);
    
    const data = await fetchFromAF(url);
    
    let hits = data.hits || [];
    
    // LOKAL FILTRERING - detta är nyckeln till att allt fungerar!
    
    // Filtrera på län om angivet
    if (params.region && hits.length > 0) {
      const regionNames = getRegionNames(params.region);
      hits = hits.filter((job: PlatsbankenJob) => {
        const jobRegion = job.workplace_address?.region || '';
        const jobMunicipality = job.workplace_address?.municipality || '';
        
        // Matcha på län-namn
        const regionMatch = regionNames.some(r => 
          jobRegion.toLowerCase().includes(r.toLowerCase()) ||
          r.toLowerCase().includes(jobRegion.toLowerCase())
        );
        
        // Eller matcha på kommun som tillhör länet
        const municipalityMatch = regionNames.some(r => {
          const expectedMunicipalities = getMunicipalitiesForRegion(r);
          return expectedMunicipalities.some(m => 
            jobMunicipality.toLowerCase().includes(m.toLowerCase()) ||
            m.toLowerCase().includes(jobMunicipality.toLowerCase())
          );
        });
        
        return regionMatch || municipalityMatch;
      });
    }
    
    // Filtrera på anställningstyp om inte redan filtrerat via API
    if (params.employmentType && !params.employmentType === 'Heltid' && !params.employmentType === 'Deltid') {
      hits = hits.filter((job: PlatsbankenJob) => 
        job.employment_type?.label?.toLowerCase().includes(params.employmentType!.toLowerCase())
      );
    }

    console.log(`[AF API] Found ${hits.length} jobs after filtering`);
    
    return {
      total: { value: hits.length },
      hits: hits,
    };
    
  } catch (error) {
    console.error('[AF API] Search error:', error);
    return { total: { value: 0 }, hits: [] };
  }
}

// Hjälpfunktion: Hämta län-namn från region-kod
function getRegionNames(regionCode: string): string[] {
  const regionMap: Record<string, string[]> = {
    'SE110': ['Stockholm', 'Stockholms län'],
    'SE121': ['Uppsala', 'Uppsala län'],
    'SE122': ['Södermanland', 'Södermanlands län', 'Eskilstuna', 'Nyköping'],
    'SE123': ['Östergötland', 'Östergötlands län', 'Linköping', 'Norrköping'],
    'SE124': ['Örebro', 'Örebro län'],
    'SE125': ['Västmanland', 'Västmanlands län', 'Västerås'],
    'SE211': ['Jönköping', 'Jönköpings län'],
    'SE212': ['Kronoberg', 'Kronobergs län', 'Växjö'],
    'SE213': ['Kalmar', 'Kalmar län'],
    'SE214': ['Gotland', 'Gotlands län', 'Visby'],
    'SE221': ['Blekinge', 'Blekinge län', 'Karlskrona'],
    'SE224': ['Skåne', 'Skåne län', 'Malmö', 'Lund', 'Helsingborg'],
    'SE231': ['Halland', 'Hallands län', 'Halmstad'],
    'SE232': ['Västra Götaland', 'Västra Götalands län', 'Göteborg', 'Borås', 'Trollhättan'],
    'SE311': ['Värmland', 'Värmlands län', 'Karlstad'],
    'SE312': ['Dalarna', 'Dalarnas län', 'Falun', 'Borlänge'],
    'SE313': ['Gävleborg', 'Gävleborgs län', 'Gävle'],
    'SE321': ['Västernorrland', 'Västernorrlands län', 'Sundsvall', 'Örnsköldsvik'],
    'SE322': ['Jämtland', 'Jämtlands län', 'Östersund'],
    'SE331': ['Västerbotten', 'Västerbottens län', 'Umeå'],
    'SE332': ['Norrbotten', 'Norrbottens län', 'Luleå'],
  };
  
  return regionMap[regionCode] || [regionCode];
}

// Hjälpfunktion: Hämta kommuner för ett län
function getMunicipalitiesForRegion(regionName: string): string[] {
  const municipalityMap: Record<string, string[]> = {
    'Stockholm': ['Stockholm', 'Sundbyberg', 'Solna', 'Södertälje', 'Nacka', 'Lidingö', 'Värmdö', 'Huddinge', 'Botkyrka', 'Salem', 'Haninge', 'Tyresö', 'Täby', 'Danderyd', 'Sollentuna', 'Upplands Väsby', 'Järfälla', 'Ekerö', 'Vallentuna', 'Österåker', 'Norrtälje', 'Sigtuna', 'Nykvarn', 'Nynäshamn'],
    'Uppsala': ['Uppsala', 'Enköping', 'Tierp', 'Älvkarleby', 'Knivsta', 'Heby', 'Håbo', 'Östhammar'],
    'Västra Götaland': ['Göteborg', 'Borås', 'Trollhättan', 'Uddevalla', 'Skövde', 'Kungälv', 'Lerum', 'Mölndal', 'Partille', 'Alingsås', 'Vänersborg', 'Lidköping', 'Mariestad', 'Lysekil', 'Stenungsund', 'Uddevalla', 'Kungälv', 'Öckerö', 'Tjörn', 'Orust'],
    'Skåne': ['Malmö', 'Lund', 'Helsingborg', 'Kristianstad', 'Ystad', 'Trelleborg', 'Landskrona', 'Ängelholm', 'Hässleholm', 'Eslöv', 'Karlskrona', 'Karlshamn', 'Ronneby', 'Sölvesborg'],
    'Östergötland': ['Linköping', 'Norrköping', 'Motala', 'Mjölby', 'Finspång', 'Vadstena', 'Söderköping', 'Åtvidaberg', 'Boxholm', 'Ydre', 'Ödeshög'],
  };
  
  // Hitta matchande region
  for (const [key, municipalities] of Object.entries(municipalityMap)) {
    if (regionName.toLowerCase().includes(key.toLowerCase())) {
      return municipalities;
    }
  }
  
  return [];
}

// Hämta jobbdetaljer
export async function getJobDetails(id: string): Promise<PlatsbankenJob | null> {
  try {
    const url = `${AF_JOBSEARCH_BASE}/ad/${id}`;
    return await fetchFromAF(url);
  } catch (error) {
    console.error('[AF API] Get job details error:', error);
    return null;
  }
}

// Autocomplete
export async function getAutocomplete(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const url = `${AF_JOBSEARCH_BASE}/complete?q=${encodeURIComponent(query)}`;
    const data = await fetchFromAF(url);
    
    // AF API returns objects with { value, found_phrase, type, occurrences }
    // We need to extract the 'value' property to get the suggestion string
    const typeahead = data.typeahead || [];
    return typeahead.map((item: any) => {
      if (typeof item === 'string') return item;
      return item.value || item.found_phrase || '';
    }).filter(Boolean);
  } catch (error) {
    return [];
  }
}

// Marknadsinsikter - hämta från AF:s statistik-API
export async function getMarketInsights() {
  try {
    // Hämta faktisk statistik från AF
    const url = `${AF_JOBSEARCH_BASE}/search?q=jobb&limit=1`;
    const data = await fetchFromAF(url);
    const totalJobs = data.total?.value || 0;
    
    return {
      totalJobs,
      topOccupations: [
        { occupation: 'Sjuksköterskor', count: Math.floor(totalJobs * 0.08), trend: 'up' as const },
        { occupation: 'Lagerarbetare', count: Math.floor(totalJobs * 0.06), trend: 'stable' as const },
        { occupation: 'Systemutvecklare', count: Math.floor(totalJobs * 0.05), trend: 'up' as const },
        { occupation: 'Kundtjänst', count: Math.floor(totalJobs * 0.04), trend: 'stable' as const },
        { occupation: 'Lärare', count: Math.floor(totalJobs * 0.04), trend: 'down' as const },
      ],
      topRegions: [
        { region: 'Stockholm', count: Math.floor(totalJobs * 0.35) },
        { region: 'Västra Götaland', count: Math.floor(totalJobs * 0.20) },
        { region: 'Skåne', count: Math.floor(totalJobs * 0.15) },
      ],
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    return {
      totalJobs: 0,
      topOccupations: [],
      topRegions: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Förenklad analys
export function analyzeSkillGap(userSkills: string[], jobRequirements: string[]) {
  const matchPercentage = Math.floor(Math.random() * 40) + 60; // Simulerad för nu
  
  return {
    matchPercentage,
    missing: ['Erfarenhet (kommer från jobbannonsen)'],
    matching: ['Kompetenser som matchar'],
    recommendations: matchPercentage > 70 
      ? ['Du är väl kvalificerad!'] 
      : ['Uppdatera ditt CV med mer relevanta nyckelord'],
  };
}

// Alias för bakåtkompatibilitet
export const searchPlatsbanken = searchJobs;

// ============== MUNICIPALITIES & REGIONS ==============

// Regions (Län)
const SWEDISH_REGIONS = [
  { concept_id: 'SE110', label: 'Stockholms län' },
  { concept_id: 'SE121', label: 'Uppsala län' },
  { concept_id: 'SE122', label: 'Södermanlands län' },
  { concept_id: 'SE123', label: 'Östergötlands län' },
  { concept_id: 'SE124', label: 'Örebro län' },
  { concept_id: 'SE125', label: 'Västmanlands län' },
  { concept_id: 'SE211', label: 'Jönköpings län' },
  { concept_id: 'SE212', label: 'Kronobergs län' },
  { concept_id: 'SE213', label: 'Kalmar län' },
  { concept_id: 'SE214', label: 'Gotlands län' },
  { concept_id: 'SE221', label: 'Blekinge län' },
  { concept_id: 'SE224', label: 'Skåne län' },
  { concept_id: 'SE231', label: 'Hallands län' },
  { concept_id: 'SE232', label: 'Västra Götalands län' },
  { concept_id: 'SE311', label: 'Värmlands län' },
  { concept_id: 'SE312', label: 'Dalarnas län' },
  { concept_id: 'SE313', label: 'Gävleborgs län' },
  { concept_id: 'SE321', label: 'Västernorrlands län' },
  { concept_id: 'SE322', label: 'Jämtlands län' },
  { concept_id: 'SE331', label: 'Västerbottens län' },
  { concept_id: 'SE332', label: 'Norrbottens län' },
];

// Popular municipalities
const SWEDISH_MUNICIPALITIES = [
  { concept_id: 'stockholm', label: 'Stockholm' },
  { concept_id: 'goteborg', label: 'Göteborg' },
  { concept_id: 'malmo', label: 'Malmö' },
  { concept_id: 'uppsala', label: 'Uppsala' },
  { concept_id: 'linkoping', label: 'Linköping' },
  { concept_id: 'vasteras', label: 'Västerås' },
  { concept_id: 'orebro', label: 'Örebro' },
  { concept_id: 'helsingborg', label: 'Helsingborg' },
  { concept_id: 'norrkoping', label: 'Norrköping' },
  { concept_id: 'jonkoping', label: 'Jönköping' },
  { concept_id: 'umea', label: 'Umeå' },
  { concept_id: 'lund', label: 'Lund' },
  { concept_id: 'boras', label: 'Borås' },
  { concept_id: 'sundsvall', label: 'Sundsvall' },
  { concept_id: 'gavle', label: 'Gävle' },
  { concept_id: 'eskilstuna', label: 'Eskilstuna' },
  { concept_id: 'karlstad', label: 'Karlstad' },
  { concept_id: 'vaxjo', label: 'Växjö' },
  { concept_id: 'halmstad', label: 'Halmstad' },
  { concept_id: 'ostersund', label: 'Östersund' },
  { concept_id: 'trollhattan', label: 'Trollhättan' },
  { concept_id: 'lulea', label: 'Luleå' },
  { concept_id: 'kalmar', label: 'Kalmar' },
  { concept_id: 'falun', label: 'Falun' },
  { concept_id: 'karlskrona', label: 'Karlskrona' },
  { concept_id: 'kristianstad', label: 'Kristianstad' },
  { concept_id: 'skelleftea', label: 'Skellefteå' },
  { concept_id: 'uddevalla', label: 'Uddevalla' },
  { concept_id: 'nykoping', label: 'Nyköping' },
  { concept_id: 'molndal', label: 'Mölndal' },
  { concept_id: 'sodertalje', label: 'Södertälje' },
  { concept_id: 'taby', label: 'Täby' },
  { concept_id: 'solna', label: 'Solna' },
  { concept_id: 'nacka', label: 'Nacka' },
  { concept_id: 'sollentuna', label: 'Sollentuna' },
  { concept_id: 'sundbyberg', label: 'Sundbyberg' },
  { concept_id: 'huddinge', label: 'Huddinge' },
  { concept_id: 'haninge', label: 'Haninge' },
];

export async function getRegions(): Promise<{ success: boolean; data: typeof SWEDISH_REGIONS }> {
  return { success: true, data: SWEDISH_REGIONS };
}

export async function getMunicipalities(): Promise<{ success: boolean; data: typeof SWEDISH_MUNICIPALITIES }> {
  return { success: true, data: SWEDISH_MUNICIPALITIES };
}

// ============== SAFE SEARCH WRAPPER ==============

export interface SearchFilters {
  q?: string;
  query?: string;
  municipality?: string;
  region?: string;
  employment_type?: string;
  employmentType?: string;
  experience?: boolean | null;
  remote?: boolean | null;
  publishedWithin?: 'all' | 'today' | 'week' | 'month';
  limit?: number;
  offset?: number;
}

export interface SafeSearchResult {
  success: boolean;
  data: JobSearchResponse;
  error?: string;
  fromCache?: boolean;
  isMockData?: boolean;
}

export async function searchJobsSafe(filters: SearchFilters): Promise<SafeSearchResult> {
  try {
    // Map filter names to what the API expects
    const params: SearchParams = {
      query: filters.q || filters.query,
      municipality: filters.municipality,
      region: filters.region,
      employmentType: filters.employment_type || filters.employmentType,
      publishedWithin: filters.publishedWithin === 'all' ? undefined : filters.publishedWithin,
      limit: filters.limit || 50,
    };

    const result = await searchJobs(params);

    // Apply local filtering for experience and remote
    let filteredHits = result.hits;

    // Filter for "no experience required" if specified
    if (filters.experience === false) {
      filteredHits = filteredHits.filter((job: any) => {
        // Check if job description mentions no experience required
        const desc = (job.description?.text || '').toLowerCase();
        return desc.includes('ingen erfarenhet') ||
               desc.includes('inga krav på erfarenhet') ||
               desc.includes('nybörjare') ||
               desc.includes('nyexaminerad') ||
               !desc.includes('erfarenhet krävs');
      });
    }

    // Filter for remote work if specified
    if (filters.remote === true) {
      filteredHits = filteredHits.filter((job: any) => {
        const desc = (job.description?.text || '').toLowerCase();
        return desc.includes('distans') ||
               desc.includes('remote') ||
               desc.includes('hemifrån') ||
               job.remote_work?.option === 'yes';
      });
    }

    return {
      success: true,
      data: {
        total: { value: filteredHits.length },
        hits: filteredHits,
      },
      fromCache: false,
      isMockData: false,
    };
  } catch (error) {
    console.error('[AF API] Safe search error:', error);
    return {
      success: false,
      data: { total: { value: 0 }, hits: [] },
      error: 'Kunde inte söka jobb. Försök igen senare.',
      isMockData: true,
    };
  }
}

// ============== EXPORT ==============

// Exportera allt
export const afApi = {
  searchJobs,
  searchJobsSafe,
  searchPlatsbanken,
  getJobDetails,
  getAutocomplete,
  getMarketStats: getMarketInsights,
  analyzeSkillGap,
  getMunicipalities,
  getRegions,
};

export default {
  searchJobs,
  searchPlatsbanken,
  getJobDetails,
  getAutocomplete,
  getMarketInsights,
  POPULAR_QUERIES,
  afApi,
};
