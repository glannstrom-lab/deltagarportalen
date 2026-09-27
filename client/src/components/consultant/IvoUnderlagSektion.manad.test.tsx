/**
 * IvoUnderlagSektion — månadsunderlag per stödmånad (RK39, rollspelet 2026-09-27).
 * Bara planer som gällde någon dag i den valda månaden går att välja, och
 * knappen tar fram underlaget för just den planen och månaden.
 *
 * Motprov (körda): (1) ta bort månadsfiltret på planerna → "en plan som
 * slutade före månaden"-testet faller. (2) skicka `manader[0]` i stället för
 * vald månad → nedladdningstestet faller.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const m = vi.hoisted(() => ({ laddaNer: vi.fn() }))

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: { listAll: vi.fn(), listSessionsBetween: vi.fn(async () => []), update: vi.fn() },
  underlagApi: { listIPeriod: vi.fn(async () => []) },
  sammanfattaNarvaro: vi.fn(),
  FORSORJNINGSHINDER: ['arbetslos'],
  FORSORJNINGSHINDER_ETIKETT: { arbetslos: 'Arbetslös' },
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({
  fetchCachedConsultantParticipants: vi.fn(async () => [
    { participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson' },
    { participant_id: 'p2', first_name: 'Bo', last_name: 'Bengtsson' },
  ]),
}))
vi.mock('@/services/manadsunderlagPdf', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/manadsunderlagPdf')>('@/services/manadsunderlagPdf')
  return { ...faktisk, laddaNerManadsunderlag: m.laddaNer }
})

import { IvoUnderlagSektion } from './IvoUnderlagSektion'

const plan = (o: Record<string, unknown>) => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, start_date: '2026-09-01', end_date: null,
  weekly_hours_target: 11, jobsearch_hours_per_week: 3, status: 'active', forsorjningshinder: 'arbetslos', created_at: '', updated_at: '', ...o,
})

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0)) // 12 nov 2026
  const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
  vi.mocked(aktivitetsplanApi.listAll).mockResolvedValue([
    plan({}),
    plan({ id: 'plan2', participant_id: 'p2', start_date: '2026-06-01', end_date: '2026-09-30', status: 'ended' }),
  ] as never)
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

function rita() {
  return render(<QueryClientProvider client={new QueryClient()}><IvoUnderlagSektion /></QueryClientProvider>)
}

describe('Månadsunderlag per stödmånad', () => {
  it('tar fram underlaget för vald deltagare och kalendermånad', async () => {
    m.laddaNer.mockResolvedValue(undefined)
    rita()
    const manad = await screen.findByLabelText('Stödmånad')
    fireEvent.change(manad, { target: { value: '2026-10' } })
    fireEvent.change(screen.getByLabelText('Deltagare'), { target: { value: 'plan1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ladda ner månadsunderlag (PDF)' }))
    await waitFor(() => expect(m.laddaNer).toHaveBeenCalledTimes(1))
    expect(m.laddaNer.mock.calls[0][0]).toMatchObject({ ym: '2026-10', participantName: 'Anna Andersson', plan: { id: 'plan1' } })
  })

  it('en plan som slutade före månaden går inte att välja', async () => {
    rita()
    const manad = await screen.findByLabelText('Stödmånad')
    fireEvent.change(manad, { target: { value: '2026-10' } })
    const val = Array.from((screen.getByLabelText('Deltagare') as HTMLSelectElement).options).map((o) => o.textContent)
    expect(val.some((t) => t?.startsWith('Anna Andersson'))).toBe(true)
    expect(val.some((t) => t?.startsWith('Bo Bengtsson'))).toBe(false)
    // I september gällde Bos plan fortfarande
    fireEvent.change(manad, { target: { value: '2026-09' } })
    const sep = Array.from((screen.getByLabelText('Deltagare') as HTMLSelectElement).options).map((o) => o.textContent)
    expect(sep.some((t) => t?.startsWith('Bo Bengtsson'))).toBe(true)
  })

  it('knappen är avstängd tills en deltagare är vald, och ett fel visas i klartext', async () => {
    m.laddaNer.mockRejectedValue(new Error('timeout'))
    rita()
    const knapp = await screen.findByRole('button', { name: 'Ladda ner månadsunderlag (PDF)' })
    expect(knapp).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Deltagare'), { target: { value: 'plan1' } })
    fireEvent.click(knapp)
    expect(await screen.findByRole('alert')).toHaveTextContent('Månadsunderlaget kunde inte tas fram: timeout')
  })
})
