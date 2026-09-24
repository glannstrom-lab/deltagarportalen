/**
 * Dagens milstolpar, uppföljningar och kalenderhändelser hör till "kommande".
 *
 * Före 2026-09-24 jämfördes `new Date('2026-09-24') >= now`. Ett datum ur en
 * date-kolumn blir då UTC-midnatt — kl. 02:00 i Sverige sommartid — så efter
 * 02:00 räknades dagens poster som passerade: de föll ur påminnelselistan och
 * dagens nätverksuppföljning synkades aldrig till kalendern.
 *
 * Tidszonen låses till Europe/Stockholm och klockan till 10:00 lokal tid.
 * Fixturerna har prod-formen: `target_date`, `next_contact_date` och
 * `calendar_events.date` är alla `date` (YYYY-MM-DD) i prod.
 */
process.env.TZ = 'Europe/Stockholm'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { getEventsMock, createEventMock, getActiveMock, getAllContactsMock } = vi.hoisted(() => ({
  getEventsMock: vi.fn(),
  createEventMock: vi.fn(async (e: Record<string, unknown>) => ({ ...e, id: '00000000-0000-4000-8000-000000000001' })),
  getActiveMock: vi.fn(),
  getAllContactsMock: vi.fn(),
}))

vi.mock('./cloudStorage', () => ({
  calendarApi: { createEvent: createEventMock, getEvents: getEventsMock },
}))
vi.mock('./careerApi', () => ({
  careerPlanApi: { getActive: getActiveMock },
  networkApi: { getAll: getAllContactsMock },
}))

import { getAggregatedReminders, syncNetworkFollowupsToCalendar } from './calendarIntegration'

beforeEach(() => {
  vi.useFakeTimers()
  // 2026-09-24 10:00 lokal tid (08:00 UTC, sommartid).
  vi.setSystemTime(new Date('2026-09-24T08:00:00Z'))
  createEventMock.mockClear()
  getActiveMock.mockResolvedValue({
    milestones: [
      { id: 'm-idag', title: 'Skicka tre ansökningar', is_completed: false, target_date: '2026-09-24', description: null },
      { id: 'm-igar', title: 'Uppdatera CV', is_completed: false, target_date: '2026-09-23', description: null },
    ],
  })
  getAllContactsMock.mockResolvedValue([
    { id: 'c-idag', name: 'Anna Andersson', company: 'Lagret AB', next_contact_date: '2026-09-24' },
  ])
  getEventsMock.mockResolvedValue([
    { id: 'e-idag', title: 'Intervju', date: '2026-09-24', time: '14:00', type: 'interview', description: null },
    { id: 'e-imorgon', title: 'Möte med handledare', date: '2026-09-25', time: '09:00', type: 'meeting', description: null },
  ])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getAggregatedReminders', () => {
  it('tar med dagens milstolpe, uppföljning och kalenderhändelse — men inte gårdagens', async () => {
    const ids = (await getAggregatedReminders(7)).map(r => r.id)
    expect(ids).toContain('milestone-m-idag')
    expect(ids).toContain('network-c-idag')
    expect(ids).toContain('calendar-e-idag')
    expect(ids).not.toContain('milestone-m-igar')
  })

  it('räknar dagar i kalenderdagar: morgondagens möte är 1 dag bort, inte 0', async () => {
    const moten = (await getAggregatedReminders(7)).filter(r => r.id === 'calendar-e-imorgon')
    expect(moten).toHaveLength(1)
    // prioritet 'medium' = daysUntil <= 1; med floor på millisekunder blev
    // det 0, och händelsen hade ändå varit 'medium' — kontrollera därför
    // datumet, som ska vara lokal midnatt den 25:e.
    expect(moten[0].dueDate.getFullYear()).toBe(2026)
    expect(moten[0].dueDate.getMonth()).toBe(8)
    expect(moten[0].dueDate.getDate()).toBe(25)
    expect(moten[0].dueDate.getHours()).toBe(0)
  })
})

describe('syncNetworkFollowupsToCalendar', () => {
  it('synkar en uppföljning som gäller idag', async () => {
    getEventsMock.mockResolvedValue([])
    const utfall = await syncNetworkFollowupsToCalendar()
    expect(utfall).toEqual({ synced: 1, errors: 0 })
    expect(createEventMock).toHaveBeenCalledTimes(1)
  })

  it('skapar ingenting när kalendern inte gick att läsa — ett läsfel är ingen tom kalender', async () => {
    getEventsMock.mockRejectedValue(Object.assign(new Error('hämta kalenderhändelser'), { name: 'LagringsFel' }))
    const utfall = await syncNetworkFollowupsToCalendar()
    expect(createEventMock).not.toHaveBeenCalled()
    expect(utfall.synced).toBe(0)
  })
})
