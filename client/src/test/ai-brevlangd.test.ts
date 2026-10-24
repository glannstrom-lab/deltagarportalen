/**
 * AIX10: personligt-brev i tre längder (brev, mejl, chatt).
 *
 * Det som får skilja längderna är längdangivelsen. Sanningsreglerna, förbudet
 * mot platshållare och mot hälsningsfras ska finnas i ALLA längder — annars
 * blir den korta versionen den som hittar på (korta texter blir lätt vaga och
 * då frestar modellen med påhitt).
 */
import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const { PROMPTS } = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system: string; user: string; maxTokens: number }>
}
/* eslint-enable @typescript-eslint/no-require-imports */

const bas = {
  companyName: 'Nordfrakt AB',
  jobTitle: 'Lagerarbetare',
  jobDescription: 'Vi söker en lagerarbetare.',
  extraContext: 'Jag har truckkort.',
}
const bygg = (langd?: unknown) => PROMPTS['personligt-brev']({ ...bas, ...(langd === undefined ? {} : { langd }) })

const LANGDER = ['brev', 'mejl', 'chatt'] as const

describe('personligt-brev: längdparametern', () => {
  it('utan langd är resultatet det vanliga brevet (250-350 ord, 1500 tokens)', () => {
    const p = bygg()
    expect(p.system).toContain('250-350 ord')
    expect(p.maxTokens).toBe(1500)
    expect(p.user).toContain('Skriv ett personligt brev för:')
    expect(p.user).toContain('Skriv brevet:')
  })

  it.each(['okänd', '', 'MEJL', '__proto__', 'constructor', 'toString', 42, null, {}, ['mejl']])(
    'okänt värde %j faller tillbaka på standardlängden',
    (v) => {
      expect(bygg(v)).toEqual(bygg())
    },
  )

  it('mejl: exakt tre meningar, och ingen brevlängd kvar', () => {
    const p = bygg('mejl')
    expect(p.system).toMatch(/EXAKT tre meningar/)
    expect(p.system).not.toContain('250-350 ord')
    expect(p.maxTokens).toBeLessThan(1500)
  })

  it('chatt: högst två meningar, och ingen brevlängd kvar', () => {
    const p = bygg('chatt')
    expect(p.system).toMatch(/högst 2 meningar/)
    expect(p.system).not.toContain('250-350 ord')
    expect(p.maxTokens).toBeLessThan(1500)
  })

  it.each(LANGDER)('%s: sanningsregler och förbud finns i systemprompten', (langd) => {
    const { system } = bygg(langd)
    expect(system).toMatch(/Hitta ALDRIG på erfarenheter/)
    expect(system).toMatch(/EGENSKAPER, VANOR och FÖRMÅGOR/)
    expect(system).toMatch(/Tillskriv inte heller ARBETSGIVAREN/)
    expect(system).toMatch(/ALDRIG platshållare/)
    expect(system).toMatch(/Avsluta ALDRIG brevet med en hälsningsfras/)
    expect(system).toMatch(/UNDERLAGET TUNT ELLER TOMT/)
    // Den gemensamma sanningsregeln läggs på av sammansättningsstället (index.js).
    expect(system).toMatch(/SANNINGSREGEL|sanningsregel|aldrig.*hitta på|Never invent/i)
  })

  it.each(LANGDER)('%s: tomt underlag ger fortfarande utkast med luckor, med rätt längd', (langd) => {
    const { system } = PROMPTS['personligt-brev']({ companyName: 'X', jobTitle: 'Y', jobDescription: 'Z', langd, tomtUnderlag: true })
    expect(system).toContain('INGET UNDERLAG OM PERSONEN')
    expect(system).toContain('Påstå ALDRIG något om personens språk')
    if (langd === 'brev') expect(system).toContain('120-180 ord inklusive luckorna')
    else expect(system).not.toContain('120-180 ord inklusive luckorna')
  })

  it('underlaget (CV, egen text) når modellen i alla längder', () => {
    for (const langd of LANGDER) {
      const { user } = bygg(langd)
      expect(user).toContain('Nordfrakt AB')
      expect(user).toContain('Jag har truckkort.')
    }
  })
})
