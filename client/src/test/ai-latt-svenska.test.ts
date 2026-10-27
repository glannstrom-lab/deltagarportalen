/**
 * AIX25 (2026-10-27): AI-svaren följer Lätt svenska.
 *
 * Två grindar:
 *  1. Promptbygget — `sv-latt` ger Lätt svenska-regeln i alla funktioner som tar
 *     språk, vanlig svenska och engelska får den inte (och engelskan ändras inte
 *     alls), och `sv-latt` faller aldrig till engelska.
 *  2. LIX-måttet på fasta exempelsvar (fixturer). AI går inte att köra lokalt, så
 *     fixturerna visar att måttet SKILJER lätt från vanlig text. Samma funktion
 *     körs mot skarpa svar av e2e/latt-ai-prod-rok.cjs.
 */
import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const { PROMPTS } = require('../../api/_prompts/index.js') as {
  PROMPTS: Record<string, (data: unknown) => { system: string }>
}
const { sprakFran, LATT_SVENSKA_REGEL, medLattSvenska } = require('../../api/_prompts/_delat.js') as {
  sprakFran: (d: unknown) => 'sv' | 'sv-latt' | 'en'
  LATT_SVENSKA_REGEL: string
  medLattSvenska: (s: string, d: unknown) => string
}
const { lix, LIX_TAK_LATT } = require('../../api/_prompts/_lix.js') as {
  lix: (t: string) => { lix: number; ord: number; meningar: number }
  LIX_TAK_LATT: number
}
/* eslint-enable @typescript-eslint/no-require-imports */

const FUNKTIONER = ['chatbot', 'ai-team-chat', 'adaptation-recommendations', 'adaptation-conversation', 'vecko-reflektion']
const MARKOR = 'LÄTT SVENSKA'

describe('sprakFran', () => {
  it.each([
    [{ sprak: 'sv-latt' }, 'sv-latt'],
    [{ language: 'sv-latt' }, 'sv-latt'],
    [{ sprak: 'SV-latt ' }, 'sv-latt'],
    [{ sprak: 'sv_latt' }, 'sv-latt'],
    [{ sprak: 'sv-latt', language: 'sv' }, 'sv-latt'],
    [{ sprak: 'en' }, 'en'],
    [{ language: 'en-GB' }, 'en'],
    [{ sprak: 'sv' }, 'sv'],
    [{}, 'sv'],
    [undefined, 'sv'],
    [{ sprak: 42 }, 'sv'],
    [{ sprak: 'fr' }, 'sv'],
  ])('%j -> %s', (data, vantat) => {
    expect(sprakFran(data)).toBe(vantat)
  })
})

describe('Lätt svenska i promptarna', () => {
  for (const fn of FUNKTIONER) {
    it(`${fn}: sv-latt får regeln, sv och en får den inte`, () => {
      expect(PROMPTS[fn]({ sprak: 'sv-latt' }).system).toContain(MARKOR)
      expect(PROMPTS[fn]({ language: 'sv-latt' }).system).toContain(MARKOR)
      expect(PROMPTS[fn]({ sprak: 'sv' }).system).not.toContain(MARKOR)
      expect(PROMPTS[fn]({ sprak: 'en' }).system).not.toContain(MARKOR)
      expect(PROMPTS[fn]({}).system).not.toContain(MARKOR)
    })

    it(`${fn}: sv-latt ger samma prompt som sv plus regeln — inget annat ändras`, () => {
      const sv = PROMPTS[fn]({ sprak: 'sv' }).system
      const latt = PROMPTS[fn]({ sprak: 'sv-latt' }).system
      expect(latt.length).toBeGreaterThan(sv.length)
      expect(latt).toContain(LATT_SVENSKA_REGEL)
      // Sanningsregeln (läggs på sist av index.js) ska finnas kvar i båda.
      expect(latt).toContain('SANNINGSREGEL')
    })
  }

  it('ai-team-chat: sv-latt faller inte till engelska, en gör det fortfarande', () => {
    expect(PROMPTS['ai-team-chat']({ sprak: 'sv-latt' }).system).toContain('Svara på svenska')
    expect(PROMPTS['ai-team-chat']({ sprak: 'sv-latt' }).system).not.toContain('Answer in English')
    expect(PROMPTS['ai-team-chat']({ sprak: 'en' }).system).toContain('Answer in English')
    expect(PROMPTS['ai-team-chat']({ sprak: 'en' }).system).not.toContain('Svara på svenska')
  })

  it('adaptation-*: sv-latt väljer den svenska grenen, language=en den engelska', () => {
    for (const fn of ['adaptation-recommendations', 'adaptation-conversation']) {
      expect(PROMPTS[fn]({ language: 'sv-latt' }).system).toMatch(/på svenska/)
      expect(PROMPTS[fn]({ language: 'en' }).system).toMatch(/in English/)
    }
  })

  it('medLattSvenska lämnar texten byte för byte oförändrad utanför sv-latt', () => {
    expect(medLattSvenska('abc', { sprak: 'en' })).toBe('abc')
    expect(medLattSvenska('abc', undefined)).toBe('abc')
  })

  it('regeln ändrar bara formen — den ger inget utrymme att hitta på regelverk', () => {
    expect(LATT_SVENSKA_REGEL).toMatch(/Alla andra regler gäller oförändrade/)
    expect(LATT_SVENSKA_REGEL).toMatch(/Förklara svåra ord/)
    expect(LATT_SVENSKA_REGEL).toMatch(/under 12 ord/)
  })
})

/** Svar så som en modell som följer regeln skulle skriva dem. */
const LATT_SVAR = [
  'Det är okej att vara trött. Du behöver inte göra allt idag. Välj ett litet steg. Du kan till exempel skriva ner tre saker du är bra på.',
  'A-kassa är pengar du kan få om du blir arbetslös. Hur mycket du får beror på dig. Fråga din a-kassa. De kan svara på just din fråga.',
  'Du kan ringa Arbetsförmedlingen. De hjälper dig att hitta jobb. Säg att du vill ha stöd. Skriv ner vad de svarar.',
  'Ett CV är ett papper om dig. Där står vad du har jobbat med. Där står också vad du kan. Börja med ditt senaste jobb.',
]

/** Samma sak i vanligt myndighets- och coachspråk. */
const VANLIGA_SVAR = [
  'Arbetsförmedlingen erbjuder individuellt anpassade insatser för arbetssökande, och kvalificeringsvillkoren för ersättning beror på din specifika situation, varför du bör kontakta din arbetslöshetskassa för en fullständig bedömning av förutsättningarna.',
  'Det är fullt förståeligt att du känner dig otillräcklig i det här skedet av jobbsökandet, men genom att systematiskt kartlägga dina kompetenser och formulera konkreta delmål kan du successivt återfå känslan av kontroll över processen.',
  'Anpassningar av arbetsplatsen kan bland annat omfatta ergonomiska hjälpmedel, flexibla arbetstider och förändrade arbetsuppgifter, och arbetsgivaren kan under vissa förutsättningar få ekonomiskt stöd från Försäkringskassan eller Arbetsförmedlingen.',
]

describe('LIX-grinden på fasta exempelsvar', () => {
  it('lätta svar ligger under taket', () => {
    for (const svar of LATT_SVAR) expect(lix(svar).lix, svar).toBeLessThan(LIX_TAK_LATT)
  })

  it('vanliga svar ligger över taket — annars mäter grinden ingenting', () => {
    for (const svar of VANLIGA_SVAR) expect(lix(svar).lix, svar).toBeGreaterThan(LIX_TAK_LATT)
  })

  it('räknar enligt definitionen: ord/meningar + 100*långa ord/ord', () => {
    // 4 ord, 1 mening, 0 ord över sex tecken => LIX 4.
    expect(lix('Du kan få hjälp.').lix).toBeCloseTo(4, 5)
    // 2 meningar, 4 ord, 1 långt ord ("Arbetsförmedlingen") => 2 + 25.
    expect(lix('Ring Arbetsförmedlingen. Fråga mer.').lix).toBeCloseTo(4 / 2 + (100 * 1) / 4, 5)
  })

  it('tom text ger 0, inte NaN', () => {
    expect(lix('').lix).toBe(0)
    expect(lix('   ').lix).toBe(0)
  })
})
