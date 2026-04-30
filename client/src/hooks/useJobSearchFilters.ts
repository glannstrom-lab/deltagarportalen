/**
 * useJobSearchFilters — persisterar användarens senaste filterurval i Supabase.
 *
 * Pattern: optimistisk lokal state + debounced upsert mot user_preferences.
 * Cross-device-sync är icke-förhandlingsbart — därför Supabase, inte localStorage.
 *
 * Utloggade användare får defaultFilters utan persistens (sparas inget).
 */

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

export const jobSearchFiltersSchema = z.object({
  query: z.string().max(200).default(''),
  municipality: z.string().max(100).default(''),
  region: z.string().max(20).default(''),
  employmentType: z.string().max(100).default(''),
  publishedWithin: z.enum(['today', 'week', 'month', 'all']).default('all'),
})

export type JobSearchFilters = z.infer<typeof jobSearchFiltersSchema>

const SAVE_DEBOUNCE_MS = 500

function isDefaultFilters(f: JobSearchFilters): boolean {
  return (
    !f.query &&
    !f.municipality &&
    !f.region &&
    !f.employmentType &&
    f.publishedWithin === 'all'
  )
}

export function useJobSearchFilters(defaultFilters: JobSearchFilters) {
  const [filters, setFilters] = useState<JobSearchFilters>(defaultFilters)
  const [isLoaded, setIsLoaded] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Läs senaste filter från Supabase vid mount
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setIsLoaded(true)
        return
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('job_search_filters')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.warn('[useJobSearchFilters] kunde inte läsa filter:', error.message)
        setIsLoaded(true)
        return
      }

      const saved = data?.job_search_filters
      if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
        const result = jobSearchFiltersSchema.safeParse(saved)
        if (result.success) {
          setFilters(result.data)
        }
      }
      setIsLoaded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Debounced upsert vid filter-ändring (kör inte under initial load)
  useEffect(() => {
    if (!isLoaded) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = isDefaultFilters(filters) ? {} : filters

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            job_search_filters: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (error) {
        console.warn('[useJobSearchFilters] kunde inte spara filter:', error.message)
      }
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [filters, isLoaded])

  return [filters, setFilters, isLoaded] as const
}
