/**
 * AI API Client - Centralized client for all AI API calls
 * Automatically includes authentication headers.
 *
 * GDPR-säkerhet (2026-05-15): PII-sanitering körs på all data innan
 * det skickas till backend (som sedan vidarebefordrar till OpenRouter USA).
 * Personnummer, kreditkort, bankkonton stryks helt. Email/telefon flaggas.
 * Se client/src/lib/piiSanitizer.ts.
 *
 * B15 (2026-08-05): saneringen görs nu på **alla** nivåer i nyttolasten, inte
 * bara toppnivåns strängar, och `callAIStream` finns för strömmande svar så
 * inget UI behöver gå förbi lagret med ett eget `fetch`. Varje ny väg ut till
 * `/api/ai` ska gå via `prepareAiRequest` — annars kringgås både PII-saneringen
 * och art. 9-grinden, tyst.
 */

import { supabase } from '@/lib/supabase'
import { sanitizeForAi } from '@/lib/piiSanitizer'
import { apiLogger } from '@/lib/logger'
import { useAuthStore } from '@/stores/authStore'
import { DoaSummarySchema, safeParseAiResponse } from './aiSchemas'

/**
 * Art. 9-funktioner: tar emot särskilda kategorier av personuppgifter (hälsa,
 * mående, funktionsnedsättning). Kräver uttryckligt samtycke (art. 9.2.a).
 *
 * **Måste hållas i synk med `ART9_FUNCTIONS` i `client/api/ai.js`**, som är den
 * bindande grinden — den här listan finns för att ge användaren ett begripligt
 * fel i stället för en 403, och för att fånga nya ytor som glömmer
 * `AiConsentGate` (UX13 uppstod precis så).
 */
const ART9_FUNCTIONS = new Set([
  'vecko-reflektion',
  'adaptation-recommendations',
  'adaptation-conversation',
  // B16 (2026-08-05): AI-teamets agenter `arbetsterapeut` och
  // `motivationscoach` får energinivå och `supportGoals.challenges` inbakade i
  // prompten av `useAITeamContext`. Se motsvarande kommentar i client/api/ai.js.
  'ai-team-chat',
])

/**
 * Förklaringen användaren får när grinden stoppar ett anrop.
 *
 * Standardtexten ("dina anteckningar om hälsa och mående") beskriver
 * dagbok/mående och stämmer inte för AI-teamet — där handlar det om att
 * chatten bär med sig energinivå och egna beskrivna hinder. Ett fel som
 * beskriver fel sak är svårare att åtgärda än inget fel alls, särskilt för
 * målgruppen.
 */
const ART9_CONSENT_MESSAGES: Record<string, string> = {
  'ai-team-chat':
    'AI-teamet får med sig hur du mår och vad du beskrivit som svårt, så att coacherna kan anpassa sina svar. Godkänn AI-behandling i Inställningar för att använda chatten.',
}

const ART9_DEFAULT_MESSAGE =
  'Den här funktionen läser dina anteckningar om hälsa och mående. Godkänn AI-behandling i Inställningar först.'

/** Kastas när ett art. 9-anrop stoppas för att samtycke saknas. */
export class AiConsentRequiredError extends Error {
  readonly code = 'AI_CONSENT_REQUIRED'
  constructor(message: string) {
    super(message)
    this.name = 'AiConsentRequiredError'
  }
}

interface AIApiResponse<T = unknown> {
  success: boolean
  error?: string
  [key: string]: T | boolean | string | undefined
}

/**
 * Get the current user's access token
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/** Maxtid för ett AI-anrop innan vi ger upp (E1/P3, 2026-07-10).
 *  Vercel-funktionen har egen serverside-timeout; 60 s täcker långsamma
 *  modellsvar utan att låta UI:t vänta för evigt på hängda anslutningar. */
const AI_TIMEOUT_MS = 60_000

/**
 * Saniterar strängar på **alla** nivåer i nyttolasten.
 *
 * `sanitizeObjectForAi` tittar bara på toppnivåns strängfält. Det räcker för
 * `{ jobbAnnons }` men inte för `{ historik: [{ innehall }] }` eller
 * `{ cvData: { workExperience: [...] } }` — och chatthistoriken är just där ett
 * personnummer som skrivits i chatten hamnar. Med bara toppnivå hade samma text
 * strippats i sitt första anrop och sedan följt med osaniterad i varje
 * efterföljande `historik` (B15, 2026-08-05).
 */
function sanitizeDeep<T>(
  value: T,
  strippedAcc: Record<string, number>,
  warnAcc: Record<string, number>
): T {
  if (typeof value === 'string') {
    const result = sanitizeForAi(value)
    for (const [k, v] of Object.entries(result.stripped)) {
      strippedAcc[k] = (strippedAcc[k] || 0) + v
    }
    for (const w of result.warnings) {
      warnAcc[w.type] = (warnAcc[w.type] || 0) + w.count
    }
    return result.sanitized as unknown as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item, strippedAcc, warnAcc)) as unknown as T
  }

  if (value !== null && typeof value === 'object') {
    // Bara vanliga objektliteraler traverseras. Date/File/Map m.fl. lämnas
    // orörda — att bygga om dem till `{}` hade tyst tappat data.
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return value

    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDeep(v, strippedAcc, warnAcc)
    }
    return out as unknown as T
  }

  return value
}

/**
 * GDPR: sanera nyttolasten innan persondata skickas till AI-leverantören (USA).
 * Exporterad så tester kan verifiera den utan att gå via nätverkslagret.
 */
export function sanitizeAiPayload<T extends Record<string, unknown>>(data: T): {
  sanitized: T
  stripped: Record<string, number>
  warnings: Array<{ type: string; count: number }>
} {
  const stripped: Record<string, number> = {}
  const warnAcc: Record<string, number> = {}
  const sanitized = sanitizeDeep(data, stripped, warnAcc)
  const warnings = Object.entries(warnAcc).map(([type, count]) => ({ type, count }))
  return { sanitized, stripped, warnings }
}

/**
 * Gemensam förberedelse för **alla** vägar ut till `/api/ai` — både den
 * vanliga och den strömmande.
 *
 * B15 (2026-08-05): `AgentChat` gjorde ett eget `fetch` förbi det här lagret,
 * så varken art. 9-grinden eller PII-saneringen kördes på portalens mest
 * använda AI-yta. Lägg aldrig till en ny väg till `/api/ai` som inte går
 * genom den här funktionen.
 */
async function prepareAiRequest(
  functionName: string,
  data: Record<string, unknown>
): Promise<{ token: string; sanitized: Record<string, unknown> }> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Du måste vara inloggad för att använda AI-funktioner.')
  }

  // UX13: stoppa art. 9-data redan här när samtycket saknas — då lämnar den
  // aldrig webbläsaren. Servern gör om kontrollen; den här är för användarens
  // skull, inte för säkerhetens.
  if (ART9_FUNCTIONS.has(functionName)) {
    const profile = useAuthStore.getState().profile
    if (!profile?.ai_consent_at) {
      throw new AiConsentRequiredError(
        ART9_CONSENT_MESSAGES[functionName] ?? ART9_DEFAULT_MESSAGE
      )
    }
    if (profile.ai_enabled === false) {
      throw new AiConsentRequiredError(
        'Du har stängt av AI-behandling av dina uppgifter. Slå på det i Inställningar om du vill använda den här funktionen.'
      )
    }
  }

  const { sanitized, stripped, warnings } = sanitizeAiPayload(data)
  const strippedCount = Object.values(stripped).reduce((a, b) => a + b, 0)
  if (strippedCount > 0) {
    apiLogger.warn('[callAI] PII strippad innan AI-anrop:', { functionName, stripped })
  }
  if (warnings.length > 0) {
    apiLogger.debug('[callAI] PII-warning (behållen, krävs för AI-output):', { functionName, warnings })
  }

  return { token, sanitized }
}

/** Översätter ett icke-OK HTTP-svar till portalens felmeddelanden. Kastar alltid. */
async function throwAiHttpError(response: Response): Promise<never> {
  if (response.status === 401) {
    throw new Error('Din session har gått ut. Vänligen logga in igen.')
  }
  if (response.status === 429) {
    throw new Error('För många förfrågningar. Försök igen om en stund.')
  }
  if (response.status === 403) {
    // Serverns art. 9-grind. Läs dess text — den skiljer på "inget samtycke",
    // "avstängt" och "kunde inte kontrolleras".
    const body = await response.json().catch(() => null) as { error?: string; code?: string } | null
    if (body?.code === 'AI_CONSENT_REQUIRED') {
      throw new AiConsentRequiredError(
        body.error ?? 'Funktionen kräver att du godkänner AI-behandling i Inställningar.'
      )
    }
  }
  if (response.status === 502) {
    // B17: serverns formkontroll fällde svaret. Meddelandet är skrivet för
    // användaren och säger vad som gick fel — generisk "kommunikationsfel"
    // skulle göra det omöjligt att veta att ett nytt försök är rimligt.
    const body = await response.json().catch(() => null) as { error?: string; code?: string } | null
    if (body?.code === 'AI_INVALID_RESPONSE' && body.error) {
      throw new Error(body.error)
    }
  }
  throw new Error('Ett fel uppstod vid kommunikation med AI-tjänsten.')
}

/**
 * Make an authenticated request to the AI API
 */
export async function callAI<T = unknown>(
  functionName: string,
  data: Record<string, unknown>
): Promise<AIApiResponse<T>> {
  const { token, sanitized } = await prepareAiRequest(functionName, data)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ function: functionName, data: sanitized }),
      signal: controller.signal
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AI-tjänsten svarade inte i tid. Försök igen om en stund.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    await throwAiHttpError(response)
  }

  return response.json()
}

export interface AiStreamHandlers {
  /** Anropas per token. `full` är allt som strömmats hittills. */
  onChunk?: (chunk: string, full: string) => void
  /** Följdfrågor som servern skickar sist i strömmen. */
  onSuggestions?: (suggestions: string[]) => void
  /** Anroparens avbrytssignal (t.ex. byte av agent eller unmount). */
  signal?: AbortSignal
}

/**
 * Strömmande AI-anrop (SSE) — samma grindar och samma PII-sanering som `callAI`.
 *
 * `callAI` går inte att använda rakt av för strömmande svar: den läser hela
 * kroppen som JSON och sätter en 60 s-timeout över hela anropet. Därför finns
 * den här varianten — men den **delar prelude** med `callAI` (`prepareAiRequest`)
 * så saneringen inte går att missa. Timeouten gäller bara tills svarshuvudena
 * kommit; själva strömmen får ta den tid modellen behöver.
 *
 * Kastar `DOMException` med namnet `AbortError` när anroparens signal avbryter,
 * så anroparen kan skilja avbrott från riktiga fel.
 *
 * @returns hela det strömmade svaret som text.
 */
export async function callAIStream(
  functionName: string,
  data: Record<string, unknown>,
  handlers: AiStreamHandlers = {}
): Promise<string> {
  const { token, sanitized } = await prepareAiRequest(functionName, data)

  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()
  const callerSignal = handlers.signal
  if (callerSignal) {
    if (callerSignal.aborted) abortFromCaller()
    else callerSignal.addEventListener('abort', abortFromCaller, { once: true })
  }

  let connectTimedOut = false
  const timeoutId = setTimeout(() => {
    connectTimedOut = true
    controller.abort()
  }, AI_TIMEOUT_MS)

  try {
    let response: Response
    try {
      response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ function: functionName, stream: true, data: sanitized }),
        signal: controller.signal
      })
    } catch (err) {
      if (connectTimedOut) {
        throw new Error('AI-tjänsten svarade inte i tid. Försök igen om en stund.')
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      await throwAiHttpError(response)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Ett fel uppstod vid kommunikation med AI-tjänsten.')
    }

    const decoder = new TextDecoder()
    let full = ''
    let buffer = ''

    /** Hanterar en SSE-rad. JSON-parsning och hantering hålls isär: annars
     *  fångas serverns `{ error }` av samma catch som "trasig JSON" och
     *  försvinner tyst — så gjorde AgentChat före B15. */
    const handleLine = (line: string) => {
      if (!line.startsWith('data: ')) return
      const payload = line.slice(6).trim()
      if (!payload || payload === '[DONE]') return

      let parsed: { content?: string; token?: string; suggestions?: unknown; error?: string }
      try {
        parsed = JSON.parse(payload)
      } catch {
        return // trasig JSON — hoppa över raden
      }

      if (parsed.error) throw new Error(parsed.error)

      // Föredrar { content }; { token } är legacy-fältet från ai.js SSE-grenen.
      const chunk = parsed.content ?? parsed.token
      if (chunk) {
        full += chunk
        handlers.onChunk?.(chunk, full)
      }
      if (Array.isArray(parsed.suggestions)) {
        handlers.onSuggestions?.(parsed.suggestions.filter((s): s is string => typeof s === 'string'))
      }
    }

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) handleLine(line)
    }

    buffer += decoder.decode()
    if (buffer.trim()) handleLine(buffer.trim())

    return full
  } finally {
    clearTimeout(timeoutId)
    callerSignal?.removeEventListener('abort', abortFromCaller)
  }
}

/**
 * Convenience functions for specific AI endpoints
 */

export async function generateCoverLetter(data: {
  jobbAnnons?: string
  jobDescription?: string
  companyName?: string
  jobTitle?: string
  cvData?: Record<string, unknown>
  ton?: 'professionell' | 'entusiastisk' | 'formell'
  extraKeywords?: string
  motivering?: string
}) {
  return callAI<string>('personligt-brev', data)
}

// C12 (2026-07-23): convenience-wrappers för de 8 orphanade ai.js-funktionerna
// raderade tillsammans med funktionerna (cv-optimering, generera-cv-text,
// intervju-forberedelser, jobbtips, loneforhandling, natverkande,
// ansokningscoach, mentalt-stod) — noll anropare. Återskapas från git-
// historiken om G10-personaliseringen vill koppla in någon av dem.
// karriarplan lever (anropas direkt via callAI i PlanTab, B7).

export async function chatWithAI(data: {
  meddelande: string
  historik?: Array<{ roll: string; innehall: string }>
}) {
  return callAI<string>('chatbot', data)
}

/**
 * Profilsammanfattning till `profiles.ai_summary`.
 *
 * B17 (2026-08-05): svaret castades tidigare rakt av. Anroparen
 * (`profileEnhancementsApi.ts:722-735`) plockade `.summary || .content ||
 * (typeof result === 'string' ? result : '')` — och skrev sedan resultatet
 * till databasen **utan att kontrollera att det blev något**. Vid oväntad
 * svarsform sparades alltså tomma strängen som användarens sammanfattning,
 * `ai_summary_updated_at` sattes, och UI:t visade en tom ruta som såg
 * genererad ut. Att kasta här är enda sättet att stoppa skrivningen utan att
 * röra anroparen: fel ska synas som fel, inte som en tom sammanfattning.
 */
export async function generateProfileSummary(data: {
  name?: string
  title?: string
  location?: string
  experience?: Array<{ title: string; company: string; description?: string }>
  education?: Array<{ degree: string; school: string }>
  skills?: Array<{ name: string; level?: number }>
  desiredJobs?: string[]
  interests?: string[]
}) {
  const result = await callAI<string>('profile-summary', data)
  const summary = (result as { summary?: unknown }).summary
  if (typeof summary !== 'string' || summary.trim().length === 0) {
    throw new Error('AI-tjänsten gav ingen sammanfattning. Försök igen om en stund.')
  }
  return { ...result, summary: summary.trim() }
}

/**
 * STA — DOA-sammanfattning för AF-blankett sida 4.
 * Returnerar strukturerad summering med 1 mål-och-planering + en text per kategori.
 * AT redigerar utkastet innan PDF-export.
 */
export interface DoaSummaryResult {
  malPlanering: string
  kategorier: Array<{ title: string; resurserBegransningar: string }>
}

export async function generateDoaSummary(data: {
  firstName?: string
  categories: Array<{
    title: string
    items: Array<{
      text: string
      person: number | null
      bedomare: number | string | null
      comment: string | null
    }>
  }>
}) {
  const result = await callAI<DoaSummaryResult>('sta-doa-sammanfattning', data as unknown as Record<string, unknown>)

  // B17 (2026-08-05): tidigare returnerades `result` orört och anroparen
  // (`pages/sta/components/AssessmentEditor.tsx:326`) läste `.malPlanering`
  // och `.kategorier[i].resurserBegransningar` direkt ur det castade svaret.
  // Texten skrivs till `scores._ai_summary` och exporteras till AF:s blankett
  // — ett fält med fel typ blir "[object Object]" i ett myndighetsdokument.
  // Servern formkontrollerar numera också (RESPONSE_VALIDATORS i ai.js); den
  // här grinden finns för att en klient aldrig ska lita på att servern gjorde
  // det, och för att ge ett begripligt fel i stället för en 502.
  const parsed = safeParseAiResponse(
    DoaSummarySchema,
    (result as { sammanfattning?: unknown }).sammanfattning
  )
  if (!parsed.success) {
    throw new Error('AI-sammanfattningen hade oväntat format. Försök igen om en stund.')
  }

  return { ...result, sammanfattning: parsed.data as DoaSummaryResult }
}

export default {
  callAI,
  callAIStream,
  generateCoverLetter,
  chatWithAI,
  generateProfileSummary
}
