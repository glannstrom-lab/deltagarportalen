import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * profileStore ersatte 28 useState-hooks på profilsidan. Det som är värt att
 * testa är inte setters utan de tre ställen där data kan gå förlorad:
 *  - `_calculateCompletion` (driver "nästa steg"-nudgen deltagaren följer)
 *  - optimistisk `updateProfile` med rollback när skrivningen faller
 *  - offline-kön: ändringar gjorda utan nät ska tas upp igen, inte tappas
 */
const userApi = {
  getProfile: vi.fn(),
  getPreferences: vi.fn(),
  updateProfile: vi.fn(),
  updatePreferences: vi.fn(),
}
const cvApi = { getCV: vi.fn() }

vi.mock('../services/supabaseApi', () => ({
  userApi: {
    getProfile: (...a: unknown[]) => userApi.getProfile(...a),
    getPreferences: (...a: unknown[]) => userApi.getPreferences(...a),
    updateProfile: (...a: unknown[]) => userApi.updateProfile(...a),
    updatePreferences: (...a: unknown[]) => userApi.updatePreferences(...a),
  },
  cvApi: { getCV: (...a: unknown[]) => cvApi.getCV(...a) },
}))

const profileSkillsApi = { getAll: vi.fn() }
const profileDocumentsApi = { getAll: vi.fn() }
vi.mock('../services/profileEnhancementsApi', () => ({
  profileSkillsApi: { getAll: () => profileSkillsApi.getAll() },
  profileDocumentsApi: { getAll: () => profileDocumentsApi.getAll() },
}))

const notifications = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
  promise: vi.fn(),
}
vi.mock('../lib/toast', () => ({
  notifications: {
    success: (...a: unknown[]) => notifications.success(...a),
    error: (...a: unknown[]) => notifications.error(...a),
    warning: (...a: unknown[]) => notifications.warning(...a),
  },
  TOAST_MESSAGES: {
    SAVE_ERROR: 'Kunde inte spara. Försök igen.',
    OFFLINE: 'Du är offline.',
    ONLINE: 'Du är online igen!',
  },
}))

const { useProfileStore } = await import('./profileStore')

/** Prod-form: profiles.desired_jobs är objekt, inte strängar (verifierat
 *  mot databasen 2026-08-05 — 2 av 2 rader med innehåll är `object`). */
const yrke = (label: string, priority = 1) => ({ label, priority })

const tomPreferens = {
  desired_jobs: [],
  interests: [],
  availability: {},
  mobility: {},
  salary: {},
  labor_market_status: {},
  work_preferences: {},
  physical_requirements: {},
  consultant_data: {},
  therapist_data: {},
  support_goals: {},
}

const nollställ = () =>
  useProfileStore.setState({
    profile: null,
    preferences: { ...tomPreferens },
    cvData: null,
    enhancements: { skillsCount: 0, documentsCount: 0, hasSummary: false },
    activeTab: 'overview',
    loading: false,
    initialLoading: true,
    cloudSyncing: false,
    cloudSynced: true,
    lastSyncError: null,
    showOnboarding: false,
    onboardingStep: 0,
    pendingUpdates: [],
    isOnline: true,
    completion: { filled: 0, total: 12, percent: 0 },
  })

const sättOnline = (värde: boolean) =>
  Object.defineProperty(window.navigator, 'onLine', { value: värde, configurable: true })

describe('profileStore', () => {
  beforeEach(() => {
    // Fejkade timers för HELA sviten. `debouncedSave` är en modulnivå-closure
    // som lever kvar mellan tester — blandar man riktiga och fejkade timers
    // hänger en riktig timeout kvar och blockerar nästa test tyst.
    vi.useFakeTimers()
    ;(useProfileStore.getState()._debouncedSavePreferences as unknown as { cancel: () => void }).cancel()
    vi.clearAllMocks()
    localStorage.clear()
    sättOnline(true)
    nollställ()
    userApi.getProfile.mockResolvedValue({ first_name: 'Anna' })
    userApi.getPreferences.mockResolvedValue({ ...tomPreferens })
    userApi.updateProfile.mockResolvedValue(undefined)
    userApi.updatePreferences.mockResolvedValue(undefined)
    cvApi.getCV.mockResolvedValue(null)
    profileSkillsApi.getAll.mockResolvedValue([])
    profileDocumentsApi.getAll.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('_calculateCompletion', () => {
    it('tom profil ger 0 av 12 och pekar på förnamn som nästa steg', () => {
      const c = useProfileStore.getState()._calculateCompletion()

      expect(c).toMatchObject({ filled: 0, total: 12, percent: 0 })
      expect(c.nextStep).toMatchObject({ key: 'first_name', tab: 'overview' })
    })

    it('räknar ifyllda fält och avrundar procenten', () => {
      useProfileStore.setState({
        profile: { first_name: 'Anna', last_name: 'Ek', phone: '070', location: 'Umeå' },
      })

      const c = useProfileStore.getState()._calculateCompletion()

      expect(c.filled).toBe(4)
      expect(c.percent).toBe(33) // 4/12 = 33,33 -> 33
    })

    it('nästa steg är det FÖRSTA saknade fältet, inte det sista', () => {
      useProfileStore.setState({ profile: { first_name: 'Anna' } })

      expect(useProfileStore.getState()._calculateCompletion().nextStep?.key).toBe('last_name')
    })

    it('registeredAtAF=false räknas som ifyllt (svaret "nej" är ett svar)', () => {
      useProfileStore.setState({
        preferences: { ...tomPreferens, labor_market_status: { registeredAtAF: false } },
      })

      expect(useProfileStore.getState()._calculateCompletion().filled).toBe(1)
    })

    it('tomma listor räknas inte som ifyllda', () => {
      useProfileStore.setState({
        preferences: { ...tomPreferens, desired_jobs: [], work_preferences: { sectors: [] } },
      })

      expect(useProfileStore.getState()._calculateCompletion().filled).toBe(0)
    })

    it('helt ifylld profil ger 100 % och inget nästa steg', () => {
      useProfileStore.setState({
        profile: { first_name: 'A', last_name: 'B', phone: '1', location: 'Umeå' },
        preferences: {
          ...tomPreferens,
          desired_jobs: [yrke('Lager')],
          availability: { status: 'unemployed' },
          consultant_data: { cvStatus: 'complete' },
          therapist_data: { energyLevel: { sustainableHoursPerDay: 4 } },
          support_goals: { shortTerm: { goal: 'praktik' }, longTerm: { goal: 'fast jobb' } },
          labor_market_status: { registeredAtAF: true },
          work_preferences: { sectors: ['private'] },
        },
      })

      const c = useProfileStore.getState()._calculateCompletion()
      expect(c.filled).toBe(12)
      expect(c.percent).toBe(100)
      expect(c.nextStep).toBeUndefined()
    })
  })

  describe('laddning', () => {
    it('loadProfile lägger profilen i storen', async () => {
      userApi.getProfile.mockResolvedValue({ first_name: 'Anna', last_name: 'Ek' })

      await useProfileStore.getState().loadProfile()

      expect(useProfileStore.getState().profile).toMatchObject({ first_name: 'Anna' })
    })

    it('loadProfile visar ett fel i stället för att krascha sidan', async () => {
      userApi.getProfile.mockRejectedValue(new Error('RLS denied'))

      await expect(useProfileStore.getState().loadProfile()).resolves.toBeUndefined()
      expect(notifications.error).toHaveBeenCalledWith('Kunde inte ladda profil')
    })

    it('loadPreferences sväljer fel tyst (icke-kritiskt)', async () => {
      userApi.getPreferences.mockRejectedValue(new Error('nej'))

      await useProfileStore.getState().loadPreferences()

      expect(notifications.error).not.toHaveBeenCalled()
    })

    it('loadCvData normaliserar undefined till null', async () => {
      cvApi.getCV.mockResolvedValue(undefined)

      await useProfileStore.getState().loadCvData()

      expect(useProfileStore.getState().cvData).toBeNull()
    })

    it('loadEnhancements räknar kompetenser och dokument', async () => {
      profileSkillsApi.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }])
      profileDocumentsApi.getAll.mockResolvedValue([{ id: 1 }])
      useProfileStore.setState({ profile: { ai_summary: 'text' } })

      await useProfileStore.getState().loadEnhancements()

      expect(useProfileStore.getState().enhancements).toEqual({
        skillsCount: 2,
        documentsCount: 1,
        hasSummary: true,
      })
    })

    it('loadAll släcker initialLoading även när allt faller', async () => {
      userApi.getProfile.mockRejectedValue(new Error('nej'))
      userApi.getPreferences.mockRejectedValue(new Error('nej'))

      await useProfileStore.getState().loadAll()

      expect(useProfileStore.getState().initialLoading).toBe(false)
    })

    it('loadAll visar onboarding för en tom profil som inte sett den', async () => {
      await useProfileStore.getState().loadAll()

      expect(useProfileStore.getState().showOnboarding).toBe(true)
    })

    it('loadAll visar INTE onboarding för den som redan sett den', async () => {
      localStorage.setItem('profile_onboarding_seen', 'true')

      await useProfileStore.getState().loadAll()

      expect(useProfileStore.getState().showOnboarding).toBe(false)
    })

    it('loadAll visar INTE onboarding när profilen redan är påbörjad', async () => {
      userApi.getProfile.mockResolvedValue({
        first_name: 'Anna', last_name: 'Ek', phone: '070', location: 'Umeå',
      })

      await useProfileStore.getState().loadAll()

      expect(useProfileStore.getState().completion.percent).toBeGreaterThanOrEqual(30)
      expect(useProfileStore.getState().showOnboarding).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('uppdaterar optimistiskt innan servern svarat', async () => {
      let släpp: () => void = () => {}
      userApi.updateProfile.mockImplementation(() => new Promise<void>(r => { släpp = r }))

      const p = useProfileStore.getState().updateProfile({ first_name: 'Anna' })

      expect(useProfileStore.getState().profile).toMatchObject({ first_name: 'Anna' })
      expect(useProfileStore.getState().cloudSyncing).toBe(true)

      släpp()
      await p
      expect(useProfileStore.getState().cloudSynced).toBe(true)
      expect(useProfileStore.getState().cloudSyncing).toBe(false)
    })

    it('slår ihop med befintlig profil i stället för att ersätta den', async () => {
      useProfileStore.setState({ profile: { first_name: 'Anna', last_name: 'Ek' } })

      await useProfileStore.getState().updateProfile({ phone: '070' })

      expect(useProfileStore.getState().profile).toMatchObject({
        first_name: 'Anna', last_name: 'Ek', phone: '070',
      })
    })

    it('rullar tillbaka från servern och varnar när skrivningen faller', async () => {
      useProfileStore.setState({ profile: { first_name: 'Anna' } })
      userApi.updateProfile.mockRejectedValue(new Error('RLS denied'))
      userApi.getProfile.mockResolvedValue({ first_name: 'Anna' })

      await useProfileStore.getState().updateProfile({ first_name: 'Ändrat' })

      expect(userApi.getProfile).toHaveBeenCalled()
      expect(useProfileStore.getState().profile).toMatchObject({ first_name: 'Anna' })
      expect(useProfileStore.getState().cloudSyncing).toBe(false)
      expect(notifications.error).toHaveBeenCalledWith('Kunde inte spara. Försök igen.')
    })
  })

  describe('updatePreferences', () => {
    it('uppdaterar lokalt direkt och djupmergar nästlade objekt', () => {
      useProfileStore.setState({
        preferences: { ...tomPreferens, availability: { status: 'unemployed', availableFrom: '2026-09-01' } },
      })

      useProfileStore.getState().updatePreferences({ availability: { status: 'student' } })

      expect(useProfileStore.getState().preferences.availability).toEqual({
        status: 'student',
        availableFrom: '2026-09-01', // ← fältet som INTE skickades med måste överleva
      })
      expect(useProfileStore.getState().cloudSynced).toBe(false)
    })

    it('räknar om completion — men en uppdatering försent (se "kända defekter")', () => {
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('Lager')] })
      expect(useProfileStore.getState().completion.filled).toBe(0)

      useProfileStore.getState().updatePreferences({ interests: ['bygg'] })
      expect(useProfileStore.getState().completion.filled).toBe(1)
    })

    it('skriver till servern debounce:at, inte per tangenttryck', async () => {
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('a')] })
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('a'), yrke('b')] })
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('a'), yrke('b'), yrke('c')] })
      expect(userApi.updatePreferences).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1000)

      expect(userApi.updatePreferences).toHaveBeenCalledTimes(1)
      expect(userApi.updatePreferences.mock.calls[0][0]).toMatchObject({
        desired_jobs: [yrke('a'), yrke('b'), yrke('c')],
      })
    })

    it('köar ändringen i stället för att tappa den när nätet är nere', async () => {
      sättOnline(false)

      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('a')] })
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('a'), yrke('b')] })
      await vi.advanceTimersByTimeAsync(1000)

      expect(userApi.updatePreferences).not.toHaveBeenCalled()
      expect(useProfileStore.getState().pendingUpdates).toHaveLength(1)
      expect(useProfileStore.getState().isOnline).toBe(false)
      expect(notifications.warning).toHaveBeenCalled()
    })

    it('sparar felmeddelandet och slutar påstå att allt är synkat', async () => {
      userApi.updatePreferences.mockRejectedValue(new Error('RLS denied'))

      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('a')] })
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('a'), yrke('b')] })
      await vi.advanceTimersByTimeAsync(1000)

      expect(useProfileStore.getState().lastSyncError).toBe('RLS denied')
      expect(useProfileStore.getState().cloudSynced).toBe(false)
      expect(useProfileStore.getState().cloudSyncing).toBe(false)
      expect(notifications.error).toHaveBeenCalledWith('RLS denied')
    })
  })

  describe('offline-kön', () => {
    it('_syncOfflineQueue gör ingenting när kön är tom', async () => {
      await useProfileStore.getState()._syncOfflineQueue()

      expect(userApi.updatePreferences).not.toHaveBeenCalled()
    })

    it('_syncOfflineQueue avstår när nätet fortfarande är nere', async () => {
      sättOnline(false)
      useProfileStore.setState({ pendingUpdates: [{ desired_jobs: [yrke('a')] }] })

      await useProfileStore.getState()._syncOfflineQueue()

      expect(userApi.updatePreferences).not.toHaveBeenCalled()
      expect(useProfileStore.getState().pendingUpdates).toHaveLength(1)
    })

    it('slår ihop alla köade ändringar till EN skrivning och tömmer kön', async () => {
      useProfileStore.setState({
        pendingUpdates: [{ desired_jobs: [yrke('a')] }, { interests: ['x'] }, { desired_jobs: [yrke('b')] }],
      })

      await useProfileStore.getState()._syncOfflineQueue()

      expect(userApi.updatePreferences).toHaveBeenCalledTimes(1)
      expect(userApi.updatePreferences.mock.calls[0][0]).toMatchObject({
        desired_jobs: [yrke('b')],
        interests: ['x'],
      })
      expect(useProfileStore.getState().pendingUpdates).toEqual([])
      expect(useProfileStore.getState().cloudSynced).toBe(true)
      expect(useProfileStore.getState().isOnline).toBe(true)
    })

    it('behåller kön när skrivningen misslyckas — inget får tappas', async () => {
      userApi.updatePreferences.mockRejectedValue(new Error('nej'))
      useProfileStore.setState({ pendingUpdates: [{ desired_jobs: [yrke('a')] }] })

      await useProfileStore.getState()._syncOfflineQueue()

      expect(useProfileStore.getState().pendingUpdates).toHaveLength(1)
      expect(useProfileStore.getState().cloudSyncing).toBe(false)
    })
  })

  describe('UI-tillstånd', () => {
    it('updateProfileImage sätter och nollar bild-url', () => {
      useProfileStore.setState({ profile: { first_name: 'Anna' } })

      useProfileStore.getState().updateProfileImage('https://blob/x.png')
      expect(useProfileStore.getState().profile?.profile_image_url).toBe('https://blob/x.png')

      useProfileStore.getState().updateProfileImage(null)
      expect(useProfileStore.getState().profile?.profile_image_url).toBeUndefined()
    })

    it('updateProfileImage utan profil skapar inte en tom profil', () => {
      useProfileStore.getState().updateProfileImage('https://blob/x.png')

      expect(useProfileStore.getState().profile).toBeNull()
    })

    it('setActiveTab, setShowOnboarding och setOnboardingStep uppdaterar tillståndet', () => {
      const s = useProfileStore.getState()
      s.setActiveTab('jobbsok')
      s.setShowOnboarding(true)
      s.setOnboardingStep(2)

      expect(useProfileStore.getState().activeTab).toBe('jobbsok')
      expect(useProfileStore.getState().showOnboarding).toBe(true)
      expect(useProfileStore.getState().onboardingStep).toBe(2)
    })

    it('completeOnboarding kommer ihåg valet över omladdning', () => {
      useProfileStore.setState({ showOnboarding: true, onboardingStep: 3 })

      useProfileStore.getState().completeOnboarding()

      expect(localStorage.getItem('profile_onboarding_seen')).toBe('true')
      expect(useProfileStore.getState().showOnboarding).toBe(false)
      expect(useProfileStore.getState().onboardingStep).toBe(0)
    })
  })

  /**
   * ⚠️ KÄNDA DEFEKTER (fynd i D13, 2026-08-05). Testerna nedan beskriver det
   * KORREKTA kontraktet och är markerade `it.fails` — de går alltså gröna så
   * länge buggen finns kvar och blir RÖDA när den fixas. Det är signalen att
   * ta bort `.fails`, inte att sänka ambitionen. Ingen av dem cementerar
   * buggen som önskat beteende.
   */
  describe('kända defekter', () => {
    it.fails('completion ska räknas om MED den nya profilen, inte den gamla', async () => {
      userApi.getProfile.mockResolvedValue({ first_name: 'Anna', last_name: 'Ek' })

      await useProfileStore.getState().loadProfile()

      // profileStore.ts:227 — `set({ profile: data, completion: get()._calculateCompletion() })`.
      // Argumentet beräknas FÖRE set() körs, så `get().profile` är fortfarande
      // det gamla värdet. Samma mönster i loadPreferences (rad 244) och
      // updatePreferences (rad 361). Följd: "nästa steg"-nudgen på profilsidan
      // ligger ett steg efter tills något annat råkar räkna om den.
      expect(useProfileStore.getState().completion.filled).toBe(2)
    })

    it.fails('updatePreferences ska ge färsk completion redan vid första ändringen', () => {
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('Lager')] })

      expect(useProfileStore.getState().completion.filled).toBe(1)
    })

    it('en ENSAM preferensändring sparas till servern', async () => {
      // ÅTGÄRDAD 2026-08-05. Var ett följdfel av debounce-buggen: första
      // anropet efter en tyst period startade ingen timer och försvann, så en
      // deltagare som bockade i EN inställning och lämnade sidan aldrig nådde
      // `user_preferences`. Kvar som regressionsvakt — se src/lib/debounce.ts.
      useProfileStore.getState().updatePreferences({ desired_jobs: [yrke('Lager')] })
      await vi.advanceTimersByTimeAsync(5000)

      expect(userApi.updatePreferences).toHaveBeenCalledTimes(1)
    })
  })
})
