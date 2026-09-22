/**
 * HealthTab — ett fel i humörsviten får inte sudda ut dagens humör.
 *
 * `moodApi.getStreak()` kastar vid fel sedan 2026-09-22 (en nolla ljög om
 * att sviten var bruten). Den låg i samma Promise.all som dagens humör och
 * välmåendedatan — utan fångst fällde ett svitfel hela laddningen, och sidan
 * sa "logga ditt humör" till någon som redan gjort det.
 *
 * Mutation: ta bort `.catch(() => null)` på getStreak i loadData → testet faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/services/cloudStorage', () => ({
  moodApi: {
    getTodaysMood: vi.fn().mockResolvedValue({ mood: 'good', note: '' }),
    getStreak: vi.fn().mockRejectedValue(new Error('timeout')),
    logMood: vi.fn(),
  },
  wellnessDataApi: { get: vi.fn().mockResolvedValue(null), save: vi.fn() },
}))

import HealthTab from './HealthTab'

describe('HealthTab', () => {
  it('visar dagens humör även när sviten inte gick att hämta', async () => {
    render(<HealthTab />)
    expect(await screen.findByText('Du har loggat ditt humör idag')).toBeInTheDocument()
  })
})
