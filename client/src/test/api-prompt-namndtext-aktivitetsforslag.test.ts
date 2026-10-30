/**
 * AIX16 + AIX21 — promptarnas och validatorernas kontrakt (server).
 *
 * AIX16: bara aggregerade tal, celler under 5 undertrycks även på servern, och
 *   varje mening med ett tal som inte står i underlaget, en orsak eller en
 *   jämförelse över tid stryks.
 * AIX21: bara id:n ur katalogen; varje okänt id förkastas.
 */
import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const { PROMPTS } = require('../../api/_prompts/index.js') as {
  PROMPTS: Record<string, (data: unknown) => { system: string; user: string; maxTokens: number; responseKey?: string; parseJson?: boolean }>
}
const nt = require('../../api/_prompts/_namndtext.js') as {
  validera: (v: unknown, indata: unknown) => { ok: true; value: { text: string; struket: number } } | { ok: false; error: string }
  underlagText: (u: unknown) => string
}
const af = require('../../api/_prompts/_aktivitetsforslag.js') as {
  validera: (v: unknown, indata: unknown) => { ok: true; value: { forslag: Array<{ id: string; motivering: string }> } } | { ok: false; error: string }
}
const ai = require('../../api/ai.js') as { RESPONSE_VALIDATORS: Record<string, unknown> }
/* eslint-enable @typescript-eslint/no-require-imports */

const grupp = (namn: string, o: Record<string, number | null> = {}) => ({
  namn, deltagare: 120, bedomdaPass: 840, narvarograd: 78, anmaldFranvaro: 61, oanmaldFranvaro: 33, sjukUtanIntyg: 12, underlagLamnat: 9, ...o,
})
const UNDERLAG = {
  kvartal: 3,
  ar: 2026,
  grupper: [grupp('Språk'), grupp('Hälsa', { deltagare: 40, bedomdaPass: 200, narvarograd: 64 })],
  summa: { deltagare: 160, bedomdaPass: 1040, narvarograd: 75, anmaldFranvaro: 90, oanmaldFranvaro: 50, sjukUtanIntyg: 20, underlagLamnat: 15 },
  ovrigaUndertryckta: false,
}

describe('AIX16: prompten konsulent-namndtext', () => {
  const bygg = (data: unknown) => PROMPTS['konsulent-namndtext'](data)

  it('är registrerad med validator, JSON-svar och svarsnyckel', () => {
    const p = bygg({ underlag: UNDERLAG })
    expect(p.parseJson).toBe(true)
    expect(p.responseKey).toBe('namndtext')
    expect(ai.RESPONSE_VALIDATORS['konsulent-namndtext']).toBeTypeOf('function')
  })

  it('underlaget är den enda indatan: andra fält i data ignoreras', () => {
    const p = bygg({ underlag: UNDERLAG, deltagare: [{ namn: 'Anna Andersson' }], fritext: 'hemligt' })
    expect(p.user).not.toContain('Anna Andersson')
    expect(p.user).not.toContain('hemligt')
    expect(p.user).toContain('Språk')
  })

  it('en cell på 1-4 når aldrig modellen, även om anroparen glömt undertrycka den', () => {
    const p = bygg({ underlag: { ...UNDERLAG, grupper: [grupp('Språk', { anmaldFranvaro: 3, oanmaldFranvaro: 4, sjukUtanIntyg: 1 })] } })
    expect(p.user).toContain('anmäld frånvaro undertryckt (färre än 5)')
    expect(p.user).toContain('oanmäld frånvaro undertryckt (färre än 5)')
    expect(p.user).toContain('sjuk utan intyg undertryckt (färre än 5)')
    expect(p.user).not.toMatch(/anmäld frånvaro 3|oanmäld frånvaro 4|sjuk utan intyg 1;/)
  })

  it('en nollcell redovisas som 0 och en närvarograd utan bedömda pass som streck', () => {
    const p = bygg({ underlag: { ...UNDERLAG, grupper: [grupp('Språk', { sjukUtanIntyg: 0, bedomdaPass: 3, narvarograd: 66 })] } })
    expect(p.user).toContain('sjuk utan intyg 0')
    expect(p.user).toContain('närvarograd —')
  })

  it('förbjuder orsaker, jämförelser, nya tal och namn', () => {
    const s = bygg({ underlag: UNDERLAG }).system
    expect(s).toMatch(/Förklara aldrig varför/)
    expect(s).toMatch(/Jämför inte med andra kvartal/)
    expect(s).toMatch(/ENBART tal som står ordagrant/)
    expect(s).toMatch(/Skriv inga namn/)
  })

  it('tål saknad indata', () => {
    expect(bygg(undefined).user).toContain('Inga grupper kan redovisas.')
  })
})

describe('AIX16: validatorn', () => {
  const kor = (text: string, underlag: unknown = UNDERLAG) => nt.validera({ text }, { underlag })

  it('släpper igenom en mening vars tal alla står i underlaget', () => {
    const r = kor('Under kvartalet hade 120 deltagare i gruppen Språk en plan, och närvarograden var 78 %.')
    expect(r).toMatchObject({ ok: true })
    expect(r.ok && r.value.text).toContain('120')
    expect(r.ok && r.value.struket).toBe(0)
  })

  it('stryker en mening med ett tal som inte står i underlaget, och behåller resten', () => {
    const r = kor('Under kvartalet hade 120 deltagare en plan. Hela 87 deltagare avslutade sin plan i förtid.')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.text).toContain('120')
      expect(r.value.text).not.toContain('87')
      expect(r.value.struket).toBe(1)
    }
  })

  it('stryker ett talord som inte motsvaras av en siffra i underlaget', () => {
    const r = kor('Under kvartalet hade 120 deltagare en plan. Sju grupper redovisades.')
    expect(r.ok && r.value.text).not.toMatch(/Sju/)
    expect(r.ok && r.value.struket).toBe(1)
  })

  it.each([
    'Frånvaron var hög på grund av dålig tillgång till kollektivtrafik.',
    'Närvaron var låg eftersom många var sjuka.',
    'Det beror på att aktiviteterna låg tidigt.',
    'Resultatet nåddes tack vare nya arbetssätt.',
    'Frånvaron ledde till fler underlag.',
  ])('stryker en orsaksförklaring: %s', (mening) => {
    const r = kor(`Under kvartalet hade 120 deltagare en plan. ${mening}`)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.struket).toBe(1)
      expect(r.value.text).toBe('Under kvartalet hade 120 deltagare en plan.')
    }
  })

  it.each([
    'Närvarograden ökade jämfört med föregående kvartal.',
    'Frånvaron minskade under kvartalet.',
    'Hälften av deltagarna hade en plan.',
  ])('stryker en jämförelse över tid eller en härledd kvot: %s', (mening) => {
    const r = kor(`Under kvartalet hade 120 deltagare en plan. ${mening}`)
    expect(r.ok && r.value.struket).toBe(1)
  })

  it('fäller svaret när ingen mening håller', () => {
    expect(kor('Frånvaron minskade eftersom 87 var friska.').ok).toBe(false)
    expect(nt.validera({}, { underlag: UNDERLAG }).ok).toBe(false)
    expect(nt.validera({ text: '   ' }, { underlag: UNDERLAG }).ok).toBe(false)
  })

  it('jämför mot undertryckt underlag: ett tal 1-4 kan aldrig vara belagt', () => {
    const underlag = { ...UNDERLAG, grupper: [grupp('Språk', { anmaldFranvaro: 2 })] }
    const r = kor('Under kvartalet hade 120 deltagare en plan. Anmäld frånvaro var 2.', underlag)
    expect(r.ok && r.value.struket).toBe(1)
  })

  it('tar emot en bar sträng som svar', () => {
    expect(nt.validera('Under kvartalet hade 120 deltagare en plan.', { underlag: UNDERLAG }).ok).toBe(true)
  })
})

const KATALOG = [
  { id: 'a1', namn: 'Jobbklubb', typ: 'Jobbsökning', plats: 'Biblioteket', tid: 'Tisdag 09:00–12:00' },
  { id: 'a2', namn: 'Språkkafé', typ: 'Språk', plats: '', tid: '' },
  { id: 'a3', namn: 'Datorhjälp', typ: 'Motivation', plats: 'Stadshuset', tid: '' },
]

describe('AIX21: prompten konsulent-aktivitetsforslag', () => {
  const bygg = (data: unknown) => PROMPTS['konsulent-aktivitetsforslag'](data)

  it('är registrerad med validator, JSON-svar och svarsnyckel', () => {
    const p = bygg({ mal: 'vill börja jobba', katalog: KATALOG })
    expect(p.parseJson).toBe(true)
    expect(p.responseKey).toBe('aktivitetsforslag')
    expect(ai.RESPONSE_VALIDATORS['konsulent-aktivitetsforslag']).toBeTypeOf('function')
  })

  it('får katalogens id:n och namn, målet, och inget annat', () => {
    const p = bygg({ mal: 'vill börja jobba', katalog: KATALOG, namn: 'Anna Andersson' })
    expect(p.user).toContain('a1: Jobbklubb')
    expect(p.user).toContain('a3: Datorhjälp')
    expect(p.user).toContain('vill börja jobba')
    expect(p.user).not.toContain('Anna Andersson')
  })

  it('svarsformen är en lista av platta objekt, aldrig [[…]]', () => {
    const s = bygg({ mal: 'x', katalog: KATALOG }).system
    expect(s).toContain('{"forslag":[{"id":"a1","motivering":"…"}]}')
    expect(s).toMatch(/BARA med id:n ur listan/)
  })

  it('tål saknad indata', () => {
    expect(bygg(undefined).user).toContain('Inga aktiviteter.')
  })
})

describe('AIX21: validatorn', () => {
  const kor = (forslag: unknown) => af.validera({ forslag }, { mal: 'vill träna svenska och söka jobb', katalog: KATALOG })

  it('släpper igenom förslag med känt id och en motivering', () => {
    const r = kor([{ id: 'a1', motivering: 'Hjälper till att söka jobb.' }, { id: 'a2', motivering: 'Tränar svenska.' }])
    expect(r.ok && r.value.forslag.map((f) => f.id)).toEqual(['a1', 'a2'])
  })

  it('FÖRKASTAR varje okänt id', () => {
    const r = kor([{ id: 'a1', motivering: 'Bra.' }, { id: 'a9', motivering: 'Påhittad aktivitet.' }, { id: 'Yogakurs', motivering: 'Påhittad.' }])
    expect(r.ok && r.value.forslag.map((f) => f.id)).toEqual(['a1'])
  })

  it('fäller svaret när modellen föreslog något men inget av det fanns i katalogen', () => {
    expect(kor([{ id: 'a9', motivering: 'Påhittad.' }]).ok).toBe(false)
  })

  it('en tom lista är ett giltigt svar: inget passar', () => {
    expect(kor([])).toEqual({ ok: true, value: { forslag: [] } })
  })

  it('tar högst fyra, inga dubbletter, och släpper en motivering med ett påhittat tal', () => {
    const katalog = Array.from({ length: 6 }, (_, i) => ({ id: `a${i + 1}`, namn: `Post ${i + 1}`, typ: '', plats: '', tid: '' }))
    const r = af.validera(
      { forslag: [{ id: 'a1', motivering: 'En.' }, { id: 'a1', motivering: 'Dubblett.' }, { id: 'a2', motivering: 'Ger 500 kr.' }, ...['a3', 'a4', 'a5', 'a6'].map((id) => ({ id, motivering: 'Passar.' }))] },
      { mal: 'jobb', katalog },
    )
    expect(r.ok && r.value.forslag.map((f) => f.id)).toEqual(['a1', 'a3', 'a4', 'a5'])
  })

  it('tar emot listan direkt och förkastar rader som inte är objekt', () => {
    const r = af.validera([{ id: 'a1', motivering: 'Bra.' }, 'a2', null, [['a3', 'x']]], { mal: 'x', katalog: KATALOG })
    expect(r.ok && r.value.forslag.map((f) => f.id)).toEqual(['a1'])
  })
})
