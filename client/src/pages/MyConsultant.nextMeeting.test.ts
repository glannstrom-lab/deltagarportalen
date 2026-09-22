/**
 * Regression (2026-09-22, fynd i prod-sveppet över AI-agenternas filer):
 * "Nästa möte"-frågan mot `consultant_meetings` använde `.single()`, som
 * kräver EXAKT en rad. Varenda deltagare utan ett bokat kommande möte fick
 * PostgREST att svara 406 PGRST116 på /my-consultant — och `error` lästes
 * inte ens ut, så felet försvann tyst. Samma buggklass beskrivs redan i
 * UX12-kommentaren i filen (RPC:n `get_my_consultant` gick i samma fälla),
 * men den fixen missade den här andra frågan.
 *
 * `.maybeSingle()` (0 eller 1 rad, inget fel vid tom träff) är rätt verktyg
 * här eftersom frågan redan filtrerar med `.limit(1)`.
 *
 * Vakten läser källan i stället för att mocka Supabase-klienten, av samma
 * skäl som MyConsultant.i18n.test.ts: den ska falla på KÄLLTEXTEN, inte på
 * en mock som är snällare än verkligheten.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, 'MyConsultant.tsx'), 'utf8')

describe('MyConsultant: consultant_meetings-frågan får aldrig kräva exakt en rad', () => {
  it('använder maybeSingle(), inte single(), för "nästa möte"', () => {
    const meetingsBlockMatch = source.match(
      /from\('consultant_meetings'\)[\s\S]*?\n\s*\n/
    )
    expect(meetingsBlockMatch).not.toBeNull()

    const block = meetingsBlockMatch![0]
    expect(block).toContain('.maybeSingle()')
    expect(block).not.toMatch(/\.single\(\)/)
  })

  it('läser ut och loggar error från nästa-möte-frågan i stället för att svälja den', () => {
    const idx = source.indexOf("from('consultant_meetings')")
    expect(idx).toBeGreaterThan(-1)
    const around = source.slice(Math.max(0, idx - 200), idx + 400)
    expect(around).toMatch(/error:\s*meetingError/)
  })
})
