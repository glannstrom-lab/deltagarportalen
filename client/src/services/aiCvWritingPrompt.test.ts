/**
 * B14 — `cv-writing`-prompten får inte be modellen hitta på siffror.
 *
 * Den gamla `quantify`-lydelsen var ordagrant "Föreslå rimliga siffror baserat
 * på personens bakgrund (t.ex. antal års erfarenhet, teamstorlek, procentuella
 * förbättringar)". Modellen fick alltså order att uppfinna tal, och texten
 * hamnar i användarens CV som skickas till arbetsgivare. Det är samma bugg som
 * B9 (AI-brevet hittade på meriter), men inbyggd med flit.
 *
 * En prompt-regression syns i inget annat test — den syns bara i någons färdiga
 * CV. Därför läses den faktiska prompten här, inte en beskrivning av den.
 *
 * (Testfilen ligger under src/ eftersom vitest bara inkluderar src/**.)
 */
import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const aiHandler = require('../../api/ai.js') as {
  PROMPTS: Record<string, (data: unknown) => { system: string; user: string; maxTokens: number; responseKey: string }>
}

const cvWriting = aiHandler.PROMPTS['cv-writing']

const CV_DATA = {
  title: 'Lagerarbetare',
  firstName: 'Anna',
  workExperience: [
    { title: 'Lagerarbetare', company: 'Nordlager AB', startDate: '2019-03', endDate: '2024-01', description: 'Plock och pack.' },
  ],
  skills: [{ name: 'Truckkort' }],
}

/** Order som ber modellen gissa. Ingen av dem får finnas i någon feature.
 *  (Orden får förstås förekomma som *förbud* — därför matchas hela ordern.) */
const FABRICATION_PHRASES = [
  'föreslå rimliga siffror',
  'rimliga siffror',
  'baserat på rollens karaktär',
  'föreslå siffror',
]

describe('B14: cv-writing/quantify ber inte om påhittade siffror', () => {
  const types = ['summary', 'experience', 'skills'] as const

  it.each(types)('quantify.%s innehåller inte den gamla "föreslå siffror"-ordern', (type) => {
    const prompt = cvWriting({ feature: 'quantify', type, content: 'Jag har jobbat på lager.', cvData: CV_DATA })
    const lower = prompt.user.toLowerCase()

    for (const phrase of FABRICATION_PHRASES) {
      expect(lower, `prompten ber modellen gissa: "${phrase}"`).not.toContain(phrase)
    }
  })

  it.each(types)('quantify.%s kräver att siffror har täckning i underlaget', (type) => {
    const prompt = cvWriting({ feature: 'quantify', type, content: 'Jag har jobbat på lager.', cvData: CV_DATA })
    const lower = prompt.user.toLowerCase()

    expect(lower).toContain('täckning')
    // Uttrycklig order att hoppa över siffran i stället för att gissa.
    expect(lower).toMatch(/utelämna|utan siffra|utan siffror/)
    // ...och ett uttryckligt förbud mot att uppskatta.
    expect(lower).toMatch(/hitta aldrig på|aldrig ett tal|uppskatta aldrig|uppskatta, avrunda/)
  })

  it('quantify.summary säger uttryckligen att ett svar helt utan siffror är korrekt', () => {
    const prompt = cvWriting({ feature: 'quantify', type: 'summary', content: 'x', cvData: CV_DATA })
    expect(prompt.user.toLowerCase()).toContain('utan siffror')
  })
})

describe('B14: sanningskravet gäller alla features, inte bara quantify', () => {
  const features = ['improve', 'quantify', 'translate', 'generate'] as const

  it.each(features)('systemprompten för %s förbjuder påhittade siffror och meriter', (feature) => {
    const prompt = cvWriting({ feature, type: 'summary', content: 'x', cvData: CV_DATA })
    const lower = prompt.system.toLowerCase()

    expect(lower).toContain('aldrig hitta på')
    expect(lower).toContain('siffror')
    // Motsvarigheten till B9:s "osäker → utelämna".
    expect(lower).toMatch(/utelämna/)
  })
})

describe('B14: underlaget till kvantifiering är verkligt, inte gissat', () => {
  it('skickar med anställningsperioder så antal år kan räknas ur datan', () => {
    const prompt = cvWriting({ feature: 'quantify', type: 'summary', content: 'x', cvData: CV_DATA })
    expect(prompt.user).toContain('2019-03–2024-01')
  })

  it('markerar pågående anställning i stället för att lämna slutdatum tomt', () => {
    const prompt = cvWriting({
      feature: 'quantify',
      type: 'summary',
      content: 'x',
      cvData: { workExperience: [{ title: 'Lagerarbetare', company: 'Nordlager AB', startDate: '2019-03', current: true }] },
    })
    expect(prompt.user).toContain('2019-03–pågående')
  })

  it('hittar inte på ett "antal års erfarenhet" ur antalet tjänster', () => {
    // Den raderade raden var `workExperience.length * 2 // Rough estimate` —
    // två anställningar blev "4 års erfarenhet" utan grund i datan.
    const prompt = cvWriting({
      feature: 'quantify',
      type: 'summary',
      content: 'x',
      cvData: { workExperience: [{ title: 'A', company: 'B' }, { title: 'C', company: 'D' }] },
    })
    expect(prompt.user).not.toMatch(/4 år|fyra år/i)
  })

  it('klarar CV utan arbetslivserfarenhet utan att kasta', () => {
    expect(() => cvWriting({ feature: 'quantify', type: 'summary', content: 'x', cvData: {} })).not.toThrow()
    expect(() => cvWriting({})).not.toThrow()
  })
})
