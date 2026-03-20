/**
 * useLearning - Hook for learning data and progress
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getLearningData,
  getArticlesByCategory,
  markArticleComplete,
  updateArticleProgress,
  markExerciseComplete,
  type LearningProgress,
  type ArticleWithProgress,
  type ExerciseWithProgress,
  type LearningCategory,
  type DailyTip
} from '@/services/learningService'

interface UseLearningReturn {
  progress: LearningProgress | null
  recommendedArticles: ArticleWithProgress[]
  inProgressArticles: ArticleWithProgress[]
  categories: LearningCategory[]
  exercises: ExerciseWithProgress[]
  dailyTip: DailyTip | null
  hasInterestProfile: boolean
  isLoading: boolean
  error: string | null
  refresh: () => void
  completeArticle: (articleId: string) => Promise<boolean>
  updateProgress: (articleId: string, progress: number) => Promise<boolean>
  completeExercise: (exerciseId: string) => Promise<boolean>
  loadCategoryArticles: (categoryId: string) => Promise<ArticleWithProgress[]>
}

export function useLearning(): UseLearningReturn {
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [recommendedArticles, setRecommendedArticles] = useState<ArticleWithProgress[]>([])
  const [inProgressArticles, setInProgressArticles] = useState<ArticleWithProgress[]>([])
  const [categories, setCategories] = useState<LearningCategory[]>([])
  const [exercises, setExercises] = useState<ExerciseWithProgress[]>([])
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null)
  const [hasInterestProfile, setHasInterestProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getLearningData()
      setProgress(data.progress)
      setRecommendedArticles(data.recommendedArticles)
      setInProgressArticles(data.inProgressArticles)
      setCategories(data.categories)
      setExercises(data.exercises)
      setDailyTip(data.dailyTip)
      setHasInterestProfile(data.hasInterestProfile)
    } catch (err) {
      console.error('Error loading learning data:', err)
      setError('Kunde inte ladda lärande-data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const completeArticle = useCallback(async (articleId: string) => {
    const success = await markArticleComplete(articleId)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  const updateProgress = useCallback(async (articleId: string, progressValue: number) => {
    return await updateArticleProgress(articleId, progressValue)
  }, [])

  const completeExercise = useCallback(async (exerciseId: string) => {
    const success = await markExerciseComplete(exerciseId)
    if (success) {
      await loadData()
    }
    return success
  }, [loadData])

  const loadCategoryArticles = useCallback(async (categoryId: string) => {
    return await getArticlesByCategory(categoryId)
  }, [])

  return {
    progress,
    recommendedArticles,
    inProgressArticles,
    categories,
    exercises,
    dailyTip,
    hasInterestProfile,
    isLoading,
    error,
    refresh: loadData,
    completeArticle,
    updateProgress,
    completeExercise,
    loadCategoryArticles
  }
}

export default useLearning
