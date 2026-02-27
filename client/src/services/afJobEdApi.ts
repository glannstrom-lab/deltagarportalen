/**
 * Arbetsförmedlingen JobEd Connect API
 * Kopplar utbildningar till yrken och kompetenser
 * Dokumentation: https://data.arbetsformedlingen.se/jobedconnect/
 * 
 * ANVÄNDER SUPABASE EDGE FUNCTIONS (ingen CORS!)
 */

// Supabase config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function fetchFromJobEd(endpoint: string, params?: Record<string, string>) {
  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  const functionUrl = `${SUPABASE_URL}/functions/v1/af-jobed${endpoint}${queryParams}`;
  
  console.log('Calling Edge Function (JobEd):', functionUrl);
  
  // Timeout efter 10 sekunder
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('JobEd API error:', response.status, errorText);
      throw new Error(`JobEd API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('JobEd API timeout');
    }
    throw error;
  }
}

// ============== EDUCATION TO OCCUPATION ==============

export interface EducationMatch {
  education_code: string;
  education_title: string;
  education_type: string;
  matching_occupations: Array<{
    occupation_id: string;
    occupation_label: string;
    match_score: number;
  }>;
}

export async function getOccupationsForEducation(educationCode: string): Promise<EducationMatch | null> {
  try {
    return await fetchFromJobEd('/education-to-occupations', { education_code: educationCode });
  } catch (error) {
    console.error('Fel vid hämtning av yrken för utbildning:', error);
    return null;
  }
}

// ============== OCCUPATION TO EDUCATION ==============

export interface OccupationEducation {
  occupation_id: string;
  occupation_label: string;
  recommended_educations: Array<{
    education_code: string;
    education_title: string;
    education_type: string;
    duration_months?: number;
    provider?: string;
    description?: string;
    match_score: number;
  }>;
}

export async function getEducationsForOccupation(occupationId: string): Promise<OccupationEducation | null> {
  try {
    return await fetchFromJobEd('/occupation-to-educations', { occupation_id: occupationId });
  } catch (error) {
    console.error('Fel vid hämtning av utbildningar för yrke:', error);
    return null;
  }
}

// ============== COMPETENCIES ==============

export interface CompetencyMatch {
  occupation_id: string;
  occupation_label: string;
  required_competencies: Array<{
    competency_id: string;
    competency_label: string;
    importance: 'essential' | 'preferred' | 'optional';
  }>;
}

export async function getCompetenciesForOccupation(occupationId: string): Promise<CompetencyMatch | null> {
  try {
    return await fetchFromJobEd('/occupation-competencies', { occupation_id: occupationId });
  } catch (error) {
    console.error('Fel vid hämtning av kompetenser:', error);
    return null;
  }
}

// ============== SEARCH EDUCATIONS ==============

export interface Education {
  code: string;
  title: string;
  type: string;
  description?: string;
  duration_months?: number;
  provider?: string;
  url?: string;
}

export async function searchEducations(query: string): Promise<Education[]> {
  try {
    const result = await fetchFromJobEd('/search-educations', { q: query });
    return result.educations || [];
  } catch (error) {
    return [];
  }
}

// ============== MOCK DATA (fallback) ==============

export const MOCK_EDUCATION_PATHS: Record<string, Array<{
  title: string;
  type: string;
  duration: string;
  description: string;
}>> = {
  'sjuksköterska': [
    { title: 'Sjuksköterskeutbildning', type: 'Universitet', duration: '3 år', description: 'Grundläggande sjuksköterskeexamen' },
    { title: 'Sjuksköterskeutbildning för undersköterskor', type: 'Universitet', duration: '2 år', description: 'För dig med undersköterskeutbildning' },
  ],
  'programmerare': [
    { title: 'Systemvetenskapligt program', type: 'Universitet', duration: '3 år', description: 'Datavetenskap och programmering' },
    { title: 'Mjukvaruutvecklare', type: 'Yrkeshögskola', duration: '2 år', description: 'Praktisk utbildning i programmering' },
    { title: 'Webbutvecklare', type: 'Yrkeshögskola', duration: '1 år', description: 'Fokus på webbutveckling' },
  ],
  'lärare': [
    { title: 'Grundlärarutbildning', type: 'Universitet', duration: '4 år', description: 'Förskola och grundskola' },
    { title: 'Ämneslärarutbildning', type: 'Universitet', duration: '5 år', description: 'Grundskola och gymnasium' },
  ],
  'ekonom': [
    { title: 'Civilekonomprogrammet', type: 'Universitet', duration: '4 år', description: 'Ekonomi och management' },
    { title: 'Redovisningsekonom', type: 'Yrkeshögskola', duration: '1.5 år', description: 'Praktisk redovisning' },
  ],
};

export function getMockEducationsForOccupation(occupationLabel: string): Array<{
  title: string;
  type: string;
  duration: string;
  description: string;
}> {
  const normalized = occupationLabel.toLowerCase();
  
  for (const [key, educations] of Object.entries(MOCK_EDUCATION_PATHS)) {
    if (normalized.includes(key)) {
      return educations;
    }
  }
  
  return [
    { title: 'Yrkeshögskoleutbildning', type: 'Yrkeshögskola', duration: '1-2 år', description: 'Praktisk yrkesutbildning' },
    { title: 'Högskoleutbildning', type: 'Universitet', duration: '3-5 år', description: 'Akademisk utbildning' },
  ];
}

// ============== EXPORT ==============

export const jobEdApi = {
  getOccupationsForEducation,
  getEducationsForOccupation,
  getCompetenciesForOccupation,
  searchEducations,
  // getMockEducationsForOccupation, // Endast för testning
  // MOCK_EDUCATION_PATHS, // Endast för testning
};

export default jobEdApi;
