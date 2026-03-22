/**
 * Learning Service - Articles, exercises, and learning progress
 * With RIASEC-based personalization
 *
 * Now uses contentApi for database access with mock data fallback
 */

import { supabase } from '@/lib/supabase'
import { articleCategories, type EnhancedArticle } from '@/services/articleData'
import { type Exercise } from '@/data/exercises'
import { interestApi } from '@/services/supabaseApi'
import { contentArticleApi, contentExerciseApi } from '@/services/contentApi'
import { personalizeArticles, calculateExerciseRelevance, type RiasecScores } from '@/services/interestPersonalization'

// ============================================
// TYPES
// ============================================

export interface LearningProgress {
  articlesRead: number
  articlesInProgress: number
  exercisesCompleted: number
  totalXP: number
  streak: number
  lastActivityDate: string | null
}

export interface ArticleWithProgress extends EnhancedArticle {
  progress: number
  isCompleted: boolean
  lastReadAt?: string
  relevanceScore?: number // RIASEC-based relevance
}

export interface ExerciseWithProgress extends Exercise {
  progress: number
  isCompleted: boolean
  answeredSteps: number
  lastActivityAt?: string
  relevanceScore?: number // RIASEC-based relevance
}

export interface LearningPath {
  id: string
  name: string
  description: string
  icon: string
  articles: string[]
  exercises: string[]
  completedCount: number
  totalCount: number
}

export interface LearningCategory {
  id: string
  name: string
  description: string
  icon: string
  articleCount: number
  completedCount: number
}

export interface DailyTip {
  id: string
  title: string
  content: string
  category: string
}

// ============================================
// GET LEARNING DATA
// ============================================

export async function getLearningData(): Promise<{
  progress: LearningProgress
  recommendedArticles: ArticleWithProgress[]
  inProgressArticles: ArticleWithProgress[]
  categories: LearningCategory[]
  exercises: ExerciseWithProgress[]
  dailyTip: DailyTip
  hasInterestProfile: boolean
}> {
  const { data: { user } } = await supabase.auth.getUser()

  // Get progress data
  const progress = await getLearningProgress(user?.id)

  // Get article progress
  const articleProgress = user ? await getArticleProgress(user.id) : new Map()

  // Fetch articles and exercises from database (with mock data fallback)
  const [articlesData, exercisesData] = await Promise.all([
    contentArticleApi.getAll(),
    contentExerciseApi.getAll()
  ])

  // Get exercise progress (needs exercises for step count)
  const exerciseProgress = user ? await getExerciseProgress(user.id, exercisesData) : new Map()

  // Get RIASEC profile for personalization
  let riasecScores: RiasecScores | null = null
  let hasInterestProfile = false

  try {
    const interestResult = await interestApi.getResult()
    if (interestResult) {
      // Check nested format first (riasec_profile.scores)
      if (interestResult.riasec_profile?.scores) {
        riasecScores = interestResult.riasec_profile.scores as RiasecScores
        hasInterestProfile = true
      }
      // Check for direct columns format (database schema)
      else if (typeof interestResult.realistic === 'number' || typeof interestResult.investigative === 'number') {
        riasecScores = {
          realistic: interestResult.realistic || 0,
          investigative: interestResult.investigative || 0,
          artistic: interestResult.artistic || 0,
          social: interestResult.social || 0,
          enterprising: interestResult.enterprising || 0,
          conventional: interestResult.conventional || 0
        }
        hasInterestProfile = true
      }
    }
  } catch {
    // No interest profile available
  }

  // Build articles with progress
  const allArticles: ArticleWithProgress[] = articlesData.map(article => ({
    ...article,
    progress: articleProgress.get(article.id)?.progress || 0,
    isCompleted: articleProgress.get(article.id)?.isCompleted || false,
    lastReadAt: articleProgress.get(article.id)?.lastReadAt,
    relevanceScore: 50 // Default relevance
  }))

  // Personalize articles if RIASEC profile available
  let recommendedArticles: ArticleWithProgress[]

  if (riasecScores) {
    // Use RIASEC-based personalization
    const personalizedArticles = personalizeArticles(
      allArticles.filter(a => !a.isCompleted && a.progress < 80),
      riasecScores
    )

    recommendedArticles = personalizedArticles
      .map(a => ({
        ...a,
        relevanceScore: a.relevanceScore
      }))
      .sort((a, b) => {
        // First prioritize in-progress
        if (a.progress > 0 && b.progress === 0) return -1
        if (b.progress > 0 && a.progress === 0) return 1
        // Then by RIASEC relevance
        return (b.relevanceScore || 0) - (a.relevanceScore || 0)
      })
      .slice(0, 6)
  } else {
    // Fallback: sort by energy level
    recommendedArticles = allArticles
      .filter(a => !a.isCompleted && a.progress < 80)
      .sort((a, b) => {
        if (a.progress > 0 && b.progress === 0) return -1
        if (b.progress > 0 && a.progress === 0) return 1
        const energyOrder = { low: 0, medium: 1, high: 2 }
        return energyOrder[a.energyLevel] - energyOrder[b.energyLevel]
      })
      .slice(0, 6)
  }

  // Get in-progress articles
  const inProgressArticles = allArticles
    .filter(a => a.progress > 0 && a.progress < 100 && !a.isCompleted)
    .sort((a, b) => (b.lastReadAt || '').localeCompare(a.lastReadAt || ''))
    .slice(0, 3)

  // Build categories with counts
  const categories = await buildCategories(allArticles)

  // Build exercises with progress and relevance
  const exercisesWithProgress: ExerciseWithProgress[] = exercisesData.map(exercise => {
    const prog = exerciseProgress.get(exercise.id)
    const relevanceScore = riasecScores
      ? calculateExerciseRelevance(exercise, riasecScores)
      : 50

    return {
      ...exercise,
      progress: prog?.progress || 0,
      isCompleted: prog?.isCompleted || false,
      answeredSteps: prog?.answeredSteps || 0,
      lastActivityAt: prog?.lastActivityAt,
      relevanceScore
    }
  })

  // Sort exercises by relevance if RIASEC available
  if (riasecScores) {
    exercisesWithProgress.sort((a, b) => {
      // Prioritize not completed
      if (!a.isCompleted && b.isCompleted) return -1
      if (a.isCompleted && !b.isCompleted) return 1
      // Then by relevance
      return (b.relevanceScore || 0) - (a.relevanceScore || 0)
    })
  }

  // Get daily tip
  const dailyTip = getDailyTip()

  return {
    progress,
    recommendedArticles,
    inProgressArticles,
    categories,
    exercises: exercisesWithProgress,
    dailyTip,
    hasInterestProfile
  }
}

// ============================================
// GET ARTICLES BY CATEGORY
// ============================================

export async function getArticlesByCategory(categoryId: string): Promise<ArticleWithProgress[]> {
  const { data: { user } } = await supabase.auth.getUser()
  const articleProgress = user ? await getArticleProgress(user.id) : new Map()

  // Fetch articles by category from database
  const articles = await contentArticleApi.getByCategory(categoryId)

  return articles.map(article => ({
    ...article,
    progress: articleProgress.get(article.id)?.progress || 0,
    isCompleted: articleProgress.get(article.id)?.isCompleted || false,
    lastReadAt: articleProgress.get(article.id)?.lastReadAt
  }))
}

// ============================================
// MARK ARTICLE COMPLETE
// ============================================

export async function markArticleComplete(articleId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('article_reading_progress')
    .upsert({
      user_id: user.id,
      article_id: articleId,
      progress_percent: 100,
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,article_id'
    })

  if (error) {
    console.error('Error marking article complete:', error)
    return false
  }

  // Log activity
  await supabase
    .from('user_activities')
    .insert({
      user_id: user.id,
      activity_type: 'article_read',
      activity_data: { article_id: articleId }
    })

  return true
}

// ============================================
// UPDATE ARTICLE PROGRESS
// ============================================

export async function updateArticleProgress(articleId: string, progress: number): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('article_reading_progress')
    .upsert({
      user_id: user.id,
      article_id: articleId,
      progress_percent: Math.min(100, progress),
      is_completed: progress >= 100,
      completed_at: progress >= 100 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,article_id'
    })

  if (error) {
    console.error('Error updating article progress:', error)
    return false
  }

  return true
}

// ============================================
// MARK EXERCISE COMPLETE
// ============================================

export async function markExerciseComplete(exerciseId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('exercise_answers')
    .upsert({
      user_id: user.id,
      exercise_id: exerciseId,
      is_completed: true,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,exercise_id'
    })

  if (error) {
    console.error('Error marking exercise complete:', error)
    return false
  }

  // Log activity
  await supabase
    .from('user_activities')
    .insert({
      user_id: user.id,
      activity_type: 'exercise_completed',
      activity_data: { exercise_id: exerciseId }
    })

  return true
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getLearningProgress(userId?: string): Promise<LearningProgress> {
  if (!userId) {
    return {
      articlesRead: 0,
      articlesInProgress: 0,
      exercisesCompleted: 0,
      totalXP: 0,
      streak: 0,
      lastActivityDate: null
    }
  }

  try {
    // Get article stats
    const { data: articleData } = await supabase
      .from('article_reading_progress')
      .select('is_completed, progress_percent')
      .eq('user_id', userId)

    const articlesRead = articleData?.filter(a => a.is_completed).length || 0
    const articlesInProgress = articleData?.filter(a => !a.is_completed && a.progress_percent > 0).length || 0

    // Get exercise stats
    const { count: exercisesCompleted } = await supabase
      .from('exercise_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)

    // Get streak
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .eq('streak_type', 'learning')
      .maybeSingle()

    // Get last activity
    const { data: lastActivity } = await supabase
      .from('user_activities')
      .select('created_at')
      .eq('user_id', userId)
      .in('activity_type', ['article_read', 'exercise_completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Calculate XP (10 per article, 20 per exercise)
    const totalXP = (articlesRead * 10) + ((exercisesCompleted || 0) * 20)

    return {
      articlesRead,
      articlesInProgress,
      exercisesCompleted: exercisesCompleted || 0,
      totalXP,
      streak: streakData?.current_streak || 0,
      lastActivityDate: lastActivity?.created_at || null
    }
  } catch (error) {
    console.error('Error getting learning progress:', error)
    return {
      articlesRead: 0,
      articlesInProgress: 0,
      exercisesCompleted: 0,
      totalXP: 0,
      streak: 0,
      lastActivityDate: null
    }
  }
}

interface ArticleProgressData {
  progress: number
  isCompleted: boolean
  lastReadAt?: string
}

async function getArticleProgress(userId: string): Promise<Map<string, ArticleProgressData>> {
  const map = new Map<string, ArticleProgressData>()

  try {
    const { data } = await supabase
      .from('article_reading_progress')
      .select('article_id, progress_percent, is_completed, updated_at')
      .eq('user_id', userId)

    data?.forEach(row => {
      map.set(row.article_id, {
        progress: row.progress_percent,
        isCompleted: row.is_completed,
        lastReadAt: row.updated_at
      })
    })
  } catch (error) {
    console.error('Error getting article progress:', error)
  }

  return map
}

interface ExerciseProgressData {
  progress: number
  isCompleted: boolean
  answeredSteps: number
  lastActivityAt?: string
}

async function getExerciseProgress(userId: string, exercisesData: Exercise[]): Promise<Map<string, ExerciseProgressData>> {
  const map = new Map<string, ExerciseProgressData>()

  try {
    const { data } = await supabase
      .from('exercise_answers')
      .select('exercise_id, is_completed, answers, updated_at')
      .eq('user_id', userId)

    data?.forEach(row => {
      const answers = row.answers || {}
      const answeredSteps = Object.keys(answers).length
      const exercise = exercisesData.find(e => e.id === row.exercise_id)
      const totalSteps = exercise?.steps.length || 1

      map.set(row.exercise_id, {
        progress: row.is_completed ? 100 : Math.round((answeredSteps / totalSteps) * 100),
        isCompleted: row.is_completed,
        answeredSteps,
        lastActivityAt: row.updated_at
      })
    })
  } catch (error) {
    console.error('Error getting exercise progress:', error)
  }

  return map
}

async function buildCategories(articles: ArticleWithProgress[]): Promise<LearningCategory[]> {
  // Fetch categories from database (with mock fallback)
  const categories = await contentArticleApi.getCategories()

  return categories.map(cat => {
    const catArticles = articles.filter(a => a.category === cat.key)
    return {
      id: cat.key,
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '',
      articleCount: catArticles.length,
      completedCount: catArticles.filter(a => a.isCompleted).length
    }
  }).filter(cat => cat.articleCount > 0)
}

function getDailyTip(): DailyTip {
  const tips: DailyTip[] = [
    {
      id: '1',
      title: 'CV-tips',
      content: 'Anpassa alltid ditt CV till varje jobbannons. Använd samma nyckelord som arbetsgivaren.',
      category: 'cv'
    },
    {
      id: '2',
      title: 'Intervjutips',
      content: 'Förbered 2-3 frågor att ställa till arbetsgivaren. Det visar engagemang och intresse.',
      category: 'interview'
    },
    {
      id: '3',
      title: 'Nätverkstips',
      content: 'LinkedIn-inlägg på morgonen (7-9) får oftast mest engagemang.',
      category: 'networking'
    },
    {
      id: '4',
      title: 'Motivation',
      content: 'Sätt upp små delmål varje dag. Att söka ett jobb om dagen är bättre än att söka tio på en gång.',
      category: 'wellness'
    },
    {
      id: '5',
      title: 'ATS-tips',
      content: 'Undvik tabeller och kolumner i ditt CV - de kan göra att ATS-system missar viktig information.',
      category: 'cv'
    }
  ]

  // Return a "random" tip based on the day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return tips[dayOfYear % tips.length]
}

export default {
  getLearningData,
  getArticlesByCategory,
  markArticleComplete,
  updateArticleProgress,
  markExerciseComplete
}
