/**
 * JobAd Links API Service
 * Hämtar externa jobb från LinkedIn, Indeed, etc som inte finns på Platsbanken
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ExternalJob {
  id: string;
  headline: string;
  source: string;
  sourceUrl: string;
  employer?: string;
  location?: string;
  publishedDate?: string;
  occupation?: string;
}

export interface ExternalJobsResponse {
  total: number;
  jobs: ExternalJob[];
  source: 'api' | 'stream';
}

export interface ExternalJobStats {
  totalJobs: number;
  sourceDistribution: {
    source: string;
    count: number;
    icon: string;
  }[];
  lastUpdated: string;
  description: string;
}

export interface JobSource {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
}

// Cache for stats and sources
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchFromFunction<T>(endpoint: string): Promise<T> {
  const cacheKey = endpoint;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/af-jobad-links${endpoint}`, {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data as T;
}

/**
 * Search external job ads
 */
export async function searchExternalJobs(
  query?: string,
  limit = 50,
  offset = 0
): Promise<ExternalJobsResponse> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  return fetchFromFunction<ExternalJobsResponse>(`/search?${params.toString()}`);
}

/**
 * Get statistics about external jobs
 */
export async function getExternalJobStats(): Promise<ExternalJobStats> {
  return fetchFromFunction<ExternalJobStats>('/stats');
}

/**
 * Get list of external job sources
 */
export async function getJobSources(): Promise<{ sources: JobSource[] }> {
  return fetchFromFunction<{ sources: JobSource[] }>('/sources');
}

// Source badge colors for UI
export const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'LinkedIn': {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800'
  },
  'Indeed': {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800'
  },
  'Monster': {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800'
  },
  'StepStone': {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800'
  },
  'Glassdoor': {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  'Blocket Jobb': {
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800'
  },
  'Extern': {
    bg: 'bg-stone-50 dark:bg-stone-800',
    text: 'text-stone-700 dark:text-stone-400',
    border: 'border-stone-200 dark:border-stone-700'
  },
};

export function getSourceColors(source: string) {
  return SOURCE_COLORS[source] || SOURCE_COLORS['Extern'];
}

export default {
  searchExternalJobs,
  getExternalJobStats,
  getJobSources,
  getSourceColors,
  SOURCE_COLORS,
};
