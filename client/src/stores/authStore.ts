import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { useSettingsStore } from './settingsStore'
import { useEnergyStore } from './energyStoreWithSync'
import { userPreferencesApi } from '@/services/cloudStorage'
import { setUser as setSentryUser } from '@/lib/sentry'

export type UserRole = 'USER' | 'CONSULTANT' | 'ADMIN' | 'SUPERADMIN'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole  // Huvudroll (bakåtkompatibel)
  roles: UserRole[]  // Alla roller användaren har
  activeRole: UserRole  // Vilken roll som är aktiv just nu
  phone: string | null
  avatar_url: string | null
  consultant_id: string | null
  created_at: string
  updated_at: string
  // GDPR Consent timestamps
  terms_accepted_at: string | null
  privacy_accepted_at: string | null
  ai_consent_at: string | null
  marketing_consent_at: string | null
}

interface AuthState {
  // State
  user: User | null
  profile: Profile | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isSigningOut: boolean
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: UserRole
    consent?: {
      terms: boolean
      privacy: boolean
      aiProcessing?: boolean
    }
  }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
  setActiveRole: (role: UserRole) => void
  clearError: () => void
  setSigningOut: (value: boolean) => void
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
      isSigningOut: false,

      // Initialize auth state from Supabase session
      initialize: async () => {
        if (get().isSigningOut) {
          return
        }

        try {
          set({ isLoading: true, error: null })
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            throw sessionError
          }

          if (session) {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (userError) {
              throw userError
            }

            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user?.id)
              .single()

            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('Could not fetch profile:', profileError)
            }

            // Se till att nya fält finns (bakåtkompatibilitet)
            const enrichedProfile = profile ? {
              ...profile,
              roles: profile.roles || [profile.role || 'USER'],
              activeRole: profile.activeRole || profile.role || 'USER',
            } : null

            set({
              user: user || null,
              profile: enrichedProfile,
              session: session,
              isAuthenticated: !!user,
              isLoading: false,
            })

            // Sync settings and energy from cloud
            if (user) {
              useSettingsStore.getState().syncWithServer()
              useEnergyStore.getState().syncWithServer()
              // Update last login for streak tracking
              userPreferencesApi.updateLastLogin()
            }
          } else {
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Kunde inte initiera autentisering'
          console.error('Auth initialization error:', error)
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          })
        }
      },

      // Sign in with email and password
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null, isSigningOut: false })
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
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

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          // Se till att nya fält finns
          const enrichedProfile = profile ? {
            ...profile,
            roles: profile.roles || [profile.role || 'USER'],
            activeRole: profile.activeRole || profile.role || 'USER',
          } : null

          set({
            user: data.user,
            profile: enrichedProfile,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          })

          // Set Sentry user context for error tracking
          setSentryUser({
            id: data.user.id,
            email: data.user.email,
            role: enrichedProfile?.role,
          })

          // Sync settings and energy from cloud
          useSettingsStore.getState().syncWithServer()
          useEnergyStore.getState().syncWithServer()

          // Update last login timestamp for streak tracking
          userPreferencesApi.updateLastLogin()

          return { error: null }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Inloggning misslyckades'
          set({
            isLoading: false,
            error: message,
          })
          return { error: message }
        }
      },

      // Sign up new user
      signUp: async (userData) => {
        try {
          set({ isLoading: true, error: null })

          const role = userData.role || 'USER'
          const consent = userData.consent || { terms: false, privacy: false, aiProcessing: false }

          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                first_name: userData.firstName,
                last_name: userData.lastName,
                role: role,
                // GDPR consent flags - stored in user metadata
                terms_accepted: consent.terms,
                privacy_accepted: consent.privacy,
                ai_consent: consent.aiProcessing || false,
              },
            },
          })

          if (error) {
            throw error
          }

          if (!data.session) {
            set({ isLoading: false })
            return { error: 'Konto skapat! Kontrollera din e-post för att bekräfta.' }
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .single()

          // Se till att nya fält finns
          const enrichedProfile = profile ? {
            ...profile,
            roles: profile.roles || [profile.role || 'USER'],
            activeRole: profile.activeRole || profile.role || 'USER',
          } : null

          set({
            user: data.user,
            profile: enrichedProfile,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          })

          return { error: null }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Registrering misslyckades'
          set({
            isLoading: false,
            error: message,
          })
          return { error: message }
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ isSigningOut: true })

          const { error } = await supabase.auth.signOut()

          if (error) {
            throw error
          }

          // Clear Sentry user context
          setSentryUser(null)

          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            isSigningOut: false,
          })
        } catch (error: unknown) {
          console.error('Sign out error:', error)
          set({ isSigningOut: false })
        }
      },

      // Update profile
      updateProfile: async (updates: Partial<Profile>) => {
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
          set({
            profile: get().profile ? { ...get().profile!, ...updates } : null,
          })

          return { error: null }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Kunde inte uppdatera profil'
          return { error: message }
        }
      },

      // Set active role
      setActiveRole: (role: UserRole) => {
        const { profile } = get()
        if (!profile) return

        // Verify user has this role
        const userRoles = profile.roles || [profile.role]
        if (!userRoles.includes(role)) {
          console.error('User does not have role:', role)
          return
        }

        // Update local state immediately for responsive UI
        set({
          profile: { ...profile, activeRole: role },
        })

        // Persist to database
        supabase
          .from('profiles')
          .update({ activeRole: role })
          .eq('id', profile.id)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to update activeRole:', error)
            }
          })
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Set signing out flag
      setSigningOut: (value: boolean) => {
        set({ isSigningOut: value })
      },
    }),
    {
      name: 'auth-storage',
      // SECURITY: Only persist non-sensitive state
      // Session tokens are managed by Supabase's own secure storage
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Helper hooks for role checking
export const useActiveRole = () => {
  return useAuthStore((state) => state.profile?.activeRole || state.profile?.role || 'USER')
}

export const useUserRoles = () => {
  return useAuthStore((state) => state.profile?.roles || [state.profile?.role || 'USER'])
}

export const useHasRole = (role: UserRole) => {
  const roles = useUserRoles()
  return roles.includes(role)
}

export const useIsSuperAdmin = () => useHasRole('SUPERADMIN')
export const useIsAdmin = () => useHasRole('ADMIN') || useHasRole('SUPERADMIN')
export const useIsConsultant = () => useHasRole('CONSULTANT') || useIsAdmin()
