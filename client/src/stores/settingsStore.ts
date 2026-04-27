/**
 * Settings Store med Supabase-synkronisering
 * Sparar användarinställningar i molnet för synk mellan enheter
 */
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import i18n from '@/i18n/config'
import { storageLogger } from '@/lib/logger'

export type EnergyLevel = 'low' | 'medium' | 'high'
export type Language = 'sv' | 'en'

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
  _saveToServer: (updates: Partial<ServerSettings>) => Promise<void>
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
          if (!user) return

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
            storageLogger.error('Kunde inte spara inställningar:', error)
          } else {
            set({ lastSynced: new Date().toISOString() })
          }
        } catch (err) {
          storageLogger.error('Fel vid sparning av inställningar:', err)
        }
      },

      // Sync with server
      syncWithServer: async () => {
        set({ isLoading: true })

        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ isLoading: false })
            return
          }

          const { data, error } = await supabase
            .from('user_preferences')
            .select('calm_mode, focus_mode, email_notifications, push_notifications, weekly_summary, high_contrast, large_text, language, has_completed_onboarding, updated_at')
            .eq('user_id', user.id)
            .maybeSingle()

          if (error) {
            storageLogger.error('Kunde inte hämta inställningar:', error)
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

            if (data.language && (data.language === 'sv' || data.language === 'en')) {
              updates.language = data.language as Language
              i18n.changeLanguage(data.language)
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
              has_completed_onboarding: state.hasCompletedOnboarding
            })
            set({ isLoading: false })
          }
        } catch (err) {
          storageLogger.error('Fel vid synkronisering av inställningar:', err)
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
          lastSynced: state.lastSynced
        })
      }
    ),
    { name: 'SettingsStore', enabled: process.env.NODE_ENV === 'development' }
  )
)

// Hook för att synkronisera vid inloggning
export function useSettingsSync() {
  const syncWithServer = useSettingsStore(state => state.syncWithServer)

  return {
    sync: syncWithServer
  }
}

export default useSettingsStore
