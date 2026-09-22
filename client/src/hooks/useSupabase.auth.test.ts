/**
 * useAuth läser authStore — den frågar inte Supabase själv (2026-09-22).
 *
 * Tidigare gjorde varje monterad instans `getUser()` + `getProfile()` och
 * registrerade en egen `onAuthStateChange` vars callback väntade på ett
 * Supabase-anrop. En hubbsida med summary-hook + onboarding-spårning gav
 * dubbla anrop per sidvisning, och ett Supabase-anrop inne i auth-callbacken
 * är supabase-js kända deadlock-mönster. authStore är den enda källan.
 *
 * Mutation (kontrollerad): återställ den gamla hooken → test 1 och 2 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const { getUser, onAuthStateChange } = vi.hoisted(() => ({
  getUser: vi.fn(async () => ({ data: { user: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getUser, onAuthStateChange }, from: vi.fn() },
  getCurrentUser: vi.fn(async () => null),
  getProfile: vi.fn(async () => ({ data: null, error: null })),
}))

const store = vi.hoisted(() => ({
  user: { id: 'u1' } as unknown,
  profile: { id: 'u1', first_name: 'Anna' } as unknown,
  isLoading: false,
}))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (valj: (s: typeof store) => unknown) => valj(store),
}))

import { useAuth } from './useSupabase'

beforeEach(() => {
  getUser.mockClear()
  onAuthStateChange.mockClear()
  store.user = { id: 'u1' }
  store.isLoading = false
})

describe('useAuth', () => {
  it('ger storens användare direkt, utan en egen laddningsrunda', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toEqual({ id: 'u1' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('gör inga egna Supabase-anrop och registrerar ingen egen auth-lyssnare', () => {
    renderHook(() => useAuth())
    renderHook(() => useAuth())
    expect(getUser).not.toHaveBeenCalled()
    expect(onAuthStateChange).not.toHaveBeenCalled()
  })

  it('följer storens laddningsläge', () => {
    store.user = null
    store.isLoading = true
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })
})
