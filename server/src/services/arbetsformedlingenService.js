/**
 * Arbetsförmedlingen API Service
 * Hanterar kommunikation med Arbetsförmedlingens öppna API
 * Dokumentation: https://jobsearch.api.jobtechdev.se/
 */

const JOBSEARCH_BASE_URL = 'https://jobsearch.api.jobtechdev.se';
const ENRICHMENTS_BASE_URL = 'https://enrichments.api.jobtechdev.se';
const HISTORICAL_BASE_URL = 'https://historical.api.jobtechdev.se';

// ============================================
// CACHE-HANTERING
// ============================================

class APICache {
  constructor() {
    this.cache = new Map();
    this.DEFAULT_TTL = 5 * 60 * 1000; // 5 minuter
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.DEFAULT_TTL)
    });
  }

  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    Array.from(this.cache.keys()).forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

const apiCache = new APICache();

// ============================================
// MOCK-DATA FÖR FALLBACK
// ============================================

const MOCK_JOBS = [
  {
    id: 'mock-af-1',
    headline: 'Kundtjänstmedarbetare till växande företag',
    description: {
      text: 'Vi söker en positiv och serviceinriktad kundtjänstmedarbetare till vårt team. Du kommer att hantera kundfrågor via telefon och mejl, ge support och säkerställa hög kundnöjdhet. Erfarenhet av kundservice är meriterande men inte ett krav - vi lär dig det du behöver veta!',
      text_formatted: '<p>Vi söker en positiv och serviceinriktad kundtjänstmedarbetare...</p>'
    },
    employer: { name: 'Servicebolaget Sverige AB', workplace: 'Stockholm City' },
    workplace_address: { 
      municipality: 'Stockholm', 
      city: 'Stockholm',
      region: 'Stockholms län',
      country: 'Sverige'
    },
    occupation: { concept_id: '1', label: 'Kundtjänstmedarbetare', legacy_ams_taxonomy_id: '1234' },
    occupation_group: { concept_id: 'g1', label: 'Kundtjänstpersonal', legacy_ams_taxonomy_id: '4110' },
    employment_type: { concept_id: '1', label: 'Tillsvidareanställning', legacy_ams_taxonomy_id: '5678' },
    publication_date: new Date().toISOString(),
    application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    application_details: { 
      url: 'https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/mock-af-1', 
      via_af: true,
      reference: 'AF-2024-001'
    },
    experience_required: false,
    driving_license_required: false,
    salary_type: { concept_id: 's1', label: 'Månadslön', legacy_ams_taxonomy_id: '111' },
    salary_description: 'Enligt överenskommelse',
    must_have: {
      skills: [
        { concept_id: '1', label: 'Kundservice', legacy_ams_taxonomy_id: '111', weight: 10 },
        { concept_id: '2', label: 'Kommunikation', legacy_ams_taxonomy_id: '222', weight: 8 }
      ],
      languages: [
        { concept_id: 'l1', label: 'Svenska', legacy_ams_taxonomy_id: '301', weight: 10 }
      ]
    },
    nice_to_have: {
      skills: [
        { concept_id: '3', label: 'Engelska', legacy_ams_taxonomy_id: '302', weight: 5 },
        { concept_id: '4', label: 'Datorvana', legacy_ams_taxonomy_id: '303', weight: 6 }
      ]
    }
  },
  {
    id: 'mock-af-2',
    headline: 'Lagerarbetare för omgående start',
    description: {
      text: 'Till vårt moderna lager i Göteborg söker vi nu drivna lagerarbetare. Arbetsuppgifter inkluderar plock och pack, inleverans, varuhantering och övriga lageruppgifter. Vi erbjuder en trygg anställning med goda utvecklingsmöjligheter.',
      text_formatted: '<p>Till vårt moderna lager i Göteborg söker vi nu drivna lagerarbetare...</p>'
    },
    employer: { name: 'Logistikpartner Sverige AB', workplace: 'Göteborg Lager' },
    workplace_address: { 
      municipality: 'Göteborg', 
      city: 'Göteborg',
      region: 'Västra Götalands län',
      country: 'Sverige'
    },
    occupation: { concept_id: '2', label: 'Lagerarbetare', legacy_ams_taxonomy_id: '1235' },
    occupation_group: { concept_id: 'g2', label: 'Lager- och terminalpersonal', legacy_ams_taxonomy_id: '4320' },
    employment_type: { concept_id: '2', label: 'Tillsvidareanställning', legacy_ams_taxonomy_id: '5679' },
    publication_date: new Date(Date.now() - 86400000).toISOString(),
    application_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    application_details: { 
      url: 'https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/mock-af-2', 
      via_af: true,
      reference: 'AF-2024-002'
    },
    experience_required: false,
    driving_license_required: true,
    driving_license: [{ concept_id: 'd1', label: 'B-körkort' }],
    salary_type: { concept_id: 's2', label: 'Timlön', legacy_ams_taxonomy_id: '112' },
    salary_description: 'Timlön enligt kollektivavtal',
    must_have: {
      skills: [
        { concept_id: '5', label: 'Lagerarbete', legacy_ams_taxonomy_id: '333', weight: 8 },
        { concept_id: '6', label: 'Fysisk arbetsförmåga', legacy_ams_taxonomy_id: '334', weight: 10 }
      ]
    },
    nice_to_have: {
      skills: [
        { concept_id: '7', label: 'Truckkörning', legacy_ams_taxonomy_id: '444', weight: 8 },
        { concept_id: '8', label: 'Skannerhantering', legacy_ams_taxonomy_id: '445', weight: 5 }
      ]
    }
  },
  {
    id: 'mock-af-3',
    headline: 'Undersköterska till äldreboende - Nattjänst',
    description: {
      text: 'Vi söker en engagerad undersköterska som vill arbeta natt och bidra till våra äldres välbefinnande. Du ska vara ett gott stöd för våra boende och arbeta för att ge dem en god omvårdnad och ett värdigt liv. Vi erbjuder fast nattjänstgöring och goda förmåner.',
      text_formatted: '<p>Vi söker en engagerad undersköterska som vill arbeta natt...</p>'
    },
    employer: { name: 'Sollentuna Kommun - Omsorgsförvaltningen', workplace: 'Solgården äldreboende' },
    workplace_address: { 
      municipality: 'Sollentuna', 
      city: 'Sollentuna',
      region: 'Stockholms län',
      country: 'Sverige'
    },
    occupation: { concept_id: '3', label: 'Undersköterska', legacy_ams_taxonomy_id: '1236' },
    occupation_group: { concept_id: 'g3', label: 'Undersköterskor', legacy_ams_taxonomy_id: '5320' },
    employment_type: { concept_id: '3', label: 'Tillsvidareanställning', legacy_ams_taxonomy_id: '5680' },
    publication_date: new Date(Date.now() - 172800000).toISOString(),
    application_deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    application_details: { 
      url: 'https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/mock-af-3', 
      via_af: true,
      email: 'rekrytering@sollentuna.se',
      reference: 'AF-2024-003'
    },
    experience_required: true,
    driving_license_required: false,
    salary_type: { concept_id: 's3', label: 'Månadslön', legacy_ams_taxonomy_id: '111' },
    salary_description: 'Lön enligt kollektivavtal',
    must_have: {
      skills: [
        { concept_id: '9', label: 'Omvårdnad', legacy_ams_taxonomy_id: '555', weight: 10 },
        { concept_id: '10', label: 'Kommunikation', legacy_ams_taxonomy_id: '222', weight: 8 }
      ],
      education: [
        { concept_id: 'e1', label: 'Undersköterskeutbildning', legacy_ams_taxonomy_id: '601', weight: 10 }
      ]
    },
    nice_to_have: {
      work_experiences: [
        { concept_id: 'w1', label: 'Äldreomsorg', legacy_ams_taxonomy_id: '701', weight: 8 }
      ]
    }
  },
  {
    id: 'mock-af-4',
    headline: 'Butikssäljare till modebutik i centrala Malmö',
    description: {
      text: 'Vi söker en engagerad butikssäljare som brinner för mode och service. Du kommer att arbeta med kundmottagning, försäljning, varuexponering och bidra till att skapa en inspirerande shoppingupplevelse. Tidigare erfarenhet av butiksarbete är meriterande.',
      text_formatted: '<p>Vi söker en engagerad butikssäljare som brinner för mode...</p>'
    },
    employer: { name: 'Modehuset Scandinavia', workplace: 'Malmö Centrum' },
    workplace_address: { 
      municipality: 'Malmö', 
      city: 'Malmö',
      region: 'Skåne län',
      country: 'Sverige'
    },
    occupation: { concept_id: '4', label: 'Butikssäljare', legacy_ams_taxonomy_id: '1237' },
    occupation_group: { concept_id: 'g4', label: 'Butikssäljare', legacy_ams_taxonomy_id: '5220' },
    employment_type: { concept_id: '4', label: 'Deltid', legacy_ams_taxonomy_id: '5681' },
    publication_date: new Date(Date.now() - 259200000).toISOString(),
    application_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    application_details: { 
      url: 'https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/mock-af-4', 
      via_af: true,
      reference: 'AF-2024-004'
    },
    experience_required: false,
    driving_license_required: false,
    salary_type: { concept_id: 's4', label: 'Timlön', legacy_ams_taxonomy_id: '112' },
    salary_description: 'Timlön + provision',
    must_have: {
      skills: [
        { concept_id: '11', label: 'Försäljning', legacy_ams_taxonomy_id: '777', weight: 10 },
        { concept_id: '12', label: 'Kundservice', legacy_ams_taxonomy_id: '111', weight: 8 }
      ]
    },
    nice_to_have: {
      skills: [
        { concept_id: '13', label: 'Visuell merchandising', legacy_ams_taxonomy_id: '778', weight: 6 }
      ]
    }
  },
  {
    id: 'mock-af-5',
    headline: 'Administratör med ekonomikunskaper till växande konsultföretag',
    description: {
      text: 'Vi söker en strukturerad och noggrann administratör som kan stötta vår ekonomiavdelning. Arbetsuppgifter inkluderar fakturering, bokföring, kontering, utbetalningar och allmän administration. Erfarenhet av ekonomiarbete och goda kunskaper i Excel är ett krav.',
      text_formatted: '<p>Vi söker en strukturerad och noggrann administratör...</p>'
    },
    employer: { name: 'Ekonomipartner Konsult AB', workplace: 'Malmö Hyllie' },
    workplace_address: { 
      municipality: 'Malmö', 
      city: 'Malmö',
      region: 'Skåne län',
      country: 'Sverige'
    },
    occupation: { concept_id: '5', label: 'Administratör', legacy_ams_taxonomy_id: '1238' },
    occupation_group: { concept_id: 'g5', label: 'Kontorsassistenter och sekreterare', legacy_ams_taxonomy_id: '4120' },
    employment_type: { concept_id: '5', label: 'Tillsvidareanställning', legacy_ams_taxonomy_id: '5682' },
    publication_date: new Date(Date.now() - 345600000).toISOString(),
    application_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    application_details: { 
      url: 'https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/mock-af-5', 
      via_af: true,
      email: 'hr@ekonomipartner.se',
      reference: 'AF-2024-005'
    },
    experience_required: true,
    driving_license_required: false,
    salary_type: { concept_id: 's5', label: 'Månadslön', legacy_ams_taxonomy_id: '111' },
    salary_description: '32000-38000 kr/mån',
    must_have: {
      skills: [
        { concept_id: '14', label: 'Administration', legacy_ams_taxonomy_id: '999', weight: 10 },
        { concept_id: '15', label: 'Ekonomi', legacy_ams_taxonomy_id: '1010', weight: 10 },
        { concept_id: '16', label: 'Excel', legacy_ams_taxonomy_id: '1011', weight: 9 }
      ],
      work_experiences: [
        { concept_id: 'w2', label: 'Ekonomiadministration', legacy_ams_taxonomy_id: '702', weight: 8 }
      ]
    },
    nice_to_have: {
      skills: [
        { concept_id: '17', label: 'Visma', legacy_ams_taxonomy_id: '1012', weight: 7 },
        { concept_id: '18', label: 'Fortnox', legacy_ams_taxonomy_id: '1013', weight: 7 }
      ]
    }
  }
];

const MOCK_MARKET_DATA = {
  topOccupations: [
    { occupation: 'Undersköterska', count: 4523, trend: 'up', growth: 12 },
    { occupation: 'Lagerarbetare', count: 3891, trend: 'up', growth: 8 },
    { occupation: 'Kundtjänstmedarbetare', count: 3245, trend: 'stable', growth: 2 },
    { occupation: 'Sjuksköterska', count: 2987, trend: 'up', growth: 15 },
    { occupation: 'Butikssäljare', count: 2765, trend: 'down', growth: -3 },
    { occupation: 'Lärare', count: 2543, trend: 'up', growth: 7 },
    { occupation: 'Systemutvecklare', count: 2341, trend: 'up', growth: 18 },
    { occupation: 'Kock', count: 2134, trend: 'stable', growth: 1 },
    { occupation: 'Chaufför', count: 1987, trend: 'up', growth: 5 },
    { occupation: 'Vårdbiträde', count: 1876, trend: 'up', growth: 11 }
  ],
  salaryIndicators: {
    'Stockholms län': { median: 38500, average: 41200, range: { min: 28000, max: 65000 } },
    'Västra Götalands län': { median: 34200, average: 36800, range: { min: 26000, max: 58000 } },
    'Skåne län': { median: 32800, average: 35100, range: { min: 25000, max: 55000 } },
    'Uppsala län': { median: 33500, average: 35800, range: { min: 25500, max: 52000 } },
    'Östergötlands län': { median: 31800, average: 33900, range: { min: 24500, max: 49000 } }
  },
  skillTrends: [
    { skill: 'AI/Maskininlärning', growthRate: 156, demand: 95, trend: 'up' },
    { skill: 'Hållbarhet/miljö', growthRate: 89, demand: 78, trend: 'up' },
    { skill: 'Digital kommunikation', growthRate: 67, demand: 85, trend: 'up' },
    { skill: 'Projektledning (Agile)', growthRate: 45, demand: 92, trend: 'up' },
    { skill: 'JavaScript/TypeScript', growthRate: 34, demand: 88, trend: 'up' },
    { skill: 'Svenska (flytande)', growthRate: 12, demand: 98, trend: 'stable' },
    { skill: 'Engelska (business)', growthRate: 18, demand: 87, trend: 'stable' },
    { skill: 'Kundservice', growthRate: 5, demand: 92, trend: 'stable' },
    { skill: 'Truckkörning', growthRate: -2, demand: 76, trend: 'down' },
    { skill: ' traditionell bokföring', growthRate: -15, demand: 45, trend: 'down' }
  ]
};

// ============================================
// HJÄLPFUNKTIONER
// ============================================

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchFromAF(endpoint, params = {}, baseUrl = JOBSEARCH_BASE_URL) {
  const queryParams = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';

  const cacheKey = `${endpoint}${queryParams}`;
  
  // Kolla cache först
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  try {
    const response = await fetchWithTimeout(
      `${baseUrl}${endpoint}${queryParams}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Spara i cache
    apiCache.set(cacheKey, data);
    
    return { ...data, fromCache: false };
  } catch (error) {
    console.error(`Arbetsförmedlingen API error (${endpoint}):`, error);
    throw error;
  }
}

// Retry-logik med backoff
async function fetchWithRetry(endpoint, params = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Vänta innan varje retry (förutom första försöket)
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await fetchFromAF(endpoint, params);
    } catch (error) {
      lastError = error;
      
      // Om det är ett nätverksfel, försök igen
      if (error.name === 'TypeError' || error.name === 'AbortError') {
        continue;
      }
      
      // Om det är en 5xx server error, försök igen
      if (error.message.includes('5')) {
        continue;
      }
      
      // 4xx errors - försök inte igen
      if (error.message.includes('4')) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

// ============================================
// HUVUDEXPORTER
// ============================================

const arbetsformedlingenService = {
  /**
   * Sök jobbannonser från Platsbanken
   */
  async searchJobs(filters = {}) {
    const {
      q,
      occupation,
      occupation_group,
      occupation_field,
      municipality,
      region,
      experience,
      driving_license,
      remote,
      employment_type,
      published_after,
      limit = 20,
      offset = 0,
      sort = 'relevance'
    } = filters;

    try {
      const result = await fetchWithRetry('/search', {
        q,
        occupation,
        occupation_group,
        occupation_field,
        municipality,
        region,
        experience,
        driving_license,
        remote,
        employment_type,
        published_after,
        limit,
        offset,
        sort
      });

      return {
        success: true,
        data: {
          total: result.total?.value || 0,
          hits: result.hits || [],
          positions: result.positions || 0
        },
        fromCache: result.fromCache,
        isMockData: false
      };
    } catch (error) {
      console.warn('Använder mock-data pga API-fel:', error.message);
      
      // Filtrera mock-data baserat på sökfilter
      let filteredJobs = [...MOCK_JOBS];
      
      if (q) {
        const query = q.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.headline.toLowerCase().includes(query) ||
          job.description.text.toLowerCase().includes(query) ||
          job.occupation.label.toLowerCase().includes(query)
        );
      }
      
      if (municipality) {
        filteredJobs = filteredJobs.filter(job => 
          job.workplace_address?.municipality?.toLowerCase().includes(municipality.toLowerCase())
        );
      }
      
      if (region) {
        filteredJobs = filteredJobs.filter(job => 
          job.workplace_address?.region?.toLowerCase().includes(region.toLowerCase())
        );
      }
      
      if (employment_type) {
        filteredJobs = filteredJobs.filter(job => 
          job.employment_type?.label?.toLowerCase().includes(employment_type.toLowerCase())
        );
      }

      return {
        success: true,
        data: {
          total: { value: filteredJobs.length },
          hits: filteredJobs.slice(offset, offset + limit),
          positions: filteredJobs.length
        },
        error: 'Data kan vara föråldrad - Arbetsförmedlingens API är för närvarande otillgängligt',
        isMockData: true
      };
    }
  },

  /**
   * Hämta en specifik jobbannons
   */
  async getJobById(id) {
    try {
      const result = await fetchWithRetry(`/ad/${id}`);
      return {
        success: true,
        data: result,
        fromCache: result.fromCache,
        isMockData: false
      };
    } catch (error) {
      // Kolla om det finns i mock-data
      const mockJob = MOCK_JOBS.find(j => j.id === id);
      if (mockJob) {
        return {
          success: true,
          data: mockJob,
          error: 'Data kan vara föråldrad - Arbetsförmedlingens API är för närvarande otillgängligt',
          isMockData: true
        };
      }
      
      return {
        success: false,
        error: 'Kunde inte hämta jobbannons',
        isMockData: false
      };
    }
  },

  /**
   * Autocomplete för sökningar
   */
  async getAutocomplete(query, type = 'occupation') {
    const cacheKey = `autocomplete-${type}-${query}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { success: true, data: cached, fromCache: true };

    try {
      const result = await fetchFromAF('/complete', { q: query, type, limit: 10 });
      const data = result.typeahead || [];
      apiCache.set(cacheKey, data, 10 * 60 * 1000); // 10 minuter cache
      return { success: true, data, fromCache: false };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Kunde inte hämta förslag'
      };
    }
  },

  /**
   * Hämta taxonomi-data (yrken, kompetenser, etc.)
   */
  async getTaxonomy(type, query, limit = 20) {
    try {
      const result = await fetchFromAF('/taxonomy/concepts', {
        type,
        q: query,
        limit
      });
      return {
        success: true,
        data: result.concepts || [],
        fromCache: result.fromCache
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Kunde inte hämta taxonomi-data'
      };
    }
  },

  /**
   * Hämta kommuner (cachad)
   */
  async getMunicipalities() {
    const cacheKey = 'municipalities';
    const cached = apiCache.get(cacheKey);
    if (cached) return { success: true, data: cached, fromCache: true };

    try {
      const result = await fetchFromAF('/taxonomy/concepts', {
        type: 'municipality',
        limit: 100
      });
      const data = result.concepts || [];
      apiCache.set(cacheKey, data, 60 * 60 * 1000); // 1 timme cache
      return { success: true, data, fromCache: false };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Kunde inte hämta kommuner'
      };
    }
  },

  /**
   * Hämta regioner (cachad)
   */
  async getRegions() {
    const cacheKey = 'regions';
    const cached = apiCache.get(cacheKey);
    if (cached) return { success: true, data: cached, fromCache: true };

    try {
      const result = await fetchFromAF('/taxonomy/concepts', {
        type: 'region',
        limit: 30
      });
      const data = result.concepts || [];
      apiCache.set(cacheKey, data, 60 * 60 * 1000); // 1 timme cache
      return { success: true, data, fromCache: false };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Kunde inte hämta regioner'
      };
    }
  },

  /**
   * Hämta marknadsinsikter (topp yrken, löner, trender)
   */
  async getMarketInsights(region) {
    try {
      // Försök hämta realdata från historiska API:et
      const historical = await fetchWithRetry('/search', {
        published_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        limit: 100,
        ...(region && { region })
      }, 1).catch(() => null);

      if (historical && historical.hits && historical.hits.length > 0) {
        // Analysera data för att få insikter
        const occupationCounts = {};
        historical.hits.forEach(job => {
          const occ = job.occupation?.label || 'Okänt';
          occupationCounts[occ] = (occupationCounts[occ] || 0) + 1;
        });

        const topOccupations = Object.entries(occupationCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([occupation, count]) => ({ occupation, count }));

        return {
          success: true,
          data: {
            topOccupations,
            salaryIndicators: MOCK_MARKET_DATA.salaryIndicators,
            skillTrends: MOCK_MARKET_DATA.skillTrends,
            totalJobs: historical.total?.value || 0,
            lastUpdated: new Date().toISOString()
          },
          isMockData: false
        };
      }

      throw new Error('No historical data');
    } catch (error) {
      // Returnera mock-data
      return {
        success: true,
        data: {
          topOccupations: MOCK_MARKET_DATA.topOccupations,
          salaryIndicators: region 
            ? { [region]: MOCK_MARKET_DATA.salaryIndicators[region] || MOCK_MARKET_DATA.salaryIndicators['Stockholms län'] }
            : MOCK_MARKET_DATA.salaryIndicators,
          skillTrends: MOCK_MARKET_DATA.skillTrends,
          totalJobs: MOCK_JOBS.length * 1000,
          lastUpdated: new Date().toISOString()
        },
        error: 'Data kan vara föråldrad - Arbetsförmedlingens API är för närvarande otillgängligt',
        isMockData: true
      };
    }
  },

  /**
   * Gap-analys - matcha användarens kompetenser mot marknadens efterfrågan
   */
  async analyzeSkillGap(userSkills = [], targetOccupation = null) {
    try {
      // Hämta jobb för att analysera efterfrågade kompetenser
      const searchQuery = targetOccupation || userSkills.slice(0, 2).join(' ');
      const jobs = await this.searchJobs({ q: searchQuery, limit: 50 });
      
      if (!jobs.success || !jobs.data.hits.length) {
        throw new Error('Kunde inte hämta jobb för analys');
      }

      // Extrahera efterfrågade kompetenser
      const skillDemand = {};
      const allRequiredSkills = [];
      
      jobs.data.hits.forEach(job => {
        const skills = [
          ...(job.must_have?.skills || []),
          ...(job.nice_to_have?.skills || [])
        ];
        
        skills.forEach(skill => {
          const skillName = skill.label.toLowerCase();
          skillDemand[skillName] = (skillDemand[skillName] || 0) + skill.weight;
          allRequiredSkills.push(skillName);
        });
      });

      // Sortera efter efterfrågan
      const topDemandedSkills = Object.entries(skillDemand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([skill, demand]) => ({ skill, demand }));

      // Jämför med användarens kompetenser
      const userSkillsLower = userSkills.map(s => s.toLowerCase());
      
      const matchedSkills = topDemandedSkills.filter(({ skill }) =>
        userSkillsLower.some(userSkill => 
          userSkill.includes(skill) || skill.includes(userSkill)
        )
      );

      const missingSkills = topDemandedSkills.filter(({ skill }) =>
        !matchedSkills.some(match => 
          match.skill.includes(skill) || skill.includes(match.skill)
        )
      );

      // Beräkna matchningsgrad
      const matchPercentage = topDemandedSkills.length > 0
        ? Math.round((matchedSkills.length / Math.min(topDemandedSkills.length, 10)) * 100)
        : 0;

      return {
        success: true,
        data: {
          matchPercentage,
          matchedSkills: matchedSkills.slice(0, 10),
          missingSkills: missingSkills.slice(0, 10),
          topDemandedSkills: topDemandedSkills.slice(0, 15),
          totalJobsAnalyzed: jobs.data.hits.length,
          isMockData: jobs.isMockData
        }
      };
    } catch (error) {
      // Använd mock-data för analys
      const mockDemandedSkills = [
        { skill: 'kommunikation', demand: 95 },
        { skill: 'kundservice', demand: 88 },
        { skill: 'samarbetsförmåga', demand: 82 },
        { skill: 'svenska', demand: 78 },
        { skill: 'datorvana', demand: 75 },
        { skill: 'engelska', demand: 68 },
        { skill: 'problemlösning', demand: 65 },
        { skill: 'flexibilitet', demand: 62 },
        { skill: 'initiativförmåga', demand: 58 },
        { skill: 'administration', demand: 55 }
      ];

      const userSkillsLower = userSkills.map(s => s.toLowerCase());
      const matchedSkills = mockDemandedSkills.filter(({ skill }) =>
        userSkillsLower.some(us => us.includes(skill) || skill.includes(us))
      );
      const missingSkills = mockDemandedSkills.filter(s => !matchedSkills.includes(s));
      const matchPercentage = Math.round((matchedSkills.length / mockDemandedSkills.length) * 100);

      return {
        success: true,
        data: {
          matchPercentage,
          matchedSkills,
          missingSkills: missingSkills.slice(0, 5),
          topDemandedSkills: mockDemandedSkills,
          totalJobsAnalyzed: 50,
          isMockData: true
        },
        error: 'Analys baserad på uppskattad data - API ej tillgängligt'
      };
    }
  },

  /**
   * Berika jobbannons med AI-analys
   */
  async enrichJobAd(text) {
    const cacheKey = `enrichment-${text.substring(0, 100)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { success: true, data: cached, fromCache: true };

    try {
      const response = await fetchWithTimeout(
        `${ENRICHMENTS_BASE_URL}/enrichment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ text }),
        },
        15000
      );

      if (!response.ok) {
        throw new Error(`Enrichment API error: ${response.status}`);
      }

      const result = await response.json();
      apiCache.set(cacheKey, result, 30 * 60 * 1000); // 30 minuter cache
      return { success: true, data: result, fromCache: false };
    } catch (error) {
      // Fallback: enkel regex-baserad extraktion
      const skills = [
        'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python',
        'java', 'c#', 'sql', 'mongodb', 'postgresql', 'docker', 'kubernetes',
        'aws', 'azure', 'git', 'agil', 'scrum', 'kanban', 'projektledning',
        'kundservice', 'försäljning', 'marknadsföring', 'ekonomi', 'redovisning',
        'hr', 'administration', 'ledarskap', 'kommunikation', 'svenska', 'engelska',
        'lagerarbete', 'truckkörning', 'omvårdnad', 'vård', 'undersköterska',
        'sjuksköterska', 'lärare', 'pedagogik', 'barnskötare', 'förskollärare'
      ];

      const foundSkills = skills
        .filter(skill => text.toLowerCase().includes(skill.toLowerCase()))
        .map(skill => ({
          label: skill.charAt(0).toUpperCase() + skill.slice(1),
          type: 'skill',
          frequency: 1
        }));

      const fallback = {
        entities: foundSkills,
        relations: [],
        isFallback: true
      };

      apiCache.set(cacheKey, fallback, 5 * 60 * 1000);
      return { success: true, data: fallback, isFallback: true };
    }
  },

  /**
   * Formatera jobbdata till portalens format
   */
  formatJobForPortal(jobAd) {
    return {
      id: jobAd.id,
      title: jobAd.headline,
      company: jobAd.employer?.name || 'Arbetsgivare ej angiven',
      workplace: jobAd.employer?.workplace,
      location: jobAd.workplace_address?.municipality || jobAd.workplace_address?.city || 'Ort ej angiven',
      region: jobAd.workplace_address?.region,
      description: jobAd.description?.text || '',
      descriptionFormatted: jobAd.description?.text_formatted || '',
      employmentType: jobAd.employment_type?.label || 'Ej angiven',
      occupation: jobAd.occupation?.label,
      occupationGroup: jobAd.occupation_group?.label,
      experienceRequired: jobAd.experience_required || false,
      drivingLicenseRequired: jobAd.driving_license_required || false,
      drivingLicenses: jobAd.driving_license || [],
      publicationDate: jobAd.publication_date,
      deadline: jobAd.application_deadline,
      salary: jobAd.salary_description,
      salaryType: jobAd.salary_type?.label,
      applicationUrl: jobAd.application_details?.url,
      applicationViaAF: jobAd.application_details?.via_af || false,
      applicationEmail: jobAd.application_details?.email,
      applicationReference: jobAd.application_details?.reference,
      requiredSkills: (jobAd.must_have?.skills || []).map(s => s.label),
      requiredLanguages: (jobAd.must_have?.languages || []).map(l => l.label),
      requiredEducation: (jobAd.must_have?.education || []).map(e => e.label),
      niceToHaveSkills: (jobAd.nice_to_have?.skills || []).map(s => s.label),
      contacts: jobAd.application_contacts || [],
      source: 'arbetsformedlingen',
      sourceUrl: `https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/${jobAd.id}`
    };
  },

  /**
   * Formatera flera jobb
   */
  formatJobsForPortal(jobAds) {
    return jobAds.map(job => this.formatJobForPortal(job));
  },

  /**
   * Hämta cache-statistik
   */
  getCacheStats() {
    return apiCache.getStats();
  },

  /**
   * Rensa cache
   */
  clearCache(pattern) {
    apiCache.invalidate(pattern);
    return { success: true };
  },

  /**
   * Kontrollera API-status
   */
  async checkStatus() {
    try {
      await fetchWithTimeout(`${JOBSEARCH_BASE_URL}/search?q=test&limit=1`, {}, 5000);
      return { online: true, message: 'API är tillgängligt' };
    } catch (error) {
      return { 
        online: false, 
        message: 'API är för närvarande otillgängligt',
        error: error.message
      };
    }
  }
};

module.exports = arbetsformedlingenService;
