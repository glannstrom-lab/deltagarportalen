/**
 * Deep-link smoke test — Phase 1 regression guard
 *
 * Verifies that all 28 existing deep-link routes still resolve to their
 * correct pages after the hub navigation shell was added (Plans 01-04).
 *
 * Why: PITFALLS.md Pitfall 1 — the catch-all <Route path="*"> in App.tsx
 * silently redirects unmatched URLs to '/'. A broken route would not
 * fail loudly; users would just see the dashboard when they bookmark /cv.
 * This test asserts the URL stays at the requested path after navigation.
 *
 * Runs in BOTH flag states to verify NAV-04 + NAV-05 in combination.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- vi.mock importOriginal + partial-state mocks */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Suspense } from 'react'

// Mock auth so RootRoute and PrivateRoute treat us as logged-in USER
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'test-user', email: 'test@example.com' },
    session: { access_token: 'mock' },
    profile: {
      id: 'test-user',
      email: 'test@example.com',
      first_name: 'Test',
      activeRole: 'USER',
      role: 'USER',
      roles: ['USER'],
    },
    initialize: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    clearError: vi.fn(),
    error: null,
  })),
}))

// (isHubNavEnabled-mocken borttagen 2026-07-10, C3 — hub-nav är permanent)

// Mock Supabase to prevent real network calls during page render
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn().mockResolvedValue({ error: null }),
  },
}))

// Mock Sentry to suppress any tracking calls
vi.mock('@/lib/sentry', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  initSentry: vi.fn(),
}))

// Mock ThemeContext — the Layout/TopBar uses useTheme() which requires ThemeProvider in the tree.
// Rather than adding ThemeProvider to every test wrapper, we mock the context hook.
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

// The 28 deep-link paths that must NOT silently redirect
// NOTE: spontanansökan and nätverk contain non-ASCII characters — both must work
const DEEP_LINK_PATHS = [
  '/cv',
  '/cover-letter',
  '/interest-guide',
  '/knowledge-base',
  '/profile',
  '/my-consultant',
  '/job-search',
  '/applications',
  '/career',
  '/diary',
  '/wellness',
  '/settings',
  '/resources',
  '/print-resources',
  '/help',
  '/salary',
  '/education',
  '/calendar',
  '/spontanansökan',
  '/nätverk',
  '/personal-brand',
  '/linkedin-optimizer',
  '/skills-gap-analysis',
  '/interview-simulator',
  '/ai-team',
  '/exercises',
  '/international',
  '/externa-resurser',
] as const

const HUB_PATHS = [
  '/oversikt',
  '/jobb',
  '/karriar',
  '/resurser',
  '/min-vardag',
] as const

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
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Deep-link smoke test (NAV-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

    it.each(DEEP_LINK_PATHS)(
      'mounts %s without silently redirecting',
      async (path) => {
        const { container } = await renderAppAt(path)
        await waitFor(
          () => {
            expect(container.textContent ?? '').not.toBe('loading')
            expect(container.textContent ?? '').not.toBe('')
          },
          { timeout: 15000 }
        )
        const errorFallback = container.querySelector('[data-testid="route-error-fallback"]')
        expect(errorFallback).toBeNull()
      },
      { timeout: 20000 }
    )

    it.each(HUB_PATHS)(
      'mounts hub path %s',
      async (path) => {
        const { container } = await renderAppAt(path)
        await waitFor(
          () => {
            expect(container.textContent ?? '').not.toBe('loading')
            expect(container.textContent ?? '').not.toBe('')
          },
          { timeout: 15000 }
        )
        // Hub pages are placeholder pages — assert no error boundary fired
        const errorFallback = container.querySelector('[data-testid="route-error-fallback"]')
        expect(errorFallback).toBeNull()
      },
      20000
    )
  })

/**
 * Renderingstestet ovan kan INTE se att en route försvunnit.
 *
 * Uppmätt 2026-08-20: hela raden `<Route path="salary/*" …>` togs bort ur
 * `App.tsx` och sviten förblev grön — 1 760 tester, 127 filer. Orsaken är att
 * catch-allen (`App.tsx`, `path="*"` → `/` → `/oversikt`) renderar
 * instrumentpanelen, som har innehåll och inte fyrar någon felgräns. Testet
 * frågar "kom det något på skärmen?", inte "kom RÄTT sida?".
 *
 * Den här kontrollen läser routetabellen som text i stället. Den är trubbig
 * med flit: den bevisar inte att sidan fungerar, bara att sökvägen fortfarande
 * har en egen route — vilket är precis det renderingstestet inte kan.
 */
describe('routetabellen — varje djuplänk har en egen route (NAV-05)', () => {
  const appKalla = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8')
  const routeSokvagar = new Set(
    [...appKalla.matchAll(/<Route\s+[^>]*path="([^"]+)"/g)].map((m) => m[1].replace(/\/\*$/, '')),
  )

  it('routetabellen går att läsa — positiv kontroll', () => {
    expect(routeSokvagar.size).toBeGreaterThan(20)
  })

  it.each([...DEEP_LINK_PATHS, ...HUB_PATHS])('%s finns i App.tsx', (path) => {
    // Rutterna är nästlade under `/`, så de skrivs utan inledande snedstreck.
    const utanSnedstreck = path.replace(/^\//, '')
    expect(
      routeSokvagar.has(utanSnedstreck) || routeSokvagar.has(path),
      `Sökvägen ${path} har ingen route i App.tsx och faller därför på ` +
        'catch-allen — tyst, tillbaka till Översikt.',
    ).toBe(true)
  })
})

