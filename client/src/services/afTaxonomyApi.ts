/**
 * Arbetsförmedlingen Taxonomi API
 * Hanterar yrken, kompetenser, utbildningar och begrepp
 * Dokumentation: https://data.arbetsformedlingen.se/taxonomi/
 * 
 * ANVÄNDER SUPABASE EDGE FUNCTIONS (ingen CORS!) + CACHING + RETRY
 */

import { taxonomyCache } from './cacheService';
import { withRetry, fetchWithRetry } from './retryService';

// Supabase config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function fetchFromTaxonomy(endpoint: string, params?: Record<string, string>) {
  const cacheKey = `taxonomy:${endpoint}:${JSON.stringify(params)}`;
  
  // Kolla cache först
  const cached = taxonomyCache.get(cacheKey);
  if (cached) {
    console.log('[Taxonomy] Cache hit:', endpoint);
    return cached;
  }
  
  // Bygg query string
  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  const functionUrl = `${SUPABASE_URL}/functions/v1/af-taxonomy${endpoint}${queryParams}`;
  
  console.log('[Taxonomy] Fetching:', functionUrl);
  
  // Kör med retry-logik
  const data = await withRetry(async () => {
    const response = await fetchWithRetry(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }, { maxRetries: 2, baseDelay: 1000 });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Taxonomy] API error:', response.status, errorText);
      throw new Error(`Taxonomy API error: ${response.status}`);
    }
    
    return response.json();
  }, { maxRetries: 2 }, `Taxonomy ${endpoint}`);
  
  // Spara i cache (1 timme för taxonomi)
  taxonomyCache.set(cacheKey, data);
  
  return data;
}

// ============== CONCEPT TYPES ==============

export interface ConceptType {
  id: string;
  name: string;
  description?: string;
}

export async function getConceptTypes(): Promise<ConceptType[]> {
  return fetchFromTaxonomy('/concept-types');
}

// ============== CONCEPTS ==============

export interface Concept {
  id: string;
  preferred_label: string;
  type: string;
  definition?: string;
  deprecated?: boolean;
}

export interface ConceptSearchResult {
  concepts: Concept[];
  total: number;
}

export async function searchConcepts(
  query: string, 
  type?: string, 
  limit: number = 20
): Promise<ConceptSearchResult> {
  const params: Record<string, string> = { q: query, limit: String(limit) };
  if (type) params.type = type;
  
  return fetchFromTaxonomy('/concepts', params);
}

export async function getConceptById(id: string): Promise<Concept> {
  return fetchFromTaxonomy(`/concepts/${id}`);
}

// ============== OCCUPATIONS (YRKEN) ==============

export interface Occupation {
  id: string;
  preferred_label: string;
  ssyk_code?: string;
  ssyk_level?: number;
  definition?: string;
}

export async function searchOccupations(query: string, limit: number = 20): Promise<Occupation[]> {
  const result = await searchConcepts(query, 'occupation', limit);
  return result.concepts.map(c => ({
    id: c.id,
    preferred_label: c.preferred_label,
    definition: c.definition
  }));
}

export async function getOccupationBySSYK(ssykCode: string): Promise<Occupation | null> {
  try {
    const result = await searchConcepts(ssykCode, 'occupation', 1);
    if (result.concepts.length > 0) {
      const concept = result.concepts[0];
      return {
        id: concept.id,
        preferred_label: concept.preferred_label,
        definition: concept.definition
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ============== SKILLS (KOMPETENSER) ==============

export interface Skill {
  id: string;
  preferred_label: string;
  definition?: string;
  type: string;
}

export async function searchSkills(query: string, limit: number = 20): Promise<Skill[]> {
  const result = await searchConcepts(query, 'skill', limit);
  return result.concepts.map(c => ({
    id: c.id,
    preferred_label: c.preferred_label,
    definition: c.definition,
    type: 'skill'
  }));
}

export async function getSkillsForOccupation(occupationId: string): Promise<Skill[]> {
  try {
    const relations = await fetchFromTaxonomy(`/concepts/${occupationId}/relations`, {
      relation_type: 'has_skill'
    });
    
    return relations
      .filter((r: any) => r.to_concept?.type === 'skill')
      .map((r: any) => ({
        id: r.to_concept.id,
        preferred_label: r.to_concept.preferred_label,
        definition: r.to_concept.definition,
        type: 'skill'
      }));
  } catch (error) {
    return [];
  }
}

// ============== RELATIONS ==============

export interface ConceptRelation {
  id: string;
  from_concept: Concept;
  to_concept: Concept;
  relation_type: string;
}

export async function getRelatedConcepts(
  conceptId: string, 
  relationType?: string
): Promise<ConceptRelation[]> {
  const params: Record<string, string> = {};
  if (relationType) params.relation_type = relationType;
  
  return fetchFromTaxonomy(`/concepts/${conceptId}/relations`, params);
}

// ============== SSYK STRUCTURE ==============

export interface SSYKGroup {
  code: string;
  label: string;
  level: number;
}

// Vanliga SSYK-nivåer för snabb åtkomst
export const COMMON_SSYK_GROUPS = [
  { code: '1', label: 'Chefsyrken', level: 1 },
  { code: '2', label: 'Yrken med krav på fördjupad högskolekompetens', level: 1 },
  { code: '3', label: 'Yrken med krav på högskolekompetens', level: 1 },
  { code: '4', label: 'Kontors- och kundserviceyrken', level: 1 },
  { code: '5', label: 'Service-, omsorgs- och försäljningsyrken', level: 1 },
  { code: '6', label: 'Lantbruks-, trädgårds-, fiske- och hantverksyrken', level: 1 },
  { code: '7', label: 'Process- och maskinoperatörsyrken', level: 1 },
  { code: '8', label: 'Enklare yrken', level: 1 },
  { code: '9', label: 'Oförutsägbart arbete', level: 1 },
];

export async function getOccupationsBySSYK(ssykCode: string): Promise<Occupation[]> {
  const result = await searchConcepts(ssykCode, 'occupation', 50);
  return result.concepts
    .filter(c => c.preferred_label && !c.deprecated)
    .map(c => ({
      id: c.id,
      preferred_label: c.preferred_label,
      definition: c.definition
    }));
}

// ============== AUTOCOMPLETE ==============

export interface AutocompleteSuggestion {
  id: string;
  label: string;
  type: string;
}

export async function autocompleteOccupations(query: string): Promise<AutocompleteSuggestion[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const occupations = await searchOccupations(query, 10);
    return occupations.map(o => ({
      id: o.id,
      label: o.preferred_label,
      type: 'occupation'
    }));
  } catch (error) {
    return [];
  }
}

export async function autocompleteSkills(query: string): Promise<AutocompleteSuggestion[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const skills = await searchSkills(query, 10);
    return skills.map(s => ({
      id: s.id,
      label: s.preferred_label,
      type: 'skill'
    }));
  } catch (error) {
    return [];
  }
}

// ============== POPULAR OCCUPATIONS ==============
// Baserat på vanliga sökningar i Platsbanken

export const POPULAR_OCCUPATIONS = [
  { id: 'occupation_1', label: 'Systemutvecklare', category: 'IT' },
  { id: 'occupation_2', label: 'Sjuksköterska', category: 'Vård' },
  { id: 'occupation_3', label: 'Lärare', category: 'Utbildning' },
  { id: 'occupation_4', label: 'Ekonomiassistent', category: 'Ekonomi' },
  { id: 'occupation_5', label: 'Lagerarbetare', category: 'Lager' },
  { id: 'occupation_6', label: 'Kundtjänstmedarbetare', category: 'Service' },
  { id: 'occupation_7', label: 'Byggarbetare', category: 'Bygg' },
  { id: 'occupation_8', label: 'Kock', category: 'Hotell/Restaurang' },
  { id: 'occupation_9', label: 'Lastbilschaufför', category: 'Transport' },
  { id: 'occupation_10', label: 'Vårdbiträde', category: 'Vård' },
];

// ============== EXPORT ==============

export const taxonomyApi = {
  // Concepts
  getConceptTypes,
  searchConcepts,
  getConceptById,
  
  // Occupations
  searchOccupations,
  getOccupationBySSYK,
  getOccupationsBySSYK,
  autocompleteOccupations,
  
  // Skills
  searchSkills,
  getSkillsForOccupation,
  autocompleteSkills,
  
  // Relations
  getRelatedConcepts,
  
  // Constants
  POPULAR_OCCUPATIONS,
  COMMON_SSYK_GROUPS,
};

export default taxonomyApi;
