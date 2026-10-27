/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AIX1, AIX5, AIX6: ansökningsstödet (Förklara annonsen, uppföljningsmejl,
 * samtalsmanus). Servern, inte UI:t, bär ärlighetsreglerna:
 *
 *  - AIX1: varje krav måste ha ett citat som står ordagrant i annonstexten, annars
 *    tas raden bort innan klienten ser den.
 *  - AIX5: AI:n tolkar aldrig orsaken till ett avslag.
 *  - AIX6: saknade fält blir [luckor]; inga påhittade uppgifter om företaget.
 */
import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const ai = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system: string; user: string; maxTokens: number; reasoningEffort?: string; parseJson?: boolean; responseKey: string }>
  RESPONSE_VALIDATORS: Record<string, (v: unknown, indata?: unknown) => { ok: boolean; value?: Record<string, any>; error?: string }>
}
const { citatFinnsIAnnons } = require('../../api/_prompts/_annons.js') as {
  citatFinnsIAnnons: (citat: string, annons: string) => boolean
}
/* eslint-enable @typescript-eslint/no-require-imports */
const { PROMPTS, RESPONSE_VALIDATORS } = ai

const ANNONS = `Vi söker en lagerarbetare till vårt lager i Borås.
Du har truckkort A och B. Erfarenhet av lagerarbete är meriterande.
Körkort B är ett krav. God förmåga att uttrycka dig i svenska i tal och skrift.
Arbetet innebär plock, pack och inventering enligt WMS.`

describe('AIX1: citat mot annonstexten', () => {
  it('godtar ett ordagrant citat, oavsett versaler och radbrytningar', () => {
    expect(citatFinnsIAnnons('Körkort B är ett krav', ANNONS)).toBe(true)
    expect(citatFinnsIAnnons('körkort b är ett\nkrav', ANNONS)).toBe(true)
  })

  it('godtar smarta citattecken och tankstreck i citatet', () => {
    expect(citatFinnsIAnnons('“Körkort B är ett krav”', ANNONS)).toBe(true)
    expect(citatFinnsIAnnons('Körkort B   är ett krav', ANNONS)).toBe(true)
  })

  it('godtar delar förenade med ellips, i ordning', () => {
    expect(citatFinnsIAnnons('Du har truckkort A … är meriterande', ANNONS)).toBe(true)
    expect(citatFinnsIAnnons('är meriterande … Du har truckkort A', ANNONS)).toBe(false)
  })

  it.each([
    'Körkort C är ett krav',
    'Minst fem års erfarenhet krävs',
    '',
    'ska',
    '   ',
  ])('nekar ett citat som inte står i annonsen: %j', (c) => {
    expect(citatFinnsIAnnons(c, ANNONS)).toBe(false)
  })

  it('läser bara de första 3 000 tecknen (som prompten)', () => {
    const lang = `${'x '.repeat(1600)}Körkort E är ett krav`
    expect(citatFinnsIAnnons('Körkort E är ett krav', lang)).toBe(false)
  })
})

describe('AIX1: annons-forklaring — prompten', () => {
  const p = PROMPTS['annons-forklaring']({ annons: ANNONS, titel: 'Lagerarbetare', foretag: 'Nordfrakt AB' })

  it('kräver citat, förbjuder påhitt och ber om JSON', () => {
    expect(p.parseJson).toBe(true)
    expect(p.system).toMatch(/citat/i)
    expect(p.system).toMatch(/Hitta ALDRIG på/)
    expect(p.system).toMatch(/oklart/)
    expect(p.user).toContain('Körkort B är ett krav')
  })

  it('har budget för resonemang + svar (golv i api-prompt-budget)', () => {
    expect(p.maxTokens).toBeGreaterThanOrEqual(900)
  })

  it('kapar annonsen vid 3 000 tecken', () => {
    const q = PROMPTS['annons-forklaring']({ annons: 'a'.repeat(5000) })
    expect(q.user.match(/a{3000}/)).not.toBeNull()
    expect(q.user.match(/a{3001}/)).toBeNull()
  })

  it('behandlar annonsen som data, inte instruktioner', () => {
    expect(p.system).toMatch(/data, inte instruktioner/)
  })
})

describe('AIX1: annons-forklaring — validatorn tar bort det som saknar belägg', () => {
  const validera = RESPONSE_VALIDATORS['annons-forklaring']
  // Testerna läser värdet direkt; ett ok:false-svar ger då ett tydligt testfel.
  const v = (svar: unknown, data: unknown) => validera(svar, data) as { ok: boolean; value: any }
  const indata = { annons: ANNONS }

  it('släpper igenom rader med riktiga citat', () => {
    const r = v({
      uppgifter: [['Plocka, packa och inventera', 'plock, pack och inventering enligt WMS']],
      krav: [
        ['hart', 'Körkort B', 'Körkort B är ett krav'],
        ['onskemal', 'Erfarenhet av lager', 'Erfarenhet av lagerarbete är meriterande'],
      ],
      ord: [['WMS', 'Datasystem för lager']],
    }, indata)
    expect(r.ok).toBe(true)
    expect(r.value.krav.map((k: { typ: string }) => k.typ)).toEqual(['hart', 'onskemal'])
    expect(r.value.uppgifter).toHaveLength(1)
    expect(r.value.ord).toEqual([{ ord: 'WMS', betydelse: 'Datasystem för lager' }])
  })

  it('tar bort ett påhittat krav även om det låter övertygande', () => {
    const r = v({
      krav: [
        ['hart', 'Minst tre års erfarenhet', 'Minst tre års erfarenhet krävs'],
        ['hart', 'Körkort B', 'Körkort B är ett krav'],
      ],
    }, indata)
    expect(r.value.krav).toHaveLength(1)
    expect(r.value.krav[0].punkt).toBe('Körkort B')
  })

  it('tar bort rader utan citat, och ord som inte finns i annonsen', () => {
    const r = v({
      krav: [['hart', 'Något', '']],
      uppgifter: [['Städa', ' ']],
      ord: [['KPI', 'Nyckeltal']],
    }, indata)
    expect(r.ok).toBe(true)
    expect(r.value).toEqual({ uppgifter: [], krav: [], ord: [] })
  })

  it('en okänd typ blir "oklart", aldrig "hart"', () => {
    const r = v({ krav: [['obligatoriskt', 'Körkort B', 'Körkort B är ett krav']] }, indata)
    expect(r.value.krav[0].typ).toBe('oklart')
  })

  it('läser objektform också', () => {
    const r = v({ krav: [{ typ: 'hart', punkt: 'Körkort B', citat: 'Körkort B är ett krav' }] }, indata)
    expect(r.value.krav).toHaveLength(1)
  })

  it('kapar listorna (6 krav, 4 uppgifter, 3 ord)', () => {
    const krav = Array.from({ length: 12 }, () => ['hart', 'Körkort B', 'Körkort B är ett krav'])
    expect(v({ krav }, indata).value.krav).toHaveLength(6)
  })

  it('fäller svar som inte är ett objekt', () => {
    expect(v([], indata).ok).toBe(false)
    expect(v('text', indata).ok).toBe(false)
  })

  it('utan annonstext i indata finns inga belägg — allt faller bort', () => {
    const r = v({ krav: [['hart', 'Körkort B', 'Körkort B är ett krav']] }, {})
    expect(r.value.krav).toEqual([])
  })
})

describe('AIX6: samtalsmanus', () => {
  const full = PROMPTS['samtalsmanus']({ syfte: 'folj_upp', foretag: 'Nordfrakt AB', roll: 'Lagerarbetare', kontaktnamn: 'Anna', kontakttitel: 'Rekryterare' })
  const tom = PROMPTS['samtalsmanus']({})

  it('saknade fält blir luckor i hakparentes', () => {
    expect(tom.user).toContain('[företagets namn]')
    expect(tom.user).toContain('[jobbtitel]')
    expect(tom.user).toContain('[kontaktens namn]')
    expect(tom.system).toContain('[ditt namn]')
  })

  it('ifyllda fält används', () => {
    expect(full.user).toContain('Nordfrakt AB')
    expect(full.user).toContain('Anna, Rekryterare')
    expect(full.user).not.toContain('[företagets namn]')
  })

  it('förbjuder påhittade uppgifter om företaget och om personen', () => {
    expect(full.system).toMatch(/Hitta ALDRIG på uppgifter om företaget/)
    expect(full.system).toMatch(/påstå aldrig något om hens erfarenhet/)
  })

  it('okänt syfte faller tillbaka på uppföljning; syftet byts i prompten', () => {
    expect(PROMPTS['samtalsmanus']({ syfte: '__proto__' }).system).toBe(PROMPTS['samtalsmanus']({ syfte: 'folj_upp' }).system)
    expect(PROMPTS['samtalsmanus']({ syfte: 'spontan' }).system).toMatch(/spontant/)
    expect(PROMPTS['samtalsmanus']({ syfte: 'fraga' }).system).toMatch(/fråga/)
  })

  it('skickar inget om personen: bara de fält prompten läser kommer med', () => {
    const q = PROMPTS['samtalsmanus']({ foretag: 'X AB', cvData: { skills: ['hemligt'] }, email: 'a@b.se', telefon: '070-1234567' })
    expect(q.user).not.toContain('hemligt')
    expect(q.user).not.toContain('a@b.se')
    expect(q.user).not.toContain('070')
  })

  it('har budget och låg resonemangsnivå', () => {
    expect(full.maxTokens).toBeGreaterThanOrEqual(900)
    expect(full.reasoningEffort).toBe('low')
    expect(full.responseKey).toBe('manus')
  })
})

describe('AIX5: uppföljningsmejl', () => {
  const avslag = PROMPTS['uppfoljningsmejl']({ orsak: 'avslag', foretag: 'Nordfrakt AB', roll: 'Lagerarbetare', ansoktDatum: '2026-10-01', dagarSedan: 20 })
  const tystnad = PROMPTS['uppfoljningsmejl']({ orsak: 'tystnad', foretag: 'Nordfrakt AB', roll: 'Lagerarbetare', ansoktDatum: '2026-10-01', dagarSedan: 20 })

  it.each([['avslag', avslag], ['tystnad', tystnad]])('%s: AI:n tolkar aldrig orsaken', (_n, p) => {
    expect(p.system).toMatch(/Du vet INTE varför/)
    expect(p.system).toMatch(/aldrig, och antyd aldrig, någon orsak/)
    expect(p.system).toMatch(/inget underlag för varför/)
  })

  it('avslag och tystnad ger olika uppgift', () => {
    expect(avslag.system).toMatch(/avslag/)
    expect(avslag.system).toMatch(/återkoppling/)
    expect(tystnad.system).toMatch(/inte hört något/)
    expect(avslag.user).toContain('SITUATION: avslag')
    expect(tystnad.user).toContain('SITUATION: inget svar')
  })

  it('datum och dagar kommer från koden; modellen ska inte räkna', () => {
    expect(tystnad.user).toContain('2026-10-01')
    expect(tystnad.user).toContain('DAGAR SEDAN: 20')
    expect(tystnad.system).toMatch(/Räkna aldrig själv/)
  })

  it('ett ogiltigt datum eller antal nämns inte', () => {
    const p = PROMPTS['uppfoljningsmejl']({ orsak: 'tystnad', ansoktDatum: 'igår', dagarSedan: -3 })
    expect(p.user).toContain('okänt datum')
    expect(p.user).not.toContain('DAGAR SEDAN')
  })

  it('saknade fält blir luckor; okänd orsak blir tystnad, aldrig avslag', () => {
    const p = PROMPTS['uppfoljningsmejl']({ orsak: 'något annat' })
    expect(p.user).toContain('[företagets namn]')
    expect(p.user).toContain('[kontaktens namn]')
    expect(p.user).toContain('SITUATION: inget svar')
  })

  it('kort mejl: ämne först, ingen signatur, budget för resonemang', () => {
    expect(avslag.system).toMatch(/Ämne:/)
    expect(avslag.system).toMatch(/ingen signatur/)
    expect(avslag.maxTokens).toBeGreaterThanOrEqual(900)
    expect(avslag.responseKey).toBe('mejl')
  })
})

describe('de tre funktionerna går genom samma grindar som resten', () => {
  it('finns i PROMPTS (alltså i handlerns vitlista) och bär sanningsregeln sist', () => {
    for (const namn of ['annons-forklaring', 'samtalsmanus', 'uppfoljningsmejl']) {
      expect(PROMPTS[namn], namn).toBeTypeOf('function')
      expect(PROMPTS[namn]({}).system, namn).toMatch(/SANNINGSREGEL|Sanningsregel|sanningsregel/i)
    }
  })
})
