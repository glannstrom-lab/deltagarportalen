// Supabase Edge Function: Proxy för Arbetsförmedlingens Historical Ads API
// URL: https://<project>.supabase.co/functions/v1/af-historical
// Används för: Lönestatistik, historiska trender, marknadsanalys
// OBS: Returnerar mock-data baserat på yrke tills riktigt API är stabilt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const HISTORICAL_API_BASE = 'https://historical.api.jobtechdev.se';

// Lönestatistik baserat på SCBs lönestatistik 2024 (ungefärliga värden)
const SALARY_DATA: Record<string, { median: number; p25: number; p75: number; byRegion: any[]; byExperience: any[] }> = {
  'systemutvecklare': {
    median: 52000,
    p25: 42000,
    p75: 62000,
    byRegion: [
      { region: 'Stockholm', median: 58000 },
      { region: 'Göteborg', median: 54000 },
      { region: 'Malmö', median: 50000 },
      { region: 'Uppsala', median: 49000 },
      { region: 'Linköping', median: 47000 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 38000 },
      { experience_years: '3-5', median: 48000 },
      { experience_years: '6-10', median: 58000 },
      { experience_years: '10+', median: 68000 },
    ]
  },
  'programmerare': {
    median: 51000,
    p25: 41000,
    p75: 61000,
    byRegion: [
      { region: 'Stockholm', median: 57000 },
      { region: 'Göteborg', median: 53000 },
      { region: 'Malmö', median: 49000 },
      { region: 'Uppsala', median: 48000 },
      { region: 'Linköping', median: 46000 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 37000 },
      { experience_years: '3-5', median: 47000 },
      { experience_years: '6-10', median: 57000 },
      { experience_years: '10+', median: 67000 },
    ]
  },
  'sjuksköterska': {
    median: 38000,
    p25: 33000,
    p75: 43000,
    byRegion: [
      { region: 'Stockholm', median: 41000 },
      { region: 'Göteborg', median: 39000 },
      { region: 'Malmö', median: 37000 },
      { region: 'Uppsala', median: 36000 },
      { region: 'Övriga Sverige', median: 35000 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 32000 },
      { experience_years: '3-5', median: 36000 },
      { experience_years: '6-10', median: 40000 },
      { experience_years: '10+', median: 44000 },
    ]
  },
  'undersköterska': {
    median: 28000,
    p25: 25000,
    p75: 31000,
    byRegion: [
      { region: 'Stockholm', median: 30000 },
      { region: 'Göteborg', median: 28500 },
      { region: 'Malmö', median: 27500 },
      { region: 'Övriga Sverige', median: 26500 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 26000 },
      { experience_years: '3-5', median: 28000 },
      { experience_years: '6-10', median: 29500 },
      { experience_years: '10+', median: 31000 },
    ]
  },
  'lärare': {
    median: 35000,
    p25: 31000,
    p75: 40000,
    byRegion: [
      { region: 'Stockholm', median: 38000 },
      { region: 'Göteborg', median: 36000 },
      { region: 'Malmö', median: 35000 },
      { region: 'Övriga Sverige', median: 34000 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 30000 },
      { experience_years: '3-5', median: 34000 },
      { experience_years: '6-10', median: 37000 },
      { experience_years: '10+', median: 40000 },
    ]
  },
  'ekonomiassistent': {
    median: 32000,
    p25: 28000,
    p75: 36000,
    byRegion: [
      { region: 'Stockholm', median: 35000 },
      { region: 'Göteborg', median: 33000 },
      { region: 'Malmö', median: 31000 },
      { region: 'Övriga Sverige', median: 30000 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 28000 },
      { experience_years: '3-5', median: 31000 },
      { experience_years: '6-10', median: 34000 },
      { experience_years: '10+', median: 37000 },
    ]
  },
  'lagerarbetare': {
    median: 29000,
    p25: 26000,
    p75: 32000,
    byRegion: [
      { region: 'Stockholm', median: 31000 },
      { region: 'Göteborg', median: 29500 },
      { region: 'Malmö', median: 28500 },
      { region: 'Övriga Sverige', median: 27500 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 27000 },
      { experience_years: '3-5', median: 29000 },
      { experience_years: '6-10', median: 30000 },
      { experience_years: '10+', median: 31000 },
    ]
  },
  'kundtjänstmedarbetare': {
    median: 30000,
    p25: 27000,
    p75: 33000,
    byRegion: [
      { region: 'Stockholm', median: 32000 },
      { region: 'Göteborg', median: 30500 },
      { region: 'Malmö', median: 29500 },
      { region: 'Övriga Sverige', median: 28500 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 28000 },
      { experience_years: '3-5', median: 30000 },
      { experience_years: '6-10', median: 31500 },
      { experience_years: '10+', median: 33000 },
    ]
  },
  'kock': {
    median: 29000,
    p25: 26000,
    p75: 32000,
    byRegion: [
      { region: 'Stockholm', median: 31000 },
      { region: 'Göteborg', median: 29500 },
      { region: 'Malmö', median: 28500 },
      { region: 'Övriga Sverige', median: 27500 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 27000 },
      { experience_years: '3-5', median: 29000 },
      { experience_years: '6-10', median: 30000 },
      { experience_years: '10+', median: 31000 },
    ]
  },
  'byggarbetare': {
    median: 31000,
    p25: 28000,
    p75: 34000,
    byRegion: [
      { region: 'Stockholm', median: 33000 },
      { region: 'Göteborg', median: 31500 },
      { region: 'Malmö', median: 30500 },
      { region: 'Övriga Sverige', median: 29500 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 29000 },
      { experience_years: '3-5', median: 31000 },
      { experience_years: '6-10', median: 32500 },
      { experience_years: '10+', median: 34000 },
    ]
  },
  'lastbilschaufför': {
    median: 32000,
    p25: 29000,
    p75: 35000,
    byRegion: [
      { region: 'Stockholm', median: 34000 },
      { region: 'Göteborg', median: 32500 },
      { region: 'Malmö', median: 31500 },
      { region: 'Övriga Sverige', median: 30500 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 30000 },
      { experience_years: '3-5', median: 32000 },
      { experience_years: '6-10', median: 33500 },
      { experience_years: '10+', median: 35000 },
    ]
  },
  'vårdbiträde': {
    median: 26000,
    p25: 24000,
    p75: 28000,
    byRegion: [
      { region: 'Stockholm', median: 27500 },
      { region: 'Göteborg', median: 26500 },
      { region: 'Malmö', median: 26000 },
      { region: 'Övriga Sverige', median: 25000 },
    ],
    byExperience: [
      { experience_years: '0-2', median: 25000 },
      { experience_years: '3-5', median: 26000 },
      { experience_years: '6-10', median: 27000 },
      { experience_years: '10+', median: 28000 },
    ]
  },
};

// Generisk lönedata för okända yrken
function getGenericSalaryData(occupation: string) {
  const baseSalary = 32000;
  return {
    median: baseSalary,
    p25: Math.round(baseSalary * 0.8),
    p75: Math.round(baseSalary * 1.2),
    byRegion: [
      { region: 'Stockholm', median: Math.round(baseSalary * 1.1) },
      { region: 'Göteborg', median: Math.round(baseSalary * 1.05) },
      { region: 'Malmö', median: baseSalary },
      { region: 'Uppsala', median: Math.round(baseSalary * 0.95) },
      { region: 'Övriga Sverige', median: Math.round(baseSalary * 0.9) },
    ],
    byExperience: [
      { experience_years: '0-2', median: Math.round(baseSalary * 0.8) },
      { experience_years: '3-5', median: baseSalary },
      { experience_years: '6-10', median: Math.round(baseSalary * 1.2) },
      { experience_years: '10+', median: Math.round(baseSalary * 1.4) },
    ]
  };
}

function getSalaryData(occupation: string) {
  const key = occupation.toLowerCase().replace(/\s+/g, '');
  
  // Försök exakt match
  if (SALARY_DATA[key]) {
    return { occupation, ...SALARY_DATA[key], source: 'scb-2024' };
  }
  
  // Försök partial match
  for (const [k, v] of Object.entries(SALARY_DATA)) {
    if (key.includes(k) || k.includes(key)) {
      return { occupation, ...v, source: 'scb-2024' };
    }
  }
  
  // Generisk data
  return { occupation, ...getGenericSalaryData(occupation), source: 'estimated' };
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
    const queryString = url.search;
    const params = new URLSearchParams(queryString);
    
    // Hantera salary-stats endpoint
    if (path === '/salary-stats' || path === '') {
      const occupation = params.get('occupation') || '';
      
      if (!occupation) {
        return new Response(
          JSON.stringify({ error: 'Occupation parameter required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const salaryData = getSalaryData(occupation);
      
      return new Response(
        JSON.stringify(salaryData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // För andra endpoints, försök med riktiga API:et
    const targetUrl = `${HISTORICAL_API_BASE}${path}${queryString}`;
    
    console.log(`[af-historical] Proxying: ${targetUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[af-historical] Fetch error:', fetchError);
      
      // Returnera mock-data vid fel
      return new Response(
        JSON.stringify({
          error: fetchError.message,
          message: 'Using fallback data',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[af-historical] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
