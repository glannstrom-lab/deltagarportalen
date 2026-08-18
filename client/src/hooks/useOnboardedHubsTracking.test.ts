/**
 * Tester för hubbesöks-anteckningen.
 *
 * Den gamla versionen av den här filen **förseedade React Query-cachen** med
 * `onboarded_hubs: []` innan hooken monterades. Med tom seed är "lägg till" och
 * "skriv över" identiska operationer, så testet som hette "appends hub_id"
 * kunde aldrig skilja dem åt — och den riktiga buggen levde i just det fall
 * seeden gömde: kall cache, där mutationen läste `undefined` och skrev
 * `[hubId]` över allt som stod i databasen.
 *
 * Testerna nedan seedar därför ingenting. De beskriver vad SERVERN svarar, för
 * det är den enda källan mutationen numera läser.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

const useAuthMock = vi.fn(() => ({
  user: { id: 'test-user-id' },
  profile: null,
  loading: false,
  isAuthenticated: true,
}))
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => useAuthMock(),
}))

/** Vad servern har i kolumnen just nu — sätts per test. */
let serverHubbar: string[] | null = []

const updateSpy = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
}))

const selectSpy = vi.fn(() => ({
  eq: vi.fn(() => ({
    maybeSingle: vi.fn(() =>
      Promise.resolve({ data: { onboarded_hubs: serverHubbar }, error: null })
    ),
  })),
}))

const fromMock = vi.fn((_tabell?: string) => ({ update: updateSpy, select: selectSpy }))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (tabell: string) => fromMock(tabell) },
}))

let _qc: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  _qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: _qc }, children)
}

describe('useOnboardedHubsTracking', () => {
  beforeEach(() => {
    fromMock.mockClear()
    updateSpy.mockClear()
    selectSpy.mockClear()
    serverHubbar = []
    useAuthMock.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: null,
      loading: false,
      isAuthenticated: true,
    })
  })

  it('lägger till hubben i den lista som redan finns — skriver inte över den', async () => {
    // Det här är buggen som fanns fram till 2026-08-18. Med tom cache läste
    // mutationen [] och skrev ['jobb'], vilket raderade de två andra.
    serverHubbar = ['oversikt', 'karriar']
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })

    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    expect(updateSpy).toHaveBeenCalledWith({
      onboarded_hubs: ['oversikt', 'karriar', 'jobb'],
    })
  })

  it('läser nuläget från servern, inte från cachen', async () => {
    // Cachen får medvetet fel svar. Läser hooken den i stället för servern
    // skriver den ['jobb'] och testet faller.
    serverHubbar = ['oversikt']
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')

    function localWrapper({ children }: { children: ReactNode }) {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      qc.setQueryData(['hub', 'oversikt', 'test-user-id'], { onboarded_hubs: [], full_name: null })
      return createElement(QueryClientProvider, { client: qc }, children)
    }

    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper: localWrapper })
    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    expect(updateSpy).toHaveBeenCalledWith({ onboarded_hubs: ['oversikt', 'jobb'] })
  })

  it('skriver inte alls när hubben redan är antecknad', async () => {
    serverHubbar = ['jobb', 'oversikt']
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })

    await waitFor(() => expect(selectSpy).toHaveBeenCalled())
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('klarar en profilrad utan kolumnvärde', async () => {
    serverHubbar = null
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })

    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    expect(updateSpy).toHaveBeenCalledWith({ onboarded_hubs: ['jobb'] })
  })

  it('skriver ingenting utan inloggad användare', async () => {
    useAuthMock.mockReturnValue({
      user: null as unknown as { id: string },
      profile: null,
      loading: false,
      isAuthenticated: false,
    })
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })

    await new Promise((r) => setTimeout(r, 30))
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('kör bara en gång per monterad hook', async () => {
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    const { rerender } = renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1))
    rerender()
    rerender()
    expect(updateSpy).toHaveBeenCalledTimes(1)
  })
})
