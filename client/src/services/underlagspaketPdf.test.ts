/**
 * RK8 (rollspelet 2026-09-27): "Lämna underlag" ska lämna en handling. Vad
 * paketet faktiskt lägger på pappret — byteströmmen läses som i
 * narvaroIntygPdf.test.ts, med parenteserna av-eskaperade först (fällan 2026-08-23).
 */
import { describe, it, expect } from 'vitest'
import {
  avvikerFranLamnat,
  generateUnderlagspaketBlob,
  intygStatus,
  markeradAv,
  paketAnteckning,
  paketRader,
  paketUtfall,
  sammanfattningRader,
  underlagspaketFilnamn,
  type PaketPass,
  type UnderlagspaketInput,
} from './underlagspaketPdf'
import { sammanfattaNarvaro } from './aktivitetApi'

const pass = (o: Partial<PaketPass>): PaketPass => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-10-05', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: null, notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

const KONSULENT = 'k1'
const NAMN = { [KONSULENT]: 'Karin Konsulent' }

const passen: PaketPass[] = [
  pass({ id: 'a', date: '2026-10-05', attendance: 'present', marked_by: KONSULENT, marked_at: '2026-10-05T10:15:00Z' }),
  pass({ id: 'b', date: '2026-10-06', attendance: 'sick_certified', sick_certificate_received: false, attendance_note: 'Ringde 08.10, feber', marked_by: KONSULENT, marked_at: '2026-10-06T07:30:00Z' }),
  pass({ id: 'c', date: '2026-10-07', attendance: 'sick_certified', sick_certificate_received: true, marked_by: KONSULENT, marked_at: '2026-10-08T12:00:00Z' }),
  pass({ id: 'd', date: '2026-10-08', attendance: 'absent_invalid', attendance_note: 'Kom inte, svarade inte i telefon', marked_by: KONSULENT, marked_at: '2026-10-08T13:00:00Z' }),
  pass({ id: 'e', date: '2026-10-09', absence_reported_at: '2026-10-08T18:00:00Z', absence_reason: 'child_care', absence_note: 'Förskolan stängd' }),
  pass({ id: 'f', date: '2026-09-30', attendance: 'present' }), // före perioden
]

const underlag: UnderlagspaketInput['underlag'] = {
  recipient: 'Anna Andersson, Försörjningsstöd',
  period_from: '2026-10-01',
  period_to: '2026-10-20',
  handed_over_at: '2026-10-20T08:00:00Z',
  summary: sammanfattaNarvaro(passen, '2026-10-01', '2026-10-20'),
  note: 'Kontakt med vårdcentralen pågår',
  withdrawn_at: null,
  withdrawn_reason: null,
}

const input: UnderlagspaketInput = {
  underlag,
  participantId: 'p1',
  participantName: 'Omar Deltagare',
  lamnatAv: 'Karin Konsulent',
  organizationName: 'Demokommun',
  sessions: passen,
  namn: NAMN,
  regelverk: 'kommun',
  nu: new Date('2026-10-20T08:05:00Z'),
}

const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')

async function textenIPdf(i: UnderlagspaketInput): Promise<string> {
  const blob = await generateUnderlagspaketBlob(i)
  return await new Promise<string>((resolve, reject) => {
    const läsare = new FileReader()
    läsare.onload = () => resolve(String(läsare.result))
    läsare.onerror = () => reject(läsare.error)
    läsare.readAsBinaryString(blob)
  }).then(avEskapera)
}

describe('underlagspaketet — raderna', () => {
  it('intygsstatus skiljer sjuk med och utan intyg, och gäller bara sjukmarkering', () => {
    expect(intygStatus(passen[1])).toBe('Utan intyg')
    expect(intygStatus(passen[2])).toBe('Med intyg')
    expect(intygStatus(passen[0])).toBe('-')
  })

  it('vem som markerat: namn, deltagaren själv, eller rakt ut att namnet saknas', () => {
    expect(markeradAv(passen[0], 'p1', NAMN)).toBe('Karin Konsulent')
    expect(markeradAv(pass({ marked_by: 'p1' }), 'p1', NAMN)).toBe('Deltagaren')
    expect(markeradAv(pass({ marked_by: 'okand' }), 'p1', NAMN)).toBe('Namn saknas (annan användare)')
    expect(markeradAv(pass({}), 'p1', NAMN)).toBe('-')
  })

  it('frånvaro bär konsulentens anteckning och deltagarens egen anmälan', () => {
    expect(paketAnteckning(passen[3])).toBe('Kom inte, svarade inte i telefon')
    expect(paketAnteckning(passen[4])).toMatch(/^Deltagaren anmälde 2026-10-08 20:00: vård av barn - Förskolan stängd$/)
    expect(paketUtfall(passen[4])).toBe('Anmäld frånvaro (vård av barn), ej bedömd')
  })

  it('bara periodens pass, dag för dag, med markeringstid i svensk tid', () => {
    const rader = paketRader(input)
    expect(rader).toHaveLength(5)
    expect(rader[0][0]).toBe('mån 5 okt 2026')
    expect(rader[1]).toEqual(['tis 6 okt 2026', '09:00-12:00', 'Jobbsökarverkstad\nJobbsökande', 'Sjuk', 'Utan intyg', 'Ringde 08.10, feber', 'Karin Konsulent', '2026-10-06 09:30'])
  })

  it('underlag från före RK3 visar "-" med skäl, inte en nolla', () => {
    const rader = sammanfattningRader({ pass: 3, present: 1, sick_certified: 2 })
    expect(rader).toContainEqual(['Sjuk (med och utan intyg ihop)', '2'])
    expect(rader).toContainEqual(['Sjuk utan intyg', '- (räknades inte separat när underlaget lämnades)'])
  })

  it('säger till när passen ändrats efter att underlaget lämnades', () => {
    const nu = sammanfattaNarvaro(passen, '2026-10-01', '2026-10-20')
    expect(avvikerFranLamnat(underlag.summary, nu)).toBe(false)
    expect(avvikerFranLamnat({ ...underlag.summary, present: 0 }, nu)).toBe(true)
  })

  it('filnamnet bär deltagare och period', () => {
    expect(underlagspaketFilnamn('Omar Deltagare', '2026-10-01', '2026-10-20')).toBe('underlag-omar-deltagare-2026-10-01-2026-10-20.pdf')
  })
})

describe('underlagspaketet — PDF:en', () => {
  it('bär period, mottagare, lämnat av, intygsstatus, anteckningar och vem som markerade', async () => {
    const text = await textenIPdf(input)
    expect(text).toContain('Omar Deltagare')
    expect(text).toContain('1 okt 2026 - 20 okt 2026')
    expect(text).toContain('Anna Andersson, Försörjningsstöd')
    expect(text).toContain('2026-10-20 10:00 av Karin Konsulent')
    expect(text).toContain('Utan intyg')
    expect(text).toContain('Med intyg')
    expect(text).toContain('Ringde 08.10, feber')
    expect(text).toContain('Karin Konsulent')
    expect(text).toContain('socialnämnden')
    expect(text).not.toContain('passen har ändrats')
  })

  it('ett ångrat underlag säger det överst', async () => {
    const text = await textenIPdf({ ...input, underlag: { ...underlag, withdrawn_at: '2026-10-20T09:00:00Z', withdrawn_reason: 'Fel period' } })
    expect(text).toContain('Fel period')
    expect(text).toContain('gäller inte längre')
  })

  it('en leverantör får ingen socialnämnd i texten', async () => {
    const text = await textenIPdf({ ...input, regelverk: 'leverantor' })
    expect(text).not.toContain('socialnämnden')
  })
})
