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


// ============== ROBUST API WRAPPERS ==============

/**
 * Wrapper functions that return data with source indicator
 * No fallback to mock data - throws error if API fails
 */

export interface DataWithSource<T> {
  data: T;
  source: 'api' | 'cache';
  timestamp: string;
}

async function getPopularSearchesWithFallback(
  category: 'occupations' | 'skills' | 'locations' | 'employers' = 'occupations',
  limit: number = 10
): Promise<DataWithSource<PopularSearch[]>> {
  const result = await getPopularSearches(category, limit);
  if (result && result.length > 0) {
    return { data: result, source: 'api', timestamp: new Date().toISOString() };
  }
  throw new Error('No data available from API');
}

async function getTrendingSkillsWithFallback(limit: number = 20): Promise<DataWithSource<TrendingSkill[]>> {
  const result = await getTrendingSkills(limit);
  if (result && result.length > 0) {
    return { data: result, source: 'api', timestamp: new Date().toISOString() };
  }
  throw new Error('No data available from API');
}

async function getMarketStatsWithFallback(): Promise<DataWithSource<MarketStats>> {
  const result = await getMarketStats();
  if (result && result.total_jobs > 0) {
    return { data: result, source: 'api', timestamp: new Date().toISOString() };
  }
  throw new Error('No data available from API');
}

async function getSalaryStatsWithFallback(occupation: string): Promise<DataWithSource<SalaryStats | null>> {
  const result = await getSalaryStats(occupation);
  if (result) {
    return { data: result, source: 'api', timestamp: new Date().toISOString() };
  }
  return { data: null, source: 'api', timestamp: new Date().toISOString() };
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
