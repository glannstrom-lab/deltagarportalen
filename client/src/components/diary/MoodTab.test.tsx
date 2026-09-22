/**
 * MoodTab — F21 (WCAG 4.1.2): humörkalenderns månadsnavigering
 * (prev/next) var två namnlösa ikonknappar (docs/portal-review-2026-08-09.md
 * fynd 5 / ROADMAP F21).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

const logMood = vi.fn()
vi.mock('@/hooks/useDiary', () => ({
  useMoodLogs: () => ({
    logs: [],
    todayMood: null,
    stats: { averageMood: 0, averageEnergy: 0, totalLogs: 0 },
    logMood,
    isLoading: false,
  }),
}))

import { MoodTab } from './MoodTab'

describe('F21: MoodTab månadsnavigering har tillgängliga namn', () => {
  it('föregående/nästa månad-knapparna har aria-label, inte bara en pilikon', () => {
    render(<MoodTab />)
    expect(screen.getByRole('button', { name: /föregående månad/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nästa månad/i })).toBeInTheDocument()
  })
})

/**
 * 2026-09-22: humöret sparades med `log_date = toISOString().split('T')[0]` —
 * UTC-datumet. Mellan 00 och 02 svensk tid är det gårdagen: kvällens loggning
 * efter midnatt skrev över gårdagens rad, medan `moodLogsApi.getToday()` (som
 * redan räknar lokalt) inte hittade någon rad för idag. Mutation: återställ
 * `formatLocalDate(new Date())` i handleSave → testet faller.
 */
describe('MoodTab sparar på den lokala dagen', () => {
  it('00:30 svensk tid sparas som idag, inte igår', async () => {
    const tz = process.env.TZ
    process.env.TZ = 'Europe/Stockholm'
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-21T22:30:00Z') })
    try {
      logMood.mockResolvedValue(undefined)
      render(<MoodTab />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /spara dagens humör/i }))
      })
      expect(logMood).toHaveBeenCalledWith(expect.objectContaining({ log_date: '2026-09-22' }))
    } finally {
      vi.useRealTimers()
      process.env.TZ = tz
    }
  })
})
