import { supabase } from '../lib/supabase'

// Konfiguration för AI-tjänsten
// Ändra denna URL om du hostar AI-servern någon annanstans
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'https://ditt-ai-server-url.com'

// Om AI-servern inte är tillgänglig, använd fallback-mallar
const USE_FALLBACK = true // Sätt till false när AI-servern är igång

export interface CoverLetterRequest {
  jobbAnnons: string
  erfarenhet?: string
  motivering?: string
  namn?: string
  ton?: 'professionell' | 'entusiastisk' | 'formell'
  companyName?: string
  jobTitle?: string
  cvData?: any
}

export interface CoverLetterResponse {
  success: boolean
  brev: string
  ton: string
}

// Fallback-mallar
const templates: Record<string, string> = {
  professionell: `Hej,

Jag skriver för att uttrycka mitt intresse för tjänsten som [JOB_TITLE] på [COMPANY].

Med min bakgrund inom [EXPERIENCE] har jag utvecklat färdigheter som jag tror skulle vara värdefulla för er organisation.

Jag uppskattar möjligheten att diskutera hur jag kan bidra till ert team.

Med vänliga hälsningar,
[NAME]`,

  entusiastisk: `Hej!

Jag blev så glad när jag såg er annons för [JOB_TITLE] på [COMPANY]! Detta är precis den typ av roll jag har letat efter.

Min erfarenhet inom [EXPERIENCE] har gett mig kunskaper som jag är övertygad om skulle passa perfekt hos er.

Jag ser verkligen fram emot att få prata mer om hur jag kan bidra!

Bästa hälsningar,
[NAME]`,

  formell: `Bästa mottagare,

Jag ansöker härmed om tjänsten som [JOB_TITLE] på [COMPANY].

Min yrkesbakgrund omfattar erfarenhet inom [EXPERIENCE]. Jag har utvecklat omfattande kunskaper inom området.

Jag är övertygad om att min kompetens skulle göra mig till en värdefull tillgång.

Jag ser fram emot att få diskutera mina kvalifikationer.

Med högaktning,
[NAME]`
}

/**
 * AI Service - just nu med fallback-mallar
 * 
 * För att aktivera riktig AI:
 * 1. Starta AI-servern: cd server/ai && npm install && npm start
 * 2. Uppdatera VITE_AI_SERVER_URL i .env
 * 3. Sätt USE_FALLBACK = false nedan
 */
export const aiService = {
  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    // Om AI-server inte är konfigurerad, använd fallback
    if (USE_FALLBACK || AI_SERVER_URL.includes('ditt-ai-server')) {
      return this.generateFallbackLetter(data)
    }

    try {
      // Försök anropa AI-server
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${AI_SERVER_URL}/api/ai/personligt-brev`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          jobbAnnons: data.jobbAnnons,
          erfarenhet: data.erfarenhet,
          motivering: data.motivering,
          namn: data.namn,
          ton: data.ton || 'professionell'
        })
      })

      if (!response.ok) {
        throw new Error('AI server error')
      }

      const result = await response.json()
      return {
        success: true,
        brev: result.brev,
        ton: data.ton || 'professionell'
      }
    } catch (error) {
      console.warn('AI server not available, using fallback')
      return this.generateFallbackLetter(data)
    }
  },

  generateFallbackLetter(data: CoverLetterRequest): CoverLetterResponse {
    const ton = data.ton || 'professionell'
    const template = templates[ton]
    
    const namn = data.namn || (data.cvData?.firstName && data.cvData?.lastName 
      ? `${data.cvData.firstName} ${data.cvData.lastName}` 
      : '[Ditt namn]')

    const brev = template
      .replace(/\[JOB_TITLE\]/g, data.jobTitle || 'den aktuella tjänsten')
      .replace(/\[COMPANY\]/g, data.companyName || 'företaget')
      .replace(/\[EXPERIENCE\]/g, data.erfarenhet || 'min bransch')
      .replace(/\[NAME\]/g, namn)

    return {
      success: true,
      brev: brev + '\n\n(PS. Detta är en mall - anpassa den gärna efter din stil!)',
      ton
    }
  },

  // Övriga AI-funktioner (med fallback)
  async optimizeCV(data: { cvText: string; yrke?: string }) {
    return {
      success: true,
      feedback: `Tips för CV:t:

1. Anpassa för ${data.yrke || 'rollen du söker'}
2. Använd konkreta exempel
3. Max 2 sidor
4. Kontrollera stavning`,
      yrke: data.yrke || null
    }
  },

  async prepareInterview(data: { jobbTitel: string; foretag?: string }) {
    return {
      success: true,
      forberedelser: `Förberedelser för ${data.jobbTitel}:

1. Läs på om företaget
2. Öva på vanliga frågor
3. Förbered egna frågor
4. Var punktlig`,
      jobbTitel: data.jobbTitel,
      foretag: data.foretag
    }
  },

  async isEnabled() {
    return !USE_FALLBACK
  }
}
