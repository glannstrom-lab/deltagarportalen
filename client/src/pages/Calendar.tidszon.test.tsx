/**
 * Kalendern mellan midnatt och 02 svensk tid.
 *
 * `new Date().toISOString()` ger UTC-datumet. 00:30 svensk sommartid är det
 * fortfarande gårdagen i UTC — så "idag"-markeringen stod på fel dag, och
 * dagvyn (som slår upp händelser med `toISOString`) visade gårdagens
 * händelser i stället för dagens. Sidan håller nu `currentDate` på lokal
 * middag, så varje ISO-uppslag nedströms hamnar på rätt datum.
 *
 * Mutation: återställ `isToday` till `toISOString().split('T')[0]` → första
 * testet faller. Återställ `useState(new Date())` → andra testet faller.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@/test/utils'

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
    <div>{actions}{children}</div>
  ),
}))
vi.mock('@/components/focus/shell/FokusVaxel', () => ({
  FokusVaxel: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ leaveWizard: vi.fn() }),
}))
vi.mock('@/components/focus/pages/FocusCalendarWizard', () => ({ FocusCalendarWizard: () => null }))
vi.mock('@/components/radgivare/RadgivarPanel', () => ({ RadgivarTips: () => null }))
vi.mock('@/components/calendar/EventModal', () => ({ EventModal: () => null }))

const getEvents = vi.fn()
vi.mock('@/services/cloudStorage', () => ({
  calendarApi: {
    getEvents: (...a: unknown[]) => getEvents(...a),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  },
}))

import Calendar from './Calendar'

const ursprungligTz = process.env.TZ

beforeAll(() => {
  process.env.TZ = 'Europe/Stockholm'
})
afterAll(() => {
  process.env.TZ = ursprungligTz
})

beforeEach(() => {
  // 2026-09-22 00:30 svensk tid = 2026-09-21 22:30 UTC
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-21T22:30:00Z') })
  getEvents.mockResolvedValue([
    { id: 'e1', title: 'Möte idag', date: '2026-09-22', time: '10:00', type: 'meeting' },
    { id: 'e2', title: 'Möte igår', date: '2026-09-21', time: '10:00', type: 'meeting' },
  ])
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('Kalendern strax efter midnatt', () => {
  it('markerar den lokala dagen som idag i månadsvyn, inte UTC-dagen', async () => {
    render(<Calendar />)
    const idag = await screen.findByRole('button', { current: 'date' })
    expect(idag.textContent).toMatch(/^22/)
  })

  it('dagvyn visar dagens händelser, inte gårdagens', async () => {
    render(<Calendar />)
    fireEvent.click(await screen.findByRole('tab', { name: /^(dag|day)$/i }))
    expect(await screen.findByText('Möte idag')).toBeInTheDocument()
    expect(screen.queryByText('Möte igår')).not.toBeInTheDocument()
  })

  it('knappen för ny händelse har ett namn även när texten är dold på mobil', async () => {
    render(<Calendar />)
    await screen.findByRole('tab', { name: /^(dag|day)$/i })
    // Texten i knappen har `hidden sm:inline`; utan aria-label är knappen namnlös på mobil
    const knappar = screen.getAllByRole('button').filter(b => b.getAttribute('aria-label'))
    expect(knappar.some(b => /ny|new/i.test(b.getAttribute('aria-label') ?? ''))).toBe(true)
  })
})
