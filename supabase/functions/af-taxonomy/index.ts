// Supabase Edge Function: Proxy för Arbetsförmedlingens Taxonomi API
// URL: https://<project>.supabase.co/functions/v1/af-taxonomy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAXONOMY_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

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
    let path = url.pathname.replace('/af-taxonomy', '').replace('//', '/');
    const queryString = url.search;
    const params = new URLSearchParams(queryString);
    
    // Mappa frontend-anrop till rätt Taxonomy API endpoints
    // Frontend anropar /concepts?q=System&type=occupation
    // Taxonomy API använder /terms/suggest eller /concepts/search
    
    let targetUrl: string;
    
    if (path === '/concepts' || path === '') {
      // Autocomplete/suggest endpoint
      const query = params.get('q') || '';
      const type = params.get('type') || 'occupation-name';
      const limit = params.get('limit') || '10';
      
      // Använd terms/suggest för autocomplete
      targetUrl = `${TAXONOMY_API_BASE}/terms/suggest?query=${encodeURIComponent(query)}&type=${type}&limit=${limit}`;
    } else {
      // Annars prox:a som vanligt
      targetUrl = `${TAXONOMY_API_BASE}${path}${queryString}`;
    }
    
    console.log(`[af-taxonomy] Proxying: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[af-taxonomy] API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Taxonomy API error', 
          status: response.status, 
          details: errorText,
          url: targetUrl 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    // Transformera svaret till det format frontend förväntar sig
    // Frontend förväntar sig: { concepts: Concept[], total: number }
    // där Concept = { id, preferred_label, type, definition }
    let transformedData = data;
    
    // Om detta är en suggest-response, transformera till concepts-format
    if (path === '/concepts' && data.terms) {
      const concepts = data.terms.map((term: any) => ({
        id: term.concept_id || term.concept_uuid || `term_${term.term}`,
        preferred_label: term.term,
        type: term.type || params.get('type') || 'occupation-name',
        definition: term.description || ''
      }));
      
      transformedData = {
        concepts: concepts,
        total: concepts.length
      };
    }

    return new Response(JSON.stringify(transformedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[af-taxonomy] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
