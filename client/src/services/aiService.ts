import { supabase } from '../lib/supabase'
import { coverLetterApi } from './supabaseApi'

// Request/Response interfaces
export interface CVOptimizationRequest {
  cvText: string
  yrke?: string
}

export interface CVOptimizationResponse {
  success: boolean
  feedback: string
  yrke: string | null
}

export interface GenerateCVRequest {
  yrke: string
  erfarenhet?: string
  utbildning?: string
  styrkor?: string
}

export interface GenerateCVResponse {
  success: boolean
  cvText: string
  yrke: string
}

export interface CoverLetterRequest {
  jobbAnnons: string
  erfarenhet?: string
  motivering?: string
  namn?: string
  ton?: 'professionell' | 'entusiastisk' | 'formell'
  extraContext?: string
  cvData?: any
  jobDescription?: string
  companyName?: string
  jobTitle?: string
}

export interface CoverLetterResponse {
  success: boolean
  brev: string
  ton: string
}

export interface InterviewPrepRequest {
  jobbTitel: string
  foretag?: string
  erfarenhet?: string
  egenskaper?: string
}

export interface InterviewPrepResponse {
  success: boolean
  forberedelser: string
  jobbTitel: string
  foretag?: string
}

export interface JobTipsRequest {
  intressen?: string
  tidigareErfarenhet?: string
  hinder?: string
  mal?: string
}

export interface JobTipsResponse {
  success: boolean
  tips: string
}

export interface ExerciseHelpRequest {
  ovningId: string
  steg: number
  fraga: string
  anvandarSvar?: string
}

export interface ExerciseHelpResponse {
  success: boolean
  hjalp: string
  ovningId: string
  steg: number
}

export interface SalaryNegotiationRequest {
  roll: string
  erfarenhetAr?: number
  nuvarandeLon?: number
  foretagsStorlek?: string
  ort?: string
}

export interface SalaryNegotiationResponse {
  success: boolean
  radgivning: string
  roll: string
}

export interface AIHealthResponse {
  status: string
  enabled: boolean
  url: string
  model?: string
  message?: string
}

// Fallback templates when AI is not available
const coverLetterTemplates: Record<string, string> = {
  professionell: `Hej,

Jag skriver för att uttrycka mitt intresse för tjänsten som [JOB_TITLE] på [COMPANY].

Med min bakgrund inom [EXPERIENCE] och mina färdigheter inom [SKILLS], tror jag att jag skulle vara ett bra tillskott till ert team.

Jag uppskattar möjligheten att diskutera hur jag kan bidra till [COMPANY]s fortsatta framgång.

Med vänliga hälsningar,
[NAME]`,

  entusiastisk: `Hej!

WOW! Jag blev så exalterad när jag såg er annons för [JOB_TITLE] på [COMPANY]! Detta är precis den typ av roll jag har drömt om.

Min passion för [FIELD] och min erfarenhet av [EXPERIENCE] gör mig till den perfekta kandidaten för detta jobb.

Jag ser fram emot att få prata mer om hur jag kan bidra till ert fantastiska team!

Bästa hälsningar,
[NAME]`,

  formell: `Bästa mottagare,

Jag ansöker härmed om tjänsten som [JOB_TITLE] på [COMPANY].

Min yrkesbakgrund omfattar [EXPERIENCE] års erfarenhet inom [FIELD]. Jag har utvecklat omfattande kunskaper inom [SKILLS].

Jag är övertygad om att min kompetens och mitt engagemang skulle göra mig till en värdefull tillgång för er organisation.

Jag ser fram emot möjligheten att personligen få diskutera mina kvalifikationer.

Med högaktning,
[NAME]`
}

/**
 * Tjänst för AI-funktioner via Supabase Edge Functions
 * 
 * VIKTIGT: Personligt brev använder befintliga ai-cover-letter Edge Function
 * som redan är deployad och fungerar. Övriga funktioner har fallback.
 */
export const aiService = {
  /**
   * Kolla om AI-servern är tillgänglig
   */
  async checkHealth(): Promise<AIHealthResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return {
          status: 'NO_SESSION',
          enabled: false,
          url: import.meta.env.VITE_SUPABASE_URL || '',
          message: 'Du måste vara inloggad för att använda AI-funktioner'
        }
      }

      // Testa ai-cover-letter endpoint (den som faktiskt finns deployad)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(
        `${supabaseUrl}/functions/v1/ai-cover-letter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cvData: { firstName: 'Test', lastName: 'Test' },
            jobDescription: 'test',
            companyName: 'test',
            jobTitle: 'test'
          })
        }
      )

      if (response.ok) {
        return {
          status: 'OK',
          enabled: true,
          url: supabaseUrl,
          message: 'AI-tjänster tillgängliga'
        }
      }

      // Om 503 = AI inte konfigurerad ännu
      if (response.status === 503) {
        return {
          status: 'NOT_CONFIGURED',
          enabled: false,
          url: supabaseUrl,
          message: 'AI-tjänsten är inte konfigurerad ännu. Kontakta administratören.'
        }
      }

      return {
        status: 'ERROR',
        enabled: false,
        url: supabaseUrl,
        message: 'AI-tjänsten är för tillfället inte tillgänglig'
      }
    } catch (error) {
      return {
        status: 'ERROR',
        enabled: false,
        url: '',
        message: 'Kunde inte ansluta till AI-tjänster'
      }
    }
  },

  /**
   * Få AI-feedback på CV (med fallback)
   */
  async optimizeCV(data: CVOptimizationRequest): Promise<CVOptimizationResponse> {
    // Fallback eftersom vi inte har en fungerande CV-analys än
    return {
      success: true,
      feedback: `Tips för att förbättra ditt CV:

1. Se till att ditt CV är anpassat för rollen som ${data.yrke || 'du söker'}
2. Använd konkreta exempel på dina prestationer
3. Håll det koncist - max 2 sidor
4. Använd nyckelord från jobbannonsen
5. Kontrollera stavning och grammatik`,
      yrke: data.yrke || null
    }
  },

  /**
   * Generera CV-text (med fallback)
   */
  async generateCVText(data: GenerateCVRequest): Promise<GenerateCVResponse> {
    const cvText = `PROFIL
Erfaren ${data.yrke} med bred kompetens inom området. Strukturerad och resultatorienterad.

ARBETSLIVSERFARENHET
${data.erfarenhet || 'Beskriv din erfarenhet här'}

UTBILDNING
${data.utbildning || 'Beskriv din utbildning här'}

KOMPETENSER
${data.styrkor || 'Dina styrkor'}

SPRÅK
Svenska - Modersmål
Engelska - Goda kunskaper`

    return {
      success: true,
      cvText,
      yrke: data.yrke
    }
  },

  /**
   * Generera personligt brev via befintlig ai-cover-letter Edge Function
   * 
   * Denna använder coverLetterApi.generate() som anropar ai-cover-letter
   * som redan är deployad i Supabase.
   */
  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    try {
      const jobDesc = data.jobDescription || data.jobbAnnons
      if (!jobDesc) {
        throw new Error('Jobbeskrivning saknas')
      }

      // Använd befintliga coverLetterApi som anropar ai-cover-letter
      const result = await coverLetterApi.generate({
        cvData: data.cvData || {
          firstName: data.namn?.split(' ')[0] || '',
          lastName: data.namn?.split(' ').slice(1).join(' ') || '',
          summary: data.erfarenhet || ''
        },
        jobDescription: jobDesc,
        companyName: data.companyName || 'Företaget',
        jobTitle: data.jobTitle || 'Tjänsten',
        tone: data.ton === 'formell' ? 'formal' : 
              data.ton === 'entusiastisk' ? 'enthusiastic' : 'friendly',
        focus: 'experience'
      })

      // coverLetterApi returnerar { letter: string, metadata: {...} }
      return {
        success: true,
        brev: result.letter || result.brev || result.content,
        ton: data.ton || 'professionell'
      }
    } catch (error: any) {
      console.error('AI-brev generering misslyckades:', error)
      
      // Auth error
      if (error.message?.includes('Inte inloggad') || error.message?.includes('401') || error.status === 401) {
        return {
          success: false,
          brev: '🔐 Du verkar ha blivit utloggad. Vänligen logga in igen.',
          ton: data.ton || 'professionell'
        }
      }
      
      // Config error
      if (error.message?.includes('not configured') || error.message?.includes('503') || error.status === 503) {
        return {
          success: false,
          brev: '⚙️ AI-tjänsten är inte konfigurerad ännu. Kontakta support.',
          ton: data.ton || 'professionell'
        }
      }
      
      // Fallback template
      const template = coverLetterTemplates[data.ton || 'professionell']
      const brev = template
        .replace(/\[JOB_TITLE\]/g, data.jobTitle || 'Tjänsten')
        .replace(/\[COMPANY\]/g, data.companyName || 'Företaget')
        .replace(/\[EXPERIENCE\]/g, data.erfarenhet || 'min bransch')
        .replace(/\[SKILLS\]/g, 'mina kompetenser')
        .replace(/\[FIELD\]/g, data.motivering || 'området')
        .replace(/\[NAME\]/g, data.namn || 'Mitt Namn')

      return {
        success: true,
        brev: brev + '\n\n(Offline-mall använd - AI-tjänsten var inte tillgänglig)',
        ton: data.ton || 'professionell'
      }
    }
  },

  /**
   * Förberedelser inför intervju (med fallback)
   */
  async prepareInterview(data: InterviewPrepRequest): Promise<InterviewPrepResponse> {
    return {
      success: true,
      forberedelser: `Förberedelser inför intervjun för ${data.jobbTitel}:

1. Läs på om företaget - historia, värderingar, produkter
2. Förbered svar på vanliga frågor: "Berätta om dig själv", "Varför denna roll?"
3. Förbered egna frågor att ställa
4. Öva på att beskriva din erfarenhet konkret
5. Planera vad du ska ha på dig och hur du tar dig dit

Lycka till!`,
      jobbTitel: data.jobbTitel,
      foretag: data.foretag
    }
  },

  /**
   * Få personliga jobbsökartips (med fallback)
   */
  async getJobTips(data: JobTipsRequest): Promise<JobTipsResponse> {
    return {
      success: true,
      tips: `Jobbsökartips:

1. Skräddarsy ditt CV och brev för varje ansökan
2. Nätverka - berätta för bekanta att du söker jobb
3. Använd LinkedIn och andra plattformar
4. Följ upp ansökningar efter någon vecka
5. Var uthållig - det tar tid men det kommer!`
    }
  },

  /**
   * Hjälp med övningar (med fallback)
   */
  async getExerciseHelp(data: ExerciseHelpRequest): Promise<ExerciseHelpResponse> {
    return {
      success: true,
      hjalp: `Tips för övningen:

- Ta dig tid att tänka igenom frågan
- Det finns inga "fel" svar
- Skriv ner det som känns ärligt för dig
- Du kan alltid gå tillbaka och ändra senare`,
      ovningId: data.ovningId,
      steg: data.steg
    }
  },

  /**
   * Löneförhandlingsrådgivning (med fallback)
   */
  async getSalaryAdvice(data: SalaryNegotiationRequest): Promise<SalaryNegotiationResponse> {
    const lonSpan = data.erfarenhetAr && data.erfarenhetAr > 5 ? '45 000 - 60 000' : 
                    data.erfarenhetAr && data.erfarenhetAr > 2 ? '35 000 - 50 000' : '30 000 - 40 000'
    
    return {
      success: true,
      radgivning: `Löneförhandling för ${data.roll}:

Marknadslön: ${lonSpan} kr/mån

Tips:
1. Researcha marknadslöner
2. Lista dina prestationer
3. Förbered argument
4. Var öppen för kompromisser`,
      roll: data.roll
    }
  },

  /**
   * Kontrollera om AI är aktiverat
   */
  async isEnabled(): Promise<boolean> {
    try {
      const health = await this.checkHealth()
      return health.enabled && health.status === 'OK'
    } catch {
      return false
    }
  },

  /**
   * Hämta nuvarande AI-modell
   */
  async getCurrentModel(): Promise<string | null> {
    return 'OpenRouter (via Supabase Edge Functions)'
  }
}
