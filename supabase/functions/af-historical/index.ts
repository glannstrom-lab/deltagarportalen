// Supabase Edge Function: Hämtar lönestatistik från Arbetsförmedlingens JobSearch API
// URL: https://<project>.supabase.co/functions/v1/af-historical

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildProxyCorsHeaders, enforceIpRateLimit } from '../_shared/proxyGuard.ts';
import { medFelrapport } from '../_shared/sentry.ts'

/**
 * Meddelandet ur ett okänt kastat värde.
 *
 * `catch (error)` ger `unknown`. Att läsa `.message` rakt av kastar när
 * något annat än ett Error kastas — mitt i det catch-block som skulle ha
 * returnerat felsvaret med CORS-headrarna. Utan headrarna ser anroparen ett
 * CORS-fel i stället för orsaken.
 */
function felText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const JOBSEARCH_API_BASE = 'https://jobsearch.api.jobtechdev.se';

function extractSalary(text: string): number | null {
  if (!text) return null;
  const patterns = [
    /(\d{2})\s?[\.\s]?(\d{3})\s?kr/i,
    /(\d{2})(\d{3})\s?kr/i,
    /(\d{2})\s(\d{3})/,
    /(\d{5})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const salary = match[2] ? parseInt(match[1] + match[2]) : parseInt(match[1]);
      if (salary >= 15000 && salary <= 150000) return salary;
    }
  }
  return null;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * percentile);
  return sorted[Math.min(index, sorted.length - 1)];
}

async function fetchJobs(occupation: string, limit: number = 100): Promise<any[]> {
  const url = `${JOBSEARCH_API_BASE}/search?q=${encodeURIComponent(occupation)}&limit=${limit}`;
  console.log(`[af-historical] Fetching: ${url}`);

  // Timeout — samma mönster som af-jobsearch (A15, 2026-07-23): en hängande
  // JobSearch-anslutning fick tidigare hålla instansen till plattformens
  // maxtid utan att abortera. Den här filen saknade den fixen.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response: Response;
  try {
    response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`JobSearch API error: ${response.status}`);

  const data = await response.json();
  return data.hits || [];
}

async function getSalaryStatistics(occupation: string) {
  const jobs = await fetchJobs(occupation, 100);
  console.log(`[af-historical] Got ${jobs.length} jobs`);
  
  const salaries: number[] = [];
  const regionSalaries: Record<string, number[]> = {};
  
  for (const job of jobs) {
    let salaryText = '';
    
    if (job.salary_description?.text) {
      salaryText = Array.isArray(job.salary_description.text) 
        ? job.salary_description.text.join(' ')
        : job.salary_description.text;
    } else if (job.description?.text) {
      const text = typeof job.description.text === 'string' ? job.description.text : job.description.text.join(' ');
      const salaryMatch = text.match(/lön[:\s]+([^\n\.]{5,50})/i);
      if (salaryMatch) salaryText = salaryMatch[1];
    }
    
    if (salaryText) {
      const salary = extractSalary(salaryText);
      if (salary) {
        salaries.push(salary);
        const region = job.workplace_address?.region || 'Okänd';
        if (!regionSalaries[region]) regionSalaries[region] = [];
        regionSalaries[region].push(salary);
      }
    }
  }
  
  console.log(`[af-historical] Found ${salaries.length} salaries`);
  
  if (salaries.length === 0) throw new Error('No salary data found');
  
  const median = calculateMedian(salaries);
  const p25 = calculatePercentile(salaries, 0.25);
  const p75 = calculatePercentile(salaries, 0.75);
  
  const byRegion = Object.entries(regionSalaries)
    .map(([region, vals]) => ({ region, median: calculateMedian(vals) }))
    .sort((a, b) => b.median - a.median)
    .slice(0, 5);
  
  // 2026-09-24: här stod en fördelning per erfarenhet som var PÅHITTAD —
  // "0-2 år" = p25, "3-5 år" = median × 0,95, "6-10 år" = median × 1,1,
  // "10+ år" = p75 — och skickades ut under etiketten "JobSearch API (n
  // annonser)". Annonserna säger ingenting om erfarenhet. Ett värde utan
  // underlag skickas inte (CLAUDE.md, lärdomen 2026-08-09). Fältet finns
  // inte längre; klienten (afTrendsApi.getSalaryStats) faller på [].
  return {
    occupation,
    median,
    p25,
    p75,
    byRegion,
    source: `JobSearch API (${salaries.length} annonser)`,
    sampleSize: salaries.length
  };
}

serve(medFelrapport('af-historical', async (req) => {
  // A13 (2026-07-23): allowlistad CORS + per-IP-rate-limit i stället för öppen proxy
  const corsHeaders = buildProxyCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const limited = await enforceIpRateLimit(req, 'af-historical');
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-historical', '').replace('//', '/');
    const params = new URLSearchParams(url.search);
    
    if (path === '/salary-stats' || path === '/') {
      const occupation = params.get('occupation');
      if (!occupation) {
        return new Response(
          JSON.stringify({ error: 'Missing occupation parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const stats = await getSalaryStatistics(occupation);
      return new Response(
        JSON.stringify(stats),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Unknown endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[af-historical] Error:', error);
    return new Response(
      JSON.stringify({ error: felText(error), note: 'No salary data available' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}));
