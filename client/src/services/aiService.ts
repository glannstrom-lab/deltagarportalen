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

export interface CVOptimizationRequest {
  cvText: string
  yrke?: string
}

export interface InterviewPrepRequest {
  jobbTitel: string
  foretag?: string
  erfarenhet?: string
  egenskaper?: string
}

export interface JobTipsRequest {
  intressen?: string
  tidigareErfarenhet?: string
  hinder?: string
  mal?: string
}

// Fallback-mallar om AI-server inte är tillgänglig
const coverLetterTemplates: Record<string, string> = {
  professionell: `Hej,

Jag skriver för att uttrycka mitt intresse för tjänsten som [JOB_TITLE] på [COMPANY].

Med min bakgrund inom [EXPERIENCE] har jag utvecklat färdigheter som jag tror skulle vara värdefulla.

Jag uppskattar möjligheten att diskutera hur jag kan bidra.

Med vänliga hälsningar,
[NAME]`,

  entusiastisk: `Hej!

Jag blev så glad när jag såg er annons för [JOB_TITLE] på [COMPANY]!

Min erfarenhet inom [EXPERIENCE] har gett mig kunskaper som passar perfekt.

Jag ser fram emot att få prata mer!

Bästa hälsningar,
[NAME]`,

  formell: `Bästa mottagare,

Jag ansöker härmed om tjänsten som [JOB_TITLE] på [COMPANY].

Min yrkesbakgrund omfattar [EXPERIENCE].

Jag är övertygad om att min kompetens skulle vara till nytta.

Med högaktning,
[NAME]`
}

/**
 * AI Service - Använder lokal AI-server (server/ai)
 * 
 * För att starta AI-servern:
 * cd server/ai
 * npm start
 */
export const aiService = {
  // ========== PERSONLIGT BREV ==========
  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/personligt-brev`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobbAnnons: data.jobbAnnons,
          erfarenhet: data.erfarenhet || data.cvData?.summary,
          motivering: data.motivering,
          namn: data.namn || `${data.cvData?.firstName || ''} ${data.cvData?.lastName || ''}`.trim(),
          ton: data.ton || 'professionell'
        })
      })

      if (!response.ok) throw new Error('AI server error')
      const result = await response.json()
      
      return {
        success: true,
        brev: result.brev,
        ton: data.ton || 'professionell'
      }
    } catch (error) {
      console.warn('AI server error, using fallback:', error)
      return this.generateFallbackLetter(data)
    }
  },

  generateFallbackLetter(data: CoverLetterRequest): CoverLetterResponse {
    const ton = data.ton || 'professionell'
    const template = coverLetterTemplates[ton]
    const namn = data.namn || `${data.cvData?.firstName || ''} ${data.cvData?.lastName || ''}`.trim() || '[Ditt namn]'

    const brev = template
      .replace(/\[JOB_TITLE\]/g, data.jobTitle || 'tjänsten')
      .replace(/\[COMPANY\]/g, data.companyName || 'företaget')
      .replace(/\[EXPERIENCE\]/g, data.erfarenhet || 'min bransch')
      .replace(/\[NAME\]/g, namn)

    return {
      success: true,
      brev: brev + '\n\n(Mall använd - starta AI-servern för smartare förslag)',
      ton
    }
  },

  // ========== CV-OPTIMERING ==========
  async optimizeCV(data: CVOptimizationRequest) {
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
        feedback: `Tips för ditt CV:\n\n1. Anpassa för ${data.yrke || 'rollen du söker'}\n2. Använd konkreta exempel och siffror\n3. Håll det under 2 sidor\n4. Använd nyckelord från annonsen\n5. Kontrollera stavning och grammatik`,
        yrke: data.yrke || null
      }
    }
  },

  // ========== GENERERA CV-TEXT ==========
  async generateCVText(data: { yrke: string; erfarenhet?: string; utbildning?: string; styrkor?: string }) {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/generera-cv-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('CV generation failed')
      return response.json()
    } catch {
      return {
        success: true,
        cvText: `PROFIL\nErfaren ${data.yrke} med bred kompetens. Strukturerad och resultatorienterad.\n\nERFARENHET\n${data.erfarenhet || 'Beskriv din erfarenhet'}\n\nUTBILDNING\n${data.utbildning || 'Beskriv din utbildning'}\n\nKOMPETENSER\n${data.styrkor || 'Dina styrkor'}`,
        yrke: data.yrke
      }
    }
  },

  // ========== INTERVJUFÖRBEREDELSER ==========
  async prepareInterview(data: InterviewPrepRequest) {
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
        forberedelser: `Förberedelser för ${data.jobbTitel}${data.foretag ? ` på ${data.foretag}` : ''}:\n\n1. Läs på om företagets historia och värderingar\n2. Förbered svar på vanliga frågor ("Berätta om dig själv", "Dina styrkor/svagheter")\n3. Förbered egna frågor att ställa\n4. Planera resväg och klädsel\n5. Ta med CV och anteckningar`,
        jobbTitel: data.jobbTitel,
        foretag: data.foretag
      }
    }
  },

  // ========== JOBBTIPS ==========
  async getJobTips(data: JobTipsRequest) {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/jobbtips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Job tips failed')
      return response.json()
    } catch {
      return {
        success: true,
        tips: `Jobbsökartips:\n\n1. Skräddarsy varje ansökan\n2. Nätverka med kontakter\n3. Använd LinkedIn aktivt\n4. Följ upp ansökningar\n5. Var uthållig - det tar tid!`
      }
    }
  },

  // ========== ÖVNINGSHJÄLP ==========
  async getExerciseHelp(data: { ovningId: string; steg: number; fraga: string; anvandarSvar?: string }) {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/ovningshjalp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Exercise help failed')
      return response.json()
    } catch {
      return {
        success: true,
        hjalp: `Tips för övningen:\n\n- Ta dig tid att reflektera\n- Det finns inga "fel" svar\n- Skriv ner vad som känns ärligt\n- Du kan gå tillbaka och ändra`,
        ovningId: data.ovningId,
        steg: data.steg
      }
    }
  },

  // ========== LÖNEFÖRHANDLING ==========
  async getSalaryAdvice(data: { roll: string; erfarenhetAr?: number; ort?: string }) {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/loneforhandling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Salary advice failed')
      return response.json()
    } catch {
      const lon = data.erfarenhetAr && data.erfarenhetAr > 5 ? '45 000 - 60 000' : 
                  data.erfarenhetAr && data.erfarenhetAr > 2 ? '35 000 - 50 000' : '30 000 - 40 000'
      return {
        success: true,
        radgivning: `Löneförhandling för ${data.roll}:\n\nMarknadslön: ${lon} kr/mån\n\nTips:\n1. Researcha marknadslöner\n2. Lista dina prestationer\n3. Förbered argument`,
        roll: data.roll
      }
    }
  },

  // ========== HÄLSOKONTROLL ==========
  async checkHealth(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        return { ok: true, message: `AI igång (${data.model})` }
      }
      return { ok: false, message: 'AI-server svarar inte' }
    } catch {
      return { ok: false, message: 'Starta: cd server/ai && npm start' }
    }
  },

  async isEnabled(): Promise<boolean> {
    const health = await this.checkHealth()
    return health.ok
  }
}
