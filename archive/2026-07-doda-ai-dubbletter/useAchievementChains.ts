/**
 * Achievement Chains Hook
 * Tracks related activities and awards chained achievements
 *
 * Example chains:
 * - CV Expert: Read 5 CV articles + Create CV + Get 80% ATS score
 * - Interview Master: Complete 3 interview exercises + Read 5 interview articles
 * - Job Hunter Pro: Save 10 jobs + Apply to 5 jobs + Create 3 cover letters
 */

import { useCallback, useEffect } from 'react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ============================================
// TYPES
// ============================================

export interface AchievementChain {
  id: string
  name: string
  nameSv: string
  description: string
  descriptionSv: string
  icon: string
  color: string
  category: string
  requirements: ChainRequirement[]
  reward: {
    points: number
    badge?: string
    title?: string
  }
}

export interface ChainRequirement {
  id: string
  type: 'articles_read' | 'exercises_completed' | 'jobs_saved' | 'jobs_applied' |
        'cover_letters' | 'cv_score' | 'riasec_completed' | 'mood_streak' |
        'articles_category' | 'diary_entries'
  target: number
  category?: string // For category-specific requirements
  description: string
  descriptionSv: string
}

export interface UserChainProgress {
  chainId: string
  requirements: {
    requirementId: string
    current: number
    target: number
    isComplete: boolean
  }[]
  isComplete: boolean
  completedAt: string | null
}

// ============================================
// CHAIN DEFINITIONS
// ============================================

export const ACHIEVEMENT_CHAINS: AchievementChain[] = [
  // CV Expert Chain
  {
    id: 'cv-expert',
    name: 'CV Expert',
    nameSv: 'CV-expert',
    description: 'Master the art of CV writing',
    descriptionSv: 'Bemästra konsten att skriva CV',
    icon: 'FileText',
    color: 'violet',
    category: 'cv',
    requirements: [
      {
        id: 'cv-articles',
        type: 'articles_category',
        target: 3,
        category: 'cv',
        description: 'Read 3 CV articles',
        descriptionSv: 'Läs 3 CV-artiklar'
      },
      {
        id: 'cv-score',
        type: 'cv_score',
        target: 70,
        description: 'Reach 70% CV completeness',
        descriptionSv: 'Nå 70% CV-fullständighet'
      }
    ],
    reward: {
      points: 100,
      badge: 'cv-expert-badge',
      title: 'CV-expert'
    }
  },

  // Interview Master Chain
  {
    id: 'interview-master',
    name: 'Interview Master',
    nameSv: 'Intervjumästare',
    description: 'Prepare thoroughly for interviews',
    descriptionSv: 'Förbered dig grundligt för intervjuer',
    icon: 'MessageSquare',
    color: 'indigo',
    category: 'interview',
    requirements: [
      {
        id: 'interview-exercises',
        type: 'exercises_completed',
        target: 3,
        description: 'Complete 3 interview exercises',
        descriptionSv: 'Genomför 3 intervjuövningar'
      },
      {
        id: 'interview-articles',
        type: 'articles_category',
        target: 3,
        category: 'interview',
        description: 'Read 3 interview articles',
        descriptionSv: 'Läs 3 intervjuartiklar'
      }
    ],
    reward: {
      points: 150,
      badge: 'interview-master-badge',
      title: 'Intervjumästare'
    }
  },

  // Job Hunter Pro Chain
  {
    id: 'job-hunter-pro',
    name: 'Job Hunter Pro',
    nameSv: 'Jobbsökare-proffs',
    description: 'Become an expert job seeker',
    descriptionSv: 'Bli en proffsjobbsökare',
    icon: 'Briefcase',
    color: 'blue',
    category: 'jobs',
    requirements: [
      {
        id: 'jobs-saved',
        type: 'jobs_saved',
        target: 10,
        description: 'Save 10 jobs',
        descriptionSv: 'Spara 10 jobb'
      },
      {
        id: 'jobs-applied',
        type: 'jobs_applied',
        target: 5,
        description: 'Apply to 5 jobs',
        descriptionSv: 'Ansök till 5 jobb'
      },
      {
        id: 'cover-letters',
        type: 'cover_letters',
        target: 3,
        description: 'Create 3 cover letters',
        descriptionSv: 'Skapa 3 personliga brev'
      }
    ],
    reward: {
      points: 200,
      badge: 'job-hunter-badge',
      title: 'Jobbsökare-proffs'
    }
  },

  // Knowledge Seeker Chain
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    nameSv: 'Kunskapstörstare',
    description: 'Absorb all the knowledge',
    descriptionSv: 'Absorbera all kunskap',
    icon: 'BookOpen',
    color: 'amber',
    category: 'knowledge',
    requirements: [
      {
        id: 'articles-read',
        type: 'articles_read',
        target: 10,
        description: 'Read 10 articles',
        descriptionSv: 'Läs 10 artiklar'
      },
      {
        id: 'exercises-done',
        type: 'exercises_completed',
        target: 5,
        description: 'Complete 5 exercises',
        descriptionSv: 'Genomför 5 övningar'
      }
    ],
    reward: {
      points: 150,
      badge: 'knowledge-seeker-badge',
      title: 'Kunskapstörstare'
    }
  },

  // Self-Aware Chain (RIASEC + Wellness)
  {
    id: 'self-aware',
    name: 'Self Aware',
    nameSv: 'Självmedveten',
    description: 'Know yourself and your patterns',
    descriptionSv: 'Känn dig själv och dina mönster',
    icon: 'Compass',
    color: 'rose',
    category: 'wellness',
    requirements: [
      {
        id: 'riasec-done',
        type: 'riasec_completed',
        target: 1,
        description: 'Complete interest test',
        descriptionSv: 'Genomför intressetestet'
      },
      {
        id: 'mood-streak',
        type: 'mood_streak',
        target: 7,
        description: 'Log mood for 7 days',
        descriptionSv: 'Logga humör i 7 dagar'
      },
      {
        id: 'diary-entries',
        type: 'diary_entries',
        target: 5,
        description: 'Write 5 diary entries',
        descriptionSv: 'Skriv 5 dagboksinlägg'
      }
    ],
    reward: {
      points: 175,
      badge: 'self-aware-badge',
      title: 'Självmedveten'
    }
  },

  // First Steps Chain (Onboarding)
  {
    id: 'first-steps',
    name: 'First Steps',
    nameSv: 'Första stegen',
    description: 'Complete the basics',
    descriptionSv: 'Slutför grunderna',
    icon: 'Sparkles',
    color: 'emerald',
    category: 'general',
    requirements: [
      {
        id: 'cv-started',
        type: 'cv_score',
        target: 30,
        description: 'Start your CV',
        descriptionSv: 'Påbörja ditt CV'
      },
      {
        id: 'first-article',
        type: 'articles_read',
        target: 1,
        description: 'Read your first article',
        descriptionSv: 'Läs din första artikel'
      },
      {
        id: 'first-job',
        type: 'jobs_saved',
        target: 1,
        description: 'Save your first job',
        descriptionSv: 'Spara ditt första jobb'
      }
    ],
    reward: {
      points: 50,
      badge: 'first-steps-badge',
      title: 'Igång!'
    }
  }
]

// ============================================
// DATA FETCHING
// ============================================

async function fetchChainProgress(): Promise<UserChainProgress[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch all required data in parallel
  const [
    articlesRead,
    articlesByCategory,
    exercisesCompleted,
    jobsSaved,
    jobsApplied,
    coverLetters,
    cvScore,
    riasecCompleted,
    moodStreak,
    diaryEntries,
    completedChains
  ] = await Promise.all([
    fetchArticlesReadCount(user.id),
    fetchArticlesByCategoryCount(user.id),
    fetchExercisesCompletedCount(user.id),
    fetchJobsSavedCount(user.id),
    fetchJobsAppliedCount(user.id),
    fetchCoverLettersCount(user.id),
    fetchCVScore(user.id),
    fetchRiasecCompleted(user.id),
    fetchMoodStreak(user.id),
    fetchDiaryEntriesCount(user.id),
    fetchCompletedChains(user.id)
  ])

  // Build progress for each chain
  return ACHIEVEMENT_CHAINS.map(chain => {
    const requirements = chain.requirements.map(req => {
      let current = 0

      switch (req.type) {
        case 'articles_read':
          current = articlesRead
          break
        case 'articles_category':
          current = articlesByCategory[req.category || ''] || 0
          break
        case 'exercises_completed':
          current = exercisesCompleted
          break
        case 'jobs_saved':
          current = jobsSaved
          break
        case 'jobs_applied':
          current = jobsApplied
          break
        case 'cover_letters':
          current = coverLetters
          break
        case 'cv_score':
          current = cvScore
          break
        case 'riasec_completed':
          current = riasecCompleted ? 1 : 0
          break
        case 'mood_streak':
          current = moodStreak
          break
        case 'diary_entries':
          current = diaryEntries
          break
      }

      return {
        requirementId: req.id,
        current,
        target: req.target,
        isComplete: current >= req.target
      }
    })

    const isComplete = requirements.every(r => r.isComplete)
    const completedChain = completedChains.find(c => c.chain_id === chain.id)

    return {
      chainId: chain.id,
      requirements,
      isComplete,
      completedAt: completedChain?.completed_at || null
    }
  })
}

// Helper fetch functions
async function fetchArticlesReadCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('article_reading_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
    return count || 0
  } catch { return 0 }
}

async function fetchArticlesByCategoryCount(userId: string): Promise<Record<string, number>> {
  try {
    const { data } = await supabase
      .from('article_reading_progress')
      .select('article_id')
      .eq('user_id', userId)
      .eq('is_completed', true)

    if (!data || data.length === 0) return {}

    // This would need to be joined with articles table in production
    // For now, return empty - the implementation would map article_id to category
    return {}
  } catch { return {} }
}

async function fetchExercisesCompletedCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('exercise_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
    return count || 0
  } catch { return 0 }
}

async function fetchJobsSavedCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('saved_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count || 0
  } catch { return 0 }
}

async function fetchJobsAppliedCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count || 0
  } catch { return 0 }
}

async function fetchCoverLettersCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('cover_letters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count || 0
  } catch { return 0 }
}

async function fetchCVScore(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('cv_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) return 0

    // Calculate CV score (simplified)
    let score = 0
    if (data.first_name) score += 10
    if (data.last_name) score += 10
    if (data.email) score += 10
    if (data.summary && data.summary.length > 50) score += 20
    if (data.work_experience?.length > 0) score += 25
    if (data.education?.length > 0) score += 15
    if (data.skills?.length >= 3) score += 10

    return Math.min(100, score)
  } catch { return 0 }
}

async function fetchRiasecCompleted(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('interest_guide_results')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    return !!data
  } catch { return false }
}

async function fetchMoodStreak(userId: string): Promise<number> {
  try {
    const { data: logs } = await supabase
      .from('mood_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!logs || logs.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const uniqueDates = new Set(logs.map(l => {
      const d = new Date(l.created_at)
      return d.toISOString().split('T')[0]
    }))

    let checkDate = today
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (uniqueDates.has(dateStr)) {
        streak++
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else {
        break
      }
    }

    return streak
  } catch { return 0 }
}

async function fetchDiaryEntriesCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('diary_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count || 0
  } catch { return 0 }
}

async function fetchCompletedChains(userId: string): Promise<{ chain_id: string; completed_at: string }[]> {
  try {
    const { data } = await supabase
      .from('user_achievement_chains')
      .select('chain_id, completed_at')
      .eq('user_id', userId)
      .eq('is_completed', true)
    return data || []
  } catch { return [] }
}

// ============================================
// CHAIN COMPLETION
// ============================================

async function completeChain(chainId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const chain = ACHIEVEMENT_CHAINS.find(c => c.id === chainId)
  if (!chain) return false

  try {
    // Insert completed chain
    await supabase
      .from('user_achievement_chains')
      .upsert({
        user_id: user.id,
        chain_id: chainId,
        is_completed: true,
        completed_at: new Date().toISOString()
      })

    // Award points
    await supabase.rpc('add_user_points', {
      p_user_id: user.id,
      p_points: chain.reward.points,
      p_reason: `Completed chain: ${chain.nameSv}`
    }).catch(() => {
      // RPC might not exist, that's okay
    })

    // Log activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: 'achievement_chain_completed',
        title: `Uppnådde: ${chain.nameSv}`,
        description: chain.descriptionSv,
        points_earned: chain.reward.points,
        metadata: { chainId, badge: chain.reward.badge }
      }).catch(() => {})

    return true
  } catch {
    return false
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useAchievementChains() {
  const queryClient = useQueryClient()

  const { data: progress, isLoading, refetch } = useQuery({
    queryKey: ['achievementChains'],
    queryFn: fetchChainProgress,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const completeChainMutation = useMutation({
    mutationFn: completeChain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievementChains'] })
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
    }
  })

  // Check for newly completed chains and award them
  const checkAndAwardChains = useCallback(async () => {
    if (!progress) return

    for (const chainProgress of progress) {
      // If chain is complete but not yet awarded
      if (chainProgress.isComplete && !chainProgress.completedAt) {
        await completeChainMutation.mutateAsync(chainProgress.chainId)
      }
    }
  }, [progress, completeChainMutation])

  // Auto-check on progress change
  useEffect(() => {
    checkAndAwardChains()
  }, [progress])

  // Get chains with full info
  const chainsWithProgress = (progress || []).map(p => ({
    chain: ACHIEVEMENT_CHAINS.find(c => c.id === p.chainId)!,
    progress: p,
    progressPercentage: Math.round(
      (p.requirements.filter(r => r.isComplete).length / p.requirements.length) * 100
    )
  }))

  // Get incomplete chains sorted by progress
  const incompleteChains = chainsWithProgress
    .filter(c => !c.progress.isComplete)
    .sort((a, b) => b.progressPercentage - a.progressPercentage)

  // Get completed chains
  const completedChains = chainsWithProgress.filter(c => c.progress.isComplete)

  // Get the closest chain to completion
  const closestChain = incompleteChains[0] || null

  return {
    chains: chainsWithProgress,
    incompleteChains,
    completedChains,
    closestChain,
    isLoading,
    refetch,
    checkAndAwardChains,
  }
}

export default useAchievementChains
