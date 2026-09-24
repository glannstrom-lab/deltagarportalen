/**
 * CalendarSync räknade "dagar kvar" med floor över millisekunder mot
 * klockslaget nu. Påminnelsernas datum är lokal midnatt, så klockan 10:00
 * blev dagens sak -10 h → "Försenad" och morgondagens +14 h → "Idag".
 * Testet låser tidszonen till Stockholm och klockan till 10:00 lokal tid.
 */
process.env.TZ = 'Europe/Stockholm'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { AggregatedReminder } from '@/services/calendarIntegration'

const { getAggregatedReminders } = vi.hoisted(() => ({
  getAggregatedReminders: vi.fn(),
}))

vi.mock('@/services/calendarIntegration', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/services/calendarIntegration')>()
  return {
    ...orig,
    calendarIntegration: {
      ...orig.calendarIntegration,
      getAggregatedReminders,
    },
  }
})

import { CalendarSync } from './CalendarSync'

const paminnelse = (id: string, title: string, dueDate: Date): AggregatedReminder => ({
  id,
  title,
  description: '',
  dueDate,
  source: 'milestone',
  priority: 'medium',
} as AggregatedReminder)

describe('CalendarSync — förfallodag i lokala kalenderdagar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // 2026-03-10 10:00 lokal tid i Stockholm (CET, UTC+1)
    vi.setSystemTime(new Date(2026, 2, 10, 10, 0, 0))
  })
  afterEach(() => {
    vi.useRealTimers()
    getAggregatedReminders.mockReset()
  })

  it('visar dagens sak som "Idag" och morgondagens som "Imorgon" klockan 10:00', async () => {
    expect(new Date().getTimezoneOffset()).toBe(-60) // tidszonen tog
    getAggregatedReminders.mockResolvedValue([
      paminnelse('a', 'Dagens', new Date(2026, 2, 10)),
      paminnelse('b', 'Morgondagens', new Date(2026, 2, 11)),
      paminnelse('c', 'Om tre', new Date(2026, 2, 13)),
      paminnelse('d', 'Igår', new Date(2026, 2, 9)),
    ])

    render(
      <MemoryRouter>
        <CalendarSync showSync={false} />
      </MemoryRouter>
    )

    expect(await screen.findByText('Idag')).toBeInTheDocument()
    expect(screen.getByText('Imorgon')).toBeInTheDocument()
    expect(screen.getByText('Om 3 dagar')).toBeInTheDocument()
    expect(screen.getAllByText('Försenad')).toHaveLength(1)
  })
})
