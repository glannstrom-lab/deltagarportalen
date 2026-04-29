import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useSupabase'
import { supabase } from '@/lib/supabase'
import type { HubId } from '@/components/layout/navigation'
import { OVERSIKT_HUB_KEY } from './useOversiktHubSummary'

/**
 * Records that the user has visited a given hub by appending hubId to
 * `profiles.onboarded_hubs` (text[] column added in Plan 05-01 migration).
 *
 * Behaviour:
 *   - Fires once per hook instance (useRef guard) on first mount where userId
 *     is non-empty.
 *   - Idempotent at app level: if hubId is already present in the cached
 *     array, the mutation is a no-op (no DB write).
 *   - Updates the React Query cache (OVERSIKT_HUB_KEY) on success so the
 *     OnboardingWidget reflects "returning user" state without a refetch.
 *
 * Called from each of the 5 hub pages (HubOverview + the four siblings).
 */
export function useOnboardedHubsTracking(hubId: HubId) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const hasRunRef = useRef(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const cached = queryClient.getQueryData(OVERSIKT_HUB_KEY(userId)) as
        | { onboarded_hubs: string[]; full_name: string | null }
        | undefined
      const current = cached?.onboarded_hubs ?? []
      if (current.includes(hubId)) return current
      const next = [...current, hubId]
      const r = await supabase
        .from('profiles')
        .update({ onboarded_hubs: next })
        .eq('id', userId)
      // Supabase update returns { data, error }; treat error presence as failure.
      if ((r as { error?: { message?: string } | null }).error) {
        throw (r as { error: { message?: string } }).error
      }
      return next
    },
    onSuccess: (next) => {
      queryClient.setQueryData(OVERSIKT_HUB_KEY(userId), (old: unknown) => {
        const prev = (old ?? {}) as { onboarded_hubs?: string[]; full_name?: string | null }
        return {
          ...prev,
          onboarded_hubs: next,
        }
      })
    },
  })

  useEffect(() => {
    if (!userId || hasRunRef.current) return
    hasRunRef.current = true
    mutation.mutate()
    // mutation is stable from useMutation; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hubId])
}
