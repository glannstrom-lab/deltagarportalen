import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'USER' | 'CONSULTANT' | 'ADMIN' | 'SUPERADMIN'
  phone: string | null
  avatar_url: string | null
  consultant_id: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  // State
  user: User | null
  profile: Profile | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: 'USER' | 'CONSULTANT'
  }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Initialize auth state from Supabase session
      initialize: async () => {
        try {
          set({ isLoading: true, error: null })
          
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            throw sessionError
          }

          if (session) {
            // Get user
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (userError) {
              throw userError
            }

            // Get profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user?.id)
              .single()

            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('Could not fetch profile:', profileError)
            }

            set({
              user: user || null,
              profile: profile || null,
              session: session,
              isAuthenticated: !!user,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error: any) {
          console.error('Auth initialization error:', error)
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Kunde inte initiera autentisering',
          })
        }
      },

      // Sign in with email and password
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            // Translate common errors
            let message = error.message
            if (error.message === 'Invalid login credentials') {
              message = 'Fel e-post eller lösenord'
            } else if (error.message.includes('Email not confirmed')) {
              message = 'E-postadressen är inte bekräftad'
            } else if (error.message.includes('User not found')) {
              message = 'Användaren finns inte'
            }
            throw new Error(message)
          }

          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          set({
            user: data.user,
            profile: profile || null,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          })

          return { error: null }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Inloggning misslyckades',
          })
          return { error: error.message }
        }
      },

      // Sign up new user
      signUp: async (userData) => {
        try {
          set({ isLoading: true, error: null })
          
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                first_name: userData.firstName,
                last_name: userData.lastName,
                role: userData.role || 'USER',
              },
            },
          })

          if (error) {
            throw error
          }

          if (!data.session) {
            // Email confirmation required
            set({ isLoading: false })
            return { error: 'Konto skapat! Kontrollera din e-post för att bekräfta.' }
          }

          // Auto-login if session exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user!.id)
            .single()

          set({
            user: data.user,
            profile: profile || null,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          })

          return { error: null }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registrering misslyckades',
          })
          return { error: error.message }
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ isLoading: true })
          
          const { error } = await supabase.auth.signOut()
          
          if (error) {
            throw error
          }

          // Clear state
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          console.error('Sign out error:', error)
          set({ isLoading: false, error: error.message })
        }
      },

      // Update user profile
      updateProfile: async (updates) => {
        try {
          const { user } = get()
          if (!user) {
            return { error: 'Inte inloggad' }
          }

          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

          if (error) {
            throw error
          }

          // Update local state
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
          }))

          return { error: null }
        } catch (error: any) {
          return { error: error.message || 'Kunde inte uppdatera profil' }
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      // Only persist minimal state
      partialize: (state) => ({
        // Don't persist user/session - get from Supabase
        // Only persist UI preferences if needed
      }),
    }
  )
)

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  const store = useAuthStore.getState()
  
  if (event === 'SIGNED_IN' && session) {
    // Refresh user data
    store.initialize()
  } else if (event === 'SIGNED_OUT') {
    store.signOut()
  } else if (event === 'USER_UPDATED' && session) {
    store.initialize()
  }
})
