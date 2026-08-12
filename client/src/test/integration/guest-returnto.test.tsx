/**
 * K11 — gästen ska inte tappa bort vart hon var på väg.
 *
 * Buggen: en gäst som klickade "Bygg ditt CV" på en av de 180 publika sidorna
 * fick B2B-säljsidan renderad medan adressfältet fortfarande sa `/#/cv`.
 * Ingen omdirigering, ingen förklaring, ingen väg tillbaka. Reproducerat i
 * prod 2026-08-12 på fyra verktygsrouter.
 *
 * Varför testet läser location i stället för att titta på innehållet:
 * nav-smoke-testet bredvid asserterar bara "inte tomt, ingen error boundary",
 * och en omdirigering till landningssidan passerar det utan att blinka — det
 * var precis så här buggen kunde leva. Här jämförs sökvägen.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- vi.mock importOriginal + partial-state mocks */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'

// Gäst: inte inloggad, inte laddande.
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,
    profile: null,
    initialize: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    clearError: vi.fn(),
    error: null,
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

vi.mock('@/lib/sentry', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  initSentry: vi.fn(),
}))

vi.mock('@/contexts/ThemeContext', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useTheme: vi.fn(() => ({
      theme: 'light' as const,
      setTheme: vi.fn(),
      isDark: false,
      toggleDarkMode: vi.fn(),
      systemPreference: 'light' as const,
    })),
    useDarkMode: vi.fn(() => ({ isDark: false })),
  }
})

/** Skriver ut nuvarande sökväg så testet kan läsa den. */
function LocationSpy() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

async function renderAppAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const { default: App } = await import('../../App')
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Suspense fallback={<div data-testid="suspense-fallback">loading</div>}>
          <App />
          <LocationSpy />
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** De CTA-mål som guidesidorna och verktygssidorna faktiskt pekar på. */
const CTA_MAL = [
  ['/cv', '/login?returnTo=%2Fcv'],
  ['/cover-letter', '/login?returnTo=%2Fcover-letter'],
  ['/interview-simulator', '/login?returnTo=%2Finterview-simulator'],
  ['/skills-gap-analysis', '/login?returnTo=%2Fskills-gap-analysis'],
  ['/interest-guide', '/login?returnTo=%2Finterest-guide'],
  ['/job-search', '/login?returnTo=%2Fjob-search'],
  ['/wellness', '/login?returnTo=%2Fwellness'],
] as const

describe('K11: gäst som klickar en CTA på en publik sida', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(CTA_MAL)(
    '%s skickas till inloggningen med returnTo, inte tyst till startsidan',
    async (path, forvantat) => {
      const { getByTestId } = await renderAppAt(path)
      await waitFor(
        () => {
          expect(getByTestId('location').textContent).toBe(forvantat)
        },
        { timeout: 15000 }
      )
    },
    20000
  )

  it('landningssidan visas fortfarande på /', async () => {
    const { getByTestId } = await renderAppAt('/')
    await waitFor(
      () => {
        expect(getByTestId('location').textContent).toBe('/')
      },
      { timeout: 15000 }
    )
  })

  it('behåller frågesträngen så att sammanhanget överlever inloggningen', async () => {
    const { getByTestId } = await renderAppAt('/job-search?q=lager')
    await waitFor(
      () => {
        expect(getByTestId('location').textContent).toBe(
          '/login?returnTo=%2Fjob-search%3Fq%3Dlager'
        )
      },
      { timeout: 15000 }
    )
  })

  it('skickar konsulentvyn till inloggningen med returnTo', async () => {
    const { getByTestId } = await renderAppAt('/consultant')
    await waitFor(
      () => {
        expect(getByTestId('location').textContent).toBe('/login?returnTo=%2Fconsultant')
      },
      { timeout: 15000 }
    )
  })
})
