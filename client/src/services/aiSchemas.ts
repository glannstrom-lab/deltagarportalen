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
// --------------------------------------------------------------
export const KarriarPlanStepSchema = z.object({
  rubrik: z.string(),
  beskrivning: z.string(),
  tidsram: z.string().optional(),
  prioritet: z.enum(['hög', 'medel', 'låg']).optional(),
})

export const KarriarPlanSchema = z.object({
  sammanfattning: z.string().optional(),
  steg: z.array(KarriarPlanStepSchema).min(1),
  hinder: z.array(z.string()).optional(),
  resurser: z.array(z.string()).optional(),
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
// sta-document-draft (rapportautomatisering Steg-till-arbete)
// --------------------------------------------------------------
export const StaDocumentSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  bullets: z.array(z.string()).optional(),
})

export const StaDocumentDraftSchema = z.object({
  title: z.string().optional(),
  sections: z.array(StaDocumentSectionSchema).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type StaDocumentDraft = z.infer<typeof StaDocumentDraftSchema>

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
