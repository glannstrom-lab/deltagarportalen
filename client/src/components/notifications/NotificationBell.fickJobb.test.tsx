/**
 * FN14 (rest) — konsulentens notis `deltagare_fick_jobb` får egen etikett och en
 * rad med placeringens uppgifter. Fixturen har samma form som
 * services/fickJobbet.ts skriver (data.placering).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const notiser = [
  {
    id: 'n1', user_id: 'k1', type: 'deltagare_fick_jobb', title: 'Anna har fått jobb',
    message: 'Lagerarbetare hos Nordfrakt. Startdatum: 2026-11-01. Du kan registrera placeringen.', read: false, read_at: null,
    action_url: '/consultant',
    data: { placering: { employer_name: 'Nordfrakt', job_title: 'Lagerarbetare', start_date: '2026-11-01' } },
    created_at: new Date().toISOString(),
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
import { placeringsRad } from '@/lib/placeringsRad'
import { notificationConfig } from '@/hooks/useNotifications'

describe('NotificationBell — deltagare_fick_jobb (FN14)', () => {
  it('typen har egen etikett i config-kartan (inte reservens "Information")', () => {
    expect(notificationConfig.deltagare_fick_jobb.label).toBe('Deltagare fick jobb')
  })

  it('visar placeringen ur data.placering', async () => {
    render(<MemoryRouter><NotificationBell /></MemoryRouter>)
    const knapp = screen.getAllByRole('button').find((b) => /notifikation/i.test(b.getAttribute('aria-label') ?? ''))
    knapp!.click()
    expect(await screen.findByText('Att registrera: Nordfrakt · Lagerarbetare · start 2026-11-01')).toBeTruthy()
  })

  it('placeringsRad: bara det som finns, inget påhittat', () => {
    expect(placeringsRad({ employer_name: 'Nordfrakt', job_title: null, start_date: null })).toBe('Nordfrakt')
    expect(placeringsRad({ employer_name: ' ', job_title: '', start_date: null })).toBeNull()
    expect(placeringsRad(undefined)).toBeNull()
  })
})
