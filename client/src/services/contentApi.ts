/**
 * Content API - Articles and Exercises from Supabase
 *
 * This service fetches articles and exercises from the database.
 * It provides a fallback to mock data if database is empty or unavailable.
 */

import { supabase } from '@/lib/supabase'

/** Returns true if the string is a canonical UUID (8-4-4-4-12 hex). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUuid(s: string): boolean {
  return UUID_REGEX.test(s)
}
import { mockArticlesData, articleCategories, type EnhancedArticle, type ArticleChecklistItem, type ArticleAction } from './articleData'
import { exercises as mockExercises, type Exercise, type ExerciseStep, type ExerciseQuestion } from '@/data/exercises'
import * as LucideIcons from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface ArticleCategory {
  id: string
  key: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  subcategories?: { id: string; name: string }[]
}

export interface ArticleFromDB {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  category_id: string | null
  category_key: string | null
  subcategory: string | null
  tags: string[]
  reading_time: number
  difficulty: 'easy-swedish' | 'easy' | 'medium' | 'detailed'
  energy_level: 'low' | 'medium' | 'high'
  author: string | null
  author_title: string | null
  related_article_slugs: string[]
  related_exercise_slugs: string[]
  related_tools: string[]
  checklist: ArticleChecklistItem[]
  actions: ArticleAction[]
  helpfulness_rating: number | null
  bookmark_count: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ExerciseCategory {
  id: string
  key: string
  name: string
  description: string | null
  icon: string | null
  color: string
  mapped_article_category_key: string | null
  sort_order: number
  is_active: boolean
}

export interface ExerciseFromDB {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  category_id: string | null
  category_name: string | null
  duration: string
  difficulty: 'Lätt' | 'Medel' | 'Utmanande'
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ExerciseStepFromDB {
  id: string
  exercise_id: string
  step_number: number
  title: string
  description: string
  sort_order: number
}

export interface ExerciseQuestionFromDB {
  id: string
  step_id: string
  question_key: string
  question_text: string
  placeholder: string | null
  sort_order: number
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert database article to EnhancedArticle format
 */
function dbArticleToEnhanced(article: ArticleFromDB): EnhancedArticle {
  return {
    id: article.slug, // Use slug as ID for backwards compatibility
    title: article.title,
    summary: article.summary,
    content: article.content,
    category: article.category_key || '',
    subcategory: article.subcategory || undefined,
    tags: article.tags || [],
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    readingTime: article.reading_time,
    difficulty: article.difficulty,
    energyLevel: article.energy_level,
    helpfulnessRating: article.helpfulness_rating || undefined,
    bookmarkCount: article.bookmark_count,
    relatedArticles: article.related_article_slugs || [],
    relatedTools: article.related_tools || [],
    relatedExercises: article.related_exercise_slugs || [],
    checklist: article.checklist || [],
    actions: article.actions || [],
    author: article.author || undefined,
    authorTitle: article.author_title || undefined,
  }
}

/**
 * Get Lucide icon component by name
 */
function getIconComponent(iconName: string): React.ComponentType<any> {
  const icons = LucideIcons as Record<string, React.ComponentType<any>>
  return icons[iconName] || icons.HelpCircle
}

/**
 * Convert database exercise to Exercise format with icon component
 */
function dbExerciseToExercise(
  exercise: ExerciseFromDB,
  steps: ExerciseStepFromDB[],
  questions: ExerciseQuestionFromDB[]
): Exercise {
  const exerciseSteps: ExerciseStep[] = steps
    .filter(s => s.exercise_id === exercise.id)
    .sort((a, b) => a.step_number - b.step_number)
    .map(step => ({
      id: step.step_number,
      title: step.title,
      description: step.description,
      questions: questions
        .filter(q => q.step_id === step.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(q => ({
          id: q.question_key,
          text: q.question_text,
          placeholder: q.placeholder || undefined,
        })),
    }))

  return {
    id: exercise.slug,
    title: exercise.title,
    description: exercise.description,
    icon: getIconComponent(exercise.icon),
    category: exercise.category_name || '',
    duration: exercise.duration,
    difficulty: exercise.difficulty,
    steps: exerciseSteps,
  }
}

// ============================================
// ARTICLE API
// ============================================

export const contentArticleApi = {
  /**
   * Get all active articles
   */
  async getAll(): Promise<EnhancedArticle[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.warn('Error fetching articles from DB, using mock data:', error.message)
        return mockArticlesData
      }

      if (!data || data.length === 0) {
        console.debug('No articles in database, using mock data')
        return mockArticlesData
      }

      return data.map(dbArticleToEnhanced)
    } catch (err) {
      console.error('Exception fetching articles:', err)
      return mockArticlesData
    }
  },

  /**
   * Get article by slug or ID. Använder bara id.eq när identifieraren är ett
   * giltigt UUID — annars failar postgres med "invalid input syntax for type
   * uuid" och hela or-klausulen droppas (400 Bad Request).
   */
  async getById(identifier: string): Promise<EnhancedArticle | null> {
    try {
      const column = isUuid(identifier) ? 'id' : 'slug'
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq(column, identifier)
        .eq('is_active', true)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching article from DB:', error.message)
      }

      if (data) {
        return dbArticleToEnhanced(data)
      }

      // Fallback to mock data
      const mockArticle = mockArticlesData.find(a => a.id === identifier)
      return mockArticle || null
    } catch (err) {
      console.error('Exception fetching article:', err)
      const mockArticle = mockArticlesData.find(a => a.id === identifier)
      return mockArticle || null
    }
  },

  /**
   * Get articles by category
   */
  async getByCategory(categoryKey: string): Promise<EnhancedArticle[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('category_key', categoryKey)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.warn('Error fetching articles by category:', error.message)
        return mockArticlesData.filter(a => a.category === categoryKey)
      }

      if (!data || data.length === 0) {
        return mockArticlesData.filter(a => a.category === categoryKey)
      }

      return data.map(dbArticleToEnhanced)
    } catch (err) {
      console.error('Exception fetching articles by category:', err)
      return mockArticlesData.filter(a => a.category === categoryKey)
    }
  },

  /**
   * Get all article categories
   */
  async getCategories(): Promise<ArticleCategory[]> {
    try {
      const { data, error } = await supabase
        .from('article_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error || !data || data.length === 0) {
        // Return mock categories
        return articleCategories.map((cat, index) => ({
          id: cat.id,
          key: cat.id,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          sort_order: index,
          is_active: true,
          subcategories: cat.subcategories,
        }))
      }

      return data
    } catch (err) {
      console.error('Exception fetching categories:', err)
      return articleCategories.map((cat, index) => ({
        id: cat.id,
        key: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sort_order: index,
        is_active: true,
        subcategories: cat.subcategories,
      }))
    }
  },

  /**
   * Search articles by query
   */
  async search(query: string): Promise<EnhancedArticle[]> {
    const lowerQuery = query.toLowerCase()

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_active', true)
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
        .order('sort_order', { ascending: true })
        .limit(20)

      if (error) {
        console.warn('Error searching articles:', error.message)
        return mockArticlesData.filter(a =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.summary.toLowerCase().includes(lowerQuery) ||
          a.tags.some(t => t.toLowerCase().includes(lowerQuery))
        )
      }

      if (!data || data.length === 0) {
        return mockArticlesData.filter(a =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.summary.toLowerCase().includes(lowerQuery) ||
          a.tags.some(t => t.toLowerCase().includes(lowerQuery))
        )
      }

      return data.map(dbArticleToEnhanced)
    } catch (err) {
      console.error('Exception searching articles:', err)
      return mockArticlesData.filter(a =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.summary.toLowerCase().includes(lowerQuery)
      )
    }
  },
}

// ============================================
// EXERCISE API
// ============================================

export const contentExerciseApi = {
  /**
   * Get all active exercises
   */
  async getAll(): Promise<Exercise[]> {
    try {
      // Fetch exercises, steps, and questions in parallel
      const [exercisesRes, stepsRes, questionsRes] = await Promise.all([
        supabase
          .from('exercises')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('exercise_steps')
          .select('*')
          .order('step_number', { ascending: true }),
        supabase
          .from('exercise_questions')
          .select('*')
          .order('sort_order', { ascending: true }),
      ])

      if (exercisesRes.error || !exercisesRes.data || exercisesRes.data.length === 0) {
        console.debug('No exercises in database, using mock data')
        return mockExercises
      }

      const steps = stepsRes.data || []
      const questions = questionsRes.data || []

      return exercisesRes.data.map(ex =>
        dbExerciseToExercise(ex, steps, questions)
      )
    } catch (err) {
      console.error('Exception fetching exercises:', err)
      return mockExercises
    }
  },

  /**
   * Get exercise by slug or ID. Samma UUID-detektion som articles.getById —
   * undviker 400 vid slug-input.
   */
  async getById(identifier: string): Promise<Exercise | null> {
    try {
      const column = isUuid(identifier) ? 'id' : 'slug'
      const { data: exercise, error } = await supabase
        .from('exercises')
        .select('*')
        .eq(column, identifier)
        .eq('is_active', true)
        .maybeSingle()

      if (error || !exercise) {
        const mockExercise = mockExercises.find(e => e.id === identifier)
        return mockExercise || null
      }

      // Fetch steps and questions
      const { data: steps } = await supabase
        .from('exercise_steps')
        .select('*')
        .eq('exercise_id', exercise.id)
        .order('step_number', { ascending: true })

      const stepIds = steps?.map(s => s.id) || []

      const { data: questions } = await supabase
        .from('exercise_questions')
        .select('*')
        .in('step_id', stepIds)
        .order('sort_order', { ascending: true })

      return dbExerciseToExercise(exercise, steps || [], questions || [])
    } catch (err) {
      console.error('Exception fetching exercise:', err)
      const mockExercise = mockExercises.find(e => e.id === identifier)
      return mockExercise || null
    }
  },

  /**
   * Get exercises by category
   */
  async getByCategory(categoryName: string): Promise<Exercise[]> {
    try {
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('category_name', categoryName)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error || !exercises || exercises.length === 0) {
        return mockExercises.filter(e => e.category === categoryName)
      }

      // Fetch all steps and questions
      const exerciseIds = exercises.map(e => e.id)

      const { data: steps } = await supabase
        .from('exercise_steps')
        .select('*')
        .in('exercise_id', exerciseIds)
        .order('step_number', { ascending: true })

      const stepIds = steps?.map(s => s.id) || []

      const { data: questions } = await supabase
        .from('exercise_questions')
        .select('*')
        .in('step_id', stepIds)
        .order('sort_order', { ascending: true })

      return exercises.map(ex =>
        dbExerciseToExercise(ex, steps || [], questions || [])
      )
    } catch (err) {
      console.error('Exception fetching exercises by category:', err)
      return mockExercises.filter(e => e.category === categoryName)
    }
  },

  /**
   * Get all exercise categories
   */
  async getCategories(): Promise<ExerciseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error || !data || data.length === 0) {
        // Return unique categories from mock data
        const uniqueCategories = [...new Set(mockExercises.map(e => e.category))]
        return uniqueCategories.map((cat, index) => ({
          id: cat,
          key: cat.toLowerCase().replace(/\s+/g, '-'),
          name: cat,
          description: null,
          icon: null,
          color: 'emerald',
          mapped_article_category_key: null,
          sort_order: index,
          is_active: true,
        }))
      }

      return data
    } catch (err) {
      console.error('Exception fetching exercise categories:', err)
      const uniqueCategories = [...new Set(mockExercises.map(e => e.category))]
      return uniqueCategories.map((cat, index) => ({
        id: cat,
        key: cat.toLowerCase().replace(/\s+/g, '-'),
        name: cat,
        description: null,
        icon: null,
        color: 'emerald',
        mapped_article_category_key: null,
        sort_order: index,
        is_active: true,
      }))
    }
  },

  /**
   * Get exercise steps
   */
  async getSteps(exerciseSlug: string): Promise<ExerciseStep[]> {
    try {
      // Get exercise ID first
      const { data: exercise } = await supabase
        .from('exercises')
        .select('id')
        .eq('slug', exerciseSlug)
        .maybeSingle()

      if (!exercise) {
        const mockExercise = mockExercises.find(e => e.id === exerciseSlug)
        return mockExercise?.steps || []
      }

      // Get steps
      const { data: steps } = await supabase
        .from('exercise_steps')
        .select('*')
        .eq('exercise_id', exercise.id)
        .order('step_number', { ascending: true })

      if (!steps || steps.length === 0) {
        const mockExercise = mockExercises.find(e => e.id === exerciseSlug)
        return mockExercise?.steps || []
      }

      // Get questions
      const stepIds = steps.map(s => s.id)
      const { data: questions } = await supabase
        .from('exercise_questions')
        .select('*')
        .in('step_id', stepIds)
        .order('sort_order', { ascending: true })

      return steps.map(step => ({
        id: step.step_number,
        title: step.title,
        description: step.description,
        questions: (questions || [])
          .filter(q => q.step_id === step.id)
          .map(q => ({
            id: q.question_key,
            text: q.question_text,
            placeholder: q.placeholder || undefined,
          })),
      }))
    } catch (err) {
      console.error('Exception fetching exercise steps:', err)
      const mockExercise = mockExercises.find(e => e.id === exerciseSlug)
      return mockExercise?.steps || []
    }
  },
}

// Re-export for convenience
export { mockArticlesData, articleCategories } from './articleData'
export { exercises as mockExercises } from '@/data/exercises'
