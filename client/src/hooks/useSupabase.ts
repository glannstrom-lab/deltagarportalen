// C11 (2026-07-23): useCoverLetters, useAIGeneration och
// useConsultantParticipants raderade — noll anropare. useAIGeneration var
// dessutom enda vägen till cv-analysis-edgen som fakturerar OpenAI GPT-4
// direkt (utanför modellåsningen). Kvar: useAuth + useCV (används av
// hub-summary-hooksen respektive useAITeamContext).
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CV } from '../lib/supabase'
import { useAuthStore } from '@/stores/authStore'

/**
 * Inloggad användare för hubbsidornas summary-hooks.
 *
 * 2026-09-22: läser ur `authStore` i stället för att fråga Supabase själv.
 * Tidigare gjorde VARJE monterad instans `getUser()` + `getProfile()` och
 * registrerade en egen `onAuthStateChange` — en hubbsida med summary-hook +
 * onboarding-spårning gav dubbla nätverksanrop per sidvisning. Lyssnaren var
 * dessutom `async` och väntade på ett Supabase-anrop INNE i callbacken, vilket
 * supabase-js varnar för: callbacken körs under auth-låset, och ett anrop som
 * behöver samma lås kan hänga sig (känd deadlock). authStore är portalens enda
 * källa för auth-tillståndet och initieras en gång i useAuthInit.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.isLoading)
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
        // 2026-09-22: .single() kräver EXAKT en rad — varje deltagare som
        // inte skapat ett CV än (ingen rad i `cvs`) fick PostgREST att svara
        // 406 PGRST116 här. Den här hooken är i drift via useAITeamContext →
        // useCV, så det slog igenom varje gång AI-teamet byggde kontext för
        // någon utan CV. Samma buggklass som redan fixats i MyConsultant.tsx
        // (nästa-möte-frågan) och UX12 (get_my_consultant).
        const { data, error } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

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

    // `subscription.unsubscribe()` (Realtime-kanal) returnerar en Promise —
    // useEffects städfunktion måste returnera void, inte en Promise, annars
    // vägrar TS (och React varnar i praktiken om en async destructor).
    return () => { void subscription.unsubscribe() }
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

