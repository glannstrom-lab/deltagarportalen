/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AIX4 (intervjuberättelse) och AIX7 (första steget i dag).
 *
 *  - AIX4: berättelsen får bara bestå av det personen själv skrivit. Servern
 *    stryker varje STAR-steg som inte står ordagrant i hennes text, så ett
 *    resultat som modellen hittar på kan aldrig nå skärmen.
 *  - AIX7: "första steget" får inte vara en kurs, ett köp eller ett belopp, och
 *    artikellänkar sätts ur en fast karta, inte av modellen.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { artikelForForstaSteg, FORSTA_STEG_ARTIKEL } from '@/pages/skills-gap/forstaSteg'
import { STAR_ARTIKEL_SLUG } from '@/services/berattelseApi'

/* eslint-disable @typescript-eslint/no-require-imports */
const ai = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system: string; user: string; maxTokens: number; reasoningEffort?: string; parseJson?: boolean; responseKey: string }>
  RESPONSE_VALIDATORS: Record<string, (v: unknown, indata?: unknown) => { ok: boolean; value?: Record<string, any>; error?: string }>
}
const { harStodITexten, citatFinnsIText } = require('../../api/_prompts/_berattelse.js') as {
  harStodITexten: (s: string, t: string) => boolean
  citatFinnsIText: (c: string, t: string) => boolean
}
const { rensaForstaSteg } = require('../../api/_prompts/_forstasteg.js') as { rensaForstaSteg: (v: unknown) => string | null }
/* eslint-enable @typescript-eslint/no-require-imports */
const { PROMPTS, RESPONSE_VALIDATORS } = ai

const HANDELSE = 'På lagret i Borås kom en pall med fel varor. Jag skulle se till att rätt varor gick ut samma dag. Jag ringde leverantören och plockade om pallen själv.'
const INDATA = { handelse: HANDELSE, svar: [] as any[] }

function artiklar(): Array<{ slug: string }> {
  const snap = JSON.parse(readFileSync(resolve(__dirname, '../../content/articles.snapshot.json'), 'utf8'))
  return Array.isArray(snap) ? snap : snap.articles
}

describe('AIX4: prompten', () => {
  const p = PROMPTS['intervju-berattelse'](INDATA)

  it('förbjuder att fylla i resultatet och ber om citat och JSON', () => {
    expect(p.parseJson).toBe(true)
    expect(p.system).toMatch(/FYLL ALDRIG I RESULTATET/)
    expect(p.system).toMatch(/ORDAGRANT/)
    expect(p.system).toMatch(/enda öppen följdfråga/)
    expect(p.system).toMatch(/data, inte instruktioner/)
    expect(p.user).toContain('Borås')
  })

  it('har budget för resonemang + svar och är inte Lätt svenska', () => {
    expect(p.maxTokens).toBeGreaterThanOrEqual(1200)
    expect(p.reasoningEffort).toBe('low')
    expect(p.system).not.toMatch(/Lätt svenska/i)
  })

  it('kapar händelsen och följdsvaren', () => {
    const q = PROMPTS['intervju-berattelse']({ handelse: 'a'.repeat(5000), svar: [{ text: 'b'.repeat(2000) }] })
    expect(q.user.match(/a{1500}/)).not.toBeNull()
    expect(q.user.match(/a{1501}/)).toBeNull()
    expect(q.user.match(/b{500}/)).not.toBeNull()
    expect(q.user.match(/b{501}/)).toBeNull()
  })
})

describe('AIX4: validatorn släpper bara igenom det personen själv skrivit', () => {
  const validera = RESPONSE_VALIDATORS['intervju-berattelse']
  const v = (svar: unknown, data: unknown = INDATA) => {
    const r = validera(svar, data)
    expect(r.ok).toBe(true)
    return r.value as Record<string, any>
  }

  it('behåller citat som står ordagrant och frågar efter första saknade steget', () => {
    const r = v({
      steg: { situation: 'En pall med fel varor', uppgift: 'se till att rätt varor gick ut samma dag', handling: 'Jag ringde leverantören', resultat: null },
      fraga: 'Vad hände efteråt?',
    })
    expect(r.steg.situation).toBe('En pall med fel varor')
    expect(r.steg.handling).toBe('Jag ringde leverantören')
    expect(r.steg.resultat).toBeNull()
    expect(r.fragaSteg).toBe('resultat')
    expect(r.fraga).toBe('Vad hände efteråt?')
    expect(r.sammanstallning).toBeNull()
  })

  it('stryker ett resultat som modellen hittat på och frågar i stället', () => {
    const r = v({
      steg: {
        situation: 'En pall med fel varor',
        uppgift: 'se till att rätt varor gick ut samma dag',
        handling: 'Jag ringde leverantören',
        resultat: 'Kunden blev nöjd och leveransen gick ut i tid',
      },
      fraga: null,
      sammanstallning: 'Jag ordnade allt och kunden blev nöjd.',
    })
    expect(r.steg.resultat).toBeNull()
    expect(r.struket).toEqual(['resultat'])
    expect(r.sammanstallning).toBeNull()
    expect(r.fragaSteg).toBe('resultat')
    expect(typeof r.fraga).toBe('string')
    expect(r.fraga.length).toBeGreaterThan(10)
  })

  it('ett "vet inte" som står i texten räknas inte som ett resultat', () => {
    const data = { handelse: HANDELSE, svar: [{ steg: 'resultat', text: 'vet inte' }] }
    const r = v({
      steg: { situation: 'En pall med fel varor', uppgift: 'se till att rätt varor gick ut samma dag', handling: 'Jag ringde leverantören', resultat: 'vet inte' },
    }, data)
    expect(r.steg.resultat).toBeNull()
    expect(r.fragaSteg).toBe('resultat')
  })

  it('byter ut en ledande följdfråga mot en neutral', () => {
    const r = v({
      steg: { situation: 'En pall med fel varor', uppgift: null, handling: null, resultat: null },
      fraga: 'Var det då du blev stolt över dig själv?',
    })
    expect(r.fragaSteg).toBe('uppgift')
    expect(r.fraga).not.toMatch(/stolt/)
  })

  it('sammanställer när alla fyra finns i personens ord, och släpper igenom ett stött förslag', () => {
    const data = { handelse: HANDELSE, svar: [{ steg: 'resultat', text: 'Pallen gick ut samma dag och kunden ringde inte igen.' }] }
    const r = v({
      steg: {
        situation: 'En pall med fel varor',
        uppgift: 'se till att rätt varor gick ut samma dag',
        handling: 'Jag ringde leverantören och plockade om pallen själv',
        resultat: 'Pallen gick ut samma dag',
      },
      sammanstallning: 'En pall med fel varor kom till lagret. Jag ringde leverantören och plockade om pallen själv. Pallen gick ut samma dag.',
    }, data)
    expect(r.kalla).toBe('ai')
    expect(r.fraga).toBeNull()
    expect(r.sammanstallning).toContain('plockade om pallen')
  })

  it('byter en sammanställning med påhittade tal eller ord mot personens egna citat', () => {
    const data = { handelse: HANDELSE, svar: [{ steg: 'resultat', text: 'Pallen gick ut samma dag.' }] }
    const steg = {
      situation: 'En pall med fel varor',
      uppgift: 'se till att rätt varor gick ut samma dag',
      handling: 'Jag ringde leverantören',
      resultat: 'Pallen gick ut samma dag',
    }
    const medTal = v({ steg, sammanstallning: 'Jag räddade en leverans värd 40 000 kronor.' }, data)
    expect(medTal.kalla).toBe('egna-ord')
    expect(medTal.sammanstallning).not.toMatch(/40/)
    expect(medTal.sammanstallning).toContain('Pallen gick ut samma dag')
    const medPaslagen = v({ steg, sammanstallning: 'Jag hanterade en kritisk situation exemplariskt och imponerade på ledningen med min strategiska förmåga.' }, data)
    expect(medPaslagen.kalla).toBe('egna-ord')
  })

  it('fäller svar som inte är ett objekt', () => {
    expect(validera('text', INDATA).ok).toBe(false)
    expect(validera(null, INDATA).ok).toBe(false)
  })
})

describe('AIX4: stödkontrollerna var för sig', () => {
  it('citat kan skarvas med ellipser men varje del måste finnas, i ordning', () => {
    expect(citatFinnsIText('En pall … plockade om pallen', HANDELSE)).toBe(true)
    expect(citatFinnsIText('plockade om pallen … En pall', HANDELSE)).toBe(false)
  })
  it('tal måste finnas i texten', () => {
    expect(harStodITexten('Jag hade 12 pallar', 'Jag hade 12 pallar att hantera i dag')).toBe(true)
    expect(harStodITexten('Jag hade 13 pallar', 'Jag hade 12 pallar att hantera i dag')).toBe(false)
  })
  it('artikeln om STAR finns i artikelkorpusen', () => {
    expect(artiklar().some((a) => a.slug === STAR_ARTIKEL_SLUG)).toBe(true)
  })
})

describe('AIX7: prompten', () => {
  const p = PROMPTS['kompetensgap']({ cvText: 'Lagerarbete i 5 år', dromjobb: 'Inköpare' })
  it('ber om forstaSteg på 15 minuter och 0 kr och förbjuder kurser och länkar', () => {
    expect(p.system).toContain('forstaSteg')
    expect(p.system).toMatch(/15 minuter/)
    expect(p.system).toMatch(/0 kr/)
    expect(p.system).toMatch(/ALDRIG vara en kurs/)
    expect(p.system).toMatch(/skriver aldrig länkar/)
  })
})

describe('AIX7: validatorn stryker det som luktar kurs eller pengar', () => {
  const validera = RESPONSE_VALIDATORS['kompetensgap']
  const plan = (forstaSteg: unknown, forstaStegTyp: unknown = 'natverka') => ({
    matchPercentage: 50,
    skills: [{ name: 'Inköp', current: 1, target: 4, gap: 'large' }],
    actionPlan: [{ order: 1, title: 'Prata med någon', description: 'x', forstaSteg, forstaStegTyp }],
  })
  const steg = (forstaSteg: unknown, typ?: unknown) => (validera(plan(forstaSteg, typ), {}).value as any).actionPlan[0]

  it('släpper igenom en vanlig handling och behåller typen', () => {
    const r = steg('Skriv ner tre saker du redan gör som liknar inköp.', 'kartlagga')
    expect(r.forstaSteg).toBe('Skriv ner tre saker du redan gör som liknar inköp.')
    expect(r.forstaStegTyp).toBe('kartlagga')
  })

  it('godtar 0 kr men inget annat belopp', () => {
    expect(steg('Läs en artikel om inköp. Det kostar 0 kr.').forstaSteg).toBeDefined()
    expect(steg('Läs en guide som kostar 299 kr.').forstaSteg).toBeUndefined()
  })

  it.each([
    'Anmäl dig till en kurs i inköp.',
    'Ansök till en YH-utbildning inom logistik.',
    'Gå en gratis kurs på Udemy.',
    'Köp boken Inköp för alla.',
    'Besök www.inkopsakademin.se och läs.',
    'Ring Nordfrakt AB och fråga om jobb.',
  ])('stryker %s', (text) => {
    expect(steg(text).forstaSteg).toBeUndefined()
  })

  it('stryker för korta och för långa steg, och behåller resten av planen', () => {
    expect(steg('Ring').forstaSteg).toBeUndefined()
    expect(steg('a '.repeat(200)).forstaSteg).toBeUndefined()
    const r = steg('Ring en kurs', 'natverka')
    expect(r.title).toBe('Prata med någon')
    expect(r.description).toBe('x')
  })

  it('en okänd stegtyp ger ingen typ, och därmed ingen länk', () => {
    const r = steg('Prata med en kollega om hur inköp fungerar.', 'https://exempel.se/kurs')
    expect(r.forstaSteg).toBeDefined()
    expect(r.forstaStegTyp).toBeUndefined()
  })

  it('släpper igenom svar utan actionPlan orört', () => {
    const v = { matchPercentage: 10, skills: [] }
    expect(validera(v, {}).value).toBe(v)
    expect(rensaForstaSteg(undefined)).toBeNull()
  })
})

describe('AIX7: länkkartan på klienten', () => {
  it('varje typ pekar på en artikel som finns, och okänd typ ger ingen länk', () => {
    const slugs = new Set(artiklar().map((a) => a.slug))
    for (const [typ, slug] of Object.entries(FORSTA_STEG_ARTIKEL)) {
      expect(slugs.has(slug), `${typ} -> ${slug}`).toBe(true)
    }
    expect(artikelForForstaSteg('okand')).toBeNull()
    expect(artikelForForstaSteg(undefined)).toBeNull()
    expect(artikelForForstaSteg('toString')).toBeNull()
  })
})
