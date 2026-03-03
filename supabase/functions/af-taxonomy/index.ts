// Supabase Edge Function: Proxy för Arbetsförmedlingens Taxonomi API
// URL: https://<project>.supabase.co/functions/v1/af-taxonomy
// OBS: Taxonomy API är ofta långsamt, så vi använder mock-data som fallback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAXONOMY_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

// Mock-data för populära yrken (fallback när API är nere)
const POPULAR_OCCUPATIONS = [
  { id: 'occupation_1', preferred_label: 'Systemutvecklare', type: 'occupation-name' },
  { id: 'occupation_2', preferred_label: 'Sjuksköterska', type: 'occupation-name' },
  { id: 'occupation_3', preferred_label: 'Lärare', type: 'occupation-name' },
  { id: 'occupation_4', preferred_label: 'Ekonomiassistent', type: 'occupation-name' },
  { id: 'occupation_5', preferred_label: 'Lagerarbetare', type: 'occupation-name' },
  { id: 'occupation_6', preferred_label: 'Kundtjänstmedarbetare', type: 'occupation-name' },
  { id: 'occupation_7', preferred_label: 'Byggarbetare', type: 'occupation-name' },
  { id: 'occupation_8', preferred_label: 'Kock', type: 'occupation-name' },
  { id: 'occupation_9', preferred_label: 'Lastbilschaufför', type: 'occupation-name' },
  { id: 'occupation_10', preferred_label: 'Vårdbiträde', type: 'occupation-name' },
  { id: 'occupation_11', preferred_label: 'Programmerare', type: 'occupation-name' },
  { id: 'occupation_12', preferred_label: 'Väktare', type: 'occupation-name' },
  { id: 'occupation_13', preferred_label: 'Städare', type: 'occupation-name' },
  { id: 'occupation_14', preferred_label: 'Personlig assistent', type: 'occupation-name' },
  { id: 'occupation_15', preferred_label: 'Undersköterska', type: 'occupation-name' },
];

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
    const path = url.pathname.replace('/af-taxonomy', '').replace('//', '/');
    const queryString = url.search;
    const params = new URLSearchParams(queryString);
    
    // Hantera autocomplete för yrken
    if (path === '/concepts' || path === '') {
      const query = (params.get('q') || '').toLowerCase();
      const type = params.get('type') || 'occupation-name';
      
      // Filtrera mock-data på query
      const filtered = POPULAR_OCCUPATIONS.filter(o => 
        o.preferred_label.toLowerCase().includes(query)
      );
      
      // Om vi har matchande mock-data, returnera det
      if (filtered.length > 0) {
        return new Response(
          JSON.stringify({
            concepts: filtered,
            total: filtered.length,
            source: 'mock'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Om ingen match i mock-data, returnera tom lista
      return new Response(
        JSON.stringify({
          concepts: [],
          total: 0,
          source: 'mock'
        }),
        {
          headers: { ...corsHeaders, 'Type': 'application/json' },
        }
      );
    }
    
    // För andra endpoints, försök med riktiga API:et
    const targetUrl = `${TAXONOMY_API_BASE}${path}${queryString}`;
    
    console.log(`[af-taxonomy] Proxying: ${targetUrl}`);

    // Använd AbortController för timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekunder timeout
    
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
      console.error('[af-taxonomy] Fetch error:', fetchError);
      
      // Returnera mock-data vid timeout/fel
      return new Response(
        JSON.stringify({
          concepts: POPULAR_OCCUPATIONS.slice(0, 5),
          total: 5,
          source: 'mock-fallback',
          error: fetchError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[af-taxonomy] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        concepts: POPULAR_OCCUPATIONS.slice(0, 5),
        total: 5,
        source: 'mock-error'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
