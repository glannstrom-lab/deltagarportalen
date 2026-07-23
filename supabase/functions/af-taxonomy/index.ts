// Supabase Edge Function: Hämtar yrken från Arbetsförmedlingens Taxonomy API
// ANONYM TILLGÅNG - ingen auth krävs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildProxyCorsHeaders, enforceIpRateLimit } from '../_shared/proxyGuard.ts';

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

/**
 * Hämtar conceptId direkt från JobSearch:s /search-endpoint. Vi söker jobb med
 * en bred query och extraherar unika occupation-objekt (med concept_id) från
 * hits. Detta ger riktiga AF concept_ids som funkar för matchning, även
 * när taxonomy.api är nere.
 */
async function fetchFromJobSearchSearch(query: string, limit: number = 10): Promise<Concept[]> {
  const url = `${JOBSEARCH_API_BASE}/search?q=${encodeURIComponent(query)}&limit=50`;

  console.log(`[af-taxonomy] JobSearch /search: ${url}`);

  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

  if (!response.ok) {
    throw new Error(`JobSearch error: ${response.status}`);
  }

  const data = await response.json();
  const seen = new Map<string, Concept>();

  if (data.hits && Array.isArray(data.hits)) {
    for (const hit of data.hits) {
      const occ = hit.occupation;
      if (occ?.concept_id && occ.label && !seen.has(occ.concept_id)) {
        seen.set(occ.concept_id, {
          id: occ.concept_id,
          preferred_label: occ.label,
          type: 'occupation',
        });
        if (seen.size >= limit) break;
      }
    }
  }

  // Fallback: lägg till occupation_group-träffar om vi har plats kvar
  if (seen.size < limit && data.hits && Array.isArray(data.hits)) {
    for (const hit of data.hits) {
      const group = hit.occupation_group;
      if (group?.concept_id && group.label && !seen.has(group.concept_id)) {
        seen.set(group.concept_id, {
          id: group.concept_id,
          preferred_label: group.label,
          type: 'occupation-group',
        });
        if (seen.size >= limit) break;
      }
    }
  }

  return Array.from(seen.values());
}

/** Legacy fallback — /complete-endpoint ger occupation-namn utan concept_id. */
async function fetchFromJobSearchComplete(query: string, limit: number = 10): Promise<Concept[]> {
  const url = `${JOBSEARCH_API_BASE}/complete?q=${encodeURIComponent(query)}&limit=${limit * 2}`;

  console.log(`[af-taxonomy] JobSearch /complete: ${url}`);

  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

  if (!response.ok) {
    throw new Error(`JobSearch error: ${response.status}`);
  }

  const data = await response.json();
  const results: Concept[] = [];

  if (Array.isArray(data.typeahead)) {
    for (const item of data.typeahead) {
      if (item.type === 'occupation' && item.value) {
        // Inget concept_id från /complete — använd value som id (kommer ej matcha exakt).
        results.push({
          id: `term_${item.value}`,
          preferred_label: item.value,
          type: 'occupation',
        });
        if (results.length >= limit) break;
      }
    }
  }

  return results;
}

async function getOccupations(query: string, limit: number = 10): Promise<{ concepts: Concept[]; source: string }> {
  if (!query || query.length < 2) {
    return { concepts: [], source: 'none' };
  }

  // Primär källa: JobSearch /search — ger riktiga concept_ids från aktiva jobb.
  try {
    const concepts = await fetchFromJobSearchSearch(query, limit);
    if (concepts.length > 0) {
      return { concepts, source: 'jobsearch-search' };
    }
  } catch (error) {
    console.log(`[af-taxonomy] JobSearch /search failed: ${error.message}`);
  }

  // Sekundär: taxonomy.api (när den fungerar)
  try {
    const concepts = await fetchFromTaxonomy(query, limit);
    if (concepts.length > 0) {
      return { concepts, source: 'taxonomy-api' };
    }
  } catch (error) {
    console.log(`[af-taxonomy] Taxonomy failed: ${error.message}`);
  }

  // Sista fallback: /complete (utan concept_ids — fritext-matchning)
  try {
    const concepts = await fetchFromJobSearchComplete(query, limit);
    if (concepts.length > 0) {
      return { concepts, source: 'jobsearch-complete' };
    }
  } catch (error) {
    console.log(`[af-taxonomy] JobSearch /complete failed: ${error.message}`);
  }

  return { concepts: [], source: 'none' };
}

serve(async (req) => {
  // A13 (2026-07-23): allowlistad CORS + per-IP-rate-limit i stället för öppen proxy
  const corsHeaders = buildProxyCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const limited = await enforceIpRateLimit(req, 'af-taxonomy');
  if (limited) return limited;

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
