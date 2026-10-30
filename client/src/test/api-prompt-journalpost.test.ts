/**
 * AIX11 — promptens kontrakt. Stolparna är enda indata; datum, klockslag och
 * kontaktform fylls i av koden (journalSol.ts) och får aldrig komma från AI:n.
 */
import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PROMPTS } = require('../../api/_prompts/index.js') as {
  PROMPTS: Record<string, (data: unknown) => { system: string; user: string; maxTokens: number; responseKey?: string }>
}

describe('prompten konsulent-journalpost', () => {
  const bygg = (data: unknown) => PROMPTS['konsulent-journalpost'](data)

  it('finns, har svarsnyckeln journalpost och en budget som rymmer resonemang + svar', () => {
    const p = bygg({ stolpar: 'ringde' })
    expect(p.responseKey).toBe('journalpost')
    expect(p.maxTokens).toBeGreaterThanOrEqual(400)
  })

  it('stolparna är ENDA indata: allt annat i data ignoreras', () => {
    const p = bygg({
      stolpar: 'ringde, sökt 2 jobb',
      namn: 'Anna Andersson',
      journal: ['Tidigare anteckning om hälsa'],
      datum: '2026-10-30',
      kontaktform: 'telefon',
    })
    for (const lackt of ['Anna Andersson', 'Tidigare anteckning', '2026-10-30', 'telefon']) {
      expect(p.user).not.toContain(lackt)
      expect(p.system).not.toContain(lackt)
    }
    expect(p.user).toContain('ringde, sökt 2 jobb')
  })

  it('förbjuder datum, kontaktform, värdeomdömen, orsakstolkning och påhitt', () => {
    const s = bygg({ stolpar: 'x' }).system
    expect(s).toMatch(/Skriv inget datum, klockslag, kontaktform/)
    expect(s).toMatch(/Inga värdeomdömen/)
    expect(s).toMatch(/Tolka inte varför/)
    expect(s).toMatch(/hitta aldrig på/i)
    expect(s).toMatch(/ENBART det som står i stolparna/)
  })

  it('kapar orimligt långa stolpar och tål saknad indata', () => {
    expect(bygg({ stolpar: 'a'.repeat(5000) }).user.length).toBeLessThan(1700)
    expect(bygg({}).user).toContain('Inga stolpar.')
    expect(bygg(undefined).user).toContain('Inga stolpar.')
  })
})
