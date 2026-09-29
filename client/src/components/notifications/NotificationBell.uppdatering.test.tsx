/**
 * FT3 — klockan hämtar själv nya notiser.
 * Realtime levererar inget i drift (tabellen ligger inte i publikationen
 * supabase_realtime), så klockan måste kunna uppdatera sig utan omladdning.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const refresh = vi.hoisted(() => vi.fn(async () => {}))

vi.mock('@/hooks/useNotifications', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useNotifications')>()
  return {
    ...original,
    useNotifications: () => ({
      notifications: [],
      unreadCount: 0,
      unreadByCategory: { total: 0, message: 0, job_match: 0, discussion: 0, friend_request: 0 },
      isLoading: false,
      error: null,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
      clearAll: vi.fn(),
      refresh,
    }),
  }
})

import { NotificationBell, NOTIS_INTERVALL_MS } from './NotificationBell'

beforeEach(() => {
  vi.useFakeTimers()
  refresh.mockClear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('NotificationBell — uppdatering (FT3)', () => {
  it('hämtar om notiserna med jämna mellanrum', () => {
    render(<MemoryRouter><NotificationBell /></MemoryRouter>)
    expect(refresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(NOTIS_INTERVALL_MS)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('hämtar om när fönstret får fokus igen', () => {
    render(<MemoryRouter><NotificationBell /></MemoryRouter>)
    window.dispatchEvent(new Event('focus'))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('slutar när klockan avmonteras', () => {
    const { unmount } = render(<MemoryRouter><NotificationBell /></MemoryRouter>)
    unmount()
    vi.advanceTimersByTime(NOTIS_INTERVALL_MS * 3)
    window.dispatchEvent(new Event('focus'))
    expect(refresh).not.toHaveBeenCalled()
  })
})
