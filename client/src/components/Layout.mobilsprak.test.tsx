/**
 * PG4 (persona-genomgång 2026-09-12): "Välj språk" fanns bara i TopBar, och
 * TopBar renderas inte på mobil (`{showBars && !isMobile && <TopBar />}`).
 * Mobilhuvudet hade sök, krisstöd, notiser, profil och meny — inget språk.
 * Portalens engelska läsare är nyanländ och på mobil.
 *
 * Testet monterar MobileTopBar och kräver en knapp med namnet "Välj språk".
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'u1', email: 'dana@example.com' }, profile: { first_name: 'Dana' }, signOut: vi.fn() }),
}))
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: () => ({ settings: {}, focusMode: false }),
}))
vi.mock('./notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="bell" />,
  default: () => <div data-testid="bell" />,
}))
vi.mock('./CrisisSupport', () => ({ default: () => <div data-testid="kris" /> }))
vi.mock('@/i18n/lattSvenska', () => ({
  LATT_SVENSKA_KOD: 'sv-latt',
  arLattSvenska: () => false,
  sattLattSvenska: vi.fn(),
}))

import { MobileTopBar } from './Layout'

afterEach(cleanup)

describe('mobilhuvudet har språkval (PG4)', () => {
  it('visar en knapp "Välj språk" i mobilens huvud', () => {
    render(
      <MemoryRouter initialEntries={['/oversikt']}>
        <MobileTopBar />
      </MemoryRouter>
    )
    const knapp = screen.getAllByRole('button', { name: /välj språk/i })
    expect(knapp.length).toBeGreaterThanOrEqual(1)
    expect(knapp[0]).toHaveAttribute('aria-haspopup', 'listbox')
  })
})
