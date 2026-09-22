/**
 * Pauspåminnelsen ska komma till den som faktiskt arbetar.
 *
 * Före 2026-09-22 låg senaste aktivitetstid i state och i räkneintervallets
 * beroenden. Varje musrörelse eller tangenttryckning startade om intervallet,
 * och ett intervall som startas om oftare än en gång i sekunden tickar aldrig —
 * räknaren stod still så länge användaren var aktiv. Påminnelsen som
 * Lugnare läge lovar kom alltså aldrig till någon som skrev eller rörde musen.
 *
 * Mutation: lägg tillbaka `lastActiveTime` som state i intervallets beroenden
 * → första testet faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act, fireEvent } from '@/test/utils'

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: () => ({ calmMode: true }),
}))

import BreakReminder from './BreakReminder'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

/** En användare som skriver: en tangenttryckning var 400:e ms. */
function arbeta(sekunder: number) {
  for (let ms = 0; ms < sekunder * 1000; ms += 400) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      vi.advanceTimersByTime(400)
    })
  }
}

describe('BreakReminder', () => {
  it('visar påminnelsen efter arbetstiden även när användaren är aktiv hela tiden', () => {
    render(<BreakReminder workDuration={1} />)
    arbeta(65)
    expect(screen.getByRole('dialog', { name: /paus/i })).toBeInTheDocument()
  })

  it('räknar inte tid när användaren varit borta längre än en minut', () => {
    // Första minuten utan aktivitet räknas (det kan vara läsning); sedan står
    // räknaren still. Fem minuters frånvaro når alltså inte två minuters arbete.
    render(<BreakReminder workDuration={2} />)
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Esc stänger påminnelsen som "Fortsätt jobba"', () => {
    render(<BreakReminder workDuration={1} />)
    arbeta(65)
    const dialog = screen.getByRole('dialog')
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(dialog).not.toBeInTheDocument()
  })
})
