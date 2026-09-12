/**
 * F3 — påminnelsenotisen i klockan bär en kartlänk när platsen finns.
 * Hooken mockas (klockan är annars beroende av Supabase realtime); config-kartan
 * importeras på riktigt så en saknad typ i notificationConfig också fäller testet.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const notiser = [
  {
    id: 'n1', user_id: 'u1', type: 'aktivitet_paminnelse', title: 'I morgon: Jobbsökarverkstad kl 09:00',
    message: 'Du har ett pass i morgon 14/09 kl 09:00–12:00 på Hjernet, Malmgatan 4.', read: false, read_at: null,
    action_url: '/min-vecka', data: { location: 'Hjernet, Malmgatan 4', session_id: 's1' }, created_at: new Date().toISOString(),
  },
  {
    id: 'n2', user_id: 'u1', type: 'aktivitet_pass', title: 'Nytt pass', message: 'Ett pass utan plats', read: true, read_at: null,
    action_url: '/min-vecka', data: {}, created_at: new Date().toISOString(),
  },
]

vi.mock('@/hooks/useNotifications', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useNotifications')>()
  return {
    ...original,
    useNotifications: () => ({
      notifications: notiser,
      unreadCount: 1,
      unreadByCategory: { total: 1, message: 0, job_match: 0, discussion: 0, friend_request: 0 },
      isLoading: false,
      error: null,
      markAsRead: vi.fn(async () => {}),
      markAllAsRead: vi.fn(async () => {}),
      deleteNotification: vi.fn(async () => {}),
      clearAll: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    }),
  }
})

import { NotificationBell } from './NotificationBell'
import { notificationConfig } from '@/hooks/useNotifications'

describe('NotificationBell — påminnelse med kartlänk (F3)', () => {
  it('typen aktivitet_paminnelse finns i config-kartan', () => {
    expect(notificationConfig.aktivitet_paminnelse).toBeDefined()
    expect(notificationConfig.aktivitet_paminnelse.label).toBe('Påminnelse')
  })

  it('renderar en kartlänk i ny flik för påminnelsen, men inte för passet utan plats', async () => {
    render(<MemoryRouter><NotificationBell /></MemoryRouter>)
    const knapp = screen.getAllByRole('button').find((b) => /notifikation/i.test(b.getAttribute('aria-label') ?? ''))
    expect(knapp).toBeTruthy()
    knapp!.click()
    const lank = await screen.findByRole('link', { name: /Hjernet, Malmgatan 4/ })
    expect(lank.getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=Hjernet%2C%20Malmgatan%204')
    expect(lank.getAttribute('target')).toBe('_blank')
    expect(lank.getAttribute('rel')).toContain('noopener')
    expect(screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.includes('google.com/maps'))).toHaveLength(1)
  })
})
