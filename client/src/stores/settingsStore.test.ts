import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * settingsStore styr tillgänglighetsinställningarna — lugnt läge, fokusläge,
 * hög kontrast, stor text. För målgruppen är de inte "preferenser" utan
 * förutsättningen för att kunna använda portalen alls. Två saker testas:
 * att varje växling faktiskt skrivs till `user_preferences` i molnet (annars
 * är den borta på nästa enhet), och att syncWithServer inte skriver över
 * lokala val med null.
 */
type Payload = Record<string, unknown>
type Svar<T> = { data: T; error: { message: string } | null }

const upsert = vi.fn(async (_rad: Payload, _opts?: Payload): Promise<{ error: { message: string } | null }> => ({ error: null }))
const maybeSingle = vi.fn(async (): Promise<Svar<Payload | null>> => ({ data: null, error: null }))
const getUser = vi.fn(async (): Promise<{ data: { user: { id: string } | null } }> => ({ data: { user: { id: 'user-1' } } }))

const from = vi.fn((_tabell: string) => ({
  upsert,
  select: vi.fn(() => ({
    eq: vi.fn(() => ({ maybeSingle })),
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => getUser() },
    from: (t: string) => from(t),
  },
}))

const changeLanguage = vi.fn()
vi.mock('@/i18n/config', () => ({
  default: { changeLanguage: (l: string) => changeLanguage(l) },
}))

const { useSettingsStore } = await import('./settingsStore')

const utgångsläge = {
  calmMode: false,
  focusMode: false,
  emailNotifications: true,
  pushNotifications: true,
  weeklySummary: false,
  highContrast: false,
  largeText: false,
  showCoachWidget: true,
  language: 'sv' as const,
  energyLevel: 'medium' as const,
  hasCompletedOnboarding: false,
  isLoading: false,
  lastSynced: null,
}

describe('settingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upsert.mockResolvedValue({ error: null })
    maybeSingle.mockResolvedValue({ data: null, error: null })
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    useSettingsStore.setState(utgångsläge)
  })

  describe('växlingar', () => {
    it.each([
      ['toggleCalmMode', 'calmMode', 'calm_mode'],
      ['toggleFocusMode', 'focusMode', 'focus_mode'],
      ['toggleHighContrast', 'highContrast', 'high_contrast'],
      ['toggleLargeText', 'largeText', 'large_text'],
    ] as const)('%s växlar %s och sparar %s i molnet', async (action, lokal, kolumn) => {
      const före = useSettingsStore.getState()[lokal]

      useSettingsStore.getState()[action]()
      await vi.waitFor(() => expect(upsert).toHaveBeenCalled())

      expect(useSettingsStore.getState()[lokal]).toBe(!före)
      expect(from).toHaveBeenCalledWith('user_preferences')
      expect(upsert.mock.calls[0][0]).toMatchObject({ user_id: 'user-1', [kolumn]: !före })
    })

    it('toggleCoachWidget stänger av widgeten och sparar det', async () => {
      useSettingsStore.getState().toggleCoachWidget()
      await vi.waitFor(() => expect(upsert).toHaveBeenCalled())

      expect(useSettingsStore.getState().showCoachWidget).toBe(false)
      expect(upsert.mock.calls[0][0]).toMatchObject({ show_coach_widget: false })
    })

    it('växlar tillbaka vid andra anropet', () => {
      useSettingsStore.getState().toggleCalmMode()
      useSettingsStore.getState().toggleCalmMode()

      expect(useSettingsStore.getState().calmMode).toBe(false)
    })
  })

  describe('notisinställningar', () => {
    it.each([
      ['setEmailNotifications', 'emailNotifications', 'email_notifications'],
      ['setPushNotifications', 'pushNotifications', 'push_notifications'],
      ['setWeeklySummary', 'weeklySummary', 'weekly_summary'],
    ] as const)('%s sparar värdet i molnet', async (action, lokal, kolumn) => {
      useSettingsStore.getState()[action](true)
      await vi.waitFor(() => expect(upsert).toHaveBeenCalled())

      expect(useSettingsStore.getState()[lokal]).toBe(true)
      expect(upsert.mock.calls[0][0]).toMatchObject({ [kolumn]: true })
    })
  })

  it('setLanguage byter i18next-språk OCH sparar det', async () => {
    useSettingsStore.getState().setLanguage('en')
    await vi.waitFor(() => expect(upsert).toHaveBeenCalled())

    expect(changeLanguage).toHaveBeenCalledWith('en')
    expect(useSettingsStore.getState().language).toBe('en')
    expect(upsert.mock.calls[0][0]).toMatchObject({ language: 'en' })
  })

  it('setEnergyLevel är avsiktligt lokal — den synkas inte till molnet', async () => {
    useSettingsStore.getState().setEnergyLevel('low')

    expect(useSettingsStore.getState().energyLevel).toBe('low')
    await new Promise(r => setTimeout(r, 0))
    expect(upsert).not.toHaveBeenCalled()
  })

  it('setHasCompletedOnboarding sparas i molnet', async () => {
    useSettingsStore.getState().setHasCompletedOnboarding(true)
    await vi.waitFor(() => expect(upsert).toHaveBeenCalled())

    expect(upsert.mock.calls[0][0]).toMatchObject({ has_completed_onboarding: true })
  })

  describe('_saveToServer', () => {
    it('gör ingenting när ingen är inloggad', async () => {
      getUser.mockResolvedValue({ data: { user: null } })

      await useSettingsStore.getState()._saveToServer({ calm_mode: true })

      expect(upsert).not.toHaveBeenCalled()
    })

    it('sätter lastSynced vid lyckad skrivning', async () => {
      await useSettingsStore.getState()._saveToServer({ calm_mode: true })

      expect(useSettingsStore.getState().lastSynced).toBeTruthy()
    })

    it('lämnar lastSynced orörd när skrivningen misslyckas', async () => {
      upsert.mockResolvedValue({ error: { message: 'RLS denied' } })

      await useSettingsStore.getState()._saveToServer({ calm_mode: true })

      expect(useSettingsStore.getState().lastSynced).toBeNull()
    })

    it('kastar inte vidare när nätverket dör', async () => {
      upsert.mockRejectedValue(new Error('nätverket dog'))

      await expect(
        useSettingsStore.getState()._saveToServer({ calm_mode: true })
      ).resolves.toBeUndefined()
    })
  })

  describe('syncWithServer', () => {
    it('läser in serverns värden och släcker isLoading', async () => {
      maybeSingle.mockResolvedValue({
        data: {
          calm_mode: true,
          focus_mode: true,
          email_notifications: false,
          push_notifications: false,
          weekly_summary: true,
          high_contrast: true,
          large_text: true,
          language: 'en',
          has_completed_onboarding: true,
          show_coach_widget: false,
          updated_at: '2026-08-05T10:00:00.000Z',
        },
        error: null,
      })

      await useSettingsStore.getState().syncWithServer()

      const s = useSettingsStore.getState()
      expect(s.calmMode).toBe(true)
      expect(s.highContrast).toBe(true)
      expect(s.showCoachWidget).toBe(false)
      expect(s.language).toBe('en')
      expect(changeLanguage).toHaveBeenCalledWith('en')
      expect(s.lastSynced).toBe('2026-08-05T10:00:00.000Z')
      expect(s.isLoading).toBe(false)
    })

    it('null-kolumner skriver INTE över lokala val', async () => {
      useSettingsStore.setState({ calmMode: true, largeText: true })
      maybeSingle.mockResolvedValue({
        data: { calm_mode: null, large_text: null, updated_at: null },
        error: null,
      })

      await useSettingsStore.getState().syncWithServer()

      expect(useSettingsStore.getState().calmMode).toBe(true)
      expect(useSettingsStore.getState().largeText).toBe(true)
    })

    it('ogiltigt språk från servern ignoreras', async () => {
      maybeSingle.mockResolvedValue({
        data: { language: 'de', updated_at: null },
        error: null,
      })

      await useSettingsStore.getState().syncWithServer()

      expect(useSettingsStore.getState().language).toBe('sv')
      expect(changeLanguage).not.toHaveBeenCalled()
    })

    it('utan rad på servern pushas de lokala inställningarna upp', async () => {
      useSettingsStore.setState({ calmMode: true, focusMode: true })
      maybeSingle.mockResolvedValue({ data: null, error: null })

      await useSettingsStore.getState().syncWithServer()

      expect(upsert).toHaveBeenCalledTimes(1)
      expect(upsert.mock.calls[0][0]).toMatchObject({ calm_mode: true, focus_mode: true })
      expect(useSettingsStore.getState().isLoading).toBe(false)
    })

    it('släcker isLoading när ingen är inloggad', async () => {
      getUser.mockResolvedValue({ data: { user: null } })

      await useSettingsStore.getState().syncWithServer()

      expect(useSettingsStore.getState().isLoading).toBe(false)
    })

    it('släcker isLoading när läsningen ger fel', async () => {
      maybeSingle.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })

      await useSettingsStore.getState().syncWithServer()

      expect(useSettingsStore.getState().isLoading).toBe(false)
      expect(upsert).not.toHaveBeenCalled()
    })

    it('släcker isLoading även när anropet kastar', async () => {
      getUser.mockRejectedValue(new Error('offline'))

      await useSettingsStore.getState().syncWithServer()

      expect(useSettingsStore.getState().isLoading).toBe(false)
    })
  })
})
