/**
 * Kör: npx -y deno@2.9.6 test supabase/functions/ai-company-search/tolka.test.ts
 *
 * `parseCompaniesFromResponse` letade JSON-arrayen med ett ICKE-girigt mönster,
 * `/\[[\s\S]*?\]/` — det stannar vid första `]`. Perplexity (sonar) sätter
 * källhänvisningar som `[1]` i sin text, också inne i JSON-strängarna. Då:
 *  - en hänvisning FÖRE arrayen ("enligt allabolag[1]:") blev själva "arrayen"
 *    → `[1]` → noll företag ur JSON-grenen;
 *  - en hänvisning INNE i en beskrivning kapade arrayen mitt i en sträng →
 *    JSON.parse kastade.
 * I båda fallen föll funktionen tillbaka på regex-utvinning av organisations-
 * nummer, som tappar beskrivning, ort och bransch — och företag utan org.nr helt.
 */

import { parseCompaniesFromResponse } from './tolka.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

const FORETAG = [
  { name: 'Bageriet i Malmö AB', orgNumber: '5560123456', description: 'Bakar surdegsbröd[1]', city: 'Malmö', industry: 'Livsmedel' },
  { name: 'Brödboden HB', orgNumber: '9696123456', description: 'Kafé och bageri[2][3]', city: 'Lund', industry: 'Livsmedel' },
]

Deno.test('källhänvisning inne i en beskrivning: alla fält följer med', () => {
  const svar = JSON.stringify(FORETAG, null, 2)
  const r = parseCompaniesFromResponse(svar)
  assert(r.length === 2, `fick ${r.length} företag`)
  assert(r[0].description === 'Bakar surdegsbröd[1]', `beskrivning: ${JSON.stringify(r[0].description)}`)
  assert(r[1].city === 'Lund', `ort: ${JSON.stringify(r[1].city)}`)
})

Deno.test('källhänvisning i texten före arrayen: arrayen hittas ändå', () => {
  const svar = `Enligt allabolag.se[1] och proff.se[2] hittade jag följande:\n\n${JSON.stringify(FORETAG)}`
  const r = parseCompaniesFromResponse(svar)
  assert(r.length === 2, `fick ${r.length} företag`)
  assert(r.every((c) => c.industry === 'Livsmedel'), 'branschen tappades — regex-reserven användes')
})

Deno.test('text efter arrayen med hakparentes stör inte', () => {
  const svar = `${JSON.stringify(FORETAG)}\n\nKällor: [1] allabolag.se [2] proff.se`
  const r = parseCompaniesFromResponse(svar)
  assert(r.length === 2 && r[0].city === 'Malmö', JSON.stringify(r))
})

Deno.test('ren array utan hänvisningar: oförändrat beteende', () => {
  const r = parseCompaniesFromResponse('```json\n' + JSON.stringify([{ name: 'X AB', orgNumber: '556012-3456' }]) + '\n```')
  assert(r.length === 1 && r[0].orgNumber === '5560123456', JSON.stringify(r))
})

Deno.test('företag utan org.nr följer med ur JSON (reserven tappade dem)', () => {
  const r = parseCompaniesFromResponse(`Se [1].\n${JSON.stringify([{ name: 'Utan Nummer AB', description: 'x' }])}`)
  assert(r.length === 1 && r[0].name === 'Utan Nummer AB' && r[0].orgNumber === null, JSON.stringify(r))
})

// ─── fyllIOrgnummer (andra sökningen) ─────────────────────────────────────

import { fyllIOrgnummer } from './tolka.ts'
import type { CompanySearchResult } from './tolka.ts'

function foretag(name: string, orgNumber: string | null = null): CompanySearchResult {
  return { name, orgNumber, description: '', city: null, industry: null, verified: false }
}

Deno.test('fyllIOrgnummer: avslutande källhänvisning hindrar inte tolkningen', () => {
  const lista = [foretag('Bageriet i Malmö AB')]
  const n = fyllIOrgnummer(lista, '[{"name": "Bageriet i Malmö AB", "orgNumber": "556012-3456"}]\n\nKälla: [1]')
  assert(n === 1 && lista[0].orgNumber === '5560123456', JSON.stringify(lista))
})

Deno.test('fyllIOrgnummer: ett tomt namn ger INTE första företaget ett främmande nummer', () => {
  const lista = [foretag('Bageriet i Malmö AB'), foretag('Brödboden HB')]
  fyllIOrgnummer(lista, '[{"name": "", "orgNumber": "5569999999"}]')
  assert(lista.every((c) => c.orgNumber === null), JSON.stringify(lista))
})

Deno.test('fyllIOrgnummer: rör inte ett företag som redan har nummer', () => {
  const lista = [foretag('Bageriet i Malmö AB', '5560123456')]
  fyllIOrgnummer(lista, '[{"name": "Bageriet i Malmö AB", "orgNumber": "5561111111"}]')
  assert(lista[0].orgNumber === '5560123456', JSON.stringify(lista))
})
