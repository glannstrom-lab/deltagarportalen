/**
 * DP1 (2026-09-24): samtyckessteget är monterat i BÅDA skalen, och
 * välkomstflödet väntar tills villkoren är godkända.
 *
 * Mutationer (kontrollerade): ta bort `<SamtyckeSteg />` ur deltagarskalet → test 1
 * faller; ta bort den ur företagsskalet → test 3 faller; rendera OnboardingFlow
 * ovillkorligt → test 2 faller.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Foretagskonto } from '@/hooks/useForetagskonto'

const konto = vi.hoisted(() => ({
  varde: { org: null, isLoading: false, isEmployer: false, arForetagskonto: false, error: null } as {
    org: { id: string; name: string } | null
    isLoading: boolean
    isEmployer: boolean
    arForetagskonto: boolean
    error: unknown
  },
}))

vi.mock('@/hooks/useForetagskonto', () => ({
  useForetagskonto: () => konto.varde as unknown as Foretagskonto,
  FORETAGSKONTO_QUERY_KEY: ['foretagskonto'],
}))
vi.mock('./layout/Sidebar', () => ({ Sidebar: () => <div data-testid="sidomeny" /> }))
vi.mock('./layout/TopNav', () => ({
  default: () => <div data-testid="toppnav" />,
  SubNav: () => <div data-testid="undersidesrad" />,
  HubNav: () => <div data-testid="kategorirad" />,
}))
vi.mock('./layout/TopBar', () => ({ TopBar: () => <div data-testid="topbar" /> }))
vi.mock('./layout/HubBottomNav', () => ({ HubBottomNav: () => <div data-testid="bottennav" /> }))
vi.mock('./notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="bell" />,
  default: () => <div data-testid="bell" />,
}))
vi.mock('./CrisisSupport', () => ({ default: () => <div data-testid="kris" /> }))
vi.mock('./onboarding/OnboardingFlow', () => ({ OnboardingFlow: () => <div data-testid="valkomstflode" /> }))
vi.mock('./MobileOptimizer', () => ({ useMobileOptimizer: () => ({ isMobile: false }) }))

import Layout, { ForetagskontoProvider } from './Layout'
import { useAuthStore, type Profile } from '@/stores/authStore'

function sattProfil(delar: Partial<Profile>) {
  useAuthStore.setState({
    profile: {
      id: 'u1',
      role: 'USER',
      terms_accepted_at: null,
      privacy_accepted_at: null,
      ai_consent_at: null,
      onboarding_completed: false,
      ...delar,
    } as Profile,
  })
}

function rendera() {
  return render(
    <MemoryRouter initialEntries={['/cv']}>
      <Routes>
        <Route
          element={
            <ForetagskontoProvider>
              <Layout />
            </ForetagskontoProvider>
          }
        >
          <Route path="/cv" element={<div>innehåll</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  konto.varde = { org: null, isLoading: false, isEmployer: false, arForetagskonto: false, error: null }
})
afterEach(() => {
  cleanup()
  useAuthStore.setState({ profile: null })
})

describe('DP1 i skalet', () => {
  it('deltagarskalet visar samtyckessteget när villkoren saknas', () => {
    sattProfil({})
    rendera()
    expect(screen.getByTestId('samtyckessteg')).toBeInTheDocument()
  })

  it('välkomstflödet väntar tills villkoren finns, och kommer sedan', () => {
    sattProfil({})
    const { unmount } = rendera()
    expect(screen.queryByTestId('valkomstflode')).toBeNull()
    unmount()

    sattProfil({ terms_accepted_at: '2026-01-01T00:00:00Z', privacy_accepted_at: '2026-01-01T00:00:00Z' })
    rendera()
    expect(screen.queryByTestId('samtyckessteg')).toBeNull()
    expect(screen.getByTestId('valkomstflode')).toBeInTheDocument()
  })

  it('företagsskalet visar steget också, utan AI-rutan', () => {
    konto.varde = {
      org: { id: 'o1', name: 'Nordfrakt' },
      isLoading: false,
      isEmployer: true,
      arForetagskonto: true,
      error: null,
    }
    sattProfil({})
    rendera()
    expect(screen.getByTestId('foretagsskal')).toBeInTheDocument()
    expect(screen.getByTestId('samtyckessteg')).toBeInTheDocument()
    expect(screen.queryByLabelText(/AI-behandling/)).toBeNull()
  })
})
