/* eslint-disable @typescript-eslint/no-explicit-any -- vi.mock-fabriker tar emot variadic args och behöver any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore, skapaAuthByteHanterare, type Profile } from './authStore'
import { queryClient } from '@/lib/queryClient'

// KA2: authStore registrerar sin auth-lyssnare NÄR MODULEN LADDAS, alltså
// innan någon `let` i den här filen hunnit initieras. `vi.hoisted` är enda
// sättet att fånga callbacken utan TDZ-fel. `vi.clearAllMocks()` i beforeEach
// nollar mock.calls men inte implementationen, så referensen överlever.
const authLyssnare = vi.hoisted(() => ({
  callback: null as null | ((event: string, session: unknown) => Promise<void>),
}))

// Mock Supabase
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetUser = vi.fn()
const mockGetSession = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      getUser: (...args: any[]) => mockGetUser(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => Promise<void>) => {
        authLyssnare.callback = cb
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn()
            }
          }
        }
      }),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}))

// Mock Sentry
vi.mock('@/lib/sentry', () => ({
  setUser: vi.fn(),
}))

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state directly (avoid calling signOut which needs mock)
    useAuthStore.setState({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isSigningOut: false,
    })
    vi.clearAllMocks()
    // Set default mock returns
    mockSignOut.mockResolvedValue({ error: null })
  })

  describe('initialize', () => {
    it('should set authenticated state when session exists', async () => {
      const mockSession = {
        access_token: 'token123',
        user: { id: 'user1', email: 'test@example.com' },
      }
      const mockProfile: Profile = {
        id: 'user1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'USER',
        roles: ['USER'],
        activeRole: 'USER',
        phone: null,
        avatar_url: null,
        consultant_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        terms_accepted_at: null,
        privacy_accepted_at: null,
        ai_consent_at: null,
        marketing_consent_at: null,
        health_consent_at: null,
        wellness_consent_at: null,
      }

      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockGetUser.mockResolvedValue({ data: { user: mockSession.user }, error: null })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      })

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockSession.user)
      expect(state.profile).toEqual(expect.objectContaining({
        id: mockProfile.id,
        email: mockProfile.email,
        first_name: mockProfile.first_name,
      }))
      expect(state.isLoading).toBe(false)
    })

    it('should set unauthenticated state when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('should handle initialization errors', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' }
      })

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBe('Kunde inte initiera autentisering')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' }
      const mockUser = { id: 'user1', email: credentials.email }
      const mockSession = { access_token: 'token123', user: mockUser }
      const mockProfile: Profile = {
        id: 'user1',
        email: credentials.email,
        first_name: 'Test',
        last_name: 'User',
        role: 'USER',
        roles: ['USER'],
        activeRole: 'USER',
        phone: null,
        avatar_url: null,
        consultant_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        terms_accepted_at: null,
        privacy_accepted_at: null,
        ai_consent_at: null,
        marketing_consent_at: null,
        health_consent_at: null,
        wellness_consent_at: null,
      }

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      })

      const result = await useAuthStore.getState().signIn(credentials.email, credentials.password)

      const state = useAuthStore.getState()
      expect(result.error).toBeNull()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials)
    })

    it('should handle invalid credentials error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const result = await useAuthStore.getState().signIn('test@example.com', 'wrongpassword')

      expect(result.error).toBe('Fel e-post eller lösenord')
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should handle unconfirmed email error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      })

      const result = await useAuthStore.getState().signIn('test@example.com', 'password')

      expect(result.error).toBe('E-postadressen är inte bekräftad')
    })
  })

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }
      const mockUser = { id: 'user2', email: userData.email }
      const mockSession = { access_token: 'token123', user: mockUser }

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockUser, first_name: userData.firstName, last_name: userData.lastName },
              error: null
            })
          })
        })
      })

      const result = await useAuthStore.getState().signUp(userData)

      const state = useAuthStore.getState()
      expect(result.error).toBeNull()
      expect(state.isAuthenticated).toBe(true)
      expect(mockSignUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: 'USER',
            terms_accepted: false,
            privacy_accepted: false,
            ai_consent: false,
          },
        },
      })
    })

    it('should handle email confirmation required', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }

      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user2' }, session: null },
        error: null,
      })

      const result = await useAuthStore.getState().signUp(userData)

      // ON4: ett skapat konto som väntar på bekräftelse är INTE ett fel.
      // Tidigare kom "Konto skapat! …" som `error` och Register.tsx kastade
      // den i en röd alert.
      expect(result.error).toBeNull()
      expect(result.needsConfirmation).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('markerar INTE needsConfirmation när sessionen kom direkt', async () => {
      const mockUser = { id: 'user2', email: 'new@example.com' }
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 't', user: mockUser } },
        error: null,
      })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      const result = await useAuthStore.getState().signUp({
        email: 'new@example.com', password: 'x', firstName: 'N', lastName: 'U',
      })

      expect(result.needsConfirmation).toBeUndefined()
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  /**
   * KA2: cachen ska tömmas centralt — inte bara från utloggningsknappen.
   * En utgången session, ett signOut i en annan flik eller ett kontobyte i
   * samma flik går aldrig genom `signOut()`, men alla går genom
   * `onAuthStateChange`. 40 av 40 cachenycklar saknar användar-id, så det
   * som ligger kvar matchar nästa inloggade person.
   */
  describe('auth-lyssnaren tömmer React Query-cachen (KA2)', () => {
    const sessionFor = (id: string) => ({ user: { id } })

    beforeEach(() => {
      queryClient.clear()
    })

    it('registrerar sig hos supabase när modulen laddas — inte bara på vissa sidor', () => {
      expect(authLyssnare.callback).toBeTypeOf('function')
    })

    it('SIGNED_OUT via onAuthStateChange tömmer cachen, utan att signOut() körts', async () => {
      queryClient.setQueryData(['saved-jobs'], [{ id: 'jobb-1' }])
      queryClient.setQueryData(['spontaneous-companies'], [{ id: 'f-1' }])
      expect(queryClient.getQueryCache().getAll()).toHaveLength(2)

      await authLyssnare.callback!('SIGNED_OUT', null)

      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('kontobyte i samma flik (annat user.id) tömmer cachen', async () => {
      const hantera = skapaAuthByteHanterare()
      await hantera('SIGNED_IN', sessionFor('user-a') as never)
      queryClient.setQueryData(['saved-jobs'], [{ id: 'a:s jobb' }])

      await hantera('SIGNED_IN', sessionFor('user-b') as never)

      expect(queryClient.getQueryData(['saved-jobs'])).toBeUndefined()
    })

    it('tokenförnyelse för SAMMA användare rör inte cachen', async () => {
      const hantera = skapaAuthByteHanterare()
      await hantera('INITIAL_SESSION', sessionFor('user-a') as never)
      queryClient.setQueryData(['saved-jobs'], [{ id: 'jobb-1' }])

      await hantera('TOKEN_REFRESHED', sessionFor('user-a') as never)
      await hantera('USER_UPDATED', sessionFor('user-a') as never)

      expect(queryClient.getQueryData(['saved-jobs'])).toEqual([{ id: 'jobb-1' }])
    })

    it('första inloggningen i en flik utan känd användare tömmer inte (publikt innehåll får ligga kvar)', async () => {
      const hantera = skapaAuthByteHanterare()
      queryClient.setQueryData(['articles', 'publika'], [{ slug: 'x' }])

      await hantera('SIGNED_IN', sessionFor('user-a') as never)

      expect(queryClient.getQueryData(['articles', 'publika'])).toEqual([{ slug: 'x' }])
    })

    it('efter SIGNED_OUT räknas nästa inloggning som ny baslinje, och ett byte därefter tömmer igen', async () => {
      const hantera = skapaAuthByteHanterare()
      await hantera('SIGNED_IN', sessionFor('user-a') as never)
      await hantera('SIGNED_OUT', null)
      await hantera('SIGNED_IN', sessionFor('user-b') as never)
      queryClient.setQueryData(['saved-jobs'], [{ id: 'b:s jobb' }])

      await hantera('SIGNED_IN', sessionFor('user-c') as never)

      expect(queryClient.getQueryData(['saved-jobs'])).toBeUndefined()
    })
  })

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      await useAuthStore.getState().signOut()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.session).toBeNull()
    })

    /**
     * A31 (docs/review-2026-08-09/sakerhet-gdpr.md #10): CV, personligt brev
     * och annat deltagarinnehåll blev tidigare kvar i localStorage efter
     * utloggning eftersom signOut() bara nollade zustand-state. Målgruppen
     * sitter ofta på delade datorer, så det här är normalfallet — inte ett
     * kantfall. Testet gäller den faktiska nyckellistan i
     * utils/safeStorage.ts (USER_SCOPED_STORAGE_KEYS), inte bara ett urval,
     * så en ny innehållsbärande nyckel som glöms bort i listan INTE ger ett
     * falskt grönt test.
     */
    it('rensar allt deltagarinnehåll ur localStorage vid utloggning', async () => {
      const { USER_SCOPED_STORAGE_KEYS } = await import('@/utils/safeStorage')
      mockSignOut.mockResolvedValue({ error: null })

      for (const key of USER_SCOPED_STORAGE_KEYS) {
        localStorage.setItem(key, 'hemligt-innehall')
      }

      await useAuthStore.getState().signOut()

      for (const key of USER_SCOPED_STORAGE_KEYS) {
        // 'auth-storage' är undantaget: zustands persist-middleware skriver
        // OM den nyckeln på varje set() — ett lyckat signOut() persisterar
        // därför { profile: null, isAuthenticated: false } dit igen (se
        // authStore.ts partialize). Nyckeln finns alltså kvar, men utan PII —
        // kontrollera det uttryckligen i stället för att kräva att nyckeln
        // är helt borta.
        if (key === 'auth-storage') {
          expect(localStorage.getItem(key)).not.toContain('hemligt-innehall')
          continue
        }
        expect(localStorage.getItem(key)).toBeNull()
      }
    })

    it('rör INTE språkval, temaval eller cookie-samtycke vid utloggning', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      localStorage.setItem('language', 'sv')
      localStorage.setItem('theme', 'dark')
      localStorage.setItem('jobin_cookie_consent', 'true')

      await useAuthStore.getState().signOut()

      expect(localStorage.getItem('language')).toBe('sv')
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(localStorage.getItem('jobin_cookie_consent')).toBe('true')
    })

    it('rensar deltagarinnehåll även om Supabase-anropet misslyckas (fail closed på lokal data)', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Network error' } })
      localStorage.setItem('cv-edit-version', 'hemligt-cv')

      await useAuthStore.getState().signOut()

      expect(localStorage.getItem('cv-edit-version')).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com' }
      const initialProfile: Profile = {
        id: 'user1',
        email: 'test@example.com',
        first_name: 'Old',
        last_name: 'Name',
        role: 'USER',
        roles: ['USER'],
        activeRole: 'USER',
        phone: null,
        avatar_url: null,
        consultant_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        terms_accepted_at: null,
        privacy_accepted_at: null,
        ai_consent_at: null,
        marketing_consent_at: null,
        health_consent_at: null,
        wellness_consent_at: null,
      }

      // Set initial state
      useAuthStore.setState({
        user: mockUser,
        profile: initialProfile,
        isAuthenticated: true,
      })

      const updates = { first_name: 'New', last_name: 'Name' }

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      const result = await useAuthStore.getState().updateProfile(updates)

      const state = useAuthStore.getState()
      expect(result.error).toBeNull()
      expect(state.profile?.first_name).toBe('New')
    })

    it('should return error when not authenticated', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false })

      const result = await useAuthStore.getState().updateProfile({ first_name: 'New' })

      expect(result.error).toBe('Inte inloggad')
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' })

      useAuthStore.getState().clearError()

      expect(useAuthStore.getState().error).toBeNull()
    })
  })
})
