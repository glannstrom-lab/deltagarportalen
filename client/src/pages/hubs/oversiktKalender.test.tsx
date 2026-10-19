/**
 * DL4 (demogenomgången 2026-10-19): Annas Översikt sa "Kalender: inget inbokat"
 * med möte i morgon kl 12 och pass hela veckan — raden läste bara
 * `calendar_events`. Nu räknas möte med konsulenten och pass i planen också.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OversiktPanel from './OversiktPanel'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import type { MinVardagSummary } from '@/hooks/hubSummaryTypes'
import { nastaIKalendern } from './oversiktKalender'

afterEach(cleanup)

const VARDAG: MinVardagSummary = {
  recentMoodLogs: [],
  diaryEntryCount: 0,
  latestDiaryEntry: null,
  upcomingEvents: [],
  networkContactsCount: 0,
  consultant: null,
}

const iMorgonKl12 = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(12, 0, 0, 0)
  return d
}

describe('kalenderraden på Översikt', () => {
  it('visar mötet med konsulenten i stället för "inget inbokat"', () => {
    const summary = { minVardag: { ...VARDAG, nastaMote: { id: 'm1', scheduled_at: iMorgonKl12().toISOString() } } }
    render(
      <MemoryRouter>
        <OversiktPanel summary={summary as unknown as OversiktSummary} tillstand="klart" />
      </MemoryRouter>
    )
    expect(screen.queryByText('inget inbokat')).toBeNull()
    expect(screen.getByText('Möte med din konsulent')).toBeTruthy()
  })

  it('väljer det som ligger närmast — passet före mötet samma dag', () => {
    const d = iMorgonKl12()
    const datum = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const post = nastaIKalendern(
      {
        ...VARDAG,
        nastaMote: { id: 'm1', scheduled_at: d.toISOString() },
        nastaPass: { id: 'p1', title: 'Motivationsgrupp', date: datum, start_time: '09:00:00' },
      },
      'Möte med din konsulent'
    )
    expect(post).toEqual({ titel: 'Motivationsgrupp', datum, till: '/min-vecka' })
  })

  it('en egen kalenderhändelse tidigare vinner och leder till kalendern', () => {
    const post = nastaIKalendern(
      {
        ...VARDAG,
        upcomingEvents: [{ id: 'e', title: 'Tandläkare', date: '2026-10-19', time: '08:00', type: null }],
        nastaPass: { id: 'p1', title: 'Motivationsgrupp', date: '2026-10-20', start_time: '09:00:00' },
      },
      'Möte'
    )
    expect(post?.till).toBe('/calendar')
  })

  it('ingenting inbokat är fortfarande ingenting', () => {
    expect(nastaIKalendern(VARDAG, 'Möte')).toBeNull()
  })
})
