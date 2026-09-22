/**
 * Regression (2026-09-22): `createEventFromMilestone` och
 * `createEventFromNetworkFollowup` byggde ett `Partial<CalendarEvent>`
 * (camelCase: `endTime`, `with`, `createdAt`, `updatedAt` —
 * services/calendarData.ts) och skickade det rakt in i
 * `calendarApi.createEvent`, som tar `CalendarEventData` (SNAKE_CASE:
 * `end_time`, `with_person` — services/cloud/kalender.ts). `endTime`/`with`
 * nådde alltså aldrig databasen under rätt kolumnnamn — inte en NULL-rad,
 * bara data som aldrig sparades. Reachable via career-planens "synka till
 * kalender" (PlanTab.tsx → CalendarSync.tsx).
 */
import { describe, it, expect, vi } from 'vitest'

const { createEventMock } = vi.hoisted(() => ({
  createEventMock: vi.fn(async (event: unknown) => ({ id: 'e1', ...(event as object) })),
}))

vi.mock('./cloudStorage', () => ({
  calendarApi: { createEvent: createEventMock, getEvents: vi.fn(async () => []) },
}))

import { createEventFromMilestone, createEventFromNetworkFollowup } from './calendarIntegration'
import type { CareerMilestone } from './careerApi'
import type { NetworkContact } from './careerApi'

describe('createEventFromMilestone', () => {
  it('skickar snake_case-fält (end_time) till calendarApi.createEvent, inte camelCase (endTime)', async () => {
    const milestone: CareerMilestone = {
      id: 'm1',
      plan_id: 'p1',
      user_id: 'u1',
      title: 'Skicka ansökan',
      description: 'Beskrivning',
      steps: [],
      progress: 0,
      is_completed: false,
      sort_order: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      target_date: '2026-10-01',
    }

    await createEventFromMilestone(milestone)

    expect(createEventMock).toHaveBeenCalledTimes(1)
    const payload = createEventMock.mock.calls[0][0] as Record<string, unknown>

    expect(payload.end_time).toBe('10:00')
    expect(payload).not.toHaveProperty('endTime')
    expect(payload).not.toHaveProperty('createdAt')
    expect(payload).not.toHaveProperty('updatedAt')
    expect(payload.title).toBe('Skicka ansökan')
    expect(payload.date).toBe('2026-10-01')
  })
})

describe('createEventFromNetworkFollowup', () => {
  it('skickar snake_case-fält (with_person) till calendarApi.createEvent, inte camelCase (with)', async () => {
    const contact: NetworkContact = {
      id: 'c1',
      user_id: 'u1',
      name: 'Anna Andersson',
      relationship: 'colleague',
      status: 'active',
      tags: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      next_contact_date: '2026-10-05',
    } as NetworkContact

    await createEventFromNetworkFollowup(contact)

    expect(createEventMock).toHaveBeenCalledTimes(1)
    const payload = createEventMock.mock.calls[0][0] as Record<string, unknown>

    expect(payload.with_person).toBe('Anna Andersson')
    expect(payload.end_time).toBe('10:30')
    expect(payload).not.toHaveProperty('with')
    expect(payload).not.toHaveProperty('endTime')
    expect(payload).not.toHaveProperty('createdAt')
    expect(payload).not.toHaveProperty('updatedAt')
  })
})
