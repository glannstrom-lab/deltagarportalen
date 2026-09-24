/**
 * Rollskyddet i App.tsx — PrivateRoute med allowedRoles på /consultant och /admin.
 *
 * Tillagt 2026-09-24 efter ett mutationsstickprov: `if (!hasAccess)` ändrades
 * till `if (false)` i PrivateRoute — alltså ingen rollkontroll alls, vilken
 * deltagare som helst når konsulentvyn och superadmin-panelen i klienten — och
 * HELA sviten förblev grön. nav-smoke renderar bara deltagarrutter som USER och
 * kan inte se en grind som släpper igenom för mycket.
 *
 * Datan skyddas av RLS, inte av den här grinden. Men grinden är det som gör att
 * en deltagare inte möts av en konsulentvy full av tomma paneler och felrutor,
 * och den ska därför inte kunna försvinna tyst.
 *
 * Sidorna bakom grinden ersätts med vaktposter: testet frågar "renderades den
 * skyddade sidan?", inte "fungerar konsulentvyn?".
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- vi.mock importOriginal + partiella tillståndsmockar */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'

type Roll = 'USER' | 'CONSULTANT' | 'ADMIN' | 'SUPERADMIN'
let aktivRoll: Roll = 'USER'
let roller: Roll[] = ['USER']

function authTillstand() {
  return {
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'test-user', email: 'test@example.com' },
    session: { access_token: 'mock' },
    profile: {
      id: 'test-user',
      email: 'test@example.com',
      first_name: 'Test',
      activeRole: aktivRoll,
      role: aktivRoll,
      roles: roller,
    },
    initialize: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    clearError: vi.fn(),
    error: null,
  }
}

// Stödjer både `useAuthStore()` och `useAuthStore(selector)` — StartRedirect
// använder selektorformen, och en mock som ignorerar selektorn ger den hela
// objektet i stället för rollen.
vi.mock('@/stores/authStore', () => {
  const useAuthStore: any = vi.fn((sel?: (s: any) => unknown) => (sel ? sel(authTillstand()) : authTillstand()))
  useAuthStore.getState = () => authTillstand()
  useAuthStore.subscribe = vi.fn(() => () => {})
  useAuthStore.setState = vi.fn()
  return { useAuthStore }
})

vi.mock('@/pages/Consultant', () => ({ default: () => <p>VAKTPOST-KONSULENTVY</p> }))
vi.mock('@/components/admin/SuperAdminPanel', () => ({ default: () => <p>VAKTPOST-ADMINPANEL</p> }))
vi.mock('@/pages/hubs/HubOverview', () => ({ default: () => <p>VAKTPOST-OVERSIKT</p> }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => {
      const kedja: any = {
        select: vi.fn(() => kedja),
        eq: vi.fn(() => kedja),
        in: vi.fn(() => kedja),
        is: vi.fn(() => kedja),
        order: vi.fn(() => kedja),
        limit: vi.fn(() => kedja),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn(() => kedja),
        delete: vi.fn(() => kedja),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: (ok: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(ok),
      }
      return kedja
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn().mockResolvedValue({ error: null }),
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

function Plats() {
  const loc = useLocation()
  return <span data-testid="plats">{loc.pathname}</span>
}

async function renderaVid(sokvag: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const { default: App } = await import('../../App')
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[sokvag]}>
        <Suspense fallback={<div>loading</div>}>
          <App />
        </Suspense>
        <Plats />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function vantaTillsPlatsInteAr(sokvag: string) {
  await waitFor(() => expect(screen.getByTestId('plats').textContent).not.toBe(sokvag), { timeout: 15000 })
}

describe('rollskyddet på /consultant och /admin (PrivateRoute)', () => {
  beforeEach(() => {
    aktivRoll = 'USER'
    roller = ['USER']
  })

  it('en deltagare släpps inte in i konsulentvyn', async () => {
    await renderaVid('/consultant')
    await vantaTillsPlatsInteAr('/consultant')
    expect(screen.queryByText('VAKTPOST-KONSULENTVY')).not.toBeInTheDocument()
  }, 20000)

  it('en deltagare släpps inte in i adminpanelen', async () => {
    await renderaVid('/admin')
    await vantaTillsPlatsInteAr('/admin')
    expect(screen.queryByText('VAKTPOST-ADMINPANEL')).not.toBeInTheDocument()
  }, 20000)

  it('en konsulent når konsulentvyn — positiv kontroll, grinden stänger inte allt', async () => {
    aktivRoll = 'CONSULTANT'
    roller = ['CONSULTANT']
    await renderaVid('/consultant')
    expect(await screen.findByText('VAKTPOST-KONSULENTVY', {}, { timeout: 15000 })).toBeInTheDocument()
    expect(screen.getByTestId('plats').textContent).toBe('/consultant')
  }, 20000)

  it('en konsulent släpps inte in i adminpanelen', async () => {
    aktivRoll = 'CONSULTANT'
    roller = ['CONSULTANT']
    await renderaVid('/admin')
    await vantaTillsPlatsInteAr('/admin')
    expect(screen.queryByText('VAKTPOST-ADMINPANEL')).not.toBeInTheDocument()
  }, 20000)

  it('en konsulent som växlat till deltagarläge når fortfarande konsulentvyn via roles[]', async () => {
    aktivRoll = 'USER'
    roller = ['USER', 'CONSULTANT']
    await renderaVid('/consultant')
    expect(await screen.findByText('VAKTPOST-KONSULENTVY', {}, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('en superadmin når adminpanelen', async () => {
    aktivRoll = 'SUPERADMIN'
    roller = ['SUPERADMIN']
    await renderaVid('/admin')
    expect(await screen.findByText('VAKTPOST-ADMINPANEL', {}, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)
})
