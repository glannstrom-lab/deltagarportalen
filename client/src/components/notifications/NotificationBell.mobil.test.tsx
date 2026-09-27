/**
 * RD10 (rollspelet 2026-09-27): notispanelen på mobil (390 px).
 *
 *  1. Panelen var `absolute right-0 w-80` mot klockan, som står mitt i
 *     toppraden — den stack ut till vänster om skärmen ("otifikationer").
 *     På små skärmar ligger den nu fast mellan skärmens kanter.
 *  2. Flikarna krympte i den scrollande raden och flöt ihop
 *     ("MeddelandenJobb"). De får inte krympa.
 *  3. "Diskussioner" och "Vänner" motsvarar ingen funktion deltagaren har.
 *
 * jsdom har ingen layout, så geometrin prövas via klasserna som bär den.
 * Mutation: ta bort `shrink-0` i CategoryTab → andra testet faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

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
  return screen.getByRole('dialog')
}

describe('NotificationBell på mobil (RD10)', () => {
  it('panelen ligger mellan skärmens kanter på små skärmar', () => {
    const panel = oppna()
    expect(panel.className).toMatch(/(^|\s)fixed(\s|$)/)
    expect(panel.className).toMatch(/(^|\s)inset-x-2(\s|$)/)
    expect(panel.className).toMatch(/(^|\s)sm:absolute(\s|$)/)
  })

  it('flikarna krymper inte ihop i den scrollande raden', () => {
    const panel = oppna()
    const flikar = within(panel).getAllByRole('button', { pressed: undefined }).filter((b) => b.hasAttribute('aria-pressed'))
    expect(flikar.length).toBeGreaterThan(0)
    for (const f of flikar) expect(f.className).toMatch(/(^|\s)shrink-0(\s|$)/)
  })

  it('visar inga flikar för funktioner deltagaren inte har', () => {
    const panel = oppna()
    expect(within(panel).queryByRole('button', { name: /Diskussioner/ })).toBeNull()
    expect(within(panel).queryByRole('button', { name: /Vänner/ })).toBeNull()
    expect(within(panel).getByRole('button', { name: /Alla/ })).toBeInTheDocument()
  })
})
