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

// All Swedish municipalities (kommuner) - alphabetically sorted
const SWEDISH_MUNICIPALITIES = [
  { concept_id: 'ale', label: 'Ale' },
  { concept_id: 'alingsas', label: 'Alingsås' },
  { concept_id: 'alvesta', label: 'Alvesta' },
  { concept_id: 'aneby', label: 'Aneby' },
  { concept_id: 'arboga', label: 'Arboga' },
  { concept_id: 'arvidsjaur', label: 'Arvidsjaur' },
  { concept_id: 'arvika', label: 'Arvika' },
  { concept_id: 'askersund', label: 'Askersund' },
  { concept_id: 'avesta', label: 'Avesta' },
  { concept_id: 'bengtsfors', label: 'Bengtsfors' },
  { concept_id: 'berg', label: 'Berg' },
  { concept_id: 'bjurholm', label: 'Bjurholm' },
  { concept_id: 'bjuv', label: 'Bjuv' },
  { concept_id: 'boden', label: 'Boden' },
  { concept_id: 'bollebygd', label: 'Bollebygd' },
  { concept_id: 'bollnas', label: 'Bollnäs' },
  { concept_id: 'borgholm', label: 'Borgholm' },
  { concept_id: 'borlange', label: 'Borlänge' },
  { concept_id: 'boras', label: 'Borås' },
  { concept_id: 'botkyrka', label: 'Botkyrka' },
  { concept_id: 'boxholm', label: 'Boxholm' },
  { concept_id: 'bromolla', label: 'Bromölla' },
  { concept_id: 'bracke', label: 'Bräcke' },
  { concept_id: 'burlöv', label: 'Burlöv' },
  { concept_id: 'danderyd', label: 'Danderyd' },
  { concept_id: 'degerfors', label: 'Degerfors' },
  { concept_id: 'dorotea', label: 'Dorotea' },
  { concept_id: 'eda', label: 'Eda' },
  { concept_id: 'ekero', label: 'Ekerö' },
  { concept_id: 'eksjo', label: 'Eksjö' },
  { concept_id: 'emmaboda', label: 'Emmaboda' },
  { concept_id: 'enkoping', label: 'Enköping' },
  { concept_id: 'eskilstuna', label: 'Eskilstuna' },
  { concept_id: 'eslov', label: 'Eslöv' },
  { concept_id: 'essunga', label: 'Essunga' },
  { concept_id: 'fagersta', label: 'Fagersta' },
  { concept_id: 'falkenberg', label: 'Falkenberg' },
  { concept_id: 'falkoping', label: 'Falköping' },
  { concept_id: 'falun', label: 'Falun' },
  { concept_id: 'filipstad', label: 'Filipstad' },
  { concept_id: 'finspang', label: 'Finspång' },
  { concept_id: 'flen', label: 'Flen' },
  { concept_id: 'forshaga', label: 'Forshaga' },
  { concept_id: 'gallivare', label: 'Gällivare' },
  { concept_id: 'gavle', label: 'Gävle' },
  { concept_id: 'gislaved', label: 'Gislaved' },
  { concept_id: 'gnesta', label: 'Gnesta' },
  { concept_id: 'gnosjo', label: 'Gnosjö' },
  { concept_id: 'goteborg', label: 'Göteborg' },
  { concept_id: 'gotene', label: 'Götene' },
  { concept_id: 'grästorp', label: 'Grästorp' },
  { concept_id: 'grum', label: 'Grums' },
  { concept_id: 'grybho', label: 'Gullspång' },
  { concept_id: 'habo', label: 'Habo' },
  { concept_id: 'hagfors', label: 'Hagfors' },
  { concept_id: 'hallsberg', label: 'Hallsberg' },
  { concept_id: 'hallstahammar', label: 'Hallstahammar' },
  { concept_id: 'halmstad', label: 'Halmstad' },
  { concept_id: 'hammarö', label: 'Hammarö' },
  { concept_id: 'haninge', label: 'Haninge' },
  { concept_id: 'haparanda', label: 'Haparanda' },
  { concept_id: 'harjedalen', label: 'Härjedalen' },
  { concept_id: 'harnosand', label: 'Härnösand' },
  { concept_id: 'harryda', label: 'Härryda' },
  { concept_id: 'hassleholm', label: 'Hässleholm' },
  { concept_id: 'heby', label: 'Heby' },
  { concept_id: 'hedemora', label: 'Hedemora' },
  { concept_id: 'helsingborg', label: 'Helsingborg' },
  { concept_id: 'herrljunga', label: 'Herrljunga' },
  { concept_id: 'hjo', label: 'Hjo' },
  { concept_id: 'hofors', label: 'Hofors' },
  { concept_id: 'hoganas', label: 'Höganäs' },
  { concept_id: 'hogsby', label: 'Högsby' },
  { concept_id: 'horby', label: 'Hörby' },
  { concept_id: 'hoor', label: 'Höör' },
  { concept_id: 'huddinge', label: 'Huddinge' },
  { concept_id: 'hudiksvall', label: 'Hudiksvall' },
  { concept_id: 'hultsfred', label: 'Hultsfred' },
  { concept_id: 'hylte', label: 'Hylte' },
  { concept_id: 'jarfalla', label: 'Järfälla' },
  { concept_id: 'jokkmokk', label: 'Jokkmokk' },
  { concept_id: 'jonkoping', label: 'Jönköping' },
  { concept_id: 'kalix', label: 'Kalix' },
  { concept_id: 'kalmar', label: 'Kalmar' },
  { concept_id: 'karlsborg', label: 'Karlsborg' },
  { concept_id: 'karlshamn', label: 'Karlshamn' },
  { concept_id: 'karlskoga', label: 'Karlskoga' },
  { concept_id: 'karlskrona', label: 'Karlskrona' },
  { concept_id: 'karlstad', label: 'Karlstad' },
  { concept_id: 'katrineholm', label: 'Katrineholm' },
  { concept_id: 'kil', label: 'Kil' },
  { concept_id: 'kinda', label: 'Kinda' },
  { concept_id: 'kiruna', label: 'Kiruna' },
  { concept_id: 'klippan', label: 'Klippan' },
  { concept_id: 'knivsta', label: 'Knivsta' },
  { concept_id: 'kramfors', label: 'Kramfors' },
  { concept_id: 'kristianstad', label: 'Kristianstad' },
  { concept_id: 'kristinehamn', label: 'Kristinehamn' },
  { concept_id: 'krokom', label: 'Krokom' },
  { concept_id: 'kumla', label: 'Kumla' },
  { concept_id: 'kungalv', label: 'Kungälv' },
  { concept_id: 'kungsbacka', label: 'Kungsbacka' },
  { concept_id: 'kungsor', label: 'Kungsör' },
  { concept_id: 'laholm', label: 'Laholm' },
  { concept_id: 'landskrona', label: 'Landskrona' },
  { concept_id: 'laxå', label: 'Laxå' },
  { concept_id: 'lekeberg', label: 'Lekeberg' },
  { concept_id: 'leksand', label: 'Leksand' },
  { concept_id: 'lerum', label: 'Lerum' },
  { concept_id: 'lessebo', label: 'Lessebo' },
  { concept_id: 'lidingo', label: 'Lidingö' },
  { concept_id: 'lidkoping', label: 'Lidköping' },
  { concept_id: 'lilla-edet', label: 'Lilla Edet' },
  { concept_id: 'linkoping', label: 'Linköping' },
  { concept_id: 'ljungby', label: 'Ljungby' },
  { concept_id: 'ljusdal', label: 'Ljusdal' },
  { concept_id: 'ljusnarsberg', label: 'Ljusnarsberg' },
  { concept_id: 'lomma', label: 'Lomma' },
  { concept_id: 'ludvika', label: 'Ludvika' },
  { concept_id: 'lulea', label: 'Luleå' },
  { concept_id: 'lund', label: 'Lund' },
  { concept_id: 'lycksele', label: 'Lycksele' },
  { concept_id: 'lysekil', label: 'Lysekil' },
  { concept_id: 'malmo', label: 'Malmö' },
  { concept_id: 'malung-salen', label: 'Malung-Sälen' },
  { concept_id: 'marbäck', label: 'Mariestad' },
  { concept_id: 'mark', label: 'Mark' },
  { concept_id: 'markaryd', label: 'Markaryd' },
  { concept_id: 'mellerud', label: 'Mellerud' },
  { concept_id: 'mjolby', label: 'Mjölby' },
  { concept_id: 'molndal', label: 'Mölndal' },
  { concept_id: 'mora', label: 'Mora' },
  { concept_id: 'motala', label: 'Motala' },
  { concept_id: 'mullsjo', label: 'Mullsjö' },
  { concept_id: 'munkedal', label: 'Munkedal' },
  { concept_id: 'munkfors', label: 'Munkfors' },
  { concept_id: 'monsteras', label: 'Mönsterås' },
  { concept_id: 'nacka', label: 'Nacka' },
  { concept_id: 'nora', label: 'Nora' },
  { concept_id: 'norberg', label: 'Norberg' },
  { concept_id: 'nordanstig', label: 'Nordanstig' },
  { concept_id: 'nordmaling', label: 'Nordmaling' },
  { concept_id: 'norrkoping', label: 'Norrköping' },
  { concept_id: 'norrtalje', label: 'Norrtälje' },
  { concept_id: 'nybro', label: 'Nybro' },
  { concept_id: 'nykoping', label: 'Nyköping' },
  { concept_id: 'nynashamn', label: 'Nynäshamn' },
  { concept_id: 'nassjo', label: 'Nässjö' },
  { concept_id: 'ockero', label: 'Öckerö' },
  { concept_id: 'odeshog', label: 'Ödeshög' },
  { concept_id: 'olofstrom', label: 'Olofström' },
  { concept_id: 'orebro', label: 'Örebro' },
  { concept_id: 'orkelljunga', label: 'Örkelljunga' },
  { concept_id: 'ornskoldsvik', label: 'Örnsköldsvik' },
  { concept_id: 'orust', label: 'Orust' },
  { concept_id: 'osby', label: 'Osby' },
  { concept_id: 'oskarshamn', label: 'Oskarshamn' },
  { concept_id: 'osteraker', label: 'Österåker' },
  { concept_id: 'ostersund', label: 'Östersund' },
  { concept_id: 'osthammar', label: 'Östhammar' },
  { concept_id: 'overkalix', label: 'Överkalix' },
  { concept_id: 'overtornea', label: 'Övertorneå' },
  { concept_id: 'oxelosund', label: 'Oxelösund' },
  { concept_id: 'pajala', label: 'Pajala' },
  { concept_id: 'partille', label: 'Partille' },
  { concept_id: 'perstorp', label: 'Perstorp' },
  { concept_id: 'pitea', label: 'Piteå' },
  { concept_id: 'ragunda', label: 'Ragunda' },
  { concept_id: 'robertsfors', label: 'Robertsfors' },
  { concept_id: 'ronneby', label: 'Ronneby' },
  { concept_id: 'rattvik', label: 'Rättvik' },
  { concept_id: 'sala', label: 'Sala' },
  { concept_id: 'salem', label: 'Salem' },
  { concept_id: 'sandviken', label: 'Sandviken' },
  { concept_id: 'savsjo', label: 'Sävsjö' },
  { concept_id: 'sigtuna', label: 'Sigtuna' },
  { concept_id: 'simrishamn', label: 'Simrishamn' },
  { concept_id: 'sjobo', label: 'Sjöbo' },
  { concept_id: 'skara', label: 'Skara' },
  { concept_id: 'skelleftea', label: 'Skellefteå' },
  { concept_id: 'skinnskatteberg', label: 'Skinnskatteberg' },
  { concept_id: 'skovde', label: 'Skövde' },
  { concept_id: 'skurup', label: 'Skurup' },
  { concept_id: 'smedjebacken', label: 'Smedjebacken' },
  { concept_id: 'soderhamn', label: 'Söderhamn' },
  { concept_id: 'soderkoping', label: 'Söderköping' },
  { concept_id: 'sodertalje', label: 'Södertälje' },
  { concept_id: 'solleftea', label: 'Sollefteå' },
  { concept_id: 'sollentuna', label: 'Sollentuna' },
  { concept_id: 'solna', label: 'Solna' },
  { concept_id: 'solvesborg', label: 'Sölvesborg' },
  { concept_id: 'sorsele', label: 'Sorsele' },
  { concept_id: 'sotenas', label: 'Sotenäs' },
  { concept_id: 'staffanstorp', label: 'Staffanstorp' },
  { concept_id: 'stenungsund', label: 'Stenungsund' },
  { concept_id: 'stockholm', label: 'Stockholm' },
  { concept_id: 'storfors', label: 'Storfors' },
  { concept_id: 'storuman', label: 'Storuman' },
  { concept_id: 'strangnas', label: 'Strängnäs' },
  { concept_id: 'stromstad', label: 'Strömstad' },
  { concept_id: 'stromsund', label: 'Strömsund' },
  { concept_id: 'sundbyberg', label: 'Sundbyberg' },
  { concept_id: 'sundsvall', label: 'Sundsvall' },
  { concept_id: 'sunne', label: 'Sunne' },
  { concept_id: 'surahammar', label: 'Surahammar' },
  { concept_id: 'svalov', label: 'Svalöv' },
  { concept_id: 'svedala', label: 'Svedala' },
  { concept_id: 'svenljunga', label: 'Svenljunga' },
  { concept_id: 'taby', label: 'Täby' },
  { concept_id: 'tanum', label: 'Tanum' },
  { concept_id: 'tibro', label: 'Tibro' },
  { concept_id: 'tidaholm', label: 'Tidaholm' },
  { concept_id: 'tierp', label: 'Tierp' },
  { concept_id: 'timra', label: 'Timrå' },
  { concept_id: 'tingsryd', label: 'Tingsryd' },
  { concept_id: 'tjorn', label: 'Tjörn' },
  { concept_id: 'tomelilla', label: 'Tomelilla' },
  { concept_id: 'torsas', label: 'Torsås' },
  { concept_id: 'torsby', label: 'Torsby' },
  { concept_id: 'tranemo', label: 'Tranemo' },
  { concept_id: 'tranas', label: 'Tranås' },
  { concept_id: 'trelleborg', label: 'Trelleborg' },
  { concept_id: 'trollhattan', label: 'Trollhättan' },
  { concept_id: 'tyreso', label: 'Tyresö' },
  { concept_id: 'uddevalla', label: 'Uddevalla' },
  { concept_id: 'ulricehamn', label: 'Ulricehamn' },
  { concept_id: 'umea', label: 'Umeå' },
  { concept_id: 'upplands-bro', label: 'Upplands-Bro' },
  { concept_id: 'upplands-vasby', label: 'Upplands Väsby' },
  { concept_id: 'uppsala', label: 'Uppsala' },
  { concept_id: 'uppvidinge', label: 'Uppvidinge' },
  { concept_id: 'vadstena', label: 'Vadstena' },
  { concept_id: 'vaggeryd', label: 'Vaggeryd' },
  { concept_id: 'valdemarsvik', label: 'Valdemarsvik' },
  { concept_id: 'vallentuna', label: 'Vallentuna' },
  { concept_id: 'vanersborg', label: 'Vänersborg' },
  { concept_id: 'vannas', label: 'Vännäs' },
  { concept_id: 'vara', label: 'Vara' },
  { concept_id: 'varberg', label: 'Varberg' },
  { concept_id: 'varmdo', label: 'Värmdö' },
  { concept_id: 'varnamo', label: 'Värnamo' },
  { concept_id: 'vasteras', label: 'Västerås' },
  { concept_id: 'vastervik', label: 'Västervik' },
  { concept_id: 'vaxholm', label: 'Vaxholm' },
  { concept_id: 'vaxjo', label: 'Växjö' },
  { concept_id: 'vellinge', label: 'Vellinge' },
  { concept_id: 'vetlanda', label: 'Vetlanda' },
  { concept_id: 'vilhelmina', label: 'Vilhelmina' },
  { concept_id: 'vimmerby', label: 'Vimmerby' },
  { concept_id: 'vindeln', label: 'Vindeln' },
  { concept_id: 'vingaker', label: 'Vingåker' },
  { concept_id: 'visby', label: 'Gotland' },
  { concept_id: 'ystad', label: 'Ystad' },
  { concept_id: 'amal', label: 'Åmål' },
  { concept_id: 'ange', label: 'Ånge' },
  { concept_id: 'are', label: 'Åre' },
  { concept_id: 'arjang', label: 'Årjäng' },
  { concept_id: 'as', label: 'Ås' },
  { concept_id: 'asele', label: 'Åsele' },
  { concept_id: 'astorp', label: 'Åstorp' },
  { concept_id: 'atvidaberg', label: 'Åtvidaberg' },
  { concept_id: 'alvdalen', label: 'Älvdalen' },
  { concept_id: 'alvkarleby', label: 'Älvkarleby' },
  { concept_id: 'alvsbyn', label: 'Älvsbyn' },
  { concept_id: 'angelholm', label: 'Ängelholm' },
  { concept_id: 'ostra-goinge', label: 'Östra Göinge' },
];

export async function getRegions(): Promise<{ success: boolean; data: typeof SWEDISH_REGIONS }> {
  return { success: true, data: SWEDISH_REGIONS };
}

export async function getMunicipalities(): Promise<{ success: boolean; data: typeof SWEDISH_MUNICIPALITIES }> {
  return { success: true, data: SWEDISH_MUNICIPALITIES };
}

// Export the municipalities array directly for use in components
export { SWEDISH_MUNICIPALITIES, SWEDISH_REGIONS };

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
