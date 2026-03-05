import { supabase } from '../lib/supabase'

// AI Server URL - ändra om du deployar till produktion
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:3002'

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

// Fallback-mallar om AI-server inte är tillgänglig
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
 * AI Service - Använder lokal AI-server (server/ai)
 * 
 * För att starta AI-servern:
 * cd server/ai
 * npm install
 * npm start
 * 
 * Servern körs på http://localhost:3002
 */
export const aiService = {
  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    try {
      // Försök anropa lokal AI-server
      const response = await fetch(`${AI_SERVER_URL}/api/ai/personligt-brev`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobbAnnons: data.jobbAnnons,
          erfarenhet: data.erfarenhet || data.cvData?.summary,
          motivering: data.motivering,
          namn: data.namn || `${data.cvData?.firstName || ''} ${data.cvData?.lastName || ''}`.trim(),
          ton: data.ton || 'professionell'
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.warn('AI server error:', error)
        throw new Error(error.error || 'AI server error')
      }

      const result = await response.json()
      
      return {
        success: true,
        brev: result.brev,
        ton: data.ton || 'professionell'
      }

    } catch (error) {
      console.warn('AI server not available, using fallback:', error)
      // Fallback till mallar
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
      brev: brev + '\n\n(PS. Detta är en mall - starta AI-servern för smartare förslag!)',
      ton
    }
  },

  // Kolla om AI-servern är tillgänglig
  async checkHealth(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        return { 
          ok: true, 
          message: `AI-server igång (${data.model || 'ok'})` 
        }
      }
      return { 
        ok: false, 
        message: 'AI-server svarar inte korrekt' 
      }
    } catch {
      return { 
        ok: false, 
        message: 'Starta AI-servern: cd server/ai && npm start' 
      }
    }
  },

  // Övriga AI-funktioner
  async optimizeCV(data: { cvText: string; yrke?: string }) {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/cv-optimering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('CV optimization failed')
      return response.json()
    } catch {
      return {
        success: true,
        feedback: `Tips för CV:t:\n\n1. Anpassa för ${data.yrke || 'rollen'}\n2. Använd konkreta exempel\n3. Max 2 sidor`,
        yrke: data.yrke
      }
    }
  },

  async prepareInterview(data: { jobbTitel: string; foretag?: string }) {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/intervju-forberedelser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Interview prep failed')
      return response.json()
    } catch {
      return {
        success: true,
        forberedelser: `Förberedelser för ${data.jobbTitel}:\n\n1. Läs på om företaget\n2. Öva på vanliga frågor\n3. Förbered egna frågor`,
        jobbTitel: data.jobbTitel
      }
    }
  },

  async isEnabled(): Promise<boolean> {
    const health = await this.checkHealth()
    return health.ok
  }
}
