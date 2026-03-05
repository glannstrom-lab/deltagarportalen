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
  // New format for Supabase
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

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  recommended?: boolean
}

export interface AIModelsResponse {
  currentModel: string
  models: AIModel[]
  note: string
}

export interface AIFunctionResponse {
  success: boolean
  content: string
  function: string
  model: string
  metadata?: {
    tokensUsed?: number
    promptTokens?: number
    completionTokens?: number
    generatedAt?: string
  }
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
 * Anropa AI Assistant Edge Function
 */
async function callAIAssistant(
  functionName: string, 
  data: Record<string, any>,
  model?: string
): Promise<AIFunctionResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Inte inloggad')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const response = await fetch(
    `${supabaseUrl}/functions/v1/ai-assistant`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        function: functionName,
        data,
        model
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'AI-anrop misslyckades')
  }

  return response.json()
}

/**
 * Tjänst för AI-funktioner via Supabase Edge Functions
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

      // Testa ai-assistant endpoint
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(
        `${supabaseUrl}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            function: 'jobbtips',
            data: { intressen: 'test', hinder: 'test' }
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
   * Få AI-feedback på CV
   */
  async optimizeCV(data: CVOptimizationRequest): Promise<CVOptimizationResponse> {
    try {
      const result = await callAIAssistant('cv-optimering', {
        cvText: data.cvText,
        yrke: data.yrke
      })

      return {
        success: true,
        feedback: result.content,
        yrke: data.yrke || null
      }
    } catch (error) {
      console.warn('CV-analys ej tillgänglig:', error)
      // Fallback
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
    }
  },

  /**
   * Generera CV-text med AI
   */
  async generateCVText(data: GenerateCVRequest): Promise<GenerateCVResponse> {
    try {
      const result = await callAIAssistant('generera-cv-text', {
        yrke: data.yrke,
        erfarenhet: data.erfarenhet,
        utbildning: data.utbildning,
        styrkor: data.styrkor
      })

      return {
        success: true,
        cvText: result.content,
        yrke: data.yrke
      }
    } catch (error) {
      console.warn('CV-textgenerering ej tillgänglig:', error)
      // Fallback template
      const cvText = `PROFIL
Erfaren ${data.yrke} med bred kompetens inom området. Strukturerad och resultatorienterad med god förmåga att samarbeta i team.

ARBETSLIVSERFARENHET
${data.erfarenhet || 'Redovisa din arbetslivserfarenhet här'}

UTBILDNING
${data.utbildning || 'Redovisa din utbildning här'}

KOMPETENSER
${data.styrkor || 'Lista dina styrkor och kompetenser här'}

SPRÅK
Svenska - Modersmål
Engelska - Goda kunskaper`

      return {
        success: true,
        cvText,
        yrke: data.yrke
      }
    }
  },

  /**
   * Generera personligt brev via AI
   */
  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    try {
      // Validate required fields
      const jobDesc = data.jobDescription || data.jobbAnnons
      if (!jobDesc) {
        throw new Error('Jobbeskrivning saknas')
      }

      // Använd ai-assistant för personligt brev
      const result = await callAIAssistant('personligt-brev', {
        jobbAnnons: jobDesc,
        erfarenhet: data.erfarenhet || data.cvData?.summary,
        motivering: data.motivering,
        namn: data.namn || `${data.cvData?.firstName || ''} ${data.cvData?.lastName || ''}`.trim(),
        ton: data.ton || 'professionell'
      })

      return {
        success: true,
        brev: result.content,
        ton: data.ton || 'professionell'
      }
    } catch (error: any) {
      console.error('AI-brev generering misslyckades:', error)
      
      // Check if it's an authentication error
      if (error.message?.includes('Inte inloggad') || error.message?.includes('401')) {
        return {
          success: false,
          brev: '🔐 Du verkar ha blivit utloggad. Vänligen logga in igen för att använda AI-funktionen.',
          ton: data.ton || 'professionell'
        }
      }
      
      // Check if it's an configuration error
      if (error.message?.includes('not configured') || error.message?.includes('503')) {
        return {
          success: false,
          brev: '⚙️ AI-tjänsten är inte korrekt konfigurerad. Kontakta support.',
          ton: data.ton || 'professionell'
        }
      }
      
      // Use offline template as fallback
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
   * Förberedelser inför intervju
   */
  async prepareInterview(data: InterviewPrepRequest): Promise<InterviewPrepResponse> {
    try {
      const result = await callAIAssistant('intervju-forberedelser', {
        jobbTitel: data.jobbTitel,
        foretag: data.foretag,
        erfarenhet: data.erfarenhet,
        egenskaper: data.egenskaper
      })

      return {
        success: true,
        forberedelser: result.content,
        jobbTitel: data.jobbTitel,
        foretag: data.foretag
      }
    } catch (error) {
      console.warn('Intervjuförberedelser ej tillgänglig:', error)
      // Fallback
      return {
        success: true,
        forberedelser: `Förberedelser inför intervjun för ${data.jobbTitel} på ${data.foretag || 'företaget'}:

1. **Forskning**
   - Läs på om företagets historia, värderingar och kultur
   - Förstå deras produkter/tjänster
   - Kolla senaste nyheterna om företaget

2. **Vanliga frågor att förbereda**
   - "Berätta om dig själv"
   - "Varför vill du jobba här?"
   - "Vad är dina styrkor och svagheter?"
   - "Var ser du dig själv om 5 år?"

3. **Dina frågor**
   - Vilka är de största utmaningarna i rollen?
   - Hur ser teamet ut?
   - Vad är nästa steg i rekryteringsprocessen?

4. **Praktiskt**
   - Var ska du vara och när?
   - Vad ska du ha på dig?
   - Ta med CV och anteckningsblock

Lycka till!`,
        jobbTitel: data.jobbTitel,
        foretag: data.foretag
      }
    }
  },

  /**
   * Få personliga jobbsökartips
   */
  async getJobTips(data: JobTipsRequest): Promise<JobTipsResponse> {
    try {
      const result = await callAIAssistant('jobbtips', {
        intressen: data.intressen,
        tidigareErfarenhet: data.tidigareErfarenhet,
        hinder: data.hinder,
        mal: data.mal
      })

      return {
        success: true,
        tips: result.content
      }
    } catch (error) {
      console.warn('Jobbtips ej tillgänglig:', error)
      // Fallback
      return {
        success: true,
        tips: `Personliga jobbsökartips:

**Baserat på dina intressen (${data.intressen || 'varierade'}):**
- Sök roller som matchar vad du brinner för
- Nätverka inom områden du tycker om

**Baserat på din erfarenhet (${data.tidigareErfarenhet || 'tidigare'}):**
- Lyft fram överförbara färdigheter
- Var öppen för närliggande roller

**För att övervinna hinder (${data.hinder || 'du möter'}):**
- Bryt ner processen i små steg
- Fira små framsteg
- Sök stöd när du behöver det

**För att nå dina mål (${data.mal || 'dina'}):**
- Sätt upp konkreta delmål
- Ha en strukturerad ansökningsprocess
- Följ upp och utvärdera regelbundet`
      }
    }
  },

  /**
   * Hjälp med övningar
   */
  async getExerciseHelp(data: ExerciseHelpRequest): Promise<ExerciseHelpResponse> {
    try {
      const result = await callAIAssistant('ovningshjalp', {
        ovningId: data.ovningId,
        steg: data.steg,
        fraga: data.fraga,
        anvandarSvar: data.anvandarSvar
      })

      return {
        success: true,
        hjalp: result.content,
        ovningId: data.ovningId,
        steg: data.steg
      }
    } catch (error) {
      console.warn('Övningshjälp ej tillgänglig:', error)
      // Fallback
      return {
        success: true,
        hjalp: `Hjälp för övning ${data.ovningId}, steg ${data.steg}:

Du frågade: "${data.fraga}"

${data.anvandarSvar ? `Du svarade: "${data.anvandarSvar}"` : ''}

**Tips:**
- Ta dig tid att tänka igenom övningen
- Det finns inga "fel" svar - det viktiga är att du reflekterar
- Om du kör fast, prova att bryta ner det i mindre delar
- Kom ihåg att du kan spara och fortsätta senare

Behöver du mer vägledning? Kontakta din arbetskonsulent.`,
        ovningId: data.ovningId,
        steg: data.steg
      }
    }
  },

  /**
   * Löneförhandlingsrådgivning
   */
  async getSalaryAdvice(data: SalaryNegotiationRequest): Promise<SalaryNegotiationResponse> {
    try {
      const result = await callAIAssistant('loneforhandling', {
        roll: data.roll,
        erfarenhetAr: data.erfarenhetAr,
        nuvarandeLon: data.nuvarandeLon,
        foretagsStorlek: data.foretagsStorlek,
        ort: data.ort
      })

      return {
        success: true,
        radgivning: result.content,
        roll: data.roll
      }
    } catch (error) {
      console.warn('Lönerådgivning ej tillgänglig:', error)
      // Fallback
      const lonSpan = data.erfarenhetAr && data.erfarenhetAr > 5 ? '45 000 - 60 000' : 
                      data.erfarenhetAr && data.erfarenhetAr > 2 ? '35 000 - 50 000' : '30 000 - 40 000'
      
      return {
        success: true,
        radgivning: `Löneförhandlingsrådgivning för ${data.roll}:

**Marknadslön:** ${lonSpan} kr/mån
(baserat på ${data.erfarenhetAr || 0} års erfarenhet i ${data.ort || 'Sverige'})

**Förberedelser:**
1. Researcha marknadslöner (t.ex. på Unionen, Akademikerna)
2. Lista dina prestationer och ansvarsområden
3. Förbered en motivering till varför du förtjänar högre lön
4. Ha en backup-plan (andra förmåner om lönen inte går att påverka)

**Under förhandlingen:**
- Var konkret och ge exempel
- Var öppen för kompromisser
- Fråga om löneutvecklingsmöjligheter
- Få det skriftligt

**Kom ihåg:** Lön är inte allt - förmåner, utvecklingsmöjligheter och arbetsmiljö är också viktigt!`,
        roll: data.roll
      }
    }
  },

  /**
   * Generell AI-funktion (för custom användning)
   */
  async generate(
    systemPrompt: string,
    userPrompt: string,
    maxTokens?: number,
    model?: string
  ): Promise<string> {
    const result = await callAIAssistant('generell', {
      systemPrompt,
      prompt: userPrompt,
      maxTokens
    }, model)

    return result.content
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
    // Return a generic message since we get model info from responses
    return 'OpenRouter (via Supabase Edge Functions)'
  }
}
