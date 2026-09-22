/* eslint-disable @typescript-eslint/no-explicit-any -- vi.mock-fabriker tar emot variadic args och behöver any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore, skapaAuthByteHanterare, type Profile } from './authStore'
import { queryClient } from '@/lib/queryClient'
import type { User } from '@supabase/supabase-js'

/**
 * Fullständiga fixtures för `Profile`/`User`. `Profile` fick 13 nya
 * obligatoriska fält (bio, location, önskade yrken, stödmål m.fl.) efter
 * att de här testerna skrevs — tre ofullständiga objektliteraler (TS2740)
 * och en ofullständig `User` (TS2739) låg kvar och fällde
 * `typecheck:ceiling`. `overrides` låter varje test bara skriva det den
 * bryr sig om, som `profil()`-hjälparen längre ned i filen redan gjorde
 * lokalt för ett annat describe-block.
 */
function makeMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
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
    bio: null,
    location: null,
    employment_status: null,
    desired_jobs: null,
    career_goals: null,
    work_preferences: null,
    availability: null,
    mobility: null,
    salary: null,
    support_goals: null,
    interests: null,
    onboarding_completed: false,
    terms_accepted_at: null,
    privacy_accepted_at: null,
    ai_consent_at: null,
    marketing_consent_at: null,
    health_consent_at: null,
    wellness_consent_at: null,
    program: null,
    ...overrides,
  }
}

function makeMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user1',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01',
    ...overrides,
  }
}

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
      const mockProfile: Profile = makeMockProfile()

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
      const mockProfile: Profile = makeMockProfile({ email: credentials.email })

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            // maybeSingle() sedan 2026-09-22 (uppdrag A) — signIn läser inte
            // längre error-lös med .single(), se authStore.ts.
            maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
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
            // maybeSingle() sedan 2026-09-22 (uppdrag A), se authStore.ts signUp.
            maybeSingle: vi.fn().mockResolvedValue({
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
            // maybeSingle() sedan 2026-09-22 (uppdrag A), se authStore.ts signUp.
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
      const mockUser = makeMockUser()
      const initialProfile: Profile = makeMockProfile({ first_name: 'Old', last_name: 'Name' })

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

describe('aktiv roll skrivs och läses mot rätt kolumn (2026-09-15)', () => {
  /**
   * Bevisat mot prod innan fixen:
   *   PATCH /rest/v1/profiles { "activeRole": "USER" }
   *     → 400 PGRST204 "Could not find the 'activeRole' column"
   *   { "active_role": "USER" } → 200
   *
   * Felet maskerade sig självt: setActiveRole uppdaterar det lokala
   * tillståndet optimistiskt FÖRE skrivningen, och 400:an hamnade i ett
   * console.error. Växlingen såg ut att lyckas och var borta vid omladdning.
   */
  const profil = (over: Partial<Profile> = {}): Profile =>
    makeMockProfile({
      first_name: 'Test',
      last_name: 'Person',
      role: 'SUPERADMIN',
      roles: ['USER', 'SUPERADMIN'],
      activeRole: 'SUPERADMIN',
      ...over,
    })

  it('läser activeRole ur kolumnen active_role, inte ur ett fält som inte finns', async () => {
    // Raden är formad som PROD ger den: snake_case, inget activeRole-fält.
    // Den befintliga fixturen ovan har activeRole i raden, vilket databasen
    // aldrig returnerar — och det var precis därför läsfelet kunde leva:
    // fixturen var snällare än verkligheten.
    const rad = {
      id: 'user1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'Person',
      role: 'SUPERADMIN',
      roles: ['USER', 'SUPERADMIN'],
      active_role: 'USER',
    }
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 't', user: { id: 'user1' } } }, error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: rad, error: null }) }),
      }),
    })

    await useAuthStore.getState().initialize()

    // Faller läsningen tillbaka på role blir det SUPERADMIN — och en
    // superadmin som växlat till Deltagare hamnar i fel vy.
    expect(useAuthStore.getState().profile?.activeRole).toBe('USER')
  })

  it('setActiveRole skickar active_role, aldrig activeRole', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: (lös: (r: { error: null }) => void) => { lös({ error: null }); return { catch: vi.fn() } },
      }),
    })
    mockFrom.mockReturnValue({ update })
    useAuthStore.setState({ profile: profil() })

    useAuthStore.getState().setActiveRole('USER')

    expect(update).toHaveBeenCalledTimes(1)
    const skickat = update.mock.calls[0][0]
    expect(skickat).toEqual({ active_role: 'USER' })
    expect(skickat).not.toHaveProperty('activeRole')
  })

  it('updateProfile mappar activeRole till kolumnen i stället för att skicka den rå', async () => {
    // Dörren buggen kan komma tillbaka genom: updateProfile skickade tidigare
    // hela objektet vidare, och EN felaktig nyckel fäller hela uppdateringen.
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockFrom.mockReturnValue({ update })
    useAuthStore.setState({
      user: { id: 'user1' } as never,
      profile: profil(),
    })

    await useAuthStore.getState().updateProfile({ activeRole: 'USER', first_name: 'Ny' })

    const skickat = update.mock.calls[0][0]
    expect(skickat).not.toHaveProperty('activeRole')
    expect(skickat).toMatchObject({ active_role: 'USER', first_name: 'Ny' })
  })

  it('negativ kontroll — testet kan falla', () => {
    // Utan den här skulle de två ovan kunna passera av fel skäl, t.ex. om
    // update aldrig anropades alls.
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockFrom.mockReturnValue({ update })
    useAuthStore.setState({ profile: profil({ roles: ['SUPERADMIN'] }) })

    // 'USER' finns inte i roles → setActiveRole ska vägra och inte skriva alls.
    useAuthStore.getState().setActiveRole('USER')
    expect(update).not.toHaveBeenCalled()
  })
})
