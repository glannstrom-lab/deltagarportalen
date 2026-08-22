/**
 * Kontraktstest mot `education-search`-edgens normalisering.
 *
 * ## Varför filen finns
 *
 * Den 22 augusti 2026 hade projektet 2 304 tester och **inte ett enda kunde
 * falla på utbildningskoden**. Ett mutationsstickprov pekade om edge-anropet
 * till en funktion som inte finns, bytte matchningen mot fritextsökning och
 * hårdkodade typfiltret — sviten förblev grön. Under tiden var i drift:
 *
 *  - filterknappen kraschade hela sidan (React #31: `{key, value}` i `<option>`)
 *  - alla fyra typfilter gav noll av 80 313 träffar (långa formkoder)
 *  - varje "Läs mer" pekade på `[object Object]`
 *  - en komvuxkurs på 1 900 gymnasiepoäng märktes "1900 YH-poäng" och "1900 hp"
 *  - orten stod som kommunkod, "2518", bredvid en kartnål
 *  - beskrivningen inleddes med bokstaven `<p>`
 *
 * Alla sex hade fångats här. Fixturerna nedan är RIKTIGA svar från
 * jobed-connect-api.jobtechdev.se, hämtade 2026-08-22 — inte förenklade
 * former (projektets lärdom 2026-08-03: fixturer ska spegla prod, inte det
 * bekväma).
 */

import { describe, it, expect } from 'vitest'
import {
  FORMER,
  TYP_TILL_FORM,
  normalizeEducation,
  normalizeMatchHit,
  slaIhopDubbletter,
  utanTitelupprepning,
  typerFranApi,
  regionerFranApi,
  rensaVal,
} from '../../../../supabase/functions/education-search/normalisera'

// ── Fixturer, ordagrant ur API:t ─────────────────────────────────────────

/** GET /v1/educations?query=programmering&education_form=yh — träff 1. */
const YH_TRAFF = {
  id: 'i.myh.yh.12291',
  education: {
    identifier: 'i.myh.yh.12291',
    code: 'YH01839-2026',
    description: [{ lang: 'swe', content: 'Bygg- och anläggningsbranschen digitaliseras i snabb takt.' }],
    title: [{ lang: 'swe', content: 'BIM-verktyg: Parametrisk design och programmering' }],
    form: { code: 'yh', type: 'C_SchoolType' },
    credits: { system: { code: 'yh', type: 'C_Credits' }, credits: 35 },
    educationLevel: { code: 'ISCED_4', type: 'YH_EducationLevel' },
    urls: [{ lang: 'swe', content: 'https://nackademin.se' }],
  },
  providerSummary: { providers: ['Nackademin Aktiebolag'] },
  eventSummary: {
    municipalityCode: ['0184'],
    regionCode: ['01'],
    paceOfStudyPercentage: [],
    executions: [{ start: '2026-08-01', end: '2028-05-31' }],
    distance: false,
  },
}

/** GET /v1/educations?q=undersköterska — komvuxträff med HTML i beskrivningen
 *  och kommunen som "provider". */
const VUXGY_TRAFF = {
  id: 'i.alvis.49.140.125398',
  education: {
    identifier: 'i.alvis.49.140.125398',
    title: [{ lang: 'swe', content: 'Undersköterska i kombination med grundläggande svenska som andraspråk' }],
    description: [{
      lang: 'swe',
      content: 'Undersköterska\n<p>Utbildningen passar både dig som redan har erfarenhet.&nbsp;</p>\n\n<p>Efter utbildningen kan du söka arbete.</p>',
    }],
    form: { code: 'vuxgy', type: 'C_SchoolType' },
    credits: { system: { code: 'vp', type: 'C_Credits' }, credits: 1900 },
    educationLevel: { code: 'ISCED_3' },
    urls: [{ lang: 'swe', content: 'https://sodertalje.alvis.se/hittakurser/kurs/125398' }],
  },
  providerSummary: { providers: ['Nykvarn'] },
  eventSummary: {
    municipalityCode: [],
    regionCode: [],
    paceOfStudyPercentage: [100],
    executions: [{ start: '2027-01-04', end: '2028-12-22' }],
    distance: false,
  },
}

/** POST /v1/educations/match-by-jobtitle?jobtitle=snickare — platt form. */
const MATCH_TRAFF = {
  id: 'i.alvis.19.115.118347',
  code: 'BAXAOE',
  education_provider_name: 'Vallentuna',
  education_title: 'Träarbetare, Klassrum',
  education_type: 'kurspaket',
  education_form: 'vuxgy',
  education_description: '<h1>Träarbetare</h1>\n\n<h4>Arbetsuppgifter</h4>\n\n<p>Som träarbetare bygger du hus.</p>',
  providerSummary: { providers: ['Vallentuna'] },
  eventSummary: {
    municipalityCode: [],
    regionCode: [],
    paceOfStudyPercentage: [100],
    executions: [{ start: '2026-10-12', end: '2027-06-11' }],
    distance: false,
  },
}

// ── Testerna ─────────────────────────────────────────────────────────────

describe('normalizeEducation — sökträffar', () => {
  it('gör url till en STRÄNG, inte {lang, content}', () => {
    const e = normalizeEducation(YH_TRAFF)
    expect(typeof e.url).toBe('string')
    expect(e.url).toBe('https://nackademin.se/')
    expect(String(e.url)).not.toContain('[object')
    expect(typeof e.providerUrl).toBe('string')
  })

  it('släpper inte igenom en url som inte är http(s)', () => {
    const farlig = { ...YH_TRAFF, education: { ...YH_TRAFF.education, urls: [{ lang: 'swe', content: 'javascript:alert(1)' }] } }
    expect(normalizeEducation(farlig).url).toBeUndefined()
  })

  it('översätter formkoden till en läsbar etikett — aldrig råkoden', () => {
    expect(normalizeEducation(YH_TRAFF).typeLabel).toBe('Yrkeshögskola')
    expect(normalizeEducation(VUXGY_TRAFF).typeLabel).toBe('Komvux, gymnasial')
    // Okänd kod ska ge en neutral etikett, inte koden.
    const okand = { ...YH_TRAFF, education: { ...YH_TRAFF.education, form: { code: 'zzz' } } }
    expect(normalizeEducation(okand).typeLabel).toBe('Utbildning')
    expect(normalizeEducation(okand).type).toBe('other')
  })

  it('sätter en typ som ikontabellen kan slå upp', () => {
    expect(normalizeEducation(YH_TRAFF).type).toBe('yrkeshogskola')
    expect(normalizeEducation(VUXGY_TRAFF).type).toBe('komvux')
  })

  it('ger poängen rätt enhet per system — inte "YH-poäng" om allt', () => {
    expect(normalizeEducation(YH_TRAFF).creditsLabel).toBe('35 YH-poäng')
    expect(normalizeEducation(VUXGY_TRAFF).creditsLabel).toBe('1900 poäng')
    const hs = { ...YH_TRAFF, education: { ...YH_TRAFF.education, form: { code: 'hs' }, credits: { system: { code: 'hp' }, credits: 180 } } }
    expect(normalizeEducation(hs).creditsLabel).toBe('180 hp')
  })

  it('sätter duration till en TID, inte till poäng', () => {
    // 2026-08-01 → 2028-05-31 ≈ 22 månader
    expect(normalizeEducation(YH_TRAFF).duration).toBe('1,8 år')
    expect(normalizeEducation(YH_TRAFF).duration).not.toMatch(/poäng|hp/)
  })

  it('översätter kommunkoden till ett ortnamn', () => {
    expect(normalizeEducation(YH_TRAFF).location).toBe('Solna')
    expect(normalizeEducation(YH_TRAFF).location).not.toMatch(/^\d+$/)
  })

  it('använder kommunnamnet i provider som ort när kommunkod saknas', () => {
    // Komvuxposterna har tom municipalityCode men kommunens namn i provider.
    expect(normalizeEducation(VUXGY_TRAFF).locations).toEqual(['Nykvarn'])
  })

  it('upprepar inte titeln i beskrivningen', () => {
    // Alvis-posterna inleder beskrivningen med kursnamnet igen. Med
    // `line-clamp-2` blev de två synliga raderna en kopia av rubriken ovanför.
    expect(utanTitelupprepning('Undersköterska Lärling', 'Undersköterska Lärling')).toBe('')
    expect(utanTitelupprepning('Vård — går snabbt', 'Vård')).toBe('går snabbt')
    expect(utanTitelupprepning('Helt annan text', 'Vård')).toBe('Helt annan text')
    expect(normalizeEducation(VUXGY_TRAFF).description).not.toMatch(/^Undersköterska i kombination/)
  })

  it('rensar HTML och entiteter ur beskrivningen', () => {
    const d = normalizeEducation(VUXGY_TRAFF).description!
    expect(d).not.toContain('<p>')
    expect(d).not.toContain('&nbsp;')
    expect(d).toContain('Utbildningen passar')
  })
})

describe('normalizeMatchHit — matchträffar', () => {
  it('läser den platta formen i stället för att ge "Namnlös utbildning"', () => {
    const e = normalizeMatchHit(MATCH_TRAFF)
    expect(e.title).toBe('Träarbetare, Klassrum')
    expect(e.typeLabel).toBe('Komvux, gymnasial')
    expect(e.type).toBe('komvux')
  })

  it('rensar HTML även här och sätter orten ur kommunnamnet', () => {
    const e = normalizeMatchHit(MATCH_TRAFF)
    expect(e.description).not.toContain('<h1>')
    expect(e.locations).toEqual(['Vallentuna'])
  })
})

describe('slaIhopDubbletter', () => {
  it('slår ihop samma kurs på flera orter till ett kort', () => {
    const lista = ['Nykvarn', 'Södertälje', 'Huddinge', 'Botkyrka'].map((kommun, i) => ({
      ...VUXGY_TRAFF,
      id: `i.alvis.${i}.125398`,
      providerSummary: { providers: [kommun] },
    })).map(normalizeEducation)

    const { unika, borttagna } = slaIhopDubbletter(lista)
    expect(unika).toHaveLength(1)
    expect(borttagna).toBe(3)
    expect(unika[0].locations).toEqual(['Nykvarn', 'Södertälje', 'Huddinge', 'Botkyrka'])
  })

  it('slår INTE ihop olika utbildningar', () => {
    const { unika } = slaIhopDubbletter([normalizeEducation(YH_TRAFF), normalizeEducation(VUXGY_TRAFF)])
    expect(unika).toHaveLength(2)
  })
})

describe('typfiltret', () => {
  it('mappar till JobEds KORTA koder — de långa gav noll träffar', () => {
    expect(TYP_TILL_FORM.yrkeshogskola).toEqual(['yh'])
    expect(TYP_TILL_FORM.hogskola).toEqual(['hs'])
    expect(TYP_TILL_FORM.folkhogskola).toEqual(['fhs'])
    expect(TYP_TILL_FORM.komvux).toEqual(['vuxgy', 'vuxgr'])
    for (const koder of Object.values(TYP_TILL_FORM)) {
      for (const kod of koder) {
        expect(FORMER[kod], `${kod} saknas i FORMER`).toBeDefined()
        // Ett långt namn som 'yrkeshögskoleutbildning' är exakt det API:t
        // inte känner igen. Kortkoderna är max tre tecken, utom AF:s.
        expect(kod === 'af arbetsmarknadsutbildning' || kod.length <= 5).toBe(true)
      }
    }
  })
})

describe('/types och /regions — kraschen som tog hela sidan', () => {
  // JobEds faktiska svar, ordagrant.
  const FORMER_FRAN_API = [
    { key: 'af arbetsmarknadsutbildning', value: 'Af arbetsmarknadsutbildning' },
    { key: 'fhs', value: 'Fhs' }, { key: 'hs', value: 'Hs' }, { key: 'kku', value: 'Kku' },
    { key: 'vuxgr', value: 'Vuxgr' }, { key: 'vuxgy', value: 'Vuxgy' }, { key: 'yh', value: 'Yh' },
  ]
  const REGIONER_FRAN_API = [
    { key: '10', value: 'Blekinge län' },
    { key: '01', value: 'Stockholms län' },
  ]

  it('ger id och label som STRÄNGAR — aldrig {key, value}-objekt', () => {
    for (const post of typerFranApi(FORMER_FRAN_API)!) {
      expect(typeof post.id).toBe('string')
      expect(typeof post.label).toBe('string')
    }
    for (const post of regionerFranApi(REGIONER_FRAN_API)!) {
      expect(typeof post.id).toBe('string')
      expect(typeof post.label).toBe('string')
    }
  })

  it('regionerna får ett id — tidigare saknades nyckeln helt', () => {
    const r = regionerFranApi(REGIONER_FRAN_API)!
    expect(r.find((x) => x.label === 'Stockholms län')?.id).toBe('01')
    expect(r[0]).toEqual({ id: '', label: 'Hela Sverige' })
  })

  it('visar våra etiketter, inte API:ts "Yh"/"Fhs"', () => {
    const etiketter = typerFranApi(FORMER_FRAN_API)!.map((t) => t.label)
    expect(etiketter).toContain('Yrkeshögskola')
    expect(etiketter).toContain('Folkhögskola')
    expect(etiketter).not.toContain('Yh')
    // `komvux` täcker både vuxgy och vuxgr — valet ska heta "Komvux", inte
    // den första formkodens etikett i bokstavsordning.
    expect(etiketter).toContain('Komvux')
    expect(etiketter).not.toContain('Komvux, grundläggande')
  })

  it('faller tillbaka i stället för att skicka skräp vidare', () => {
    expect(typerFranApi([])).toBeNull()
    expect(typerFranApi({ inte: 'en array' })).toBeNull()
    expect(typerFranApi([{ nyckelSomInteFinns: 1 }])).toBeNull()
    expect(regionerFranApi([{ nyckelSomInteFinns: 1 }])).toBeNull()
  })

  it('rensaVal slänger poster där label inte är en sträng', () => {
    const smuts = [
      { id: 'yh', label: 'Yrkeshögskola' },
      { id: { key: 'hs' }, label: { key: 'hs', value: 'Hs' } },
    ] as unknown as Array<{ id: string; label: string }>
    expect(rensaVal(smuts)).toEqual([{ id: 'yh', label: 'Yrkeshögskola' }])
  })
})
