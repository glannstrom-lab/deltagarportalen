/**
 * MoodTab — F21 (WCAG 4.1.2): humörkalenderns månadsnavigering
 * (prev/next) var två namnlösa ikonknappar (docs/portal-review-2026-08-09.md
 * fynd 5 / ROADMAP F21).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

const logMood = vi.fn()
const retry = vi.fn()
const lage = { isError: false }
vi.mock('@/hooks/useDiary', () => ({
  useMoodLogs: () => ({
    logs: [],
    todayMood: null,
    stats: { averageMood: null, averageEnergy: null, totalLogs: 0 },
    logMood,
    isLoading: false,
    isError: lage.isError,
    retry,
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

/**
 * 2026-09-22 — tre lägen och ärliga tal:
 *  · Ett läsfel visade flikarna som om inget loggats. TodayLogger startade då
 *    på 3/3/3/3, och "Spara" skrev över dagens riktiga rad (upsert).
 *  · logMood returnerar null när databasen nekar — "Sparat!" visades ändå.
 *  · Snittet utan underlag visades som "0.0/5".
 * Mutationer (kontrollerade): ta bort `if (isError)` → test 1 faller; ta bort
 * `if (!rad) { setSparfel… }` → test 2 faller; visa `(snitt ?? 0).toFixed(1)` utan
 * null-koll → test 3 faller.
 */
describe('MoodTab — laddar / fel / klart', () => {
  beforeEach(() => {
    lage.isError = false
    logMood.mockReset()
    retry.mockReset()
  })

  it('läsfel: ett fel med "Försök igen" — inget formulär som kan skriva över dagens rad', () => {
    lage.isError = true
    render(<MoodTab />)
    expect(screen.getByRole('alert')).toHaveTextContent(/kunde inte hämta din dagbok/i)
    expect(screen.queryByRole('button', { name: /spara dagens humör/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))
    expect(retry).toHaveBeenCalled()
  })

  it('nekad sparning säger det — visar inte "Sparat"', async () => {
    logMood.mockResolvedValue(null)
    render(<MoodTab />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /spara dagens humör/i }))
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/gick inte att spara/i)
  })

  it('utan loggar visas snittet som —, inte 0.0', () => {
    render(<MoodTab />)
    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })
})
