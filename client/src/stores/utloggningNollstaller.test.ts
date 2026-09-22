import { describe, it, expect, vi } from 'vitest'
import { rensaVidUtloggning } from '@/lib/rensaVidUtloggning'

/**
 * Uppdraget 2026-09-22 ("persistens och utloggning"): React Query-cachen
 * rensas redan vid utloggning och kontobyte (KA2, 2026-09-08), och
 * localStorage-utkasten likaså (A31). INGEN av dem rör Zustand-storesens
 * EGNA in-memory state — och en store är ett modulnivå-singleton som lever
 * så länge fliken gör det. `useAITeamStore.messages` (samtal med
 * AI-coachen, kan beröra mående) och `useProfileStore.preferences` (lön,
 * önskade yrken, stödmål) låg kvar i minnet efter utloggning tills den här
 * omgången lade `registreraRensning`-anrop i varje store.
 *
 * De här testerna hade FALLIT innan dess — de importerar de riktiga
 * stores (inte mockar) och de riktiga rensningarna som stores registrerar
 * vid modulladdning, så de nollställer sig INTE bara i teorin.
 *
 * Mockar bara det som krävs för att modulerna ska gå att importera
 * (services profileStore pratar med) — själva funktionerna anropas aldrig
 * i de här testerna, bara `setState` och `rensaVidUtloggning()`.
 */

vi.mock('../services/supabaseApi', () => ({
  userApi: { getProfile: vi.fn(), getPreferences: vi.fn(), updateProfile: vi.fn(), updatePreferences: vi.fn() },
  cvApi: { getCV: vi.fn() },
}))
vi.mock('../services/profileEnhancementsApi', () => ({
  profileSkillsApi: { getAll: vi.fn() },
  profileDocumentsApi: { getAll: vi.fn() },
}))

const { useAITeamStore } = await import('./aiTeamStore')
const { useCVStore } = await import('./cvStore')
const { useEnergyStore } = await import('./energyStoreWithSync')
const { useSettingsStore } = await import('./settingsStore')
const { useProfileStore } = await import('./profileStore')
const { useFocusWizardStore } = await import('./focusWizardStore')
const { skapaAuthByteHanterare } = await import('./authStore')

describe('Zustand-stores nollställs vid utloggning (rensaVidUtloggning)', () => {
  it('aiTeamStore: samtalet med AI-coachen töms, agentvalet återgår till default', () => {
    useAITeamStore.setState({
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'Jag mår dåligt och orkar inte söka jobb idag',
          timestamp: new Date(),
          agentId: 'arbetsterapeut',
          personalityId: 'professional',
        },
      ],
      selectedAgent: 'arbetsterapeut',
      error: 'nätverksfel',
      isLoading: true,
      pendingQuestion: 'en oställd fråga',
    })

    rensaVidUtloggning()

    const state = useAITeamStore.getState()
    expect(state.messages).toEqual([])
    expect(state.selectedAgent).toBe('arbetskonsulent')
    expect(state.error).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.pendingQuestion).toBeNull()
    // Persisterad del ('ai-team-storage') ska också vara borta, inte bara
    // in-memory state — annars läser nästa sidladdning tillbaka agentvalet.
    expect(localStorage.getItem('ai-team-storage')).toBeNull()
  })

  it('profileStore: profil, preferenser, CV-data och den väntande offline-kön töms', () => {
    useProfileStore.setState({
      profile: { id: 'u1', first_name: 'Anna', email: 'anna@example.com' },
      preferences: {
        desired_jobs: [{ label: 'Undersköterska', priority: 1 }],
        interests: ['vård'],
        availability: {},
        mobility: {},
        salary: { expectationMin: 32000 },
        labor_market_status: {},
        work_preferences: {},
        physical_requirements: {},
        consultant_data: {},
        therapist_data: {},
        support_goals: { shortTerm: { goal: 'Sova bättre' } },
      },
      cvData: { id: 'cv1' } as never,
      activeTab: 'stod',
      onboardingStep: 2,
      showOnboarding: true,
      // Den här är den skarpaste läckan: en offline-kö som SKICKAS till
      // servern vid nästa lyckade updatePreferences-anrop.
      pendingUpdates: [{ salary: { expectationMin: 32000 } }],
    })

    rensaVidUtloggning()

    const state = useProfileStore.getState()
    expect(state.profile).toBeNull()
    expect(state.cvData).toBeNull()
    expect(state.pendingUpdates).toEqual([])
    expect(state.activeTab).toBe('overview')
    expect(state.onboardingStep).toBe(0)
    expect(state.showOnboarding).toBe(false)
    expect(state.preferences.desired_jobs).toEqual([])
    expect(state.preferences.salary).toEqual({})
    expect(state.preferences.support_goals).toEqual({})
    expect(localStorage.getItem('profile-storage')).toBeNull()
  })

  it('cvStore: draft-flaggan som styr "Fortsätt där du slutade" töms', () => {
    useCVStore.setState({ hasDraft: true, currentStep: 4, cvScore: 80 })

    rensaVidUtloggning()

    const state = useCVStore.getState()
    expect(state.hasDraft).toBe(false)
    expect(state.currentStep).toBe(1)
    expect(localStorage.getItem('cv-ui-storage')).toBeNull()
  })

  it('energyStoreWithSync: energinivå och inloggningsmönster töms', () => {
    useEnergyStore.setState({
      level: 'low',
      lastUpdated: '2026-09-20T10:00:00.000Z',
      loginStreak: 7,
      lastLoginDate: '2026-09-21',
    })

    rensaVidUtloggning()

    const state = useEnergyStore.getState()
    expect(state.level).toBe('medium')
    expect(state.lastUpdated).toBeNull()
    expect(state.loginStreak).toBe(0)
    expect(state.lastLoginDate).toBeNull()
    expect(localStorage.getItem('energy-storage')).toBeNull()
  })

  it('focusWizardStore: sidor markerade "hoppa över guiden" töms', () => {
    useFocusWizardStore.setState({ dismissedPaths: ['/cv', '/karriar'] })

    rensaVidUtloggning()

    expect(useFocusWizardStore.getState().dismissedPaths).toEqual([])
  })

  it('settingsStore: notiser/energi/onboarding töms, men språk och tillgänglighet överlever MED FLIT', () => {
    useSettingsStore.setState({
      language: 'en',
      highContrast: true,
      largeText: true,
      calmMode: true,
      focusMode: true,
      grafikstil: 'action',
      emailNotifications: false,
      pushNotifications: false,
      weeklySummary: true,
      hasCompletedOnboarding: true,
      energyLevel: 'low',
      lastSynced: '2026-09-21T10:00:00.000Z',
    })

    rensaVidUtloggning()

    const state = useSettingsStore.getState()
    // Överlever med flit — tema/tillgänglighet, inte personuppgift.
    expect(state.language).toBe('en')
    expect(state.highContrast).toBe(true)
    expect(state.largeText).toBe(true)
    expect(state.calmMode).toBe(true)
    expect(state.focusMode).toBe(true)
    expect(state.grafikstil).toBe('action')
    // Nollställs — annars kan syncWithServer() skriva förra deltagarens
    // notisinställningar till NÄSTA persons konto (se motiveringen i
    // settingsStore.ts).
    expect(state.emailNotifications).toBe(true)
    expect(state.pushNotifications).toBe(true)
    expect(state.weeklySummary).toBe(false)
    expect(state.hasCompletedOnboarding).toBe(false)
    expect(state.energyLevel).toBe('medium')
    expect(state.lastSynced).toBeNull()
  })

  it('kontobyte UTAN explicit utloggning (ny person loggar in i samma flik) nollställer stores — mönstret från cache-läckan 2026-08-19, en våning ned', async () => {
    const hanteraByte = skapaAuthByteHanterare()
    const sessionFor = (userId: string) => ({ user: { id: userId } }) as never

    // Deltagare A loggar in och pratar med AI-coachen.
    await hanteraByte('SIGNED_IN', sessionFor('deltagare-a'))
    useAITeamStore.setState({
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'Hemligt för A',
          timestamp: new Date(),
          agentId: 'arbetskonsulent',
          personalityId: 'professional',
        },
      ],
    })

    // Samma person igen (t.ex. tokenförnyelse) — ska INTE nollställa.
    await hanteraByte('SIGNED_IN', sessionFor('deltagare-a'))
    expect(useAITeamStore.getState().messages).toHaveLength(1)

    // En NY person loggar in i samma flik — ingen har tryckt "logga ut".
    // Det är exakt vägen förbi knappen som KA2 beskriver för cachen.
    await hanteraByte('SIGNED_IN', sessionFor('deltagare-b'))

    expect(useAITeamStore.getState().messages).toEqual([])
  })
})
