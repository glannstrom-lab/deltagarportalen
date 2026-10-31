import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'

export const KURSFRAMSTEG_KEY = (userId: string, slugs: readonly string[]) => ['kursframsteg', userId, ...slugs] as const

/**
 * Vilka av artiklarna deltagaren läst klart (`is_completed`). KASTAR vid fel —
 * ett läsfel får inte se ut som "inget läst" (anroparen visar felläget).
 */
export function useKursframsteg(slugs: readonly string[]) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  return useQuery<Set<string>>({
    queryKey: KURSFRAMSTEG_KEY(userId, slugs),
    enabled: !!userId && slugs.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_reading_progress')
        .select('article_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('article_id', slugs as string[])
      if (error) throw error
      return new Set((data ?? []).map((r) => r.article_id as string))
    },
  })
}
