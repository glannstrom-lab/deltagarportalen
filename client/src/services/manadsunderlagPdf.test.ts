/**
 * RK39 (rollspelet 2026-09-27): underlag per stödmånad — en deltagare, en
 * kalendermånad, med veckonummer. Byteströmmen läses som i
 * underlagspaketPdf.test.ts (parenteserna av-eskaperade först).
 *
 * Motprov (körda): (1) klipp inte veckan vid månadsgränsen (fran = mandag) →
 * "del av veckan"-testet faller. (2) räkna eget jobbsökande i anvisat → vecko-
 * testet faller. (3) ta bort förklaringen ur manadsAnteckning → faller.
 * (4) byt `tom ? STRECK` mot 0 → "en vecka utan pass"-testet faller.
 */
import { describe, it, expect } from 'vitest'
import {
  generateManadsunderlagPDF,
  manadensVeckor,
  manadEtikett,
  manadsAnteckning,
  manadsunderlagFilnamn,
  passRader,
  stodmanadAlternativ,
  veckoRader,
  type ManadsunderlagInput,
} from './manadsunderlagPdf'
import type { PaketPass } from './underlagspaketPdf'

const pass = (o: Partial<PaketPass> & Record<string, unknown>): PaketPass => ({
  id: 's', plan_id: 'plan1', participant_id: 'p1', date: '2026-10-05', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: null, notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
} as PaketPass)

const OKTOBER: PaketPass[] = [
  pass({ id: 'a', date: '2026-09-30', attendance: 'present' }), // före månaden, samma vecka som 1 okt
  pass({ id: 'b', date: '2026-10-01', attendance: 'present', marked_by: 'k1', marked_at: '2026-10-01T10:00:00Z' }),
  pass({ id: 'c', date: '2026-10-02', activity_type: 'jobsearch_own', start_time: '08:00', end_time: '10:00', attendance: 'present' }),
  pass({ id: 'd', date: '2026-10-06', attendance: 'absent_invalid', attendance_note: 'Kom inte', marked_by: 'k1', marked_at: '2026-10-06T13:00:00Z',
    participant_explanation: 'Bussen kom inte', participant_explanation_at: '2026-10-07T08:00:00Z' }),
  pass({ id: 'e', date: '2026-10-07', attendance: 'sick_certified', sick_certificate_received: false }),
  pass({ id: 'f', date: '2026-11-02', attendance: 'present' }), // efter månaden
]

describe('stödmånaden', () => {
  it('etikett och de tretton senaste månaderna, nyast först', () => {
    expect(manadEtikett('2026-10')).toBe('oktober 2026')
    const alt = stodmanadAlternativ(new Date(2026, 9, 15))
    expect(alt).toHaveLength(13)
    expect(alt[0]).toEqual({ value: '2026-10', label: 'oktober 2026' })
    expect(alt[12].value).toBe('2025-10')
  })

  it('ISO-veckorna som berör oktober 2026, klippta till månaden', () => {
    const v = manadensVeckor('2026-10')
    expect(v.map((x) => x.vecka)).toEqual([40, 41, 42, 43, 44])
    expect(v[0]).toEqual({ vecka: 40, mandag: '2026-09-28', fran: '2026-10-01', till: '2026-10-04', delvis: true })
    expect(v[1].delvis).toBe(false)
    expect(v[4]).toEqual({ vecka: 44, mandag: '2026-10-26', fran: '2026-10-26', till: '2026-10-31', delvis: true })
  })

  it('årsskiftet: december 2026 slutar i vecka 53', () => {
    expect(manadensVeckor('2026-12').map((x) => x.vecka)).toEqual([49, 50, 51, 52, 53])
  })
})

describe('raderna', () => {
  it('en rad per vecka — bara månadens dagar, anvisat och eget jobbsökande isär', () => {
    const rader = veckoRader(OKTOBER as never, '2026-10')
    // Vecka 40: 30 sep räknas inte; 1 okt 3 h anvisat närvaro, 2 okt 2 h eget
    expect(rader[0]).toEqual(['v. 40', '1 okt - 4 okt (del av veckan)', '2', '3', '2', '0', '0', '0', '0', '0'])
    expect(rader[1]).toEqual(['v. 41', '5 okt - 11 okt', '2', '0', '0', '0', '1', '0', '1', '0'])
  })

  it('en vecka utan pass får "-" i timkolumnerna, aldrig 0 h', () => {
    expect(veckoRader(OKTOBER as never, '2026-10')[2].slice(3, 5)).toEqual(['-', '-'])
  })

  it('passen dag för dag, med veckonummer och deltagarens förklaring i efterhand', () => {
    const rader = passRader(OKTOBER as never, '2026-10', 'p1', { k1: 'Karin Konsulent' })
    expect(rader.map((r) => r[1])).toEqual(['tor 1 okt', 'fre 2 okt', 'tis 6 okt', 'ons 7 okt'])
    expect(rader[2][0]).toBe('41')
    expect(rader[2][4]).toBe('Frånvaro, ogiltig')
    expect(rader[2][6]).toBe('Kom inte\nDeltagarens förklaring 2026-10-07 10:00: Bussen kom inte')
    expect(rader[3][5]).toBe('Utan intyg')
    expect(manadsAnteckning(pass({}) as never)).toBe('-')
  })

  it('filnamnet bär namn och månad', () => {
    expect(manadsunderlagFilnamn('Anna Exempel', '2026-10')).toBe('manadsunderlag-anna-exempel-2026-10.pdf')
  })
})

describe('PDF:en', () => {
  const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')
  const input: ManadsunderlagInput = {
    ym: '2026-10',
    plan: { id: 'plan1', participant_id: 'p1', start_date: '2026-09-01', end_date: null, weekly_hours_target: 11, jobsearch_hours_per_week: 3 },
    participantName: 'Anna Exempel',
    framtagetAv: 'Karin Konsulent',
    organizationName: 'Demokommun',
    sessions: OKTOBER as never,
    namn: { k1: 'Karin Konsulent' },
    regelverk: 'kommun',
    nu: new Date('2026-11-03T08:00:00Z'),
  }

  it('titel, stödmånad, veckomål, veckonummer och nämndens ansvar står på pappret', async () => {
    const doc = await generateManadsunderlagPDF(input)
    const text = avEskapera(doc.output())
    expect(text).toContain('Underlag om närvaro - stödmånad oktober 2026')
    expect(text).toContain('oktober 2026 (1 okt 2026 - 31 okt 2026)')
    expect(text).toContain('11 timmar per vecka, varav 3 timmar eget jobbsökande')
    expect(text).toContain('v. 40')
    expect(text).toContain('Bussen') // förklaringen radbryts i cellen
    expect(text).toContain('socialnämnden')
    expect(text).not.toContain('Månaden är inte slut')
  })

  it('en pågående månad säger att senare pass inte är bedömda', async () => {
    const doc = await generateManadsunderlagPDF({ ...input, nu: new Date('2026-10-15T08:00:00Z') })
    expect(avEskapera(doc.output())).toContain('Månaden är inte slut')
  })
})
