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
      sammanfattning: 'En 3-stegs-plan',
      steg: [
        { rubrik: 'Steg 1', beskrivning: 'Bygg CV', tidsram: '1 vecka', prioritet: 'hög' },
      ],
    }
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
    expect(r.data?.steg).toHaveLength(1)
  })

  it('parsar strängifierad JSON', () => {
    const input = JSON.stringify({
      steg: [{ rubrik: 'X', beskrivning: 'Y' }],
    })
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
  })

  it('parsar markdown-code-fence-omslutet JSON', () => {
    const input = '```json\n{ "steg": [{ "rubrik": "A", "beskrivning": "B" }] }\n```'
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
  })

  it('hanterar ai.js-fallback { raw: "..." }', () => {
    const input = { raw: '{ "steg": [{ "rubrik": "Q", "beskrivning": "W" }] }' }
    const r = safeParseAiResponse(KarriarPlanSchema, input)
    expect(r.success).toBe(true)
  })

  it('returnerar tydligt fel vid schema-mismatch', () => {
    const input = { steg: [{ wrong_key: true }] }
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

  it('parsar STA-document-draft', () => {
    const input = {
      title: 'Vecka 3',
      sections: [
        { title: 'Sammanfattning', content: 'Texten...' },
      ],
    }
    const r = safeParseAiResponse(StaDocumentDraftSchema, input)
    expect(r.success).toBe(true)
  })
})
