import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import type { ResurserSummary } from '@/components/widgets/ResurserDataContext'

/** Stable query key — exported so tests and DevTools can target it. */
export const RESURSER_HUB_KEY = (userId: string) => ['hub', 'resurser', userId] as const

export function useResurserHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()

  return useQuery<ResurserSummary>({
    queryKey: RESURSER_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      // Promise.all of 4 selects:
      //   1. cvs            — single CV row (shared cache key with JobsokHub: ['cv-versions'])
      //   2. cover_letters  — most recent 3 letters (shared cache key: ['cover-letters'])
      //   3. article_reading_progress — Kunskapsbank "recent" + completed-count
      //   4. ai_team_sessions — AI-team "recent agent" + total session count
      // Externa resurser, Utskriftsmaterial, Övningar are STATIC widgets — no DB read.
      const [cvR, lettersR, articlesR, aiTeamR] = await Promise.all([
        supabase
          .from('cvs')
          .select('id, updated_at')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('cover_letters')
          .select('id, title, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('article_reading_progress')
          .select('article_id, progress_percent, is_completed, completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false, nullsFirst: false })
          .limit(3),
        supabase
          .from('ai_team_sessions')
          .select('agent_id, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(5),
      ])

      const articles = articlesR.data ?? []
      const articleCompletedCount = articles.filter(a => a.is_completed).length
      const aiSessions = aiTeamR.data ?? []

      const summary: ResurserSummary = {
        cv: cvR.data ?? null,
        coverLetters: lettersR.data ?? [],
        recentArticles: articles,
        articleCompletedCount,
        aiTeamSessions: aiSessions,
        aiTeamSessionCount: aiSessions.length,
      }

      // Deep-link cache sync — write the EXACT keys JobsokHub uses, so deep-link routes
      // (/cv, /cover-letters) read from the same cache without a second fetch.
      queryClient.setQueryData(['cv-versions'], summary.cv ? [summary.cv] : [])
      queryClient.setQueryData(['cover-letters'], summary.coverLetters)

      return summary
    },
  })
}
