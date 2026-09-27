/**
 * Rollspelet 2026-09-27, konsulentvyns skal.
 *  RK20: på dator visade toppnaven deltagarens hubbar (Söka jobb, Karriär,
 *        CV, Intresseguide) även under /consultant. RK17 rättade mobilen.
 *  RR21: deltagarens krisknapp ("Du är inte ensam", Självmordslinjen) låg i
 *        konsulentens toppfält — på mobil och på dator.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key), i18n: { language: 'sv', changeLanguage: vi.fn() } }),
}))
vi.mock('@/stores/authStore', () => {
  const state = { user: { id: 'k1', email: 'kim@example.com' }, profile: { first_name: 'Kim' }, signOut: vi.fn() }
  return { useAuthStore: (sel?: (s: typeof state) => unknown) => (sel ? sel(state) : state) }
})
vi.mock('@/stores/settingsStore', () => ({ useSettingsStore: () => ({ settings: {}, focusMode: false }) }))
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false, toggleDarkMode: vi.fn() }) }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ isFocusModeEnabled: false, toggleFocusMode: vi.fn() }) }))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) },
}))
vi.mock('@/components/notifications/NotificationBell', () => ({ NotificationBell: () => <div />, default: () => <div /> }))
vi.mock('../notifications/NotificationBell', () => ({ NotificationBell: () => <div />, default: () => <div /> }))
vi.mock('./notifications/NotificationBell', () => ({ NotificationBell: () => <div />, default: () => <div /> }))
vi.mock('@/components/CrisisSupport', () => ({ default: () => <div data-testid="kris" /> }))
vi.mock('./LanguageSwitcher', () => ({ LanguageSwitcher: () => <div /> }))
vi.mock('./GoogleTranslate', () => ({ GoogleTranslate: () => <div /> }))
vi.mock('@/config/features', async (orig) => ({ ...(await orig<typeof import('@/config/features')>()), isTopNavEnabled: () => true }))
vi.mock('@/i18n/lattSvenska', () => ({ LATT_SVENSKA_KOD: 'sv-latt', arLattSvenska: () => false, sattLattSvenska: vi.fn() }))

import { HubNav } from './TopNav'
import { TopBar } from './TopBar'
import { MobileTopBar } from '../Layout'

afterEach(cleanup)

function rendera(path: string, K: React.ComponentType) {
  return render(<MemoryRouter initialEntries={[path]}><K /></MemoryRouter>)
}

describe('RK20 — toppnaven på dator', () => {
  it('under /consultant visas konsulentvyns flikar, inte deltagarens hubbar', () => {
    rendera('/consultant/participants/abc', () => <HubNav variant="inline" />)
    const nav = screen.getByRole('navigation', { name: 'Konsulentvyns navigering' })
    expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      '/consultant', '/consultant/participants', '/consultant/platser', '/consultant/analytics', '/consultant/communication',
    ])
    expect(screen.queryByText('Söka jobb')).toBeNull()
    expect(screen.getByRole('link', { name: 'Deltagare' })).toHaveAttribute('aria-current', 'page')
  })

  it('utanför konsulentvyn är deltagarens hubbar kvar', () => {
    rendera('/cv', () => <HubNav variant="inline" />)
    expect(screen.queryByRole('navigation', { name: 'Konsulentvyns navigering' })).toBeNull()
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(5)
  })
})

describe('RR21 — krisknappen i konsulentvyn', () => {
  it('dator: TopBar visar den inte under /consultant', () => {
    rendera('/consultant/participants/abc', TopBar)
    expect(screen.queryByTestId('kris')).toBeNull()
  })
  it('dator: TopBar visar den för deltagaren', () => {
    rendera('/cv', TopBar)
    expect(screen.getByTestId('kris')).toBeInTheDocument()
  })
  it('mobil: MobileTopBar visar den inte under /consultant, men för deltagaren', () => {
    rendera('/consultant', MobileTopBar)
    expect(screen.queryByTestId('kris')).toBeNull()
    cleanup()
    rendera('/cv', MobileTopBar)
    expect(screen.getByTestId('kris')).toBeInTheDocument()
  })
})
