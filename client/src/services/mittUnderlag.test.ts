/**
 * FN16 — "Ta med dig"-paketet.
 *
 * Motprov (körda 2026-10-30):
 *  (1) `val.journal ? lasDel(...) : utelamnad` → `lasDel(kallor.journal)` (läs journalen
 *      utan val): "journalen läses inte" och "ingår inte i zip:en" faller.
 *  (2) `lasDel` returnerar 'tom' i stället för 'fel' i catch: "ett läsfel är inte tomt" faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { byggDokument, hamtaUnderlag, skapaUnderlag, lasMigText, type Overs, type UnderlagKallor } from './mittUnderlag'
import type { ActivitySession } from './aktivitetApi'
import type { Application } from '@/types/application.types'

const t: Overs = (_k, standard, vars) =>
  standard.replace(/\{\{(\w+)\}\}/g, (_m, n: string) => String(vars?.[n] ?? ''))

const NU = new Date(2026, 9, 30, 12, 0, 0)

const ansokan = {
  id: 'a1', userId: 'u', jobId: 'j', jobData: {}, status: 'applied', source: 'job_search', priority: 'medium',
  companyName: 'Nordfrakt AB', jobTitle: 'Lagerarbetare', location: 'Borås', applicationDate: '2026-10-12',
  createdAt: '', updatedAt: '',
} as unknown as Application

const pass = (o: Partial<ActivitySession>): ActivitySession => ({
  id: 's', plan_id: 'p', participant_id: 'u', date: '2026-10-05', start_time: '09:00:00', end_time: '12:00:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null,
  attendance_note: null, sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null,
  created_at: '', updated_at: '', ...o,
} as ActivitySession)

const HEMLIG = 'KONSULENTENS-PRIVATA-ANTECKNING'

function kallor(over: Partial<UnderlagKallor> = {}): UnderlagKallor {
  return {
    ansokningar: vi.fn().mockResolvedValue([ansokan]),
    pass: vi.fn().mockResolvedValue([pass({ attendance: 'present' })]),
    planer: vi.fn().mockResolvedValue([]),
    mal: vi.fn().mockResolvedValue([]),
    journal: vi.fn().mockResolvedValue([{ datum: '2026-10-01', kategori: 'Samtal', text: HEMLIG }]),
    cv: vi.fn().mockResolvedValue({ blob: new Blob(['%PDF-cv']), namn: 'CV_Anna.pdf' }),
    vecka: vi.fn().mockResolvedValue([]),
    ...over,
  }
}

/** Filnamn och innehåll ur en zip, via centralkatalogen. */
function packaUpp(zip: Uint8Array): Record<string, string> {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
  const eocd = zip.length - 22
  const antal = v.getUint16(eocd + 10, true)
  let pos = v.getUint32(eocd + 16, true)
  const ut: Record<string, string> = {}
  for (let i = 0; i < antal; i++) {
    const storlek = v.getUint32(pos + 24, true)
    const nl = v.getUint16(pos + 28, true)
    const lokal = v.getUint32(pos + 42, true)
    const namn = new TextDecoder().decode(zip.subarray(pos + 46, pos + 46 + nl))
    const start = lokal + 30 + v.getUint16(lokal + 26, true)
    ut[namn] = new TextDecoder().decode(zip.subarray(start, start + storlek))
    pos += 46 + nl
  }
  return ut
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('journalen följer bara med med val', () => {
  it('läser inte consultant_journal när deltagaren inte valt det', async () => {
    const k = kallor()
    const rader = await hamtaUnderlag({ journal: false }, k)
    expect(k.journal).not.toHaveBeenCalled()
    expect(rader.journal.status).toBe('utelamnad')
  })

  it('journalen ingår inte i zip:en utan val, och ingår med val', async () => {
    const utan = await skapaUnderlag({ journal: false }, t, 'sv', kallor(), NU)
    const filerUtan = packaUpp(utan.zip)
    expect(Object.values(filerUtan).join('')).not.toContain(HEMLIG)
    expect(filerUtan['Las-mig.txt']).toContain('du valde att inte ta med det')

    const med = await skapaUnderlag({ journal: true }, t, 'sv', kallor(), NU)
    expect(packaUpp(med.zip)['Mitt-underlag.pdf']).toContain(HEMLIG)
  })
})

describe('ärliga tomma och trasiga delar', () => {
  it('en tom del säger det i ord, inte som en nolla', async () => {
    const rader = await hamtaUnderlag({ journal: false }, kallor({ ansokningar: vi.fn().mockResolvedValue([]) }))
    const dok = byggDokument(rader, t, 'sv', NU)
    const s = dok.sektioner.find((x) => x.id === 'ansokningar')!
    expect(s.meddelande).toBe('Du har inga ansökningar sparade.')
    expect(s.rader).toBeUndefined()
  })

  it('ett läsfel är inte "tomt"', async () => {
    const rader = await hamtaUnderlag({ journal: false }, kallor({ ansokningar: vi.fn().mockRejectedValue(new Error('boom')) }))
    expect(rader.ansokningar.status).toBe('fel')
    const s = byggDokument(rader, t, 'sv', NU).sektioner.find((x) => x.id === 'ansokningar')!
    expect(s.meddelande).toContain('kunde inte läsas')
    expect(s.meddelande).not.toContain('inga ansökningar')
  })

  it('Las-mig skiljer tomt, fel och utelämnat åt', async () => {
    const paket = await skapaUnderlag(
      { journal: false }, t, 'sv',
      kallor({ cv: vi.fn().mockResolvedValue(null), vecka: vi.fn().mockRejectedValue(new Error('x')) }), NU,
    )
    const lasMig = packaUpp(paket.zip)['Las-mig.txt']
    expect(lasMig).toContain('CV.pdf: ingår inte: det fanns inget att ta med')
    expect(lasMig).toContain('Veckan.ics: ingår inte: det gick inte att läsa just nu')
    expect(packaUpp(paket.zip)['CV.pdf']).toBeUndefined()
  })

  it('ett pass i det förflutna utan markering räknas inte som närvaro', async () => {
    const rader = await hamtaUnderlag({ journal: false }, kallor({
      pass: vi.fn().mockResolvedValue([pass({ attendance: null, date: '2026-10-05' }), pass({ id: 'x', attendance: null, date: '2026-11-05' })]),
    }))
    const s = byggDokument(rader, t, 'sv', NU).sektioner.find((x) => x.id === 'aktivitet')!
    expect(s.rader![0][4]).toBe('Inte markerad')
    expect(s.rader![1][4]).toBe('Planerat')
    expect(s.ingress).toContain('0 med närvaro')
    expect(s.ingress).toContain('1 ännu inte markerade')
  })
})

describe('paketet', () => {
  it('innehåller PDF, CV och Las-mig; veckan bara när något är inbokat', async () => {
    const paket = await skapaUnderlag({ journal: false }, t, 'sv', kallor(), NU)
    const filer = packaUpp(paket.zip)
    expect(Object.keys(filer).sort()).toEqual(['CV_Anna.pdf', 'Las-mig.txt', 'Mitt-underlag.pdf'])
    expect(filer['Mitt-underlag.pdf'].startsWith('%PDF')).toBe(true)
    expect(filer['CV_Anna.pdf']).toBe('%PDF-cv')
    expect(paket.filnamn).toBe('jobin-mitt-underlag-2026-10-30.zip')
  })

  it('veckan blir en .ics när det finns poster', async () => {
    const paket = await skapaUnderlag({ journal: false }, t, 'sv', kallor({
      vecka: vi.fn().mockResolvedValue([{ uid: 's@jobin.se', datum: '2026-11-02', start: '09:00', slut: '12:00', titel: 'Verkstad' }]),
    }), NU)
    expect(packaUpp(paket.zip)['Veckan.ics']).toContain('BEGIN:VCALENDAR')
  })

  it('lasMigText använder CRLF', () => {
    expect(lasMigText([{ fil: 'a', status: 'med' }], t, NU)).toContain('\r\n')
  })
})
