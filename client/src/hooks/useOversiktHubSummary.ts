import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import { useJobsokHubSummary } from './useJobsokHubSummary'
import { useKarriarHubSummary } from './useKarriarHubSummary'
import { useResurserHubSummary } from './useResurserHubSummary'
import { useMinVardagHubSummary } from './useMinVardagHubSummary'
import type { OversiktSummary } from '@/components/widgets/OversiktDataContext'

/**
 * Stable query key — exported so tests, DevTools and useOnboardedHubsTracking
 * can target it. The Översikt key holds ONLY the profile slice (onboarded_hubs
 * + full_name); cross-hub data is read directly from the four sibling hub keys.
 */
export const OVERSIKT_HUB_KEY = (userId: string) => ['hub', 'oversikt', userId] as const

/**
 * Översikt aggregator — Pitfall D resolution.
 *
 * Architecture: Översikt is the only hub that does NOT make its own data
 * SELECTs for the cross-hub widgets. It TRIGGERS the four other hub-loaders
 * (which dedup via React Query if already cached) and exposes their cached
 * data through OversiktDataContext.
 *
 * What this hook does:
 *   1. Fires the Översikt-specific profile SELECT (onboarded_hubs + full_name)
 *   2. Invokes the four sibling hub-loader hooks. React Query dedups by
 *      query key — if those keys are already populated, no additional
 *      requests fire; if not, the underlying loaders fetch as usual.
 *
 * Cross-hub summary widgets read getQueryData(JOBSOK_HUB_KEY|KARRIAR_HUB_KEY|...)
 * directly via useQueryClient — they never call supabase.from themselves.
 */
export function useOversiktHubSummary(): {
  data: OversiktSummary | undefined
  isLoading: boolean
} {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  // Översikt-specific profile fetch.
  const profileQ = useQuery({
    queryKey: OVERSIKT_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const r = await supabase
        .from('profiles')
        .select('onboarded_hubs, full_name')
        .eq('id', userId)
        .maybeSingle()
      const row = r.data as { onboarded_hubs?: string[] | null; full_name?: string | null } | null
      return {
        onboarded_hubs: row?.onboarded_hubs ?? [],
        full_name: row?.full_name ?? null,
      }
    },
  })

  // Trigger the four sibling hub loaders in parallel — React Query DEDUPLICATES
  // if their keys are already cached. Otherwise each loader fires its own
  // Promise.all of selects.
  const jobsokQ = useJobsokHubSummary()
  const karriarQ = useKarriarHubSummary()
  const resurserQ = useResurserHubSummary()
  const minVardagQ = useMinVardagHubSummary()

  const isLoading =
    profileQ.isLoading ||
    jobsokQ.isLoading ||
    karriarQ.isLoading ||
    resurserQ.isLoading ||
    minVardagQ.isLoading

  const data: OversiktSummary | undefined = profileQ.data
    ? {
        profile: profileQ.data,
        jobsok: jobsokQ.data,
        karriar: karriarQ.data,
        resurser: resurserQ.data,
        minVardag: minVardagQ.data,
      }
    : undefined

  return { data, isLoading }
}
