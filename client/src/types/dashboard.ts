/**
 * Typer för dashboard-widgets
 */

export type WidgetStatus = 'empty' | 'in-progress' | 'complete' | 'error'
export type WidgetColor = 'violet' | 'teal' | 'blue' | 'orange' | 'green' | 'rose' | 'amber' | 'indigo'

export interface DashboardWidgetData {
  // CV - uppdaterad med data från alla 5 tabs
  cv: {
    hasCV: boolean
    progress: number
    atsScore: number
    atsFeedback: string[]
    lastEdited: string | null
    missingSections: string[]
    // Mina CV - sparade versioner
    savedCVs: {
      id: string
      name: string
      createdAt: string
      isDefault?: boolean
    }[]
    // Mallar
    currentTemplate: string
  }
  
  // Intresseguide - uppdaterad med RIASEC-data
  interest: {
    hasResult: boolean
    topRecommendations: {
      name: string
      matchPercentage: number
    }[]
    completedAt: string | null
    // RIASEC-profil
    riasecProfile: {
      dominant: string
      secondary: string
      scores: Record<string, number>
    } | null
    // Quiz-progress
    answeredQuestions: number
    totalQuestions: number
  }
  
  // Jobbsökning
  jobs: {
    savedCount: number
    newMatches: number
    recentSavedJobs: {
      id: string
      title: string
      company: string
      location?: string
      deadline?: string
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
  
  // Personliga brev - uppdaterad med mer data
  coverLetters: {
    count: number
    drafts: number
    recentLetters: {
      id: string
      title: string
      company: string
      jobTitle?: string
      createdAt: string
    }[]
  }
  
  // Dagbok / Kalender - uppdaterad
  calendar: {
    upcomingEvents: {
      id: string
      title: string
      date: string
      time?: string
      type: string
    }[]
    eventsThisWeek: number
    hasConsultantMeeting: boolean
  }
  
  // Aktivitet
  activity: {
    weeklyApplications: number
    streakDays: number
  }
  
  // Övningar - uppdaterad
  exercises: {
    totalExercises: number
    completedExercises: number
    completionRate: number
    streakDays: number
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
  
  // Quests (dagliga uppdrag)
  quests: {
    total: number
    completed: number
    items: {
      id: string
      title: string
      completed: boolean
      points: number
      category: string
    }[]
  }
  
  // Välmående
  wellness: {
    moodToday: 1 | 2 | 3 | 4 | 5 | null
    streakDays: number
    completedActivities: number
    lastEntryDate: string | null
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
    disabled?: boolean
    icon?: React.ReactNode
  }
  onRetry?: () => void
  sizeSelector?: React.ReactNode
}
