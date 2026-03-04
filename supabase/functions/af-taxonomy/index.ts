// Supabase Edge Function: Hämtar yrken från Arbetsförmedlingens Taxonomy API
// ANONYM TILLGÅNG - ingen auth krävs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAXONOMY_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';
const JOBSEARCH_API_BASE = 'https://jobsearch.api.jobtechdev.se';

interface Concept {
  id: string;
  preferred_label: string;
  type: string;
  definition?: string;
}

async function fetchFromTaxonomy(query: string, limit: number = 10): Promise<Concept[]> {
  const url = `${TAXONOMY_API_BASE}/main/concepts?type=occupation-name&version=16&query=${encodeURIComponent(query)}&limit=${limit}`;
  
  console.log(`[af-taxonomy] Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Taxonomy API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      id: item.id || item.concept_id || `concept_${Math.random().toString(36).substr(2, 9)}`,
      preferred_label: item.preferred_label || item.term || item.label,
      type: item.type || 'occupation-name',
      definition: item.definition || item.description
    }));
  }
  
  return [];
}

async function fetchFromJobSearchComplete(query: string, limit: number = 10): Promise<Concept[]> {
  const url = `${JOBSEARCH_API_BASE}/complete?q=${encodeURIComponent(query)}&limit=${limit}`;
  
  console.log(`[af-taxonomy] Trying JobSearch: ${url}`);
  
  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  
  if (!response.ok) {
    throw new Error(`JobSearch error: ${response.status}`);
  }
  
  const data = await response.json();
  const results: Concept[] = [];
  
  if (data.occupations && Array.isArray(data.occupations)) {
    for (const occ of data.occupations.slice(0, limit)) {
      results.push({
        id: occ.id || `occ_${occ.term}`,
        preferred_label: occ.term,
        type: 'occupation',
        definition: ''
      });
    }
  }
  
  if (results.length === 0 && Array.isArray(data)) {
    for (const item of data.slice(0, limit)) {
      if (typeof item === 'string') {
        results.push({ id: `term_${item}`, preferred_label: item, type: 'occupation', definition: '' });
      } else if (item.term) {
        results.push({ id: item.id || `term_${item.term}`, preferred_label: item.term, type: item.type || 'occupation', definition: '' });
      }
    }
  }
  
  return results;
}

async function getOccupations(query: string, limit: number = 10): Promise<{ concepts: Concept[]; source: string }> {
  if (!query || query.length < 2) {
    return { concepts: [], source: 'none' };
  }
  
  try {
    const concepts = await fetchFromTaxonomy(query, limit);
    if (concepts.length > 0) {
      return { concepts, source: 'taxonomy-api' };
    }
  } catch (error) {
    console.log(`[af-taxonomy] Taxonomy failed: ${error.message}`);
  }
  
  try {
    const concepts = await fetchFromJobSearchComplete(query, limit);
    if (concepts.length > 0) {
      return { concepts, source: 'jobsearch-complete' };
    }
  } catch (error) {
    console.log(`[af-taxonomy] JobSearch failed: ${error.message}`);
  }
  
  return { concepts: [], source: 'none' };
}

serve(async (req) => {
  // CORS - tillåt alla
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-taxonomy', '').replace('//', '/');
    const params = new URLSearchParams(url.search);
    
    if (path === '/concepts' || path === '') {
      const query = params.get('q') || '';
      const limit = parseInt(params.get('limit') || '10');
      
      console.log(`[af-taxonomy] Request: q=${query}, limit=${limit}`);
      
      const { concepts, source } = await getOccupations(query, limit);
      
      return new Response(
        JSON.stringify({ concepts, total: concepts.length, source }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Proxy övriga anrop
    const targetUrl = `${TAXONOMY_API_BASE}${path}${url.search}`;
    const response = await fetch(targetUrl, { 
      method: req.method, 
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[af-taxonomy] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, concepts: [], total: 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
