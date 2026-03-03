// Supabase Edge Function: Hämtar RIKTIGA yrken från Arbetsförmedlingens Taxonomy API
// URL: https://<project>.supabase.co/functions/v1/af-taxonomy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAXONOMY_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';
const JOBSEARCH_API_BASE = 'https://jobsearch.api.jobtechdev.se';

interface Concept {
  id: string;
  preferred_label: string;
  type: string;
  definition?: string;
}

// Hämta yrken från Taxonomy API
async function fetchOccupations(query: string, limit: number = 10): Promise<Concept[]> {
  // Taxonomy API har ett GraphQL-liknande gränssnitt
  // Vi använder /concepts med sökparameter
  const url = `${TAXONOMY_API_BASE}/concepts?query=${encodeURIComponent(query)}&type=occupation-name&limit=${limit}`;
  
  console.log(`[af-taxonomy] Fetching: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Taxonomy API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transformera till vårt format
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id || item.concept_id,
        preferred_label: item.preferred_label || item.term,
        type: item.type || 'occupation-name',
        definition: item.definition || item.description
      }));
    }
    
    if (data.concepts) {
      return data.concepts.map((item: any) => ({
        id: item.id || item.concept_id,
        preferred_label: item.preferred_label || item.term,
        type: item.type || 'occupation-name',
        definition: item.definition || item.description
      }));
    }
    
    return [];
  } catch (error) {
    console.error('[af-taxonomy] Error fetching from Taxonomy:', error);
    throw error;
  }
}

// Fallback: Hämta från JobSearch /complete endpoint (mer tillförlitlig)
async function fetchFromJobSearchComplete(query: string, limit: number = 10): Promise<Concept[]> {
  const url = `${JOBSEARCH_API_BASE}/complete?q=${encodeURIComponent(query)}&limit=${limit}`;
  
  console.log(`[af-taxonomy] Trying JobSearch complete: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`JobSearch API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // JobSearch /complete returnerar förslag i olika kategorier
  const results: Concept[] = [];
  
  // Leta efter yrkesförslag
  if (data.occupations) {
    for (const occ of data.occupations.slice(0, limit)) {
      results.push({
        id: occ.id || `occ_${occ.term}`,
        preferred_label: occ.term,
        type: 'occupation',
        definition: ''
      });
    }
  }
  
  // Alternativt format
  if (data.typeahead) {
    for (const item of data.typeahead.slice(0, limit)) {
      if (item.occupation) {
        results.push({
          id: item.occupation.id || `occ_${item.occupation.term}`,
          preferred_label: item.occupation.term,
          type: 'occupation',
          definition: ''
        });
      }
    }
  }
  
  return results;
}

// Huvudfunktion för att hämta yrkesförslag
async function getOccupationSuggestions(query: string, limit: number = 10): Promise<{ concepts: Concept[]; source: string }> {
  // Försök först med Taxonomy API
  try {
    const occupations = await fetchOccupations(query, limit);
    if (occupations.length > 0) {
      return { concepts: occupations, source: 'taxonomy-api' };
    }
  } catch (error) {
    console.log('[af-taxonomy] Taxonomy API failed, trying JobSearch');
  }
  
  // Fallback till JobSearch /complete
  try {
    const occupations = await fetchFromJobSearchComplete(query, limit);
    if (occupations.length > 0) {
      return { concepts: occupations, source: 'jobsearch-complete' };
    }
  } catch (error) {
    console.log('[af-taxonomy] JobSearch API also failed');
  }
  
  // Om inget fungerar, returnera tom lista
  return { concepts: [], source: 'none' };
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
    const path = url.pathname.replace('/af-taxonomy', '').replace('//', '/');
    const params = new URLSearchParams(url.search);
    
    // Hantera concepts endpoint (autocomplete)
    if (path === '/concepts' || path === '') {
      const query = params.get('q') || '';
      const limit = parseInt(params.get('limit') || '10');
      
      if (query.length < 2) {
        return new Response(
          JSON.stringify({ concepts: [], total: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { concepts, source } = await getOccupationSuggestions(query, limit);
      
      return new Response(
        JSON.stringify({
          concepts,
          total: concepts.length,
          source
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // För andra endpoints, proxy till Taxonomy API
    const targetUrl = `${TAXONOMY_API_BASE}${path}${url.search}`;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Taxonomy API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[af-taxonomy] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        concepts: [],
        total: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
