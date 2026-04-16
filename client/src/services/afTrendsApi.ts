/**
 * Arbetsförmedlingen JobSearch Trends API
 * Populära sökningar och marknadstrender
 * Dokumentation: https://data.arbetsformedlingen.se/jobsearch-trends/
 * 
 * ANVÄNDER SUPABASE EDGE FUNCTIONS (ingen CORS!)
 */

// Supabase config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

import { trendsCache } from './cacheService';
import { jobLogger } from '@/lib/logger';
import { withRetry, fetchWithRetry } from './retryService';
import { supabase } from '@/lib/supabase';

async function fetchFromFunction(functionName: string, endpoint: string, params?: Record<string, string>) {
  const cacheKey = `${functionName}:${endpoint}:${JSON.stringify(params)}`;
  
  // Kolla cache först
  const cached = trendsCache.get(cacheKey);
  if (cached) {
    jobLogger.debug(`${functionName} Cache hit:`, endpoint);
    return cached;
  }

  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  const functionUrl = `${SUPABASE_URL}/functions/v1/${functionName}${endpoint}${queryParams}`;

  jobLogger.debug('Trends fetching:', functionUrl);
  
  // Hämta aktuell session (kan vara anon eller user)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;
  
  // Kör med retry-logik
  const data = await withRetry(async () => {
    const response = await fetchWithRetry(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    }, { maxRetries: 2, baseDelay: 1000 });
    
    if (!response.ok) {
      const errorText = await response.text();
      jobLogger.error(`${functionName} API error:`, response.status, errorText);
      throw new Error(`${functionName} API error: ${response.status}`);
    }
    
    return response.json();
  }, { maxRetries: 2 }, `${functionName} ${endpoint}`);
  
  // Spara i cache (30 minuter för trender)
  trendsCache.set(cacheKey, data);
  
  return data;
}

// Legacy wrapper för af-trends
async function fetchFromTrends(endpoint: string, params?: Record<string, string>) {
  return fetchFromFunction('af-trends', endpoint, params);
}

// Ny wrapper för af-historical
async function fetchFromHistorical(endpoint: string, params?: Record<string, string>) {
  return fetchFromFunction('af-historical', endpoint, params);
}

// ============== POPULAR SEARCHES ==============

export interface PopularSearch {
  term: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  change_percent?: number;
}

export async function getPopularSearches(
  category: 'occupations' | 'skills' | 'locations' | 'employers' = 'occupations',
  limit: number = 10
): Promise<PopularSearch[]> {
  const result = await fetchFromTrends('/popular-searches', {
    category,
    limit: String(limit)
  });
  return result?.searches || [];
}

// ============== TRENDING SKILLS ==============

export interface TrendingSkill {
  skill: string;
  demand: number;
  trend: 'up' | 'down' | 'stable';
  job_count: number;
  average_salary?: number;
}

export async function getTrendingSkills(limit: number = 20): Promise<TrendingSkill[]> {
  const result = await fetchFromTrends('/trending-skills', {
    limit: String(limit)
  });
  return result?.skills || [];
}

// ============== MARKET STATS ==============

export interface MarketStats {
  total_jobs: number;
  new_jobs_today: number;
  new_jobs_week: number;
  avg_time_to_hire_days: number;
  competition_index: number; // Antal sökande per jobb
  
  by_region: Array<{
    region: string;
    job_count: number;
    growth_percent: number;
  }>;
  
  by_occupation: Array<{
    occupation: string;
    job_count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  last_updated: string;
}

export async function getMarketStats(): Promise<MarketStats> {
  return await fetchFromTrends('/market-stats');
}

// ============== SALARY STATISTICS ==============

export interface SalaryStats {
  occupation: string;
  median_salary: number;
  percentile_25: number;
  percentile_75: number;
  by_region: Array<{
    region: string;
    median_salary: number;
  }>;
  by_experience: Array<{
    experience_years: string;
    median_salary: number;
  }>;
  source?: string;
  sampleSize?: number;
}

export async function getSalaryStats(occupation: string): Promise<SalaryStats | null> {
  jobLogger.debug('Getting salary stats for:', occupation);

  try {
    // Använd af-historical för lönestatistik
    const result = await fetchFromHistorical('/salary-stats', { occupation });
    
    if (result && !result.error) {
      return {
        occupation: result.occupation,
        median_salary: result.median,
        percentile_25: result.p25,
        percentile_75: result.p75,
        by_region: result.byRegion || [],
        by_experience: result.byExperience || [],
        source: result.source,
        sampleSize: result.sampleSize
      };
    }
  } catch (error) {
    jobLogger.debug('Historical API error:', error);
  }
  
  // Ingen fallback - returnera null om ingen data finns
  return null;
}

// ============== MOCK DATA (endast för testning) ==============

function getMockPopularSearches(category: string): PopularSearch[] {
  const mocks: Record<string, PopularSearch[]> = {
    occupations: [
      { term: 'Sjuksköterska', count: 1250, trend: 'up', change_percent: 15 },
      { term: 'Systemutvecklare', count: 980, trend: 'stable', change_percent: 2 },
      { term: 'Lärare', count: 850, trend: 'up', change_percent: 8 },
      { term: 'Ekonomiassistent', count: 720, trend: 'down', change_percent: -5 },
      { term: 'Lagerarbetare', count: 690, trend: 'stable', change_percent: 0 },
      { term: 'Kundtjänst', count: 650, trend: 'up', change_percent: 12 },
      { term: 'Byggarbetare', count: 580, trend: 'up', change_percent: 18 },
      { term: 'Kock', count: 520, trend: 'stable', change_percent: 3 },
      { term: 'Vårdbiträde', count: 480, trend: 'up', change_percent: 22 },
      { term: 'Lastbilschaufför', count: 420, trend: 'down', change_percent: -3 },
    ],
    skills: [
      { term: 'Excel', count: 2100, trend: 'stable', change_percent: 1 },
      { term: 'Svenska', count: 1850, trend: 'stable', change_percent: 0 },
      { term: 'Engelska', count: 1620, trend: 'up', change_percent: 5 },
      { term: 'B-körkort', count: 1400, trend: 'stable', change_percent: -1 },
      { term: 'Kommunikation', count: 1250, trend: 'up', change_percent: 8 },
      { term: 'Python', count: 980, trend: 'up', change_percent: 25 },
      { term: 'Projektledning', count: 850, trend: 'up', change_percent: 12 },
      { term: 'Försäljning', count: 780, trend: 'stable', change_percent: 2 },
      { term: 'JavaScript', count: 720, trend: 'up', change_percent: 18 },
      { term: 'Samarbete', count: 650, trend: 'stable', change_percent: 3 },
    ],
    locations: [
      { term: 'Stockholm', count: 3500, trend: 'up', change_percent: 8 },
      { term: 'Göteborg', count: 2100, trend: 'up', change_percent: 5 },
      { term: 'Malmö', count: 1500, trend: 'stable', change_percent: 2 },
      { term: 'Uppsala', count: 980, trend: 'up', change_percent: 12 },
      { term: 'Linköping', count: 720, trend: 'stable', change_percent: 1 },
    ],
    employers: [
      { term: 'Region Stockholm', count: 450, trend: 'up', change_percent: 15 },
      { term: 'Randstad', count: 380, trend: 'stable', change_percent: 2 },
      { term: 'Manpower', count: 350, trend: 'up', change_percent: 8 },
      { term: 'Academic Work', count: 320, trend: 'up', change_percent: 12 },
      { term: 'Västra Götalandsregionen', count: 290, trend: 'stable', change_percent: 3 },
    ]
  };
  
  return mocks[category] || mocks.occupations;
}

function getMockTrendingSkills(): TrendingSkill[] {
  return [
    { skill: 'Python', demand: 95, trend: 'up', job_count: 850, average_salary: 52000 },
    { skill: 'React', demand: 88, trend: 'up', job_count: 720, average_salary: 48000 },
    { skill: 'Azure', demand: 82, trend: 'up', job_count: 650, average_salary: 55000 },
    { skill: 'Agil utveckling', demand: 78, trend: 'stable', job_count: 580, average_salary: 50000 },
    { skill: 'SQL', demand: 75, trend: 'stable', job_count: 920, average_salary: 46000 },
    { skill: 'AI/Machine Learning', demand: 72, trend: 'up', job_count: 320, average_salary: 62000 },
    { skill: 'Projektledning', demand: 70, trend: 'stable', job_count: 1100, average_salary: 54000 },
    { skill: 'Analys', demand: 68, trend: 'up', job_count: 780, average_salary: 47000 },
    { skill: 'Kundservice', demand: 65, trend: 'stable', job_count: 2100, average_salary: 32000 },
    { skill: 'Försäljning', demand: 62, trend: 'down', job_count: 1850, average_salary: 38000 },
  ];
}

function getMockMarketStats(): MarketStats {
  return {
    total_jobs: 87500,
    new_jobs_today: 450,
    new_jobs_week: 3200,
    avg_time_to_hire_days: 42,
    competition_index: 8.5,
    
    by_region: [
      { region: 'Stockholms län', job_count: 28500, growth_percent: 12 },
      { region: 'Västra Götalands län', job_count: 18200, growth_percent: 8 },
      { region: 'Skåne län', job_count: 12800, growth_percent: 5 },
      { region: 'Uppsala län', job_count: 6500, growth_percent: 15 },
      { region: 'Östergötlands län', job_count: 5200, growth_percent: 3 },
    ],
    
    by_occupation: [
      { occupation: 'IT-tekniker', job_count: 4200, trend: 'up' },
      { occupation: 'Sjuksköterska', job_count: 3800, trend: 'up' },
      { occupation: 'Lagerarbetare', job_count: 3500, trend: 'stable' },
      { occupation: 'Kundtjänst', job_count: 3200, trend: 'up' },
      { occupation: 'Lärare', job_count: 2800, trend: 'up' },
    ],
    
    last_updated: new Date().toISOString()
  };
}

function getMockSalaryStats(occupation: string): SalaryStats {
  const baseSalary = occupation.toLowerCase().includes('programmerare') || 
                     occupation.toLowerCase().includes('utvecklare') ? 50000 : 35000;
  
  return {
    occupation,
    median_salary: baseSalary,
    percentile_25: Math.round(baseSalary * 0.75),
    percentile_75: Math.round(baseSalary * 1.35),
    by_region: [
      { region: 'Stockholm', median_salary: Math.round(baseSalary * 1.15) },
      { region: 'Göteborg', median_salary: Math.round(baseSalary * 1.05) },
      { region: 'Malmö', median_salary: baseSalary },
      { region: 'Uppsala', median_salary: Math.round(baseSalary * 0.95) },
    ],
    by_experience: [
      { experience_years: '0-2', median_salary: Math.round(baseSalary * 0.75) },
      { experience_years: '3-5', median_salary: baseSalary },
      { experience_years: '6-10', median_salary: Math.round(baseSalary * 1.25) },
      { experience_years: '10+', median_salary: Math.round(baseSalary * 1.5) },
    ]
  };
}

// ============== ROBUST API WITH FALLBACK ==============

/**
 * Wrapper functions that try API first, then fall back to mock data
 * Returns data with source indicator
 */

interface DataWithSource<T> {
  data: T;
  source: 'api' | 'cache' | 'demo';
  timestamp: string;
}

async function getPopularSearchesWithFallback(
  category: 'occupations' | 'skills' | 'locations' | 'employers' = 'occupations',
  limit: number = 10
): Promise<DataWithSource<PopularSearch[]>> {
  try {
    const result = await getPopularSearches(category, limit);
    if (result && result.length > 0) {
      return { data: result, source: 'api', timestamp: new Date().toISOString() };
    }
  } catch (error) {
    jobLogger.debug('Popular searches API failed, using demo data:', error);
  }

  // Fallback to mock data
  return {
    data: getMockPopularSearches(category),
    source: 'demo',
    timestamp: new Date().toISOString()
  };
}

async function getTrendingSkillsWithFallback(limit: number = 20): Promise<DataWithSource<TrendingSkill[]>> {
  try {
    const result = await getTrendingSkills(limit);
    if (result && result.length > 0) {
      return { data: result, source: 'api', timestamp: new Date().toISOString() };
    }
  } catch (error) {
    jobLogger.debug('Trending skills API failed, using demo data:', error);
  }

  // Fallback to mock data
  return {
    data: getMockTrendingSkills().slice(0, limit),
    source: 'demo',
    timestamp: new Date().toISOString()
  };
}

async function getMarketStatsWithFallback(): Promise<DataWithSource<MarketStats>> {
  try {
    const result = await getMarketStats();
    if (result && result.total_jobs > 0) {
      return { data: result, source: 'api', timestamp: new Date().toISOString() };
    }
  } catch (error) {
    jobLogger.debug('Market stats API failed, using demo data:', error);
  }

  // Fallback to mock data
  return {
    data: getMockMarketStats(),
    source: 'demo',
    timestamp: new Date().toISOString()
  };
}

async function getSalaryStatsWithFallback(occupation: string): Promise<DataWithSource<SalaryStats | null>> {
  try {
    const result = await getSalaryStats(occupation);
    if (result) {
      return { data: result, source: 'api', timestamp: new Date().toISOString() };
    }
  } catch (error) {
    jobLogger.debug('Salary stats API failed, using demo data:', error);
  }

  // Fallback to mock data
  return {
    data: getMockSalaryStats(occupation),
    source: 'demo',
    timestamp: new Date().toISOString()
  };
}

// ============== EXPORT ==============

export const trendsApi = {
  // Original functions (may fail)
  getPopularSearches,
  getTrendingSkills,
  getMarketStats,
  getSalaryStats,

  // Robust functions with fallback (recommended)
  getPopularSearchesWithFallback,
  getTrendingSkillsWithFallback,
  getMarketStatsWithFallback,
  getSalaryStatsWithFallback,
};

export type { DataWithSource };

export default trendsApi;
