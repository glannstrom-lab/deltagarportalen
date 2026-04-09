/**
 * Energy Store med Supabase-synkronisering
 * Spara energinivå i databasen för synk mellan enheter
 */
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export type EnergyLevel = 'low' | 'medium' | 'high'

interface EnergyState {
  level: EnergyLevel
  lastUpdated: string | null
  loginStreak: number
  lastLoginDate: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setLevel: (level: EnergyLevel) => Promise<void>
  incrementStreak: () => void
  resetStreak: () => void
  shouldAskForEnergy: () => boolean
  syncWithServer: () => Promise<void>
}

// Hjälpfunktioner
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

export const getWidgetsForEnergyLevel = (
  level: EnergyLevel,
  allWidgets: string[]
): string[] => {
  const priorityByEnergy: Record<EnergyLevel, string[]> = {
    low: ['cv', 'wellness', 'quests'],
    medium: ['cv', 'jobSearch', 'coverLetter', 'wellness', 'exercises', 'quests'],
    high: allWidgets
  }
  
  return priorityByEnergy[level] || allWidgets
}

export const useEnergyStore = create<EnergyState>()(
  devtools(
    persist(
      (set, get) => ({
      level: 'medium',
      lastUpdated: null,
      loginStreak: 0,
      lastLoginDate: null,
      isLoading: false,
      error: null,

      setLevel: async (level) => {
        const now = new Date().toISOString()
        
        // Uppdatera lokalt först (optimistisk UI)
        set({
          level,
          lastUpdated: now,
          error: null
        })

        // Synka med server
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              energy_level: level,
              energy_updated_at: now,
              updated_at: now
            }, {
              onConflict: 'user_id'
            })

          if (error) {
            console.error('Kunde inte spara energinivå:', error)
            set({ error: 'Kunde inte spara till server' })
          }
        } catch (err) {
          console.error('Fel vid sparning av energinivå:', err)
          set({ error: 'Nätverksfel' })
        }
      },

      incrementStreak: () => {
        const { lastLoginDate, loginStreak } = get()
        const today = new Date().toDateString()
        
        if (lastLoginDate === today) return
        
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (lastLoginDate === yesterday.toDateString()) {
          set({
            loginStreak: loginStreak + 1,
            lastLoginDate: today
          })
        } else {
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
        
        return lastUpdate.toDateString() !== now.toDateString()
      },

      syncWithServer: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ isLoading: false })
            return
          }

          // Hämta senaste energinivå från servern
          const { data, error } = await supabase
            .from('user_preferences')
            .select('energy_level, energy_updated_at')
            .eq('user_id', user.id)
            .maybeSingle()

          if (error) {
            console.error('Kunde inte hämta energinivå:', error)
            set({ error: 'Kunde inte synkronisera', isLoading: false })
            return
          }

          // Om servern har nyare data, uppdatera lokalt
          if (data?.energy_updated_at) {
            const serverTime = new Date(data.energy_updated_at)
            const localTime = get().lastUpdated 
              ? new Date(get().lastUpdated!)
              : new Date(0)

            if (serverTime > localTime) {
              set({
                level: data.energy_level as EnergyLevel || 'medium',
                lastUpdated: data.energy_updated_at,
                isLoading: false
              })
            }
          }

          set({ isLoading: false })
        } catch (err) {
          console.error('Fel vid synkronisering:', err)
          set({ error: 'Synkroniseringsfel', isLoading: false })
        }
      }
      }),
      {
        name: 'energy-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          level: state.level,
          lastUpdated: state.lastUpdated,
          loginStreak: state.loginStreak,
          lastLoginDate: state.lastLoginDate
        })
      }
    ),
    { name: 'EnergyStore', enabled: process.env.NODE_ENV === 'development' }
  )
)

// Hook för att synkronisera vid inloggning
export function useEnergySync() {
  const syncWithServer = useEnergyStore(state => state.syncWithServer)
  const incrementStreak = useEnergyStore(state => state.incrementStreak)
  
  return {
    sync: async () => {
      await syncWithServer()
      incrementStreak()
    }
  }
}

export default useEnergyStore
