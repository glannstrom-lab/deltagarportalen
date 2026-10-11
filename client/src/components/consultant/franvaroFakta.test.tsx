/**
 * KSL21 (beslut Mikael 2026-10-11, IAF 2024:12): en Rusta och matcha-leverantör
 * klassar inte frånvaro som giltig/ogiltig — det är Arbetsförmedlingen som
 * avgör. Leverantören registrerar fakta: närvarande / frånvarande / sjuk, orsak,
 * och om frånvaron var anmäld i förväg. Kommunen behåller giltig/ogiltig.
 *
 * Grinden: ordet "giltig" (och därmed "ogiltig") får aldrig synas för en
 * leverantör, och kommunen får aldrig tappa sina två val.
 *
 * Motprov (körda 2026-10-11):
 *   (1) narvaroValFor returnerar NARVARO_STANDARDVAL även för leverantör →
 *       val-, rad- och Dagens pass-testerna faller.
 *   (2) avvikelserapportens typText tillbaka till "Ogiltig frånvaro" →
 *       avvikelsetestet faller.
 *   (3) narvaroValFor returnerar leverantörens val även för kommun →
 *       kommuntesterna faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Attendance } from '@/services/aktivitetSchema'
import type { ActivitySession } from '@/services/aktivitetApi'

const api = vi.hoisted(() => ({ markAttendance: vi.fn(), sattFranvaroAnmald: vi.fn(), saveAttendanceNote: vi.fn() }))
let sessions: Array<Record<string, unknown>> = []

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'k1' } }, error: null }) },
    from: vi.fn((tabell: string) => {
      const b: Record<string, unknown> = {}
      b.select = vi.fn(() => b)
      b.eq = vi.fn(() => (tabell === 'activity_plans' ? Promise.resolve({ data: [{ id: 'pl', org_id: 'org-lev' }], error: null }) : b))
      b.in = vi.fn(() => b)
      b.order = vi.fn(() => Promise.resolve({ data: sessions, error: null }))
      return b
    }),
  },
}))
vi.mock('@/services/aktivitetApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/aktivitetApi')>('@/services/aktivitetApi')
  return { ...faktisk, aktivitetsplanApi: { ...faktisk.aktivitetsplanApi, ...api } }
})
vi.mock('@/lib/toast', () => ({ notifications: { error: vi.fn(), success: vi.fn() } }))

import { NARVARO_ETIKETT_LEVERANTOR, STATUS_ORD_LEVERANTOR, narvaroValFor, statusOrd } from './franvaroFakta'
import { NARVARO_STANDARDVAL } from '@/components/ui/kvarterStatus'
import { DagensPass } from './DagensPass'
import { PassRad } from './aktivitetsplan/PassRad'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import { avvikelserader, avvikelserSomText } from '@/services/avvikelserapport'
import { deltagarLage } from '@/lib/deltagarlage'
import { attGoraIdag, minDagPersoner, radSammanfattning } from '@/pages/consultant/oversiktRegler'
import sv from '@/i18n/locales/sv.json'
import en from '@/i18n/locales/en.json'
import svLatt from '@/i18n/locales/sv-latt.json'

const GILTIG = /giltig/i
const ALLA: Attendance[] = ['present', 'absent_valid', 'absent_invalid', 'sick_certified', 'external']

const idag = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  sessions = []
  api.markAttendance.mockImplementation(async (id: string, input: { attendance: Attendance | null }) => ({ id, attendance: input.attendance }))
  api.sattFranvaroAnmald.mockImplementation(async (id: string, anmald: boolean) => ({ id, attendance: anmald ? 'absent_valid' : 'absent_invalid' }))
})

describe('KSL21 — valen och orden', () => {
  it('leverantören väljer Närvarande / Frånvarande / Sjuk — aldrig giltig eller ogiltig', () => {
    for (const attendance of [null, ...ALLA]) {
      for (const absence_reason of [null, 'child_care']) {
        const val = narvaroValFor('leverantor', { attendance, absence_reason })
        expect(val.map((v) => v.etikett)).toEqual(['Närvarande', 'Frånvarande', 'Sjuk'])
        for (const v of val) expect(v.etikett).not.toMatch(GILTIG)
      }
    }
  })

  it('"Frånvarande" lagras som anmäld (absent_valid) bara när deltagaren anmält i förväg — en faktaregel', () => {
    const franvaro = (p: Parameters<typeof narvaroValFor>[1]) => narvaroValFor('leverantor', p)[1].varde
    expect(franvaro({ attendance: null, absence_reason: null })).toBe('absent_invalid')
    expect(franvaro({ attendance: null, absence_reason: 'other' })).toBe('absent_valid')
    // Redan markerad frånvaro behåller sitt värde (konsulenten kan ha ändrat "anmäld").
    expect(franvaro({ attendance: 'absent_valid', absence_reason: null })).toBe('absent_valid')
    expect(franvaro({ attendance: 'absent_invalid', absence_reason: 'sick' })).toBe('absent_invalid')
  })

  it('kommunen behåller Här / Giltig / Ogiltig / Sjuk, även när regelverket är okänt', () => {
    for (const r of ['kommun', null, undefined] as const) {
      const val = narvaroValFor(r, { attendance: null })
      expect(val).toBe(NARVARO_STANDARDVAL)
      expect(val.map((v) => v.varde)).toEqual(['present', 'absent_valid', 'absent_invalid', 'sick_certified'])
      expect(val.map((v) => v.etikett)).toEqual(['Här', 'Giltig', 'Ogiltig', 'Sjuk'])
    }
  })

  it('leverantörens ord för varje värde och status är fakta', () => {
    for (const a of ALLA) expect(NARVARO_ETIKETT_LEVERANTOR[a]).not.toMatch(GILTIG)
    for (const ord of Object.values(STATUS_ORD_LEVERANTOR)) expect(ord).not.toMatch(GILTIG)
    expect(statusOrd('ogiltig', 'leverantor')).toBe('Frånvarande, inte anmäld')
    expect(statusOrd('ogiltig', 'kommun')).toBeUndefined()
  })
})

describe('KSL21 — Dagens pass', () => {
  const pass = (o: Record<string, unknown>) => ({
    id: 's1', participant_id: 'p1', plan_id: 'pl', date: idag, start_time: '09:00:00', end_time: '23:59:00',
    title: 'Verkstad', attendance: null, self_checkin_at: null, absence_reason: null, absence_note: null, ...o,
  })

  it('leverantör: väljer Frånvarande, kan kryssa i "Anmäld i förväg" — och ordet giltig syns aldrig', async () => {
    sessions = [pass({})]
    const { container } = render(
      <MemoryRouter><DagensPass namnFor={() => 'Dana Demo'} regelverkFor={() => 'leverantor'} /></MemoryRouter>,
    )
    const grupp = await screen.findByRole('radiogroup', { name: 'Närvaro för Dana Demo' })
    expect(within(grupp).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Närvarande', 'Frånvarande', 'Sjuk'])
    expect(container.textContent).not.toMatch(GILTIG)

    fireEvent.click(within(grupp).getByRole('radio', { name: /Frånvarande/ }))
    await waitFor(() => expect(api.markAttendance).toHaveBeenCalledWith('s1', { attendance: 'absent_invalid', regelverk: 'leverantor' }))

    const anmald = await screen.findByRole('checkbox', { name: /Anmäld i förväg/ })
    expect(anmald).not.toBeChecked()
    expect(screen.getByText(/Arbetsförmedlingen avgör/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(GILTIG)

    // Deltagaren ringde — det är fortfarande fakta.
    fireEvent.click(anmald)
    await waitFor(() => expect(api.sattFranvaroAnmald).toHaveBeenCalledWith('s1', true, 'leverantor'))
    expect(container.textContent).not.toMatch(GILTIG)
  })

  it('leverantör: en anmälan i förväg föreslås som "Frånvarande", inte som giltig', async () => {
    sessions = [pass({ absence_reason: 'other', absence_note: 'Tandläkaren' })]
    const { container } = render(
      <MemoryRouter><DagensPass namnFor={() => 'Dana Demo'} regelverkFor={() => 'leverantor'} /></MemoryRouter>,
    )
    expect(await screen.findByText(/Förslag: Frånvarande/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(GILTIG)
  })

  it('kommun: samma rad har kvar Giltig och Ogiltig', async () => {
    sessions = [pass({})]
    render(<MemoryRouter><DagensPass namnFor={() => 'Dana Demo'} regelverkFor={() => 'kommun'} /></MemoryRouter>)
    const grupp = await screen.findByRole('radiogroup', { name: 'Närvaro för Dana Demo' })
    expect(within(grupp).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Här', 'Giltig', 'Ogiltig', 'Sjuk'])
    fireEvent.click(within(grupp).getByRole('radio', { name: /^Ogiltig/ }))
    // Kommunens anrop är exakt som förut — inget regelverk följer med.
    await waitFor(() => expect(api.markAttendance).toHaveBeenCalledWith('s1', { attendance: 'absent_invalid' }))
    expect(screen.queryByRole('checkbox', { name: /Anmäld i förväg/ })).toBeNull()
  })
})

describe('KSL21 — passet i aktivitetsplanen', () => {
  const session = (o: Partial<ActivitySession>): ActivitySession => ({
    id: 's1', plan_id: 'pl', participant_id: 'p1', date: '2026-10-06', start_time: '09:00', end_time: '12:00',
    title: 'Verkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null, attendance_note: null,
    sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
  })
  const rita = (s: ActivitySession, regelverk: 'kommun' | 'leverantor') => render(
    <ConfirmDialogProvider>
      <ul>
        <PassRad session={s} allaPass={[s]} visaMarkning={false} regelverk={regelverk} onChanged={() => {}} onRemoved={() => {}} onSerieAndrad={() => {}} />
      </ul>
    </ConfirmDialogProvider>,
  )

  it('leverantör: inget läge av passet visar giltig/ogiltig', () => {
    for (const attendance of [null, ...ALLA]) {
      const { container, unmount } = rita(session({ attendance }), 'leverantor')
      expect(container.textContent).not.toMatch(GILTIG)
      unmount()
    }
  })

  it('leverantör: en markerad frånvaro har "Anmäld i förväg" och en rad för orsaken', async () => {
    const { container } = rita(session({ attendance: 'absent_invalid' }), 'leverantor')
    fireEvent.click(screen.getByRole('button', { name: 'Anteckning' }))
    const anmald = screen.getByRole('checkbox', { name: /Anmäld i förväg/ })
    expect(anmald).not.toBeChecked()
    expect(screen.getByText(/Orsak: vad hände\?/)).toBeInTheDocument()
    fireEvent.click(anmald)
    await waitFor(() => expect(api.sattFranvaroAnmald).toHaveBeenCalledWith('s1', true, 'leverantor'))
    expect(container.textContent).not.toMatch(GILTIG)
  })

  it('kommun: Giltig och Ogiltig finns kvar, ingen "Anmäld i förväg"', () => {
    rita(session({ attendance: 'absent_invalid' }), 'kommun')
    const grupp = screen.getByRole('radiogroup')
    expect(within(grupp).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Här', 'Giltig', 'Ogiltig', 'Sjuk'])
    fireEvent.click(screen.getByRole('button', { name: 'Anteckning' }))
    expect(screen.queryByRole('checkbox', { name: /Anmäld i förväg/ })).toBeNull()
  })
})

describe('KSL21 — det som går vidare till Arbetsförmedlingen och listorna', () => {
  const lev = (o: Record<string, unknown>) => ({
    id: 's', plan_id: 'pl', date: '2026-10-06', title: 'Verkstad', attendance: null, attendance_note: null,
    sick_certificate_received: false, activity_type: 'jobsearch' as const, is_provider_led: true, ...o,
  })

  it('avvikelserna säger datum, typ, anmäld/inte anmäld och orsak — aldrig "ogiltig"', () => {
    const rader = avvikelserader([
      lev({ id: 'a', attendance: 'absent_invalid' }),
      lev({ id: 'b', attendance: 'absent_valid', absence_reason: 'child_care', date: '2026-10-07' }),
    ] as never, '2026-10-01', '2026-10-31')
    expect(rader.map((r) => r.typ)).toEqual(['Frånvarande, inte anmäld i förväg', 'Frånvarande, anmäld i förväg'])
    const text = avvikelserSomText(rader, true)
    expect(text).toContain('2026-10-06 · Frånvarande, inte anmäld i förväg · Verkstad')
    expect(text).not.toMatch(GILTIG)
  })

  it('deltagarlistan och Min dag talar fakta för leverantören, giltig/ogiltig för kommunen', () => {
    const now = new Date()
    const klockan = '23:59'
    const pass = [
      { id: 'a', plan_id: 'pl', participant_id: 'p1', date: idag, start_time: '09:00', end_time: '10:00', title: 'Verkstad', activity_type: 'jobsearch', attendance: 'absent_invalid', attendance_note: null, self_checkin_at: null, absence_reason: null },
      { id: 'b', plan_id: 'pl', participant_id: 'p2', date: idag, start_time: '09:00', end_time: '10:00', title: 'Verkstad', activity_type: 'jobsearch', attendance: 'absent_valid', attendance_note: 'Ringde', self_checkin_at: null, absence_reason: null },
    ]
    const underlag = { planer: [{ id: 'pl', participant_id: 'p1', status: 'active', weekly_hours_target: 20 }, { id: 'pl2', participant_id: 'p2', status: 'active', weekly_hours_target: 20 }], pass } as never
    for (const pid of ['p1', 'p2']) {
      const lev = deltagarLage({ participantId: pid, underlag, idag, klockan, franvaroSomFakta: true })
      expect(`${lev.lage} ${lev.statusText ?? ''} ${lev.tillagg ?? ''}`).not.toMatch(GILTIG)
    }
    expect(deltagarLage({ participantId: 'p1', underlag, idag, klockan }).lage).toMatch(/^Ogiltig frånvaro/)

    const attGora = attGoraIdag({ deltagare: [{ participant_id: 'p1' }], pass: pass as never, idag: now, franvaroSomFakta: true })
    const personer = minDagPersoner({ attGora, bradskande: [], leverantor: null, moten: [], deadlines: [], kontakter: [], idag: now, franvaroSomFakta: true })
    const allt = personer.flatMap((p) => [radSammanfattning(p, true).lage, radSammanfattning(p, true).detalj ?? '', ...p.punkter.flatMap((x) => [x.lage, x.detalj ?? '', x.statusText ?? ''])]).join(' ')
    expect(allt).toContain('Frånvarande, inte anmäld')
    expect(allt).not.toMatch(GILTIG)
    // Kommunen: oförändrat.
    const kommun = minDagPersoner({ attGora: attGoraIdag({ deltagare: [{ participant_id: 'p1' }], pass: pass as never, idag: now }), bradskande: [], leverantor: null, moten: [], deadlines: [], kontakter: [], idag: now })
    expect(kommun[0].punkter[0].detalj).toMatch(/Ogiltig frånvaro/)
  })
})

describe('KSL21 — deltagarens text', () => {
  it('R&M-deltagaren får veta att Arbetsförmedlingen avgör, på alla tre språken, utan "giltig"', () => {
    const lasa = (j: Record<string, unknown>, vag: string) => vag.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], j) as string
    for (const j of [sv, en, svLatt] as Array<Record<string, unknown>>) {
      const text = lasa(j, 'minVecka.franvaro.bedomningLeverantor')
      expect(text).toMatch(/Arbetsförmedlingen/)
      expect(text).not.toMatch(/giltig|valid/i)
      expect(lasa(j, 'minVecka.narvaro.absent_validLeverantor')).not.toMatch(/giltig|valid/i)
      expect(lasa(j, 'minVecka.remsa.franvaroAnmald')).not.toMatch(/giltig|valid/i)
    }
    // Kommunens text står kvar.
    expect(lasa(sv as Record<string, unknown>, 'minVecka.franvaro.bedomning')).toMatch(/konsulent som avgör/)
  })
})
