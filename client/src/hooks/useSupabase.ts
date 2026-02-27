import { useEffect, useState } from 'react'
import { supabase, Profile, CV, CoverLetter, getCurrentUser, getProfile } from '../lib/supabase'
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

// Hook for cover letters
export function useCoverLetters(userId: string | undefined) {
  const [letters, setLetters] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchLetters = async () => {
      const { data } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      setLetters(data || [])
      setLoading(false)
    }

    fetchLetters()
  }, [userId])

  const createLetter = async (letter: Partial<CoverLetter>) => {
    if (!userId) return
    
    const { data, error } = await supabase
      .from('cover_letters')
      .insert({ ...letter, user_id: userId })
      .select()
      .single()
    
    if (error) throw error
    setLetters(prev => [data, ...prev])
    return data
  }

  const deleteLetter = async (id: string) => {
    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    setLetters(prev => prev.filter(l => l.id !== id))
  }

  return { letters, loading, createLetter, deleteLetter }
}

// Hook for AI generation
export function useAIGeneration() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateCoverLetter = async (params: {
    cvData: any
    jobDescription: string
    companyName: string
    jobTitle: string
    tone?: 'formal' | 'friendly' | 'enthusiastic'
  }) => {
    setGenerating(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-cover-letter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate')
      }

      return await response.json()
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  const analyzeCV = async (params: {
    cvData: any
    jobDescription: string
  }) => {
    setGenerating(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cv-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to analyze')
      }

      return await response.json()
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  return { generateCoverLetter, analyzeCV, generating, error }
}

// Hook for consultant view (participants)
export function useConsultantParticipants(consultantId: string | undefined) {
  const [participants, setParticipants] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!consultantId) {
      setLoading(false)
      return
    }

    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('consultant_id', consultantId)
        .eq('role', 'USER')
      
      setParticipants(data || [])
      setLoading(false)
    }

    fetchParticipants()
  }, [consultantId])

  return { participants, loading }
}
