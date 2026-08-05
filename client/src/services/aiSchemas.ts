/**
 * Zod-scheman för AI-svar (C5, 2026-05-15)
 *
 * Audit-fynd H8: AI JSON-parse-fel föll tillbaka till `{ raw: content }`
 * → UI fick `result.steps === undefined` utan signal. Tyst trasighet,
 * värre än crash.
 *
 * Lösning: parsea AI-svar mot Zod-schema i klienten. Vid mismatch
 * visar UI tydligt felmeddelande istället för att rendera undefined.
 *
 * Använd `safeParseAiResponse(schema, raw)` i stället för rå JSON.parse.
 */

import { z } from 'zod'

// --------------------------------------------------------------
// karriarplan (career-plan)
// Matchar ai.js:s faktiska svarsform (B7, 2026-07-23) — den tidigare
// varianten (rubrik/beskrivning/steg) motsvarade inget verkligt svar.
// --------------------------------------------------------------
export const KarriarPlanStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  timeframe: z.string().optional(),
  actions: z.array(z.string()).optional(),
})

export const KarriarPlanSchema = z.object({
  steps: z.array(KarriarPlanStepSchema).min(1),
  analysis: z.string().optional(),
  keySkills: z.array(z.string()).optional(),
})

export type KarriarPlan = z.infer<typeof KarriarPlanSchema>

// --------------------------------------------------------------
// kompetensgap (skills-gap)
// --------------------------------------------------------------
export const KompetensComparisonSchema = z.object({
  name: z.string(),
  current: z.number().min(0).max(5),
  target: z.number().min(0).max(5),
  gap: z.enum(['none', 'small', 'medium', 'large']),
})

export const KurseRecommendationSchema = z.object({
  title: z.string(),
  provider: z.string().optional(),
  duration: z.string().optional(),
  type: z.string().optional(),
  cost: z.string().optional(),
  // Medvetet inte .url() — en AI-felskriven URL ska inte fälla hela analysen
  url: z.string().optional(),
})

export const ActionPlanStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
})

export const KompetensgapSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  skills: z.array(KompetensComparisonSchema).min(1),
  courses: z.array(KurseRecommendationSchema).optional(),
  actionPlan: z.array(ActionPlanStepSchema).optional(),
})

export type KompetensGap = z.infer<typeof KompetensgapSchema>

// --------------------------------------------------------------
// intervju-simulator (resultat efter en simulator-session)
// --------------------------------------------------------------
export const IntervjuQuestionSchema = z.object({
  question: z.string(),
  answer: z.string().optional(),
  feedback: z.string().optional(),
  score: z.number().min(0).max(10).optional(),
})

export const IntervjuSimulatorResultSchema = z.object({
  overall_score: z.number().min(0).max(10).optional(),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  questions: z.array(IntervjuQuestionSchema).optional(),
  summary: z.string().optional(),
})

export type IntervjuResult = z.infer<typeof IntervjuSimulatorResultSchema>

// --------------------------------------------------------------
// vecko-reflektion (G12, 2026-07-27)
// Veckoreflektion till deltagaren själv, byggd på dagbok + mående.
// `summary` är obligatorisk — en reflektion utan text är inget att visa.
// `gentleSuggestion` är valfri med flit: prompten säger uttryckligen att
// fältet ska utelämnas när underlaget inte ger stöd för ett förslag, i
// stället för att hitta på ett.
// --------------------------------------------------------------
export const VeckoReflektionSchema = z.object({
  summary: z.string().min(1),
  noticed: z.array(z.string()).optional(),
  gentleSuggestion: z.string().optional(),
})

export type VeckoReflektion = z.infer<typeof VeckoReflektionSchema>

// --------------------------------------------------------------
// sta-document-draft (rapportautomatisering Steg-till-arbete)
// Verklig svarsform (B8, 2026-07-23): sections är ett OBJEKT keyat på
// sektionsnyckel — { sections: { section_key: { title, content } } }.
// Det gamla schemat (array + metadata) motsvarade inget verkligt svar
// och hade alltid failat om det kopplats in.
// --------------------------------------------------------------
export const StaDocumentSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
})

export const StaDocumentSectionsSchema = z.record(z.string(), StaDocumentSectionSchema)

/** Accepterar både wrappern { sections: {...} } (promptens format) och en
 *  bar sektions-record; normaliserar alltid till Record<key, {title,content}>. */
export const StaDocumentDraftSchema = z.union([
  z
    .object({ sections: StaDocumentSectionsSchema })
    .transform((d) => d.sections),
  StaDocumentSectionsSchema,
])

export type StaDocumentDraft = z.infer<typeof StaDocumentDraftSchema>

// --------------------------------------------------------------
// sta-doa-sammanfattning (B17, 2026-08-05)
// Texten landar i Arbetsförmedlingens DOA-blankett sida 4: `malPlanering`
// i den stora rutan (Text230), en `kategorier`-post per mindre ruta
// (Text231-235). Svaret castades tidigare rakt av — `callAI<DoaSummaryResult>`
// utan kontroll — och ett fält med fel typ hade blivit `[object Object]` i
// ett myndighetsdokument, eller en tom ruta.
//
// `min(1)` på strängarna är avsiktligt: en tom text är inte ett giltigt svar
// här, den är ett tyst misslyckande som arbetsterapeuten får upptäcka i PDF:en.
// --------------------------------------------------------------
export const DoaSummaryCategorySchema = z.object({
  title: z.string().min(1),
  resurserBegransningar: z.string().min(1),
})

export const DoaSummarySchema = z.object({
  malPlanering: z.string().min(1),
  kategorier: z.array(DoaSummaryCategorySchema).min(1),
})

export type DoaSummary = z.infer<typeof DoaSummarySchema>

// --------------------------------------------------------------
// Helper: säker parse
// --------------------------------------------------------------
export interface AiParseResult<T> {
  success: boolean
  data?: T
  error?: string
  raw?: unknown
}

/**
 * Försök parsea ett AI-svar mot ett Zod-schema. Returnerar
 * { success: true, data } eller { success: false, error, raw }.
 *
 * Hanterar:
 * - Direkt JSON-objekt
 * - Strängifierad JSON
 * - Markdown-code-fence-omslutet (```json {...} ```)
 * - "raw"-fallback från ai.js (`{ raw: content }`)
 */
export function safeParseAiResponse<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): AiParseResult<T> {
  let candidate: unknown = input

  // Hantera ai.js-fallback `{ raw: "..." }`
  if (candidate && typeof candidate === 'object' && 'raw' in candidate) {
    candidate = (candidate as { raw: unknown }).raw
  }

  // Sträng → försök JSON-parse, eventuellt med code-fence-strip
  if (typeof candidate === 'string') {
    let text = candidate.trim()
    // Strippa code-fence ```json ... ```
    const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
    if (fenceMatch) text = fenceMatch[1]
    try {
      candidate = JSON.parse(text)
    } catch {
      return {
        success: false,
        error: 'AI-svaret var inte giltig JSON.',
        raw: input,
      }
    }
  }

  const result = schema.safeParse(candidate)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: 'AI-svaret matchade inte förväntat format: ' +
           result.error.issues.map(i => i.path.join('.') + ': ' + i.message).slice(0, 3).join('; '),
    raw: candidate,
  }
}
