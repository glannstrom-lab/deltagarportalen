/* eslint-disable @typescript-eslint/no-explicit-any -- vi.mock-fabriker tar emot variadic args */
/**
 * Utloggningen skickade ~20 frågor utan inloggning (prod-loggarna, flera
 * gånger per dag, 5 av dem 401). `signOut()` tömde React Query-cachen medan
 * sidan var monterad och `user` fanns kvar i authStore; nästa omrendering
 * byggde om frågorna och hämtade på nytt, och när Supabase tagit bort
 * sessionen gick hämtningarna som anon.
 *
 * Testet monterar en fråga formad som hubbhookarna (`enabled: !!userId`,
 * userId ur authStore), låter en rensare i `rensaVidUtloggning` tvinga fram
 * en omrendering (som storesen gör i drift), och låter mocken av
 * `supabase.auth.signOut` göra som den riktiga: ta bort sessionen och
 * meddela SIGNED_OUT till lyssnaren innan den svarar.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

const sb = vi.hoisted(() => ({
  harSession: true,
  lyssnare: null as null | ((event: string, session: unknown) => Promise<void>),
  signOutFel: null as null | { message: string },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(async () => {
        if (sb.signOutFel) return { error: sb.signOutFel }
        sb.harSession = false
        await sb.lyssnare?.('SIGNED_OUT', null)
        return { error: null }
      }),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn((cb: any) => {
        sb.lyssnare = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
    from: vi.fn(),
  },
}))
vi.mock('@/lib/sentry', () => ({ setUser: vi.fn() }))

import { useAuthStore } from './authStore'
import { queryClient } from '@/lib/queryClient'
import { registreraRensning } from '@/lib/rensaVidUtloggning'

// En store som nollställs vid utloggning — som aiTeamStore/profileStore i
// drift. Komponenten prenumererar på den, så rensningen ger en omrendering.
const useRaknare = create<{ n: number }>(() => ({ n: 0 }))
registreraRensning(() => useRaknare.setState((s) => ({ n: s.n + 1 })))

const anrop: string[] = []

function Hubb() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  useRaknare((s) => s.n)
  useQuery({
    queryKey: ['hub', 'test', userId],
    enabled: !!userId,
    queryFn: async () => {
      anrop.push(sb.harSession ? 'inloggad' : 'anon')
      return { ok: true }
    },
  })
  return null
}

const anvandare = { id: 'user-a', email: 'a@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01' } as User

describe('signOut — inga frågor utan inloggning', () => {
  beforeEach(() => {
    queryClient.clear()
    anrop.length = 0
    sb.harSession = true
    sb.signOutFel = null
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useAuthStore.setState({
      user: anvandare,
      profile: null,
      session: { access_token: 't' } as any,
      isAuthenticated: true,
      isLoading: false,
      isSigningOut: false,
    })
  })
  afterEach(() => cleanup())

  it('skickar ingen fråga som anon medan utloggningen pågår', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Hubb />
      </QueryClientProvider>
    )
    await waitFor(() => expect(anrop).toEqual(['inloggad']))

    await act(async () => {
      await useAuthStore.getState().signOut()
    })
    // Låt eventuella omrenderingar och hämtningar hinna köra.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })

    expect(anrop.filter((a) => a === 'anon')).toEqual([])
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('tömmer fortfarande cachen, så nästa användare inte ser föregåendes data', async () => {
    queryClient.setQueryData(['saved-jobs'], [{ id: 'jobb-1' }])
    queryClient.setQueryData(['hub', 'oversikt', 'user-a'], { namn: 'A' })

    await useAuthStore.getState().signOut()

    expect(queryClient.getQueryData(['saved-jobs'])).toBeUndefined()
    expect(queryClient.getQueryData(['hub', 'oversikt', 'user-a'])).toBeUndefined()
    expect(queryClient.getQueryCache().getAll().filter((q) => q.state.data !== undefined)).toEqual([])
  })

  it('tömmer cachen men behåller inloggningen när Supabase-anropet misslyckas', async () => {
    sb.signOutFel = { message: 'Network error' }
    queryClient.setQueryData(['saved-jobs'], [{ id: 'jobb-1' }])

    await useAuthStore.getState().signOut()

    expect(queryClient.getQueryData(['saved-jobs'])).toBeUndefined()
    expect(useAuthStore.getState().user?.id).toBe('user-a')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().isSigningOut).toBe(false)
  })
})
