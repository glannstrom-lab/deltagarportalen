/**
 * Settings Store med Supabase-synkronisering
 * Sparar användarinställningar i molnet för synk mellan enheter
 */
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import i18n from '@/i18n/config'
import { storageLogger } from '@/lib/logger'
import { registreraRensning } from '@/lib/rensaVidUtloggning'

export type EnergyLevel = 'low' | 'medium' | 'high'
export type Language = 'sv' | 'en'
/**
 * Grafikstil (beslut Mikael 2026-09-10): två uppsättningar bilder på samma
 * platser — 'mjuk' (realistiskt fotografi, dagsljus, standard) och 'action'
 * (renderad, dramatiskt ljus, EA Sports-känsla). Användaren väljer under
 * Inställningar → Utseende.
 */
export type Grafikstil = 'mjuk' | 'action'

interface SettingsState {
  // Tillgänglighet
  calmMode: boolean
  toggleCalmMode: () => void

  // Fokusläge (NPF-anpassat)
  focusMode: boolean
  toggleFocusMode: () => void

  // Notifikationer
  emailNotifications: boolean
  pushNotifications: boolean
  weeklySummary: boolean
  setEmailNotifications: (value: boolean) => void
  setPushNotifications: (value: boolean) => void
  setWeeklySummary: (value: boolean) => void

  // Utseende
  highContrast: boolean
  largeText: boolean
  toggleHighContrast: () => void
  toggleLargeText: () => void

  // Coach-widget — sidkontextuella tips längst ner till höger
  showCoachWidget: boolean
  toggleCoachWidget: () => void

  // Grafikstil — se typen Grafikstil
  grafikstil: Grafikstil
  setGrafikstil: (stil: Grafikstil) => void

  // Språk
  language: Language
  setLanguage: (lang: Language) => void

  // Energinivå - viktigt för anpassning vid låg ork
  energyLevel: EnergyLevel
  setEnergyLevel: (level: EnergyLevel) => void

  // Onboarding status
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (value: boolean) => void

  // Sync state
  isLoading: boolean
  lastSynced: string | null

  // Sync actions
  syncWithServer: () => Promise<void>
  /** `true` = skrivet i molnet. Kastar aldrig. */
  _saveToServer: (updates: Partial<ServerSettings>) => Promise<boolean>
}

/**
 * Ett språkval som ännu inte nått molnet (nätverksfel, utloggad). Uppstartens
 * synk får då inte skriva över det med serverns äldre värde. Egen nyckel i
 * localStorage — språk är en enhetsinställning (se registreraRensning nedan).
 */
const OSPARAT_SPRAK = 'language-osparat'
function lasOsparatSprak(): Language | null {
  try {
    const v = localStorage.getItem(OSPARAT_SPRAK)
    return v === 'sv' || v === 'en' ? v : null
  } catch {
    return null
  }
}
function satOsparatSprak(v: Language | null) {
  try {
    if (v) localStorage.setItem(OSPARAT_SPRAK, v)
    else localStorage.removeItem(OSPARAT_SPRAK)
  } catch {
    // Utan lagring: valet gäller sessionen ut.
  }
}

// Server-side settings type
interface ServerSettings {
  calm_mode: boolean
  focus_mode: boolean
  email_notifications: boolean
  push_notifications: boolean
  weekly_summary: boolean
  high_contrast: boolean
  large_text: boolean
  language: string
  has_completed_onboarding: boolean
  show_coach_widget: boolean
  graphics_style: Grafikstil
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
      // Tillgänglighet - Standardvärden för långtidsarbetssökande
      calmMode: false,
      toggleCalmMode: () => {
        const newValue = !get().calmMode
        set({ calmMode: newValue })
        get()._saveToServer({ calm_mode: newValue })
      },

      // Fokusläge (NPF-anpassat) - visar ett steg i taget
      focusMode: false,
      toggleFocusMode: () => {
        const newValue = !get().focusMode
        set({ focusMode: newValue })
        get()._saveToServer({ focus_mode: newValue })
      },

      // Notifikationer
      emailNotifications: true,
      pushNotifications: true,
      weeklySummary: false,
      setEmailNotifications: (value) => {
        set({ emailNotifications: value })
        get()._saveToServer({ email_notifications: value })
      },
      setPushNotifications: (value) => {
        set({ pushNotifications: value })
        get()._saveToServer({ push_notifications: value })
      },
      setWeeklySummary: (value) => {
        set({ weeklySummary: value })
        get()._saveToServer({ weekly_summary: value })
      },

      // Utseende - tillgänglighet
      highContrast: false,
      largeText: false,
      toggleHighContrast: () => {
        const newValue = !get().highContrast
        set({ highContrast: newValue })
        get()._saveToServer({ high_contrast: newValue })
      },
      toggleLargeText: () => {
        const newValue = !get().largeText
        set({ largeText: newValue })
        get()._saveToServer({ large_text: newValue })
      },

      // Coach-widget — default på, sparas i molnet
      showCoachWidget: true,
      toggleCoachWidget: () => {
        const newValue = !get().showCoachWidget
        set({ showCoachWidget: newValue })
        get()._saveToServer({ show_coach_widget: newValue })
      },

      // Grafikstil — mjuk som standard, sparas i molnet (kolumnen
      // user_preferences.graphics_style, migration 20260910, körd samma dag).
      grafikstil: 'mjuk',
      setGrafikstil: (stil) => {
        set({ grafikstil: stil })
        get()._saveToServer({ graphics_style: stil })
      },

      // Språk - synka med i18next
      language: (localStorage.getItem('language') as Language) || 'sv',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang)
        set({ language: lang })
        get()._saveToServer({ language: lang })
      },

      // Energinivå - default medium
      energyLevel: 'medium',
      setEnergyLevel: (level) => set({ energyLevel: level }),

      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (value) => {
        set({ hasCompletedOnboarding: value })
        get()._saveToServer({ has_completed_onboarding: value })
      },

      // Sync state
      isLoading: false,
      lastSynced: null,

      // Save to server (internal)
      _saveToServer: async (updates: Partial<ServerSettings>) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return false

          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              ...updates,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          if (error) {
            // `{ error }`, inte `error` direkt: `ErrorContext` har ett
            // index-signatur-krav som PostgrestError (en konkret,
            // egenskapsspecifik typ) inte uppfyller på egen hand (TS2345).
            storageLogger.error('Kunde inte spara inställningar:', { error })
            return false
          }
          set({ lastSynced: new Date().toISOString() })
          return true
        } catch (err) {
          storageLogger.error('Fel vid sparning av inställningar:', { error: err })
          return false
        }
      },

      // Sync with server
      syncWithServer: async () => {
        set({ isLoading: true })
        // Språket som gällde när synken började — byter användaren språk
        // medan frågan är ute får serverns (äldre) värde inte vinna.
        const sprakVidStart = get().language

        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ isLoading: false })
            return
          }

          const { data, error } = await supabase
            .from('user_preferences')
            .select('calm_mode, focus_mode, email_notifications, push_notifications, weekly_summary, high_contrast, large_text, language, has_completed_onboarding, show_coach_widget, graphics_style, updated_at')
            .eq('user_id', user.id)
            .maybeSingle()

          if (error) {
            storageLogger.error('Kunde inte hämta inställningar:', { error })
            set({ isLoading: false })
            return
          }

          // Om servern har data, uppdatera lokalt
          if (data) {
            const updates: Partial<SettingsState> = {}

            if (data.calm_mode !== null) updates.calmMode = data.calm_mode
            if (data.focus_mode !== null) updates.focusMode = data.focus_mode
            if (data.email_notifications !== null) updates.emailNotifications = data.email_notifications
            if (data.push_notifications !== null) updates.pushNotifications = data.push_notifications
            if (data.weekly_summary !== null) updates.weeklySummary = data.weekly_summary
            if (data.high_contrast !== null) updates.highContrast = data.high_contrast
            if (data.large_text !== null) updates.largeText = data.large_text
            if (data.has_completed_onboarding !== null) updates.hasCompletedOnboarding = data.has_completed_onboarding
            if (data.show_coach_widget !== null && data.show_coach_widget !== undefined) {
              updates.showCoachWidget = data.show_coach_widget
            }
            if (data.graphics_style === 'mjuk' || data.graphics_style === 'action') {
              updates.grafikstil = data.graphics_style
            }

            // 2026-09-22: här skrevs varje appstart över med serverns språk —
            // i praktiken alltid 'sv', eftersom inget språkval någonsin
            // sparades (språkväljarna anropar i18n direkt, setLanguage hade
            // noll anropare). Engelska gick därför inte att behålla. Nu
            // sparas valet via lyssnaren längst ned, och serverns värde
            // tillämpas bara när inget nyare lokalt val finns.
            const osparat = lasOsparatSprak()
            if (osparat) {
              if (await get()._saveToServer({ language: osparat })) satOsparatSprak(null)
            } else if (
              (data.language === 'sv' || data.language === 'en') &&
              get().language === sprakVidStart
            ) {
              updates.language = data.language as Language
              if (i18n.language !== data.language) {
                // Storen först: lyssnaren ser då ingen ändring att spara.
                set({ language: data.language as Language })
                i18n.changeLanguage(data.language)
              }
            }

            set({
              ...updates,
              lastSynced: data.updated_at || new Date().toISOString(),
              isLoading: false
            })
          } else {
            // Ingen data på servern - spara lokala inställningar
            const state = get()
            await get()._saveToServer({
              calm_mode: state.calmMode,
              focus_mode: state.focusMode,
              email_notifications: state.emailNotifications,
              push_notifications: state.pushNotifications,
              weekly_summary: state.weeklySummary,
              high_contrast: state.highContrast,
              large_text: state.largeText,
              language: state.language,
              has_completed_onboarding: state.hasCompletedOnboarding,
              show_coach_widget: state.showCoachWidget,
              graphics_style: state.grafikstil
            })
            set({ isLoading: false })
          }
        } catch (err) {
          storageLogger.error('Fel vid synkronisering av inställningar:', { error: err })
          set({ isLoading: false })
        }
      }
      }),
      {
        name: 'deltagarportal-settings',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          calmMode: state.calmMode,
          focusMode: state.focusMode,
          emailNotifications: state.emailNotifications,
          pushNotifications: state.pushNotifications,
          weeklySummary: state.weeklySummary,
          highContrast: state.highContrast,
          largeText: state.largeText,
          language: state.language,
          energyLevel: state.energyLevel,
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          showCoachWidget: state.showCoachWidget,
          grafikstil: state.grafikstil,
          lastSynced: state.lastSynced
        })
      }
    ),
    { name: 'SettingsStore', enabled: process.env.NODE_ENV === 'development' }
  )
)

/**
 * Nollställer notiser, energinivå och onboarding-flaggan vid utloggning.
 *
 * `calmMode`, `focusMode`, `highContrast`, `largeText`, `language` och
 * `grafikstil` rörs INTE — de är tema/tillgänglighet, inte personuppgift
 * (samma undantag som `USER_SCOPED_STORAGE_KEYS` i `utils/safeStorage.ts`
 * gör för språk/tema). En delad dator ska inte tvinga nästa deltagare att
 * slå på hög kontrast eller byta tillbaka språk bara för att hon loggar in.
 *
 * `energyLevel` nollställs DÄREMOT: det är inte ett temaval utan en signal
 * om hur mycket ork just den här deltagaren har idag — närmare
 * funktionsförmåga än tillgänglighet.
 *
 * Fixar också en sekundär bugg: `syncWithServer()` SKRIVER lokalt state
 * till servern (`_saveToServer`) om kontot saknar en `user_preferences`-rad
 * (ny person, ingen rad än). Utan den här rensningen hade en ny deltagares
 * första inloggning i en delad flik kunnat spara föregående deltagares
 * kvarlämnade notisinställningar till HENNES konto.
 */
/**
 * Sparar varje språkbyte, varifrån det än kommer.
 *
 * De tre språkväljarna (TopBar, LanguageSwitcher, SprakVal) anropar
 * `i18n.changeLanguage` direkt och gick aldrig via storen — valet nådde
 * därför aldrig `user_preferences.language`, och uppstartens synk satte
 * tillbaka 'sv' vid nästa appstart (drift-genomgången 2026-09-22). Lyssnaren
 * gör väljarna rätt utan att de behöver känna till storen.
 *
 * Ingen ändring (samma språk som storen redan har) = inget att spara. Det
 * täcker både i18next:s eget init-event och synkens tillämpning av serverns
 * värde, som sätter storen före `changeLanguage`.
 */
if (typeof i18n.on === 'function') {
  i18n.on('languageChanged', (lng: string) => {
    if (lng !== 'sv' && lng !== 'en') return
    if (useSettingsStore.getState().language === lng) return
    useSettingsStore.setState({ language: lng })
    satOsparatSprak(lng)
    void useSettingsStore.getState()._saveToServer({ language: lng }).then((ok) => {
      // Rensa bara om inget nyare val hunnit göras under tiden.
      if (ok && lasOsparatSprak() === lng) satOsparatSprak(null)
    })
  })
}

registreraRensning(() => {
  // Ett osparat språkval hör till den som gjorde det — nästa person på samma
  // dator ska få sitt eget språk ur molnet, inte få det här uppskickat.
  satOsparatSprak(null)
  useSettingsStore.setState({
    emailNotifications: true,
    pushNotifications: true,
    weeklySummary: false,
    hasCompletedOnboarding: false,
    energyLevel: 'medium',
    lastSynced: null,
  })
})

export default useSettingsStore
