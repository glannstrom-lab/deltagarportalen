/**
 * Typer för dashboard-widgets
 */

export type WidgetStatus = 'empty' | 'in-progress' | 'complete' | 'error'
export type WidgetColor = 'violet' | 'teal' | 'blue' | 'orange' | 'green' | 'rose' | 'amber' | 'indigo'

export interface DashboardWidgetData {
  // CV
  cv: {
    hasCV: boolean
    progress: number
    atsScore: number
    lastEdited: string | null
    missingSections: string[]
  }
  
  // Intresseguide
  interest: {
    hasResult: boolean
    topRecommendations: string[]
    completedAt: string | null
  }
  
  // Jobbsökning
  jobs: {
    savedCount: number
    newMatches: number
    recentSavedJobs: {
      id: string
      title: string
      company: string
    }[]
  }
  
  // Ansökningar
  applications: {
    total: number
    statusBreakdown: {
      applied: number
      interview: number
      rejected: number
      offer: number
    }
    nextFollowUp: {
      company: string
      jobTitle: string
      dueDate: string
    } | null
  }
  
  // Personliga brev
  coverLetters: {
    count: number
    recentLetters: {
      id: string
      title: string
      company: string
      createdAt: string
    }[]
  }
  
  // Dagbok
  diary: {
    entriesCount: number
    lastEntry: {
      date: string
      mood: 1 | 2 | 3 | 4 | 5
      preview: string
    } | null
    streakDays: number
    hasEntryToday: boolean
  }
  
  // Aktivitet
  activity: {
    weeklyApplications: number
    streakDays: number
  }
  
  // Övningar
  exercises: {
    completedCount: number
    lastCompleted: {
      title: string
      completedAt: string
    } | null
    recommendedExercise: {
      title: string
      duration: number
      category: string
    } | null
  }
  
  // Kunskapsbank
  knowledge: {
    readCount: number
    savedCount: number
    totalArticles: number
    recentlyRead: {
      id: string
      title: string
      category: string
    }[]
    recommendedArticle: {
      title: string
      readTime: number
      category: string
    } | null
  }
}

export interface WidgetStat {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
}

export interface DashboardWidgetProps {
  title: string
  icon: React.ReactNode
  to: string
  color: WidgetColor
  status: WidgetStatus
  progress?: number
  loading?: boolean
  error?: string | null
  children?: React.ReactNode
  stats?: WidgetStat[]
  primaryAction?: {
    label: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
  }
  onRetry?: () => void
  sizeSelector?: React.ReactNode
}
