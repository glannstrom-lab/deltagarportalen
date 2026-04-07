/**
 * Unified Progress Hook
 * Combines progress data from CV, articles, exercises, jobs, milestones, and RIASEC
 * into a single career readiness score and progress tracking
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cvApi, interestApi, savedJobsApi, coverLetterApi } from '@/services/supabaseApi'
import { useInterestProfile, RIASEC_TYPES, type RiasecScores } from './useInterestProfile'

// ============================================
// TYPES
// ============================================

export interface ProgressSection {
  id: string
  name: string
  nameSv: string
  score: number
  maxScore: number
  percentage: number
  color: string
  icon: string
  tips: string[]
  isComplete: boolean
}

export interface UnifiedProgress {
  // Overall score
  careerReadinessScore: number
  careerReadinessLevel: 'beginner' | 'developing' | 'ready' | 'excellent'
  careerReadinessLabel: string

  // Section breakdown
  sections: ProgressSection[]

  // Quick stats
  totalPoints: number
  completedMilestones: number
  totalMilestones: number

  // RIASEC data
  hasRiasecProfile: boolean
  dominantTypes: Array<{ code: keyof RiasecScores; score: number; nameSv: string }>

  // CV data
  cvProgress: number
  cvSkills: string[]
  hasCv: boolean

  // Knowledge data
  articlesRead: number
  exercisesCompleted: number

  // Job search data
  savedJobsCount: number
  applicationsCount: number
  coverLettersCount: number

  // Wellness data (mood only, no energy)
  currentMood: number | null
  moodStreak: number

  // Next recommended actions
  recommendations: Recommendation[]
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  action: string
  link: string
  category: string
}

// ============================================
// SCORING WEIGHTS
// ============================================

const SECTION_WEIGHTS = {
  cv: 25,           // CV completeness
  riasec: 15,       // Interest profile
  knowledge: 15,    // Articles and exercises
  jobSearch: 20,    // Saved jobs, applications
  interview: 15,    // Interview preparation
  wellness: 10,     // Mood tracking, streaks
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateCvScore(cv: Record<string, unknown> | null): { score: number; skills: string[]; tips: string[] } {
  if (!cv) return { score: 0, skills: [], tips: ['Skapa ditt CV för att komma igång'] }

  let score = 0
  const tips: string[] = []

  // Basic info (20 points)
  if (cv.first_name || cv.firstName) score += 5
  if (cv.last_name || cv.lastName) score += 5
  if (cv.email) score += 5
  if (cv.title) score += 5
  else tips.push('Lägg till en yrkestitel')

  // Summary (20 points)
  const summary = (cv.summary as string) || ''
  if (summary.length > 100) score += 20
  else if (summary.length > 0) score += 10
  else tips.push('Skriv en sammanfattning om dig själv')

  // Experience (25 points)
  const experience = (cv.work_experience as unknown[]) || (cv.workExperience as unknown[]) || []
  if (experience.length >= 2) score += 25
  else if (experience.length === 1) score += 15
  else tips.push('Lägg till arbetslivserfarenhet')

  // Education (15 points)
  const education = (cv.education as unknown[]) || []
  if (education.length > 0) score += 15
  else tips.push('Lägg till utbildning')

  // Skills (20 points)
  const skills = (cv.skills as string[]) || []
  if (skills.length >= 5) score += 20
  else if (skills.length >= 3) score += 15
  else if (skills.length > 0) score += 10
  else tips.push('Lägg till kompetenser')

  return { score, skills, tips }
}

function calculateKnowledgeScore(articlesRead: number, exercisesCompleted: number): { score: number; tips: string[] } {
  let score = 0
  const tips: string[] = []

  // Articles (50 points)
  if (articlesRead >= 10) score += 50
  else if (articlesRead >= 5) score += 30
  else if (articlesRead > 0) score += articlesRead * 5
  else tips.push('Läs artiklar i kunskapsbanken')

  // Exercises (50 points)
  if (exercisesCompleted >= 5) score += 50
  else if (exercisesCompleted >= 3) score += 30
  else if (exercisesCompleted > 0) score += exercisesCompleted * 10
  else tips.push('Genomför övningar för intervjuträning')

  return { score, tips }
}

function calculateJobSearchScore(
  savedJobs: number,
  applications: number,
  coverLetters: number
): { score: number; tips: string[] } {
  let score = 0
  const tips: string[] = []

  // Saved jobs (30 points)
  if (savedJobs >= 10) score += 30
  else if (savedJobs >= 5) score += 20
  else if (savedJobs > 0) score += savedJobs * 3
  else tips.push('Spara jobb som intresserar dig')

  // Applications (40 points)
  if (applications >= 5) score += 40
  else if (applications >= 3) score += 25
  else if (applications > 0) score += applications * 8
  else tips.push('Skicka jobbansökningar')

  // Cover letters (30 points)
  if (coverLetters >= 3) score += 30
  else if (coverLetters > 0) score += coverLetters * 10
  else tips.push('Skapa personliga brev')

  return { score, tips }
}

function calculateWellnessScore(moodStreak: number, hasMoodToday: boolean): { score: number; tips: string[] } {
  let score = 0
  const tips: string[] = []

  // Mood tracking (100 points max)
  if (moodStreak >= 7) score += 100
  else if (moodStreak >= 3) score += 60
  else if (hasMoodToday) score += 30
  else tips.push('Logga ditt humör dagligen')

  return { score, tips }
}

function getCareerReadinessLevel(score: number): { level: UnifiedProgress['careerReadinessLevel']; label: string } {
  if (score >= 80) return { level: 'excellent', label: 'Utmärkt förberedd' }
  if (score >= 60) return { level: 'ready', label: 'Redo för jobbsökning' }
  if (score >= 30) return { level: 'developing', label: 'Under utveckling' }
  return { level: 'beginner', label: 'Precis börjat' }
}

function generateRecommendations(progress: Partial<UnifiedProgress>): Recommendation[] {
  const recommendations: Recommendation[] = []

  // CV recommendations
  if (!progress.hasCv || (progress.cvProgress || 0) < 50) {
    recommendations.push({
      id: 'complete-cv',
      title: 'Komplettera ditt CV',
      description: 'Ett komplett CV ökar dina chanser att bli kallad till intervju',
      priority: 'high',
      action: 'Gå till CV',
      link: '/cv',
      category: 'cv'
    })
  }

  // RIASEC recommendations
  if (!progress.hasRiasecProfile) {
    recommendations.push({
      id: 'take-interest-test',
      title: 'Gör intressetestet',
      description: 'Upptäck vilka jobb som passar din personlighet',
      priority: 'high',
      action: 'Ta testet',
      link: '/interest-guide',
      category: 'riasec'
    })
  }

  // Knowledge recommendations
  if ((progress.articlesRead || 0) < 5) {
    recommendations.push({
      id: 'read-articles',
      title: 'Läs fler artiklar',
      description: 'Lär dig tips om jobbsökning, CV och intervjuer',
      priority: 'medium',
      action: 'Gå till kunskapsbanken',
      link: '/knowledge-base',
      category: 'knowledge'
    })
  }

  // Job search recommendations
  if ((progress.savedJobsCount || 0) < 5) {
    recommendations.push({
      id: 'save-jobs',
      title: 'Spara intressanta jobb',
      description: 'Hitta jobb som matchar dina intressen och kompetenser',
      priority: 'medium',
      action: 'Sök jobb',
      link: '/jobs',
      category: 'jobs'
    })
  }

  // Wellness recommendations
  if ((progress.moodStreak || 0) < 3) {
    recommendations.push({
      id: 'track-mood',
      title: 'Logga ditt humör',
      description: 'Följ hur du mår under jobbsökningen',
      priority: 'low',
      action: 'Gå till dagboken',
      link: '/diary?tab=mood',
      category: 'wellness'
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations.slice(0, 5)
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchUnifiedProgress(): Promise<UnifiedProgress> {
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all data in parallel
  const [
    cv,
    interestResult,
    savedJobs,
    coverLetters,
    articlesReadCount,
    exercisesCompletedCount,
    applicationsCount,
    moodData,
    moodStreak,
  ] = await Promise.all([
    cvApi.getCV().catch(() => null),
    interestApi.getResult().catch(() => null),
    savedJobsApi.getAll().catch(() => []),
    coverLetterApi.getAll().catch(() => []),
    fetchArticlesReadCount(user?.id),
    fetchExercisesCompletedCount(user?.id),
    fetchApplicationsCount(user?.id),
    fetchTodaysMood(user?.id),
    fetchMoodStreak(user?.id),
  ])

  // Calculate section scores
  const cvResult = calculateCvScore(cv)
  const knowledgeResult = calculateKnowledgeScore(articlesReadCount, exercisesCompletedCount)
  const jobSearchResult = calculateJobSearchScore(savedJobs.length, applicationsCount, coverLetters.length)
  const wellnessResult = calculateWellnessScore(moodStreak, !!moodData)

  // Calculate RIASEC score
  let riasecScore = 0
  let riasecTips: string[] = []
  let dominantTypes: UnifiedProgress['dominantTypes'] = []

  if (interestResult?.riasec_profile?.scores || interestResult?.realistic !== undefined) {
    riasecScore = 100
    const scores: RiasecScores = interestResult.riasec_profile?.scores || {
      realistic: interestResult.realistic || 0,
      investigative: interestResult.investigative || 0,
      artistic: interestResult.artistic || 0,
      social: interestResult.social || 0,
      enterprising: interestResult.enterprising || 0,
      conventional: interestResult.conventional || 0,
    }

    dominantTypes = Object.entries(scores)
      .map(([code, score]) => ({
        code: code as keyof RiasecScores,
        score,
        nameSv: RIASEC_TYPES[code as keyof RiasecScores].nameSv
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  } else {
    riasecTips = ['Gör intressetestet för personliga jobbförslag']
  }

  // Interview score (based on exercises)
  const interviewScore = exercisesCompletedCount >= 3 ? 100 : (exercisesCompletedCount / 3) * 100
  const interviewTips = exercisesCompletedCount < 3
    ? ['Genomför fler intervjuövningar']
    : []

  // Build sections array
  const sections: ProgressSection[] = [
    {
      id: 'cv',
      name: 'CV',
      nameSv: 'CV',
      score: cvResult.score,
      maxScore: 100,
      percentage: cvResult.score,
      color: 'violet',
      icon: 'FileText',
      tips: cvResult.tips,
      isComplete: cvResult.score >= 80
    },
    {
      id: 'riasec',
      name: 'Interest Profile',
      nameSv: 'Intresseprofil',
      score: riasecScore,
      maxScore: 100,
      percentage: riasecScore,
      color: 'indigo',
      icon: 'Compass',
      tips: riasecTips,
      isComplete: riasecScore === 100
    },
    {
      id: 'knowledge',
      name: 'Knowledge',
      nameSv: 'Kunskap',
      score: knowledgeResult.score,
      maxScore: 100,
      percentage: knowledgeResult.score,
      color: 'amber',
      icon: 'BookOpen',
      tips: knowledgeResult.tips,
      isComplete: knowledgeResult.score >= 80
    },
    {
      id: 'jobSearch',
      name: 'Job Search',
      nameSv: 'Jobbsökning',
      score: jobSearchResult.score,
      maxScore: 100,
      percentage: jobSearchResult.score,
      color: 'blue',
      icon: 'Briefcase',
      tips: jobSearchResult.tips,
      isComplete: jobSearchResult.score >= 80
    },
    {
      id: 'interview',
      name: 'Interview Prep',
      nameSv: 'Intervjuförberedelse',
      score: Math.round(interviewScore),
      maxScore: 100,
      percentage: Math.round(interviewScore),
      color: 'emerald',
      icon: 'MessageSquare',
      tips: interviewTips,
      isComplete: interviewScore >= 80
    },
    {
      id: 'wellness',
      name: 'Wellness',
      nameSv: 'Välmående',
      score: wellnessResult.score,
      maxScore: 100,
      percentage: wellnessResult.score,
      color: 'rose',
      icon: 'Heart',
      tips: wellnessResult.tips,
      isComplete: wellnessResult.score >= 80
    },
  ]

  // Calculate weighted career readiness score
  const weightedScore = (
    (cvResult.score / 100) * SECTION_WEIGHTS.cv +
    (riasecScore / 100) * SECTION_WEIGHTS.riasec +
    (knowledgeResult.score / 100) * SECTION_WEIGHTS.knowledge +
    (jobSearchResult.score / 100) * SECTION_WEIGHTS.jobSearch +
    (interviewScore / 100) * SECTION_WEIGHTS.interview +
    (wellnessResult.score / 100) * SECTION_WEIGHTS.wellness
  )

  const careerReadinessScore = Math.round(weightedScore)
  const { level, label } = getCareerReadinessLevel(careerReadinessScore)

  // Build partial progress for recommendations
  const partialProgress: Partial<UnifiedProgress> = {
    hasCv: !!cv,
    cvProgress: cvResult.score,
    hasRiasecProfile: riasecScore === 100,
    articlesRead: articlesReadCount,
    savedJobsCount: savedJobs.length,
    moodStreak,
  }

  const recommendations = generateRecommendations(partialProgress)

  return {
    careerReadinessScore,
    careerReadinessLevel: level,
    careerReadinessLabel: label,
    sections,
    totalPoints: careerReadinessScore * 10, // Simple conversion to points
    completedMilestones: sections.filter(s => s.isComplete).length,
    totalMilestones: sections.length,
    hasRiasecProfile: riasecScore === 100,
    dominantTypes,
    cvProgress: cvResult.score,
    cvSkills: cvResult.skills,
    hasCv: !!cv,
    articlesRead: articlesReadCount,
    exercisesCompleted: exercisesCompletedCount,
    savedJobsCount: savedJobs.length,
    applicationsCount,
    coverLettersCount: coverLetters.length,
    currentMood: moodData,
    moodStreak,
    recommendations,
  }
}

// Helper functions for data fetching
async function fetchArticlesReadCount(userId?: string): Promise<number> {
  if (!userId) return 0
  try {
    const { count } = await supabase
      .from('article_reading_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
    return count || 0
  } catch {
    return 0
  }
}

async function fetchExercisesCompletedCount(userId?: string): Promise<number> {
  if (!userId) return 0
  try {
    const { count } = await supabase
      .from('exercise_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
    return count || 0
  } catch {
    return 0
  }
}

async function fetchApplicationsCount(userId?: string): Promise<number> {
  if (!userId) return 0
  try {
    const { count } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count || 0
  } catch {
    return 0
  }
}

async function fetchTodaysMood(userId?: string): Promise<number | null> {
  if (!userId) return null
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('mood_logs')
      .select('mood')
      .eq('user_id', userId)
      .gte('created_at', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.mood || null
  } catch {
    return null
  }
}

async function fetchMoodStreak(userId?: string): Promise<number> {
  if (!userId) return 0
  try {
    const { data: logs } = await supabase
      .from('mood_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!logs || logs.length === 0) return 0

    // Calculate streak
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
  } catch {
    return 0
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useUnifiedProgress() {
  const query = useQuery({
    queryKey: ['unifiedProgress'],
    queryFn: fetchUnifiedProgress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })

  return {
    progress: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export default useUnifiedProgress
