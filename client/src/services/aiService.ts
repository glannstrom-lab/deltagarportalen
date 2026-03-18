/**
 * AI Service för Deltagarportalen
 *
 * Denna service anropar Vercel Serverless Functions för alla AI-operationer.
 * Ersätter den tidigare lokala servern (localhost:3002).
 *
 * Inkluderar retry-logik för förbättrad tillförlitlighet.
 */

import { withRetry } from './retryService';

const API_BASE = '/api';

interface AIResponse {
  success: boolean;
  result?: string;
  svar?: string;
  brev?: string;
  error?: string;
  function?: string;
  model?: string;
}

// AI-specifik retry config - färre försök, längre timeout
const AI_RETRY_CONFIG = {
  maxRetries: 2, // 3 totala försök
  baseDelay: 2000, // 2 sekunder
  maxDelay: 15000, // 15 sekunder
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Generisk funktion för att anropa AI-endpoints med retry-logik
 */
async function callAI(functionName: string, data: Record<string, unknown>): Promise<AIResponse> {
  return withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout för AI

      try {
        const response = await fetch(`${API_BASE}/ai/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ function: functionName, data }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as { error?: string };
          const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
          (error as Error & { status: number }).status = response.status;
          throw error;
        }

        return response.json() as Promise<AIResponse>;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    AI_RETRY_CONFIG,
    `AI ${functionName}`
  );
}

/**
 * Health check - kolla att API:t fungerar
 */
export async function checkHealth(): Promise<any> {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}

/**
 * Hämta lista över tillgängliga AI-modeller
 */
export async function getModels(): Promise<any> {
  const response = await fetch(`${API_BASE}/models`);
  return response.json();
}

/**
 * Hämta API-konfiguration
 */
export async function getConfig(): Promise<any> {
  const response = await fetch(`${API_BASE}/config`);
  return response.json();
}

/**
 * AI Service med alla tillgängliga funktioner
 */
export const aiService = {
  /**
   * Optimera CV med AI-feedback
   */
  cvOptimering: async (cvText: string, yrke?: string) => {
    const response = await callAI('cv-optimering', { cvText, yrke });
    return response.result;
  },

  /**
   * Generera CV-sammanfattning
   */
  genereraCvText: async (data: {
    yrke: string;
    erfarenhet?: string;
    utbildning?: string;
    styrkor?: string;
  }) => {
    const response = await callAI('generera-cv-text', data);
    return response.result;
  },

  /**
   * Skriv personligt brev (legacy)
   */
  personligtBrev: async (data: {
    jobbAnnons: string;
    erfarenhet?: string;
    motivering?: string;
    namn?: string;
    ton?: 'professionell' | 'entusiastisk' | 'formell';
  }) => {
    const response = await callAI('personligt-brev', data);
    return response.brev;
  },

  /**
   * Generera personligt brev med fullständig CV-data
   */
  generateCoverLetter: async (data: {
    jobbAnnons: string;
    companyName?: string;
    jobTitle?: string;
    erfarenhet?: string;
    motivering?: string;
    namn?: string;
    ton?: 'professionell' | 'entusiastisk' | 'formell';
    extraContext?: string;
    extraKeywords?: string;
    cvData?: {
      firstName?: string;
      lastName?: string;
      title?: string;
      summary?: string;
      workExperience?: Array<{
        title: string;
        company: string;
        description?: string;
        duration?: string;
      }>;
      skills?: Array<{ name: string }>;
    };
  }) => {
    // Använder endpointen 'personligt-brev' via [function].ts
    const response = await callAI('personligt-brev', data);
    return { brev: response.brev, result: response.result };
  },

  /**
   * Förberedelser inför intervju
   */
  intervjuForberedelser: async (data: {
    jobbTitel: string;
    foretag?: string;
    erfarenhet?: string;
    egenskaper?: string;
  }) => {
    const response = await callAI('intervju-forberedelser', data);
    return response.result;
  },

  /**
   * Personliga jobbsökartips
   */
  jobbtips: async (data: {
    intressen?: string;
    tidigareErfarenhet?: string;
    hinder?: string;
    mal?: string;
  }) => {
    const response = await callAI('jobbtips', data);
    return response.result;
  },

  /**
   * Hjälp med löneförhandling
   */
  loneforhandling: async (data: {
    roll: string;
    erfarenhetAr?: number;
    nuvarandeLon?: number;
    foretagsStorlek?: string;
    ort?: string;
  }) => {
    const response = await callAI('loneforhandling', data);
    return response.result;
  },

  /**
   * Allmän karriär-chatbot
   */
  chatbot: async (meddelande: string, historik?: Array<{ roll: string; innehall: string }>) => {
    const response = await callAI('chatbot', { meddelande, historik });
    return response.svar;
  },

  /**
   * Hjälp med övningar
   */
  ovningshjalp: async (data: {
    ovningId: string;
    steg: string;
    fraga: string;
    anvandarSvar?: string;
  }) => {
    const response = await callAI('ovningshjalp', data);
    return response.result;
  },

  /**
   * Hjälp med LinkedIn-profil
   */
  linkedinOptimering: async (data: {
    typ: 'headline' | 'about' | 'post' | 'connection';
    data: any;
  }) => {
    const response = await callAI('linkedin-optimering', data);
    return response.result;
  },

  /**
   * Skapa karriärplan
   */
  karriarplan: async (data: {
    nuvarande: string;
    mal: string;
    tidsram?: string;
    hinder?: string;
  }) => {
    const response = await callAI('karriarplan', data);
    return response.result;
  },

  /**
   * Analysera kompetensgap
   */
  kompetensgap: async (data: {
    cvText: string;
    drömjobb: string;
  }) => {
    const response = await callAI('kompetensgap', data);
    return response.result;
  },

  /**
   * Ansökningscoach (realtime feedback)
   */
  ansokningscoach: async (data: {
    text: string;
    jobbannons: string;
    typ: 'feedback' | 'forbattra' | 'kontrollera';
  }) => {
    const response = await callAI('ansokningscoach', data);
    return response.result;
  },

  /**
   * Intervju-simulator
   */
  intervjuSimulator: async (data: {
    roll: string;
    foretag: string;
    anvandarSvar?: string;
    tidigareFragor?: Array<{ frag: string; svar: string }>;
  }) => {
    const response = await callAI('intervju-simulator', data);
    return response.result;
  },

  /**
   * Mentalt stöd / Motivationsboost
   */
  mentaltStod: async (data: {
    situation: string;
    kansla: string;
  }) => {
    const response = await callAI('mentalt-stod', data);
    return response.result;
  },

  /**
   * Hjälp med nätverkande
   */
  natverkande: async (data: {
    typ: 'kontakt' | 'foljupp' | 'informational' | 'tack';
    data: any;
  }) => {
    const response = await callAI('natverkande', data);
    return response.result;
  },
};

export default aiService;
