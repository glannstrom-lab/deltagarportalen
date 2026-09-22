/**
 * "Synka till kalender" (karriärplanen → CalendarSync.tsx) får inte skapa
 * dubbletter.
 *
 * Synken letade efter befintliga händelser med id `milestone-<id>`, men
 * `calendar_events.id` är en uuid som databasen sätter (verifierat i prod
 * 2026-09-22: `data_type = uuid`, och `createEvent` skickar aldrig med id).
 * Inget id matchade någonsin, så varje klick skapade allt en gång till — och
 * påminnelselistan visade varje synkad milstolpe två gånger.
 *
 * Mocken av kalendern beter sig som den riktiga: den ger varje ny händelse
 * en uuid och lämnar tillbaka händelserna i `getEvents`-form (camelCase).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { lagrade, createEventMock, getEventsMock, getActiveMock, getAllContactsMock } = vi.hoisted(() => {
  const lagrade: Record<string, unknown>[] = []
  return {
    lagrade,
    createEventMock: vi.fn(async (e: Record<string, unknown>) => {
      // Som databasen: id:t som skickas in ignoreras, en uuid sätts.
      const rad = { ...e, id: `00000000-0000-4000-8000-${String(lagrade.length).padStart(12, '0')}` }
      lagrade.push(rad)
      return rad
    }),
    getEventsMock: vi.fn(async () =>
      lagrade.map(r => ({ id: r.id, title: r.title, date: r.date, time: r.time, type: r.type, description: r.description }))
    ),
    getActiveMock: vi.fn(),
    getAllContactsMock: vi.fn(),
  }
})

vi.mock('./cloudStorage', () => ({
  calendarApi: { createEvent: createEventMock, getEvents: getEventsMock },
}))
vi.mock('./careerApi', () => ({
  careerPlanApi: { getActive: getActiveMock },
  networkApi: { getAll: getAllContactsMock },
}))

import {
  syncMilestonesToCalendar,
  syncNetworkFollowupsToCalendar,
  getAggregatedReminders,
} from './calendarIntegration'

const omDagar = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

beforeEach(() => {
  lagrade.length = 0
  createEventMock.mockClear()
  getActiveMock.mockResolvedValue({
    milestones: [
      { id: 'm1', title: 'Skicka tre ansökningar', is_completed: false, target_date: omDagar(3), description: null },
    ],
  })
  getAllContactsMock.mockResolvedValue([
    { id: 'c1', name: 'Anna Andersson', company: 'Lagret AB', next_contact_date: omDagar(2) },
  ])
})

describe('synken skapar inga dubbletter', () => {
  it('andra synken av samma milstolpe skapar ingenting', async () => {
    const forsta = await syncMilestonesToCalendar()
    const andra = await syncMilestonesToCalendar()
    expect(forsta.synced).toBe(1)
    expect(andra.synced).toBe(0)
    expect(lagrade).toHaveLength(1)
  })

  it('andra synken av samma nätverksuppföljning skapar ingenting', async () => {
    await syncNetworkFollowupsToCalendar()
    const andra = await syncNetworkFollowupsToCalendar()
    expect(andra.synced).toBe(0)
    expect(lagrade).toHaveLength(1)
  })

  it('en ny milstolpe synkas fortfarande efter en tidigare synk', async () => {
    await syncMilestonesToCalendar()
    getActiveMock.mockResolvedValue({
      milestones: [
        { id: 'm1', title: 'Skicka tre ansökningar', is_completed: false, target_date: omDagar(3), description: null },
        { id: 'm2', title: 'Ring Anna', is_completed: false, target_date: omDagar(4), description: null },
      ],
    })
    const andra = await syncMilestonesToCalendar()
    expect(andra.synced).toBe(1)
    expect(lagrade).toHaveLength(2)
  })
})

describe('påminnelselistan visar varje sak en gång', () => {
  it('en synkad milstolpe och uppföljning syns inte dubbelt via kalendern', async () => {
    await syncMilestonesToCalendar()
    await syncNetworkFollowupsToCalendar()
    const paminnelser = await getAggregatedReminders(7)
    const titlar = paminnelser.map(p => p.title).sort()
    expect(titlar).toEqual(['Följ upp: Anna Andersson', 'Skicka tre ansökningar'])
  })

  it('en vanlig kalenderhändelse visas fortfarande', async () => {
    lagrade.push({ id: 'x', title: 'Intervju på Lagret AB', date: omDagar(1), time: '09:00', type: 'interview' })
    const paminnelser = await getAggregatedReminders(7)
    expect(paminnelser.map(p => p.title)).toContain('Intervju på Lagret AB')
  })
})
