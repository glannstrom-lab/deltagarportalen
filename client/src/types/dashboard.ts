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
  
  // Kalender
  calendar: {
    upcomingEvents: {
      id: string
      title: string
      date: string
      type: 'meeting' | 'reminder' | 'deadline'
    }[]
    eventsThisWeek: number
    hasConsultantMeeting: boolean
  }
  
  // Aktivitet
  activity: {
    weeklyApplications: number
    streakDays: number
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
}
