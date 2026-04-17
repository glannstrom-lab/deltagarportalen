// Supabase Edge Function: JobAd Links API Integration
// Hämtar externa jobb från LinkedIn, Indeed, etc som inte finns på Platsbanken

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const JOBAD_LINKS_API = 'https://links.api.jobtechdev.se';

// CORS config
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.jobin.se',
  'https://jobin.se',
  'https://glannstrom-lab.github.io',
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = allowedOrigins.find(o => origin === o) || allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

interface ExternalJob {
  id: string;
  headline: string;
  source: string;
  sourceUrl: string;
  employer?: string;
  location?: string;
  publishedDate?: string;
  occupation?: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-jobad-links', '').replace('//', '/') || '/';

    console.log(`[af-jobad-links] Request path: ${path}`);

    if (path === '/search' || path === '/') {
      const query = url.searchParams.get('q') || '';
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      return await handleSearch(query, limit, offset, corsHeaders);
    } else if (path === '/stats') {
      return await handleStats(corsHeaders);
    } else if (path === '/sources') {
      return await handleSources(corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unknown endpoint', path }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[af-jobad-links] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Search external job ads
async function handleSearch(
  query: string,
  limit: number,
  offset: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // JobAd Links API uses a different format
    // The API provides links to external job postings
    const searchUrl = `${JOBAD_LINKS_API}/joblinks?offset=${offset}&limit=${limit}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
    console.log(`[af-jobad-links] Fetching: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      // If API returns error, try alternative endpoint structure
      console.log(`[af-jobad-links] Primary endpoint failed with ${response.status}, trying alternative...`);

      // Try the stream endpoint which provides all links
      const altUrl = `${JOBAD_LINKS_API}/joblinks/stream?limit=${limit}`;
      const altResponse = await fetch(altUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!altResponse.ok) {
        throw new Error(`JobAd Links API error: ${altResponse.status}`);
      }

      const text = await altResponse.text();
      // Stream endpoint returns NDJSON
      const jobs = text.split('\n')
        .filter(line => line.trim())
        .slice(0, limit)
        .map((line, idx) => {
          try {
            const data = JSON.parse(line);
            return transformJobLink(data, idx);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      return new Response(JSON.stringify({
        total: jobs.length,
        jobs,
        source: 'stream'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Transform the response
    const jobs = (data.hits || data.joblinks || []).map((job: any, idx: number) =>
      transformJobLink(job, idx)
    );

    return new Response(JSON.stringify({
      total: data.total?.value || jobs.length,
      jobs,
      source: 'api'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[af-jobad-links] Search error:', error);
    throw error;
  }
}

// Transform raw job link data to our format
function transformJobLink(data: any, idx: number): ExternalJob {
  return {
    id: data.id || `ext-${idx}-${Date.now()}`,
    headline: data.headline || data.header || data.title || 'Extern tjänst',
    source: extractSource(data.url || data.source_url || ''),
    sourceUrl: data.url || data.source_url || data.link || '',
    employer: data.employer?.name || data.company || extractEmployerFromUrl(data.url || ''),
    location: data.workplace?.municipality || data.location || '',
    publishedDate: data.publication_date || data.published || new Date().toISOString(),
    occupation: data.occupation?.label || data.occupation_group?.label || '',
  };
}

// Extract source name from URL
function extractSource(url: string): string {
  if (!url) return 'Extern';
  if (url.includes('linkedin')) return 'LinkedIn';
  if (url.includes('indeed')) return 'Indeed';
  if (url.includes('monster')) return 'Monster';
  if (url.includes('stepstone')) return 'StepStone';
  if (url.includes('careerbuilder')) return 'CareerBuilder';
  if (url.includes('glassdoor')) return 'Glassdoor';
  if (url.includes('blocket')) return 'Blocket Jobb';
  if (url.includes('jobbsafari')) return 'Jobbsafari';
  if (url.includes('metrojobb')) return 'Metrojobb';
  if (url.includes('arbetsformedlingen')) return 'Arbetsförmedlingen';
  return 'Extern';
}

// Try to extract employer from URL
function extractEmployerFromUrl(url: string): string | undefined {
  // Just return undefined - we can't reliably extract employer from URL
  return undefined;
}

// Get statistics about available external jobs
async function handleStats(corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Get total count from API
    const countUrl = `${JOBAD_LINKS_API}/joblinks?limit=1`;
    const response = await fetch(countUrl, {
      headers: { 'Accept': 'application/json' }
    });

    let totalJobs = 51000; // Fallback estimate

    if (response.ok) {
      const data = await response.json();
      totalJobs = data.total?.value || totalJobs;
    }

    // Group by source (estimated distribution)
    const sourceDistribution = [
      { source: 'LinkedIn', count: Math.floor(totalJobs * 0.35), icon: '💼' },
      { source: 'Indeed', count: Math.floor(totalJobs * 0.25), icon: '🔍' },
      { source: 'Monster', count: Math.floor(totalJobs * 0.10), icon: '👹' },
      { source: 'StepStone', count: Math.floor(totalJobs * 0.08), icon: '📊' },
      { source: 'Glassdoor', count: Math.floor(totalJobs * 0.07), icon: '🚪' },
      { source: 'Blocket Jobb', count: Math.floor(totalJobs * 0.05), icon: '📦' },
      { source: 'Övriga', count: Math.floor(totalJobs * 0.10), icon: '🌐' },
    ];

    return new Response(JSON.stringify({
      totalJobs,
      sourceDistribution,
      lastUpdated: new Date().toISOString(),
      description: 'Externa jobb som inte finns på Platsbanken',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[af-jobad-links] Stats error:', error);
    throw error;
  }
}

// Get list of available sources
async function handleSources(corsHeaders: Record<string, string>): Promise<Response> {
  const sources = [
    { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com/jobs', icon: '💼', description: 'Världens största professionella nätverk' },
    { id: 'indeed', name: 'Indeed', url: 'https://indeed.se', icon: '🔍', description: 'En av världens största jobbsajter' },
    { id: 'monster', name: 'Monster', url: 'https://monster.se', icon: '👹', description: 'Etablerad internationell jobbsajt' },
    { id: 'stepstone', name: 'StepStone', url: 'https://stepstone.se', icon: '📊', description: 'Europeisk jobbportal' },
    { id: 'glassdoor', name: 'Glassdoor', url: 'https://glassdoor.com', icon: '🚪', description: 'Jobb med företagsrecensioner' },
    { id: 'blocket', name: 'Blocket Jobb', url: 'https://jobb.blocket.se', icon: '📦', description: 'Svenska annonser' },
  ];

  return new Response(JSON.stringify({ sources }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
