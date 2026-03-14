/**
 * Energy Store - Hanterar användarens energinivå
 * Spara i localStorage för att minska databasanrop
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EnergyLevel = 'low' | 'medium' | 'high'
export { type EnergyLevel as default }

interface EnergyState {
  // Nuvarande energinivå
  level: EnergyLevel
  // Senast uppdaterad
  lastUpdated: string | null
  // Antal dagar i rad användaren loggat in
  loginStreak: number
  // Senaste inloggningsdatum
  lastLoginDate: string | null
  
  // Actions
  setLevel: (level: EnergyLevel) => void
  incrementStreak: () => void
  resetStreak: () => void
  shouldAskForEnergy: () => boolean
}

export const useEnergyStore = create<EnergyState>()(
  persist(
    (set, get) => ({
      level: 'medium', // Default
      lastUpdated: null,
      loginStreak: 0,
      lastLoginDate: null,

      setLevel: (level) => set({
        level,
        lastUpdated: new Date().toISOString()
      }),

      incrementStreak: () => {
        const { lastLoginDate, loginStreak } = get()
        const today = new Date().toDateString()
        
        // Om redan loggat in idag, gör inget
        if (lastLoginDate === today) return
        
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        
        // Om loggade in igår, öka streak
        if (lastLoginDate === yesterday.toDateString()) {
          set({
            loginStreak: loginStreak + 1,
            lastLoginDate: today
          })
        } else {
          // Annars, börja om
          set({
            loginStreak: 1,
            lastLoginDate: today
          })
        }
      },

      resetStreak: () => set({
        loginStreak: 0,
        lastLoginDate: null
      }),

      shouldAskForEnergy: () => {
        const { lastUpdated } = get()
        if (!lastUpdated) return true
        
        const lastUpdate = new Date(lastUpdated)
        const now = new Date()
        
        // Fråga igen om det är en ny dag
        return lastUpdate.toDateString() !== now.toDateString()
      }
    }),
    {
      name: 'energy-storage',
      partialize: (state) => ({
        level: state.level,
        lastUpdated: state.lastUpdated,
        loginStreak: state.loginStreak,
        lastLoginDate: state.lastLoginDate
      })
    }
  )
)

// Helper för att få beskrivning baserat på energinivå
export const getEnergyDescription = (level: EnergyLevel): string => {
  switch (level) {
    case 'low':
      return 'Det är okej att ta det lugnt idag. Varje litet steg räknas.'
    case 'medium':
      return 'Bra! Du har energi att göra några saker idag.'
    case 'high':
      return 'Toppen! Passa på att göra det där lilla extra idag.'
    default:
      return ''
  }
}

// Helper för att få emoji baserat på energinivå
export const getEnergyEmoji = (level: EnergyLevel): string => {
  switch (level) {
    case 'low':
      return '😌'
    case 'medium':
      return '😐'
    case 'high':
      return '😊'
    default:
      return '😐'
  }
}

// Helper för att få antal widgets som ska visas
export const getVisibleWidgetCount = (level: EnergyLevel): number => {
  switch (level) {
    case 'low':
      return 3
    case 'medium':
      return 6
    case 'high':
      return 11
    default:
      return 6
  }
}

// Helper för att filtrera widgets baserat på energinivå
export const getWidgetsForEnergyLevel = (
  level: EnergyLevel,
  allWidgets: string[]
): string[] => {
  const priorityByEnergy: Record<EnergyLevel, string[]> = {
    low: ['cv', 'wellness', 'quickWin'],
    medium: ['cv', 'jobSearch', 'coverLetter', 'wellness', 'exercises', 'quests'],
    high: allWidgets
  }
  
  return priorityByEnergy[level] || allWidgets
}
