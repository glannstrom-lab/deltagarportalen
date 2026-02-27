/**
 * Arbetsförmedlingen JobAd Enrichments API
 * AI-baserad analys av jobbannonser
 * Extraherar kompetenser, nyckelord och krav
 * Dokumentation: https://data.arbetsformedlingen.se/jobad-enrichments/
 */

const ENRICHMENTS_API_BASE = '/af/enrichments/v1';

async function fetchEnrichments(jobAdId: string, forceRefresh: boolean = false) {
  const url = `${ENRICHMENTS_API_BASE}/enrichments/${jobAdId}${forceRefresh ? '?refresh=true' : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      // Enrichment finns inte ännu, försök skapa den
      return null;
    }
    throw new Error(`Enrichments API error: ${response.status}`);
  }
  
  return response.json();
}

// ============== ENRICHMENT DATA ==============

export interface JobAdEnrichment {
  job_ad_id: string;
  enriched_at: string;
  
  // Extraherade entiteter
  entities: {
    skills: Array<{
      id: string;
      label: string;
      frequency: number;
      importance: 'essential' | 'preferred';
    }>;
    
    occupations: Array<{
      id: string;
      label: string;
      relevance: number;
    }>;
    
    competencies: Array<{
      id: string;
      label: string;
      type: string;
    }>;
    
    languages: Array<{
      code: string;
      label: string;
      level?: string;
    }>;
    
    drivers_licenses: Array<{
      category: string;
      required: boolean;
    }>;
    
    education_requirements: Array<{
      level: string;
      field?: string;
      required: boolean;
    }>;
    
    experience_requirements: Array<{
      years: number;
      field?: string;
      required: boolean;
    }>;
  };
  
  // Nyckelord och fraser
  keywords: Array<{
    term: string;
    frequency: number;
    importance: number;
  }>;
  
  // Kategorisering
  categories: {
    industry?: string;
    sector?: string;
    work_environment?: string;
  };
  
  // Målgruppsanalys
  target_audience: {
    experience_level?: 'entry' | 'junior' | 'mid' | 'senior';
    career_changers?: boolean;
    newly_graduated?: boolean;
  };
}

// ============== GET ENRICHMENT ==============

export async function getJobAdEnrichment(
  jobAdId: string, 
  waitForProcessing: boolean = false
): Promise<JobAdEnrichment | null> {
  try {
    let enrichment = await fetchEnrichments(jobAdId);
    
    // Om enrichment inte finns än och vi ska vänta
    if (!enrichment && waitForProcessing) {
      // Vänta och försök igen (max 3 försök)
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        enrichment = await fetchEnrichments(jobAdId);
        if (enrichment) break;
      }
    }
    
    return enrichment;
  } catch (error) {
    console.error('Fel vid hämtning av enrichment:', error);
    return null;
  }
}

// ============== ANALYZE TEXT ==============

export interface TextAnalysisResult {
  skills: string[];
  keywords: string[];
  experience_required: boolean;
  education_required: boolean;
  languages: string[];
}

export async function analyzeJobText(text: string): Promise<TextAnalysisResult> {
  // Fallback-analys när API inte är tillgängligt
  const commonSkills = [
    'kommunikation', 'samarbete', 'organisation', 'ledarskap',
    'kundservice', 'data', 'excel', 'programmering', 'projektledning',
    'försäljning', 'marknadsföring', 'ekonomi', 'redovisning'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  const experienceKeywords = ['erfarenhet', 'års erfarenhet', 'tidigare erfarenhet', 'erfaren av'];
  const educationKeywords = ['utbildning', 'examen', 'universitet', 'högskola', 'yrkeshögskola'];
  const languageKeywords = ['engelska', 'svenska', 'norska', 'danska', 'tyska', 'franska', 'spanska'];
  
  return {
    skills: foundSkills,
    keywords: extractKeywords(text),
    experience_required: experienceKeywords.some(kw => text.toLowerCase().includes(kw)),
    education_required: educationKeywords.some(kw => text.toLowerCase().includes(kw)),
    languages: languageKeywords.filter(lang => text.toLowerCase().includes(lang.toLowerCase()))
  };
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\såäöÅÄÖ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// ============== CV MATCHING ==============

export interface CVMatchResult {
  overall_score: number;
  skill_match: number;
  keyword_match: number;
  experience_match: number;
  education_match: number;
  
  matching_skills: string[];
  missing_skills: string[];
  suggestions: string[];
}

export function calculateCVMatch(
  cvData: { skills: string[]; experience: string[]; education: string[] },
  enrichment: JobAdEnrichment | null,
  jobText: string
): CVMatchResult {
  if (!enrichment) {
    // Fallback till textbaserad matchning
    return fallbackCVMatch(cvData, jobText);
  }
  
  const jobSkills = enrichment.entities.skills.map(s => s.label.toLowerCase());
  const cvSkills = cvData.skills.map(s => s.toLowerCase());
  
  const matchingSkills = jobSkills.filter(jobSkill => 
    cvSkills.some(cvSkill => cvSkill.includes(jobSkill) || jobSkill.includes(cvSkill))
  );
  
  const missingSkills = jobSkills.filter(jobSkill => 
    !cvSkills.some(cvSkill => cvSkill.includes(jobSkill) || jobSkill.includes(cvSkill))
  );
  
  const skillMatch = jobSkills.length > 0 
    ? Math.round((matchingSkills.length / jobSkills.length) * 100)
    : 50;
  
  // Nyckelordsmatchning
  const jobKeywords = enrichment.keywords.map(k => k.term.toLowerCase());
  const cvKeywords = [...cvData.skills, ...cvData.experience].map(k => k.toLowerCase());
  const matchingKeywords = jobKeywords.filter(kw => 
    cvKeywords.some(ckw => ckw.includes(kw) || kw.includes(ckw))
  );
  
  const keywordMatch = jobKeywords.length > 0
    ? Math.round((matchingKeywords.length / jobKeywords.length) * 100)
    : 50;
  
  // Övergripande score
  const overallScore = Math.round((skillMatch * 0.6) + (keywordMatch * 0.4));
  
  return {
    overall_score: overallScore,
    skill_match: skillMatch,
    keyword_match: keywordMatch,
    experience_match: enrichment.target_audience.experience_level ? 60 : 50,
    education_match: enrichment.entities.education_requirements.length > 0 ? 60 : 50,
    matching_skills: matchingSkills,
    missing_skills: missingSkills.slice(0, 5),
    suggestions: generateSuggestions(enrichment, missingSkills)
  };
}

function fallbackCVMatch(
  cvData: { skills: string[]; experience: string[]; education: string[] },
  jobText: string
): CVMatchResult {
  const jobTextLower = jobText.toLowerCase();
  const cvSkills = cvData.skills.map(s => s.toLowerCase());
  
  const commonSkills = [
    'kommunikation', 'samarbete', 'organisation', 'ledarskap',
    'kundservice', 'excel', 'powerpoint', 'word', 'programmering',
    'projektledning', 'försäljning', 'marknadsföring', 'ekonomi'
  ];
  
  const foundInJob = commonSkills.filter(skill => jobTextLower.includes(skill));
  const matchingSkills = foundInJob.filter(skill => 
    cvSkills.some(cs => cs.includes(skill) || skill.includes(cs))
  );
  
  const skillMatch = foundInJob.length > 0 
    ? Math.round((matchingSkills.length / foundInJob.length) * 100)
    : 50;
  
  return {
    overall_score: skillMatch,
    skill_match: skillMatch,
    keyword_match: 50,
    experience_match: 50,
    education_match: 50,
    matching_skills: matchingSkills,
    missing_skills: foundInJob.filter(s => !matchingSkills.includes(s)).slice(0, 5),
    suggestions: [
      'Anpassa ditt CV för att lyfta fram relevanta erfarenheter',
      'Inkludera nyckelord från annonsen',
      'Beskriv konkreta resultat från tidigare roller'
    ]
  };
}

function generateSuggestions(
  enrichment: JobAdEnrichment,
  missingSkills: string[]
): string[] {
  const suggestions: string[] = [];
  
  if (missingSkills.length > 0) {
    suggestions.push(`Överväg att lägga till dessa kompetenser i ditt CV: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  
  if (enrichment.entities.experience_requirements.length > 0) {
    suggestions.push('Beskriv hur din tidigare erfarenhet matchar kraven');
  }
  
  if (enrichment.entities.education_requirements.length > 0) {
    suggestions.push('Lyft fram relevant utbildning och certifieringar');
  }
  
  if (enrichment.keywords.length > 0) {
    suggestions.push(`Använd nyckelord som "${enrichment.keywords.slice(0, 3).map(k => k.term).join('", "')}" i ditt CV`);
  }
  
  return suggestions;
}

// ============== EXPORT ==============

export const enrichmentsApi = {
  getJobAdEnrichment,
  analyzeJobText,
  calculateCVMatch,
};

export default enrichmentsApi;
