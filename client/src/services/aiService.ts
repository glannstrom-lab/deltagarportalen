/**
 * AI Service för Deltagarportalen
 *
 * Denna service anropar Vercel Serverless Functions för alla AI-operationer.
 * Ersätter den tidigare lokala servern (localhost:3002).
 *
 * Inkluderar retry-logik för förbättrad tillförlitlighet.
 */

import { withRetry } from './retryService';
import { supabase } from '@/lib/supabase';

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

interface HealthCheckResponse {
  status: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface Model {
  id: string;
  name: string;
  provider?: string;
  [key: string]: unknown;
}

interface ModelsResponse {
  models: Model[];
  [key: string]: unknown;
}

interface ConfigResponse {
  apiVersion?: string;
  features?: string[];
  [key: string]: unknown;
}

interface LinkedInHeadlineData {
  currentHeadline?: string;
  title?: string;
  experience?: string;
}

interface LinkedInAboutData {
  currentAbout?: string;
  skills?: string;
  achievements?: string;
}

interface LinkedInPostData {
  topic?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

interface LinkedInConnectionData {
  recipientName?: string;
  context?: string;
  mutualConnection?: string;
}

type LinkedInOptimeringData =
  | { typ: 'headline'; data: LinkedInHeadlineData }
  | { typ: 'about'; data: LinkedInAboutData }
  | { typ: 'post'; data: LinkedInPostData }
  | { typ: 'connection'; data: LinkedInConnectionData };

interface NetworkingContactData {
  recipientName?: string;
  company?: string;
  role?: string;
  context?: string;
}

interface NetworkingFollowUpData {
  previousInteraction?: string;
  purpose?: string;
}

interface NetworkingInformationalData {
  recipientName?: string;
  company?: string;
  questions?: string;
}

interface NetworkingThankYouData {
  recipientName?: string;
  occasion?: string;
  details?: string;
}

type NatverkandeData =
  | { typ: 'kontakt'; data: NetworkingContactData }
  | { typ: 'foljupp'; data: NetworkingFollowUpData }
  | { typ: 'informational'; data: NetworkingInformationalData }
  | { typ: 'tack'; data: NetworkingThankYouData };

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

      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Inte inloggad. Logga in för att använda AI-funktioner.');
      }

      try {
        const response = await fetch(`${API_BASE}/ai/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
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
export async function checkHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE}/health`);
  return response.json() as Promise<HealthCheckResponse>;
}

/**
 * Hämta lista över tillgängliga AI-modeller
 */
export async function getModels(): Promise<ModelsResponse> {
  const response = await fetch(`${API_BASE}/models`);
  return response.json() as Promise<ModelsResponse>;
}

/**
 * Hämta API-konfiguration
 */
export async function getConfig(): Promise<ConfigResponse> {
  const response = await fetch(`${API_BASE}/config`);
  return response.json() as Promise<ConfigResponse>;
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
  linkedinOptimering: async (data: LinkedInOptimeringData) => {
    const response = await callAI('linkedin-optimering', data as Record<string, unknown>);
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
  natverkande: async (data: NatverkandeData) => {
    const response = await callAI('natverkande', data as Record<string, unknown>);
    return response.result;
  },
};

export default aiService;
