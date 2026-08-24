/**
 * Content API - Articles and Exercises from Supabase
 *
 * ## Artiklarna har INGEN reservkopia längre (2026-08-22)
 *
 * Fram till dess returnerade varje artikelfunktion `mockArticlesData` — 141
 * inbyggda artiklar — vid DB-fel, tomt svar ELLER exception, tyst och med en
 * `console.warn`. Prod har 163 aktiva artiklar, så reservkopian var både
 * inaktuell och osann: ett RLS-fel eller ett nätverksglapp såg ut som en
 * fungerande kunskapsbank där 22 artiklar råkade saknas. Den var dessutom
 * appens näst största chunk (247 kB brotli), levererad till varje besökare
 * som öppnade en artikel, kunskapsbanken, övningarna, utskrifterna,
 * spontanansökan eller intervjusimulatorn.
 *
 * Numera kastar artikelfunktionerna vid fel. Ett fel ska se ut som ett fel.
 * Övningarna har kvar sin reservkopia — tabellen `exercises` har 0 rader i
 * prod, så den vägen ÄR bundlen tills någon seedar den (se ROADMAP).
 */

import { supabase } from '@/lib/supabase'
import { apiLogger } from '@/lib/logger'

/** Returns true if the string is a canonical UUID (8-4-4-4-12 hex). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUuid(s: string): boolean {
  return UUID_REGEX.test(s)
}
import { articleCategories } from './articleData'
import type { EnhancedArticle, ArticleChecklistItem, ArticleAction } from '@/data/artikelkategorier'
import { exercises as mockExercises, type Exercise, type ExerciseStep } from '@/data/exercises'
import { oversattInnehall } from '@/data/oversattningar'
import { getIcon } from '@/lib/dynamicIconMap'

// ============================================
// TYPES
// ============================================

/**
 * Kolumnerna listvyerna behöver. `select('*')` drog med hela `content` för
 * alla 163 artiklar: 1 001 kB rått / **325 kB gzip** över nätet, varje gång
 * någon öppnade kunskapsbanken. Samma fråga utan brödtexten väger 14 kB gzip.
 * Målgruppen sitter delvis på mobil med begränsad datamängd.
 */
const LISTKOLUMNER =
  'id,slug,title,summary,title_en,summary_en,category_key,subcategory,tags,reading_time,difficulty,' +
  'energy_level,author,author_title,related_article_slugs,related_exercise_slugs,' +
  'related_tools,checklist,actions,helpfulness_rating,bookmark_count,created_at,updated_at'

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
  /** Engelsk översättning. NULL = ingen finns; då används svenskan. */
  title_en?: string | null
  summary_en?: string | null
  content_en?: string | null
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
/**
 * Väljer engelsk text när användaren kör engelska OCH översättningen finns.
 *
 * Fältvis fallback, inte artikelvis: en artikel som fått titel och ingress
 * översatta men ännu inte brödtexten visar engelsk rubrik och svensk text i
 * stället för att helt utebli. Att blanda är fult men läsbart; att sakna är
 * varken.
 */
function pa(sprak: string, en: string | null | undefined, sv: string): string {
  if (sprak === 'sv') return sv
  const t = (en ?? '').trim()
  return t ? t : sv
}

function dbArticleToEnhanced(article: ArticleFromDB): EnhancedArticle {
  let sprak = 'sv'
  try {
    sprak = localStorage.getItem('language') || 'sv'
  } catch {
    // Privat läge eller blockerad lagring — svenska är rätt reserv.
  }
  return {
    id: article.slug, // Use slug as ID for backwards compatibility
    title: pa(sprak, article.title_en, article.title),
    summary: pa(sprak, article.summary_en, article.summary),
    // Listvyerna hämtar inte brödtexten (se LISTKOLUMNER).
    content: pa(sprak, article.content_en, article.content ?? ''),
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
function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  return getIcon(iconName) as React.ComponentType<{ className?: string }>
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
   * Alla aktiva artiklar — UTAN brödtext. Kastar vid fel.
   *
   * Returnerar tom lista bara när databasen faktiskt är tom. Skillnaden är
   * hela poängen: den som ritar listan måste kunna säga "vi når inte
   * artiklarna" i stället för "det finns inga artiklar".
   */
  async getAll(): Promise<EnhancedArticle[]> {
    const { data, error } = await supabase
      .from('articles')
      .select(LISTKOLUMNER)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .returns<ArticleFromDB[]>()

    if (error) {
      apiLogger.error('Kunde inte hämta artiklar', { message: error.message })
      throw new Error(`Kunde inte hämta artiklar: ${error.message}`)
    }

    return (data ?? []).map(dbArticleToEnhanced)
  },

  /**
   * Get article by slug or ID. Använder bara id.eq när identifieraren är ett
   * giltigt UUID — annars failar postgres med "invalid input syntax for type
   * uuid" och hela or-klausulen droppas (400 Bad Request).
   */
  async getById(identifier: string): Promise<EnhancedArticle | null> {
    const column = isUuid(identifier) ? 'id' : 'slug'
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq(column, identifier)
      .eq('is_active', true)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      apiLogger.error('Kunde inte hämta artikeln', { identifier, message: error.message })
      throw new Error(`Kunde inte hämta artikeln: ${error.message}`)
    }

    return data ? dbArticleToEnhanced(data) : null
  },

  /**
   * Hämta ett fåtal artiklar på slug — för "Relaterade artiklar".
   *
   * Artikelsidan hämtade tidigare HELA korpusen (`getAll()`, 325 kB gzip,
   * utanför React Query alltså okachad) enbart för att slå upp tre relaterade
   * slugs. 152 av 163 artiklar har relaterade, så det skedde nästan alltid.
   */
  async getBySlugs(slugs: string[]): Promise<EnhancedArticle[]> {
    const rensade = slugs.filter((s) => typeof s === 'string' && s.length > 0).slice(0, 12)
    if (!rensade.length) return []

    const { data, error } = await supabase
      .from('articles')
      .select(LISTKOLUMNER)
      .in('slug', rensade)
      .eq('is_active', true)
      .returns<ArticleFromDB[]>()

    if (error) {
      apiLogger.error('Kunde inte hämta relaterade artiklar', { message: error.message })
      return []
    }

    // Behåll ordningen anroparen bad om — `.in()` garanterar ingen.
    const karta = new Map((data ?? []).map((rad) => [rad.slug, dbArticleToEnhanced(rad)]))
    return rensade.map((s) => karta.get(s)).filter(Boolean) as EnhancedArticle[]
  },

  /**
   * Get articles by category
   */
  async getByCategory(categoryKey: string): Promise<EnhancedArticle[]> {
    const { data, error } = await supabase
      .from('articles')
      .select(LISTKOLUMNER)
      .eq('category_key', categoryKey)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .returns<ArticleFromDB[]>()

    if (error) {
      apiLogger.error('Kunde inte hämta artiklar per kategori', { categoryKey, message: error.message })
      throw new Error(`Kunde inte hämta artiklar: ${error.message}`)
    }

    return (data ?? []).map(dbArticleToEnhanced)
  },

  /**
   * Get all article categories
   *
   * OBS: tabellen `article_categories` har **0 rader i prod** (mätt
   * 2026-08-22), så den här funktionen faller alltid tillbaka på listan i
   * `articleData.ts`. Reservkopian behålls därför medvetet — den ÄR källan
   * tills någon seedar tabellen. Se ROADMAP.
   */
  async getCategories(): Promise<ArticleCategory[]> {
    const reserv = () =>
      articleCategories.map((cat, index) => ({
        id: cat.id,
        key: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sort_order: index,
        is_active: true,
        subcategories: cat.subcategories,
      }))

    try {
      const { data, error } = await supabase
        .from('article_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error || !data || data.length === 0) return reserv()
      return data
    } catch (err) {
      apiLogger.error('Exception fetching categories', { err })
      return reserv()
    }
  },

  /**
   * Fritextsökning som faktiskt läser artiklarnas TEXT.
   *
   * Klientfiltret i TopicsTab matchar bara titel, sammanfattning och taggar.
   * Uppmätt mot prod: "Personligt brev" gav 4 träffar i UI mot 19 i
   * innehållet, "lön" 14 mot 66. Den här funktionen fanns redan och hade
   * noll anropare — nu används den när användaren söker.
   *
   * Returnerar slugs, inte hela artiklar, så att anroparen kan skära i den
   * lista den redan har utan att hämta brödtexten en gång till.
   */
  async searchSlugs(query: string): Promise<string[]> {
    const q = query.trim()
    if (q.length < 2) return []

    // `%` och `_` är jokertecken i ilike, `,` bryter or-klausulen.
    const sakert = q.replace(/[%_,()]/g, ' ').trim()
    if (!sakert) return []

    const { data, error } = await supabase
      .from('articles')
      .select('slug')
      .eq('is_active', true)
      .or(`title.ilike.%${sakert}%,summary.ilike.%${sakert}%,content.ilike.%${sakert}%`)
      .limit(60)
      .returns<{ slug: string }[]>()

    if (error) {
      apiLogger.error('Kunde inte söka i artiklarna', { message: error.message })
      return []
    }

    return (data ?? []).map((rad) => rad.slug)
  },
}

// ============================================
// EXERCISE API
// ============================================

/**
 * Övningarnas text ligger i `data/exercises.ts` på svenska. Engelskan är en
 * overlay som läggs på här, vid tjänstegränsen, så att ALLA vägar in till en
 * övning (lista, enskild, per kategori, steg) får samma översättning — i
 * stället för att varje sida måste komma ihåg att göra det.
 * Är språket svenska returneras datan oförändrad utan att overlayen hämtas.
 */
const oversattOvningar = (lista: Exercise[]) =>
  oversattInnehall('exercises', lista, 'exercises')

const oversattOvning = (ovning: Exercise) =>
  oversattInnehall('exercises', ovning, `exercises.${ovning.id}`)

const oversattSteg = (ovning: Exercise) =>
  oversattInnehall('exercises', ovning.steps, `exercises.${ovning.id}.steps`)

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
        apiLogger.debug('No exercises in database, using mock data')
        return oversattOvningar(mockExercises)
      }

      const steps = stepsRes.data || []
      const questions = questionsRes.data || []

      return oversattOvningar(
        exercisesRes.data.map(ex => dbExerciseToExercise(ex, steps, questions))
      )
    } catch (err) {
      console.error('Exception fetching exercises:', err)
      return oversattOvningar(mockExercises)
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
        return mockExercise ? oversattOvning(mockExercise) : null
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

      return oversattOvning(dbExerciseToExercise(exercise, steps || [], questions || []))
    } catch (err) {
      console.error('Exception fetching exercise:', err)
      const mockExercise = mockExercises.find(e => e.id === identifier)
      return mockExercise ? oversattOvning(mockExercise) : null
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
        return oversattOvningar(mockExercises.filter(e => e.category === categoryName))
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
      return oversattOvningar(mockExercises.filter(e => e.category === categoryName))
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
        return mockExercise ? oversattSteg(mockExercise) : []
      }

      // Get steps
      const { data: steps } = await supabase
        .from('exercise_steps')
        .select('*')
        .eq('exercise_id', exercise.id)
        .order('step_number', { ascending: true })

      if (!steps || steps.length === 0) {
        const mockExercise = mockExercises.find(e => e.id === exerciseSlug)
        return mockExercise ? oversattSteg(mockExercise) : []
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
      return mockExercise ? oversattSteg(mockExercise) : []
    }
  },
}

// Re-export for convenience.
// `mockArticlesData` låg här också — borttagen 2026-08-22 tillsammans med
// artiklarnas reservkopia. Noll importörer hade den.
export { articleCategories } from './articleData'
export { exercises as mockExercises } from '@/data/exercises'
