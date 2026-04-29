import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import type { KarriarSummary } from '@/components/widgets/KarriarDataContext'

/** Stable query key — exported so tests and DevTools can target it. */
export const KARRIAR_HUB_KEY = (userId: string) => ['hub', 'karriar', userId] as const

export function useKarriarHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useQuery<KarriarSummary>({
    queryKey: KARRIAR_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      // Pitfall E: profiles fetched ONCE with both columns.
      // Pitfall C: PLURAL personal_brand_audits (not personal_brand_audit).
      const [profileR, skillsR, brandR] = await Promise.all([
        supabase
          .from('profiles')
          .select('career_goals, linkedin_url')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('skills_analyses')
          .select('dream_job, skills_comparison, match_percentage, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('personal_brand_audits')
          .select('score, dimensions, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      return {
        careerGoals: profileR.data?.career_goals ?? null,
        linkedinUrl: profileR.data?.linkedin_url ?? null,
        latestSkillsAnalysis: skillsR.data ?? null,
        latestBrandAudit: brandR.data ?? null,
      } satisfies KarriarSummary
    },
  })
}
