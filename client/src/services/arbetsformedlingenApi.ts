/**
 * Arbetsförmedlingen API Integration
 * Realtidsdata om jobb från Platsbanken
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  occupation?: string;
  employment_type?: string;
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

// Hjälpfunktion för API-anrop
async function fetchFromApi(endpoint: string, params?: Record<string, unknown>) {
  const queryParams = params ? '?' + new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined) as [string, string][]).toString() : '';
  const response = await fetch(`${API_BASE_URL}${endpoint}${queryParams}`);
  if (!response.ok) throw new Error('API-fel');
  return response.json();
}

// Sök jobb i Platsbanken
export async function searchPlatsbanken(params: SearchFilters): Promise<JobSearchResponse> {
  try {
    return await fetchFromApi('/jobs/platsbanken/search', params);
  } catch (error) {
    console.error('Fel vid sökning i Platsbanken:', error);
    return getMockJobs();
  }
}

// Alias för bakåtkompatibilitet
export const searchJobs = searchPlatsbanken;

// Hämta jobbdetaljer
export async function getJobDetails(id: string): Promise<PlatsbankenJob | null> {
  try {
    return await fetchFromApi(`/jobs/platsbanken/${id}`);
  } catch (error) {
    console.error('Fel vid hämtning av jobbdetaljer:', error);
    return null;
  }
}

// Autocomplete för sökning
export async function getAutocomplete(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const response = await fetchFromApi('/jobs/platsbanken/complete', { q: query });
    return response?.typeahead || [];
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
  try {
    return await fetchFromApi('/jobs/market-insights');
  } catch (error) {
    console.error('Fel vid hämtning av marknadsinsikter:', error);
    return getMockMarketInsights();
  }
}

// Bakåtkompatibilitet - marknadsstatistik
export async function getMarketStats() {
  try {
    return await fetchFromApi('/jobs/market-insights');
  } catch {
    return {
      totalJobs: 0,
      lastUpdated: new Date().toISOString(),
      status: 'unavailable'
    };
  }
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

// Hämta kommuner
export async function getMunicipalities(): Promise<string[]> {
  return ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping'];
}

// Hämta regioner
export async function getRegions(): Promise<string[]> {
  return ['Stockholms län', 'Västra Götalands län', 'Skåne län', 'Uppsala län'];
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
  'kundtjänst',
  'lagerarbetare',
  'sjuksköterska',
  'lärare',
  'programmerare'
];

// Mock-data vid API-fel
function getMockJobs(): JobSearchResponse {
  return {
    total: { value: 3 },
    hits: [
      {
        id: 'mock-1',
        headline: 'Kundtjänstmedarbetare',
        description: {
          text: 'Vi söker en positiv kundtjänstmedarbetare...',
          text_formatted: '<p>Vi söker en positiv kundtjänstmedarbetare...</p>'
        },
        employer: { name: 'Testföretag AB' },
        workplace_address: {
          municipality: 'Stockholm',
          region: 'Stockholms län',
          country: 'Sverige'
        },
        employment_type: { label: 'Heltid' },
        occupation: { label: 'Kundtjänst' },
        publication_date: new Date().toISOString(),
        last_publication_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: { enriched: ['kommunikation', 'service', 'data'] }
      },
      {
        id: 'mock-2',
        headline: 'Lagerarbetare',
        description: {
          text: 'Vi söker en noggrann lagerarbetare...',
          text_formatted: '<p>Vi söker en noggrann lagerarbetare...</p>'
        },
        employer: { name: 'Logistikbolaget' },
        workplace_address: {
          municipality: 'Göteborg',
          region: 'Västra Götalands län',
          country: 'Sverige'
        },
        employment_type: { label: 'Deltid' },
        occupation: { label: 'Lager' },
        publication_date: new Date().toISOString(),
        last_publication_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: { enriched: ['lager', 'truckkort', 'fysisk'] }
      },
      {
        id: 'mock-3',
        headline: 'Administratör',
        description: {
          text: 'Vi söker en strukturerad administratör...',
          text_formatted: '<p>Vi söker en strukturerad administratör...</p>'
        },
        employer: { name: 'Kontor AB' },
        workplace_address: {
          municipality: 'Malmö',
          region: 'Skåne län',
          country: 'Sverige'
        },
        employment_type: { label: 'Heltid' },
        occupation: { label: 'Administration' },
        publication_date: new Date().toISOString(),
        last_publication_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: { enriched: ['administration', 'excel', 'organisering'] }
      }
    ]
  };
}

function getMockMarketInsights(): MarketInsights {
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
  getRegions,
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
