/**
 * FN20: deltagarens mötesförslag (O13) i konsulentens Min dag.
 * Motprov (körda): (1) ta bort `continue` för passerad tid i minDagPersoner →
 * "ett förslag vars tid passerat" faller. (2) byt MIN_DAG_PRIO.mote_forslag till 70 →
 * "går före dagens möte" faller. (3) låt vantandeForslag släppa igenom status 'scheduled' →
 * motesforslagKonsulent.test faller.
 */
import { describe, it, expect } from 'vitest'
import { minDagPersoner, radSammanfattning, valjNastaSteg, type MoteForslagRad } from './oversiktRegler'

const NU = new Date(2026, 9, 24, 9, 0) // lördag 24 okt 2026
const tomt = { attGora: [], bradskande: [], leverantor: null, moten: [], deadlines: [], kontakter: [], idag: NU }
const forslag = (o: Partial<MoteForslagRad> = {}): MoteForslagRad => ({
  id: 'f1', participantId: 'leila', scheduledAt: new Date(2026, 9, 27, 14, 0).toISOString(), meetingType: 'video', note: null, ...o,
})

describe('minDagPersoner — deltagarens förslag på mötestid', () => {
  it('blir en punkt för personen, med dag, klockslag och form', () => {
    const [p] = minDagPersoner({ ...tomt, forslag: [forslag()] })
    expect(p.participantId).toBe('leila')
    expect(p.punkter[0]).toMatchObject({ typ: 'mote_forslag', lage: 'Föreslår ett möte på tisdag 14:00, digitalt', status: 'vantar', statusText: 'Förslag på tid' })
    expect(p.punkter[0].forslag?.id).toBe('f1')
  })

  it('deltagarens egen rad följer med, kortad', () => {
    const [p] = minDagPersoner({ ...tomt, forslag: [forslag({ note: 'x'.repeat(200) })] })
    expect(p.punkter[0].detalj).toBe(`”${'x'.repeat(87)}…”`)
    const [q] = minDagPersoner({ ...tomt, forslag: [forslag({ note: 'Jag har tandläkare på tisdag' })] })
    expect(q.punkter[0].detalj).toBe('”Jag har tandläkare på tisdag”')
  })

  it('ett förslag vars tid passerat är inaktuellt och blir ingen punkt', () => {
    const passerat = forslag({ scheduledAt: new Date(2026, 9, 24, 8, 0).toISOString() })
    expect(minDagPersoner({ ...tomt, forslag: [passerat] })).toEqual([])
  })

  it('inga förslag (utelämnat eller tomt) ger ingen rad', () => {
    expect(minDagPersoner({ ...tomt })).toEqual([])
    expect(minDagPersoner({ ...tomt, forslag: [] })).toEqual([])
  })

  it('går före dagens möte', () => {
    const moten = [{ id: 'm', participantId: 'leila', scheduledAt: new Date(2026, 9, 24, 15, 0).toISOString(), meetingType: 'video', meetingLink: null, latestNote: null }]
    const [p] = minDagPersoner({ ...tomt, moten, forslag: [forslag()] })
    expect(p.punkter.map((x) => x.typ)).toEqual(['mote_forslag', 'mote_idag'])
  })

  it('kan bli nästa steg när inget annat brådskar', () => {
    const personer = minDagPersoner({ ...tomt, forslag: [forslag()] })
    const val = valjNastaSteg(personer, [], NU)
    expect(val?.typ === 'punkt' && val.punkt.typ).toBe('mote_forslag')
  })

  it('flera förslag från samma person sammanfattas', () => {
    const [p] = minDagPersoner({ ...tomt, forslag: [forslag(), forslag({ id: 'f2', scheduledAt: new Date(2026, 9, 28, 10, 0).toISOString() })] })
    const s = radSammanfattning(p)
    expect(s.lage).toBe('Två förslag på mötestid väntar på svar')
    expect(s.fler).toBe(0)
  })
})
