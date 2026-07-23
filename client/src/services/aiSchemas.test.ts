/**
 * Tester för aiSchemas — verifierar safeParseAiResponse hanterar:
 * - Direkt JSON-objekt
 * - Strängifierad JSON
 * - Markdown-code-fence ```json ... ```
 * - ai.js-fallback `{ raw: "..." }`
 * - Schema-mismatch (returnerar tydligt fel)
 */

import { describe, it, expect } from 'vitest'
import {
  KarriarPlanSchema,
  KompetensgapSchema,
  IntervjuSimulatorResultSchema,
  StaDocumentDraftSchema,
  safeParseAiResponse,
} from './aiSchemas'

describe('safeParseAiResponse', () => {
  it('parsar ett giltigt karriarplan-objekt', () => {
    const input = {
      analysis: 'En 3-stegs-plan',
      steps: [
        { order: 1, title: 'Steg 1', description: 'Bygg CV', timeframe: 'Månad 1', actions: ['Uppdatera CV'] },
      ],
      keySkills: ['Kommunikation'],
    }
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
    expect(r.data?.steps).toHaveLength(1)
  })

  it('parsar strängifierad JSON', () => {
    const input = JSON.stringify({
      steps: [{ title: 'X', description: 'Y' }],
    })
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
  })

  it('parsar markdown-code-fence-omslutet JSON', () => {
    const input = '```json\n{ "steps": [{ "title": "A", "description": "B" }] }\n```'
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
  })

  it('hanterar ai.js-fallback { raw: "..." }', () => {
    const input = { raw: '{ "steps": [{ "title": "Q", "description": "W" }] }' }
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
  })

  it('returnerar tydligt fel vid schema-mismatch', () => {
    const input = { steps: [{ wrong_key: true }] }
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(false)
    expect(r.error).toContain('matchade inte förväntat format')
  })

  it('returnerar tydligt fel vid icke-JSON', () => {
    const r = safeParseAiResponse(KarriarPlanSchema, 'inte json alls')
    expect(r.success).toBe(false)
    expect(r.error).toContain('inte giltig JSON')
  })

  it('parsar kompetensgap-svar', () => {
    const input = {
      matchPercentage: 65,
      skills: [{ name: 'React', current: 3, target: 4, gap: 'small' }],
    }
    const r = safeParseAiResponse(KompetensgapSchema, input)
    expect(r.success).toBe(true)
  })

  it('parsar intervju-simulator-resultat', () => {
    const input = {
      overall_score: 7,
      strengths: ['Struktur', 'Konkret'],
      summary: 'Bra övning',
    }
    const r = safeParseAiResponse(IntervjuSimulatorResultSchema, input)
    expect(r.success).toBe(true)
  })

  it('parsar STA-document-draft (wrappat format från prompten)', () => {
    const input = {
      sections: {
        sammanfattning: { title: 'Sammanfattning', content: 'Texten...' },
        progression_aktivitetsomfattning: { title: 'Progression', content: 'Mer text.' },
      },
    }
    const r = safeParseAiResponse(StaDocumentDraftSchema, input)
    expect(r.success).toBe(true)
    expect(r.data?.sammanfattning.title).toBe('Sammanfattning')
  })

  it('parsar STA-document-draft som rå JSON-sträng (utan parseJson server-side)', () => {
    const input = '{"sections":{"sammanfattning":{"title":"Sammanfattning","content":"Text"}}}'
    const r = safeParseAiResponse(StaDocumentDraftSchema, input)
    expect(r.success).toBe(true)
    expect(r.data?.sammanfattning.content).toBe('Text')
  })

  it('failar STA-document-draft vid trasig sektionsform', () => {
    const input = { sections: { sammanfattning: { rubrik: 'fel nycklar' } } }
    const r = safeParseAiResponse(StaDocumentDraftSchema, input)
    expect(r.success).toBe(false)
  })
})
