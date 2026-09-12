/**
 * UnderlagDialog (F10) — det som lämnas till handläggaren är det som visas,
 * och ingenting går att skicka utan mottagare eller utan pass i perioden.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup } from '@testing-library/react'
import { render } from '@/test/utils'
import { UnderlagDialog } from './UnderlagDialog'

vi.mock('@/services/aktivitetApi', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/services/aktivitetApi')>()
  return {
    ...orig,
    underlagApi: { lamna: vi.fn(), angra: vi.fn(), list: vi.fn() },
  }
})
vi.mock('@/lib/toast', () => ({ notifications: { success: vi.fn(), error: vi.fn() } }))

const plan = { id: 'plan1', participant_id: 'p1', org_id: 'org1', start_date: '2026-10-01' }
const pass = (date: string, attendance: string | null, extra: Record<string, unknown> = {}) => ({ date, attendance, ...extra })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 10, 0, 0)) // 20 okt 2026
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('UnderlagDialog — lämna', () => {
  it('räknar närvaron i perioden ur passen och visar den innan något skickas', async () => {
    render(
      <UnderlagDialog
        lage="lamna"
        plan={plan}
        sessions={[
          pass('2026-10-05', 'present'), pass('2026-10-06', 'absent_invalid'), pass('2026-10-07', null, { absence_reported_at: '2026-10-06T10:00:00Z' }),
          pass('2026-09-28', 'present'), // före perioden — räknas inte
        ] as never}
        onClose={vi.fn()}
        onSparat={vi.fn()}
      />,
    )
    // Perioden defaultar till innevarande månad (1–20 okt)
    expect(screen.getByRole('status')).toHaveTextContent(/3 pass: 1 närvarande, 0 giltig frånvaro, 1 ogiltig frånvaro/)
    expect(screen.getByRole('status')).toHaveTextContent(/1 ej markerade, 1 anmälda i förväg/)
  })

  it('går inte att skicka utan mottagare, och skickar sammanfattningen när mottagaren finns', async () => {
    const { underlagApi } = await import('@/services/aktivitetApi')
    vi.mocked(underlagApi.lamna).mockResolvedValue({ id: 'h1', recipient: 'Anna', handed_over_at: '2026-10-20T08:00:00Z', withdrawn_at: null } as never)
    const onSparat = vi.fn()
    render(<UnderlagDialog lage="lamna" plan={plan} sessions={[pass('2026-10-05', 'present')] as never} onClose={vi.fn()} onSparat={onSparat} />)

    const skicka = screen.getByRole('button', { name: 'Markera som lämnat' })
    expect(skicka).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Mottagare/), { target: { value: 'Anna Andersson, Försörjningsstöd' } })
    expect(skicka).toBeEnabled()
    fireEvent.click(skicka)

    await vi.waitFor(() => expect(underlagApi.lamna).toHaveBeenCalledTimes(1))
    const arg = vi.mocked(underlagApi.lamna).mock.calls[0][0]
    expect(arg.recipient).toBe('Anna Andersson, Försörjningsstöd')
    expect(arg.period_from).toBe('2026-10-01')
    expect(arg.period_to).toBe('2026-10-20')
    expect(arg.summary).toMatchObject({ pass: 1, present: 1, absent_invalid: 0 })
    await vi.waitFor(() => expect(onSparat).toHaveBeenCalledTimes(1))
  })

  it('går inte att skicka när perioden saknar pass — säger det i stället för att lämna ett tomt underlag', () => {
    render(<UnderlagDialog lage="lamna" plan={plan} sessions={[pass('2026-11-05', 'present')] as never} onClose={vi.fn()} onSparat={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Mottagare/), { target: { value: 'Anna' } })
    expect(screen.getByRole('status')).toHaveTextContent(/Inga pass i perioden/)
    expect(screen.getByRole('button', { name: 'Markera som lämnat' })).toBeDisabled()
  })
})

describe('UnderlagDialog — ångra', () => {
  it('kräver ett skäl och skickar det', async () => {
    const { underlagApi } = await import('@/services/aktivitetApi')
    vi.mocked(underlagApi.angra).mockResolvedValue({ id: 'h1', withdrawn_at: '2026-10-20T09:00:00Z', withdrawn_reason: 'Fel period' } as never)
    const onSparat = vi.fn()
    render(
      <UnderlagDialog
        lage="angra"
        underlag={{ id: 'h1', handed_over_at: '2026-10-20T08:00:00Z', withdrawn_at: null } as never}
        onClose={vi.fn()}
        onSparat={onSparat}
      />,
    )
    const knapp = screen.getByRole('button', { name: 'Ångra underlaget' })
    expect(knapp).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Varför ångras/), { target: { value: 'Fel period' } })
    fireEvent.click(knapp)
    await vi.waitFor(() => expect(underlagApi.angra).toHaveBeenCalledWith('h1', 'Fel period'))
    await vi.waitFor(() => expect(onSparat).toHaveBeenCalledTimes(1))
  })
})
