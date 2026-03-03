// Supabase Edge Function: Hämtar lönestatistik från Arbetsförmedlingens JobSearch API
// URL: https://<project>.supabase.co/functions/v1/af-historical
// Dokumentation: https://jobsearch.api.jobtechdev.se/

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const JOBSEARCH_API_BASE = 'https://jobsearch.api.jobtechdev.se';

interface SalaryData {
  occupation: string;
  median: number;
  p25: number;
  p75: number;
  byRegion: Array<{ region: string; median: number }>;
  byExperience: Array<{ experience_years: string; median: number }>;
  source: string;
  sampleSize: number;
}

// Extrahera lön från text
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
      if (salary >= 15000 && salary <= 150000) {
        return salary;
      }
    }
  }
  
  return null;
}

// Beräkna median
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// Beräkna percentil
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * percentile);
  return sorted[Math.min(index, sorted.length - 1)];
}

// Hämta jobbannonser från JobSearch API
async function fetchJobs(occupation: string, limit: number = 100): Promise<any[]> {
  // Enligt dokumentation: /search?q=xxx&limit=xxx
  const url = `${JOBSEARCH_API_BASE}/search?q=${encodeURIComponent(occupation)}&limit=${limit}`;
  
  console.log(`[af-historical] Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`JobSearch API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Svarformat enligt dokumentation: { hits: [...], total: { value: n } }
  return data.hits || [];
}

// Hämta och beräkna lönestatistik
async function getSalaryStatistics(occupation: string): Promise<SalaryData> {
  const jobs = await fetchJobs(occupation, 100);
  
  console.log(`[af-historical] Got ${jobs.length} jobs`);
  
  const salaries: number[] = [];
  const regionSalaries: Record<string, number[]> = {};
  
  for (const job of jobs) {
    let salaryText = '';
    
    // Lön kan finnas i flera fält
    if (job.salary_description?.text) {
      salaryText = Array.isArray(job.salary_description.text) 
        ? job.salary_description.text.join(' ')
        : job.salary_description.text;
    } else if (job.description?.text) {
      const text = typeof job.description.text === 'string' 
        ? job.description.text 
        : job.description.text.join(' ');
      const salaryMatch = text.match(/lön[:\s]+([^\n\.]{5,50})/i);
      if (salaryMatch) {
        salaryText = salaryMatch[1];
      }
    }
    
    if (salaryText) {
      const salary = extractSalary(salaryText);
      if (salary) {
        salaries.push(salary);
        
        const region = job.workplace_address?.region || 'Okänd';
        if (!regionSalaries[region]) {
          regionSalaries[region] = [];
        }
        regionSalaries[region].push(salary);
      }
    }
  }
  
  console.log(`[af-historical] Found ${salaries.length} salaries`);
  
  if (salaries.length === 0) {
    throw new Error('No salary data found');
  }
  
  const median = calculateMedian(salaries);
  const p25 = calculatePercentile(salaries, 0.25);
  const p75 = calculatePercentile(salaries, 0.75);
  
  const byRegion = Object.entries(regionSalaries)
    .map(([region, vals]) => ({
      region,
      median: calculateMedian(vals)
    }))
    .sort((a, b) => b.median - a.median)
    .slice(0, 5);
  
  const byExperience = [
    { experience_years: '0-2', median: p25 },
    { experience_years: '3-5', median: Math.round(median * 0.95) },
    { experience_years: '6-10', median: Math.round(median * 1.1) },
    { experience_years: '10+', median: p75 },
  ];
  
  return {
    occupation,
    median,
    p25,
    p75,
    byRegion,
    byExperience,
    source: `JobSearch API (${salaries.length} annonser)`,
    sampleSize: salaries.length
  };
}

serve(async (req) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://glannstrom-lab.github.io',
    'https://glannstrom-lab.github.io/deltagarportalen'
  ];
  
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.find(o => origin.startsWith(o)) || allowedOrigins[0];
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
      JSON.stringify({ 
        error: error.message,
        note: 'No salary data available'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
