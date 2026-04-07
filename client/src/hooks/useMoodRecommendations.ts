/**
 * Mood-Based Recommendations Hook
 * Provides content recommendations based on user's current mood
 * Shows encouraging content when user reports low mood
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EnhancedArticle } from '@/services/articleData'

// ============================================
// TYPES
// ============================================

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodData {
  mood: MoodLevel
  createdAt: string
  notes?: string
}

export interface MoodRecommendation {
  type: 'article' | 'exercise' | 'action'
  id: string
  title: string
  description: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  link: string
  category: string
}

export interface MoodBasedContent {
  currentMood: MoodLevel | null
  moodLabel: string
  moodEmoji: string
  recommendations: MoodRecommendation[]
  encouragingMessage: string
  suggestedActivity: string
}

// ============================================
// MOOD CONFIGURATION
// ============================================

const MOOD_CONFIG: Record<MoodLevel, {
  label: string
  emoji: string
  message: string
  activity: string
  contentTypes: string[]
}> = {
  1: {
    label: 'Mycket lågt',
    emoji: '😔',
    message: 'Det är okej att ha en tuff dag. Ta det lugnt och var snäll mot dig själv.',
    activity: 'Ta en kort paus och gör något som gör dig lugn',
    contentTypes: ['self-care', 'motivation', 'wellness']
  },
  2: {
    label: 'Lågt',
    emoji: '😕',
    message: 'Alla har dagar då det känns tungt. Varje litet steg räknas.',
    activity: 'Läs en kort, inspirerande artikel',
    contentTypes: ['motivation', 'easy-wins', 'self-care']
  },
  3: {
    label: 'Neutral',
    emoji: '😐',
    message: 'Stabil dag! Bra tillfälle att ta tag i något på din lista.',
    activity: 'Fokusera på en uppgift du kan avsluta idag',
    contentTypes: ['practical', 'knowledge', 'planning']
  },
  4: {
    label: 'Bra',
    emoji: '🙂',
    message: 'Bra energi! Passa på att göra framsteg idag.',
    activity: 'Ta itu med något som du skjutit upp',
    contentTypes: ['career', 'skills', 'interview']
  },
  5: {
    label: 'Mycket bra',
    emoji: '😊',
    message: 'Fantastiskt! Utnyttja din energi och ta på dig något utmanande.',
    activity: 'Nätverka eller skicka en ansökan',
    contentTypes: ['networking', 'applications', 'challenging']
  }
}

// Content category mapping for recommendations
const CONTENT_CATEGORIES: Record<string, {
  articleCategories: string[]
  exerciseTypes: string[]
  actions: MoodRecommendation[]
}> = {
  'self-care': {
    articleCategories: ['wellness', 'mental-health', 'self-care'],
    exerciseTypes: ['reflection', 'breathing', 'gratitude'],
    actions: [
      {
        type: 'action',
        id: 'diary',
        title: 'Skriv i dagboken',
        description: 'Ibland hjälper det att skriva ner tankar',
        reason: 'Baserat på ditt humör',
        priority: 'high',
        link: '/diary?tab=journal',
        category: 'wellness'
      },
      {
        type: 'action',
        id: 'gratitude',
        title: 'Tacksamhetsövning',
        description: 'Hitta tre saker att vara tacksam för',
        reason: 'Kan höja humöret',
        priority: 'medium',
        link: '/diary?tab=gratitude',
        category: 'wellness'
      }
    ]
  },
  'motivation': {
    articleCategories: ['motivation', 'success-stories', 'inspiration'],
    exerciseTypes: ['visualization', 'goals'],
    actions: [
      {
        type: 'action',
        id: 'goals',
        title: 'Se dina mål',
        description: 'Påminn dig om vad du arbetar mot',
        reason: 'Håller motivationen uppe',
        priority: 'high',
        link: '/diary?tab=goals',
        category: 'wellness'
      }
    ]
  },
  'easy-wins': {
    articleCategories: ['quick-tips', 'beginner', 'basics'],
    exerciseTypes: ['quick', 'simple'],
    actions: [
      {
        type: 'action',
        id: 'quick-read',
        title: 'Läs en kort artikel',
        description: '2-3 minuters läsning för snabb inspiration',
        reason: 'Snabbt sätt att göra framsteg',
        priority: 'medium',
        link: '/knowledge-base',
        category: 'knowledge'
      }
    ]
  },
  'practical': {
    articleCategories: ['cv', 'job-search', 'practical-tips'],
    exerciseTypes: ['cv-review', 'job-search'],
    actions: [
      {
        type: 'action',
        id: 'cv-update',
        title: 'Uppdatera ditt CV',
        description: 'Lägg till eller förbättra en sektion',
        reason: 'Praktiskt framsteg',
        priority: 'medium',
        link: '/cv',
        category: 'cv'
      }
    ]
  },
  'career': {
    articleCategories: ['career-development', 'industry', 'trends'],
    exerciseTypes: ['career-planning', 'skills-assessment'],
    actions: [
      {
        type: 'action',
        id: 'explore-jobs',
        title: 'Utforska jobb',
        description: 'Sök efter intressanta möjligheter',
        reason: 'Utöka dina alternativ',
        priority: 'high',
        link: '/jobs',
        category: 'jobs'
      }
    ]
  },
  'interview': {
    articleCategories: ['interview', 'preparation', 'questions'],
    exerciseTypes: ['interview-practice', 'scenarios'],
    actions: [
      {
        type: 'action',
        id: 'interview-prep',
        title: 'Intervjuförberedelse',
        description: 'Öva på vanliga frågor',
        reason: 'Bygg självförtroende',
        priority: 'high',
        link: '/interview-guide',
        category: 'interview'
      }
    ]
  },
  'networking': {
    articleCategories: ['networking', 'linkedin', 'connections'],
    exerciseTypes: ['networking', 'pitch'],
    actions: [
      {
        type: 'action',
        id: 'linkedin',
        title: 'Uppdatera LinkedIn',
        description: 'Optimera din profil',
        reason: 'Öka din synlighet',
        priority: 'high',
        link: '/linkedin-optimizer',
        category: 'networking'
      }
    ]
  },
  'applications': {
    articleCategories: ['cover-letter', 'applications', 'follow-up'],
    exerciseTypes: ['application-review'],
    actions: [
      {
        type: 'action',
        id: 'apply',
        title: 'Skicka en ansökan',
        description: 'Välj ett sparat jobb och ansök',
        reason: 'Ta nästa steg',
        priority: 'high',
        link: '/jobs?filter=saved',
        category: 'applications'
      }
    ]
  },
  'challenging': {
    articleCategories: ['advanced', 'leadership', 'entrepreneurship'],
    exerciseTypes: ['complex', 'leadership'],
    actions: [
      {
        type: 'action',
        id: 'stretch-goal',
        title: 'Sätt ett utmanande mål',
        description: 'Sikta högt idag',
        reason: 'Maximera din energi',
        priority: 'high',
        link: '/diary?tab=goals',
        category: 'wellness'
      }
    ]
  }
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchTodaysMood(): Promise<MoodData | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  try {
    const { data } = await supabase
      .from('mood_logs')
      .select('mood, created_at, notes')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) return null

    return {
      mood: data.mood as MoodLevel,
      createdAt: data.created_at,
      notes: data.notes || undefined
    }
  } catch {
    return null
  }
}

// ============================================
// RECOMMENDATION GENERATION
// ============================================

function generateRecommendations(
  mood: MoodLevel,
  articles: EnhancedArticle[]
): MoodRecommendation[] {
  const moodConfig = MOOD_CONFIG[mood]
  const recommendations: MoodRecommendation[] = []

  // Get content types for this mood level
  for (const contentType of moodConfig.contentTypes) {
    const config = CONTENT_CATEGORIES[contentType]
    if (!config) continue

    // Add action recommendations
    for (const action of config.actions) {
      recommendations.push({
        ...action,
        reason: moodConfig.message
      })
    }

    // Add article recommendations based on matching categories
    const matchingArticles = articles.filter(article =>
      config.articleCategories.some(cat =>
        article.category?.toLowerCase().includes(cat) ||
        article.tags?.some((tag: string) => tag.toLowerCase().includes(cat))
      )
    ).slice(0, 2)

    for (const article of matchingArticles) {
      recommendations.push({
        type: 'article',
        id: article.id,
        title: article.title,
        description: article.summary.slice(0, 100) + '...',
        reason: `Passar för ${moodConfig.label.toLowerCase()} humör`,
        priority: mood <= 2 ? 'high' : 'medium',
        link: `/knowledge-base/article/${article.id}`,
        category: article.category || 'general'
      })
    }
  }

  // Sort by priority and limit
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations.slice(0, 6)
}

// ============================================
// MAIN HOOK
// ============================================

export function useMoodRecommendations(articles: EnhancedArticle[] = []) {
  const { data: moodData, isLoading } = useQuery({
    queryKey: ['todaysMood'],
    queryFn: fetchTodaysMood,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })

  const result = useMemo<MoodBasedContent>(() => {
    const currentMood = moodData?.mood || null

    if (!currentMood) {
      return {
        currentMood: null,
        moodLabel: 'Okänt',
        moodEmoji: '❓',
        recommendations: [],
        encouragingMessage: 'Logga ditt humör för personliga rekommendationer',
        suggestedActivity: 'Börja med att logga hur du mår idag'
      }
    }

    const config = MOOD_CONFIG[currentMood]
    const recommendations = generateRecommendations(currentMood, articles)

    return {
      currentMood,
      moodLabel: config.label,
      moodEmoji: config.emoji,
      recommendations,
      encouragingMessage: config.message,
      suggestedActivity: config.activity
    }
  }, [moodData, articles])

  return {
    ...result,
    isLoading,
    hasMoodToday: !!moodData,
    moodData,
  }
}

/**
 * Get encouragement message based on mood
 */
export function getEncouragementMessage(mood: MoodLevel | null): string {
  if (!mood) return 'Hur mår du idag?'
  return MOOD_CONFIG[mood].message
}

/**
 * Get suggested activity based on mood
 */
export function getSuggestedActivity(mood: MoodLevel | null): string {
  if (!mood) return 'Logga ditt humör för personliga förslag'
  return MOOD_CONFIG[mood].activity
}

export default useMoodRecommendations
