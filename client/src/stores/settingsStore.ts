import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EnergyLevel = 'low' | 'medium' | 'high'

interface SettingsState {
  // Tillgänglighet
  calmMode: boolean
  toggleCalmMode: () => void
  
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
  
  // Energinivå - viktigt för anpassning vid låg ork
  energyLevel: EnergyLevel
  setEnergyLevel: (level: EnergyLevel) => void
  
  // Onboarding status
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Tillgänglighet - Standardvärden för långtidsarbetssökande
      calmMode: false,
      toggleCalmMode: () => set((state) => ({ calmMode: !state.calmMode })),
      
      // Notifikationer
      emailNotifications: true,
      pushNotifications: true,
      weeklySummary: false, // Av för att inte skapa stress
      setEmailNotifications: (value) => set({ emailNotifications: value }),
      setPushNotifications: (value) => set({ pushNotifications: value }),
      setWeeklySummary: (value) => set({ weeklySummary: value }),
      
      // Utseende - tillgänglighet
      highContrast: false,
      largeText: false,
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      toggleLargeText: () => set((state) => ({ largeText: !state.largeText })),
      
      // Energinivå - default medium
      energyLevel: 'medium',
      setEnergyLevel: (level) => set({ energyLevel: level }),
      
      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
    }),
    {
      name: 'deltagarportal-settings',
    }
  )
)
