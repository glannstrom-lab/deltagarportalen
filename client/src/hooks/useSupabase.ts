// C11 (2026-07-23): useCoverLetters, useAIGeneration och
// useConsultantParticipants raderade — noll anropare. useAIGeneration var
// dessutom enda vägen till cv-analysis-edgen som fakturerar OpenAI GPT-4
// direkt (utanför modellåsningen). Kvar: useAuth + useCV (används av
// hub-summary-hooksen respektive useAITeamContext).
import { useEffect, useState } from 'react'
import { supabase, getCurrentUser, getProfile } from '../lib/supabase'
import type { Profile, CV } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

// Hook for auth state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getCurrentUser().then(user => {
      setUser(user)
      if (user) {
        getProfile(user.id).then(({ data }) => {
          setProfile(data)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await getProfile(session.user.id)
          setProfile(data)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading, isAuthenticated: !!user }
}

// Hook for CV data with realtime updates
export function useCV(userId: string | undefined) {
  const [cv, setCV] = useState<CV | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Fetch initial data
    const fetchCV = async () => {
      try {
        const { data, error } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (error) throw error
        setCV(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchCV()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`cv-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cvs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCV(payload.new as CV)
          }
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId])

  const updateCV = async (updates: Partial<CV>) => {
    if (!userId) return
    
    const { data, error } = await supabase
      .from('cvs')
      .upsert({ ...updates, user_id: userId })
      .select()
      .single()
    
    if (error) throw error
    setCV(data)
    return data
  }

  return { cv, loading, error, updateCV }
}

