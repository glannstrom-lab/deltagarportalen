/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
/**
 * AIX2 (Vad har jag med mig?): servern, inte UI:t, bär ärlighetsreglerna.
 *  - varje förslag har ett citat som står ORDAGRANT i personens svar
 *  - inga titlar, ledarskaps- eller omfattningsord personen inte själv skrivit
 *  - inga siffror som inte står i svaren
 *  - hälsa skickas aldrig till modellen och aldrig tillbaka
 */
import { describe, it, expect } from 'vitest'

const ai = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system: string; user: string; maxTokens: number; parseJson?: boolean; responseKey: string }>
  RESPONSE_VALIDATORS: Record<string, (v: unknown, indata?: unknown) => { ok: boolean; value?: Record<string, any>; error?: string }>
}
const { PROMPTS, RESPONSE_VALIDATORS } = ai
const FN = 'vad-har-jag-med-mig'

const INDATA = {
  svar: [
    { fraga: 'Har du hjälpt någon?', text: 'Jag hjälpte grannen med trädgården varje sommar och handlade åt henne.' },
    { fraga: 'Ideellt?', text: 'Jag bakade bullar till Röda Korset när de hade loppis.' },
  ],
}

const rad = (over: Partial<Record<string, string>> = {}) => [
  over.titel ?? 'Trädgårdshjälp åt granne',
  over.organisation ?? '',
  over.beskrivning ?? 'Hjälpte en granne med trädgården och handlade åt henne.',
  over.citat ?? 'Jag hjälpte grannen med trädgården varje sommar',
]
const kor = (rader: unknown[], indata: unknown = INDATA) =>
  RESPONSE_VALIDATORS[FN]({ forslag: rader }, indata)

describe('AIX2: prompten', () => {
  it('finns i PROMPTS, ber om JSON med citat och bär sanningsregeln sist', () => {
    const p = PROMPTS[FN](INDATA)
    expect(p.parseJson).toBe(true)
    expect(p.responseKey).toBe('vardag')
    expect(p.system).toMatch(/SANNINGSREGEL/)
    expect(p.system).toMatch(/ordagrann/)
    expect(p.system).toMatch(/UPPGRADERA ALDRIG/)
    expect(p.user).toContain('Jag hjälpte grannen')
  })

  it('är inte skriven på Lätt svenska (CV-text går till arbetsgivare)', () => {
    expect(PROMPTS[FN](INDATA).system).not.toMatch(/Lätt svenska/i)
  })

  it('skickar ALDRIG svar som nämner hälsa till modellen', () => {
    const p = PROMPTS[FN]({ svar: [{ fraga: 'F', text: 'Jag tog hand om min sjuka mamma i tre år.' }] })
    expect(p.user).not.toMatch(/mamma|sjuka/)
    expect(p.system).toMatch(/avvisad/)
  })
})

describe('AIX2: validatorn', () => {
  it('släpper igenom ett förslag med ordagrant citat', () => {
    const r = kor([rad()])
    expect(r.ok).toBe(true)
    expect(r.value!.forslag).toHaveLength(1)
    expect(r.value!.forslag[0].titel).toBe('Trädgårdshjälp åt granne')
  })

  it('stryker förslag vars citat inte står i svaren (citatkontrollen)', () => {
    const r = kor([rad({ citat: 'Jag skötte en hel koloniträdgård på heltid' })])
    expect(r.value!.forslag).toEqual([])
  })

  it('godtar ellips i citatet, men varje del måste finnas', () => {
    expect(kor([rad({ citat: 'Jag hjälpte grannen … handlade åt henne' })]).value!.forslag).toHaveLength(1)
    expect(kor([rad({ citat: 'Jag hjälpte grannen … körde bil åt henne' })]).value!.forslag).toEqual([])
  })

  it('godtar citat ur vilket svar som helst, men inte ur frågan', () => {
    expect(kor([rad({ titel: 'Bullbak till loppis', beskrivning: 'Bakade bullar till en loppis.', citat: 'bakade bullar till Röda Korset' })]).value!.forslag).toHaveLength(1)
    expect(kor([rad({ citat: 'Har du hjälpt någon' })]).value!.forslag).toEqual([])
  })

  it('stryker uppgradering: hjälpte grannen blir aldrig projektledare eller ansvarig', () => {
    expect(kor([rad({ titel: 'Trädgårdsansvarig' })]).value!.forslag).toEqual([])
    expect(kor([rad({ titel: 'Ansvarig för trädgården' })]).value!.forslag).toEqual([])
    expect(kor([rad({ titel: 'Projektledare för trädgården' })]).value!.forslag).toEqual([])
    expect(kor([rad({ beskrivning: 'Ledde arbetet i en grannträdgård.' })]).value!.forslag).toEqual([])
    expect(kor([rad({ beskrivning: 'Hjälpte en granne dagligen med trädgården.' })]).value!.forslag).toEqual([])
  })

  it('tillåter ett uppgraderingsord som personen själv har skrivit', () => {
    const indata = { svar: [{ fraga: 'F', text: 'Jag ledde en grupp barn i fotbollsskolan varje sommar.' }] }
    const r = kor([rad({ titel: 'Ledde barngrupp i fotbollsskola', beskrivning: 'Ledde en grupp barn i en fotbollsskola.', citat: 'Jag ledde en grupp barn i fotbollsskolan' })], indata)
    expect(r.value!.forslag).toHaveLength(1)
  })

  it('stryker siffror som inte står i svaren, behåller de som gör det', () => {
    expect(kor([rad({ beskrivning: 'Hjälpte en granne med trädgården i 5 år.' })]).value!.forslag).toEqual([])
    const indata = { svar: [{ fraga: 'F', text: 'Jag hjälpte grannen med trädgården i 5 år och handlade åt henne.' }] }
    expect(kor([rad({ beskrivning: 'Hjälpte en granne med trädgården i 5 år.', citat: 'Jag hjälpte grannen med trädgården i 5 år' })], indata).value!.forslag).toHaveLength(1)
  })

  it('stryker en siffra i titeln, där beskrivningens stödkontroll inte ser den', () => {
    expect(kor([rad({ titel: 'Trädgårdshjälp 3 dagar i veckan' })]).value!.forslag).toEqual([])
  })

  it('tömmer organisationen när den inte står i svaren, men behåller förslaget', () => {
    const r = kor([rad({ titel: 'Bullbak till loppis', organisation: 'Svenska kyrkan', beskrivning: 'Bakade bullar till en loppis.', citat: 'bakade bullar till Röda Korset' })])
    expect(r.value!.forslag[0].organisation).toBe('')
    const ok = kor([rad({ titel: 'Bullbak till loppis', organisation: 'Röda Korset', beskrivning: 'Bakade bullar till en loppis.', citat: 'bakade bullar till Röda Korset' })])
    expect(ok.value!.forslag[0].organisation).toBe('Röda Korset')
  })

  it('stryker en beskrivning med ord som saknar stöd i svaren', () => {
    const r = kor([rad({ beskrivning: 'Genomförde kundrelaterade trädgårdsåtaganden professionellt.' })])
    expect(r.value!.forslag).toEqual([])
  })

  it('stryker ett förslag som själv nämner hälsa, även om svaren inte gjorde det', () => {
    const r = kor([rad({ beskrivning: 'Hjälpte en sjuk granne med trädgården.' })])
    expect(r.value!.forslag).toEqual([])
  })

  it('svarar avvisad: halsa när svaren nämner hälsa, oavsett vad modellen skrev', () => {
    const indata = { svar: [{ fraga: 'F', text: 'Jag tog hand om min sjuka mamma och handlade åt henne.' }] }
    const r = kor([rad({ citat: 'handlade åt henne' })], indata)
    expect(r.value).toEqual({ avvisad: 'halsa', forslag: [] })
  })

  it('släpper inte igenom dubbletter av samma citat', () => {
    const r = kor([rad(), rad(), rad({ titel: 'Handlade åt granne', beskrivning: 'Handlade åt en granne.', citat: 'handlade åt henne' })])
    expect(r.value!.forslag).toHaveLength(2)
  })

  it('tom lista är ett giltigt svar; ett svar som inte är ett objekt är det inte', () => {
    expect(kor([]).value).toEqual({ forslag: [] })
    expect(RESPONSE_VALIDATORS[FN]([], INDATA).ok).toBe(false)
    expect(RESPONSE_VALIDATORS[FN]('hej', INDATA).ok).toBe(false)
  })

  it('läser också objektform, och kräver samma belägg', () => {
    const r = kor([{ titel: 'Trädgårdshjälp åt granne', organisation: '', beskrivning: 'Hjälpte en granne med trädgården.', citat: 'påhittat citat om något annat' }])
    expect(r.value!.forslag).toEqual([])
  })
})
