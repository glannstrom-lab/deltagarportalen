/**
 * Ett hämtfel i notisklockan är inte "inga notiser".
 *
 * `useNotifications` exponerar `error`, men klockan läste den aldrig: föll
 * frågan visade listan "Inga notifikationer" — ett påstående om användaren
 * som ingen visste var sant. (2026-09-22)
 *
 * Mutation: ta bort grenen `error && notifications.length === 0` → första
 * testet faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const tillstand = { error: 'fetch failed' as string | null }

vi.mock('@/hooks/useNotifications', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useNotifications')>()
  return {
    ...original,
    useNotifications: () => ({
      notifications: [],
      unreadCount: 0,
      unreadByCategory: { total: 0, message: 0, job_match: 0, discussion: 0, friend_request: 0 },
      isLoading: false,
      error: tillstand.error,
      markAsRead: vi.fn(async () => {}),
      markAllAsRead: vi.fn(async () => {}),
      deleteNotification: vi.fn(async () => {}),
      clearAll: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    }),
  }
})

import { NotificationBell } from './NotificationBell'

function oppna() {
  render(<MemoryRouter><NotificationBell /></MemoryRouter>)
  const knapp = screen.getAllByRole('button').find((b) => /notifikation/i.test(b.getAttribute('aria-label') ?? ''))
  fireEvent.click(knapp!)
}

describe('NotificationBell — tre lägen', () => {
  it('ett hämtfel visar ett fel, inte "Inga notifikationer"', () => {
    tillstand.error = 'fetch failed'
    oppna()
    expect(screen.getByRole('alert')).toHaveTextContent(/kunde inte ladda|could not load/i)
    expect(screen.queryByText('Inga notifikationer')).not.toBeInTheDocument()
  })

  it('utan fel och utan notiser visas tomläget', () => {
    tillstand.error = null
    oppna()
    expect(screen.getByText('Inga notifikationer')).toBeInTheDocument()
  })
})
