/**
 * Typer för hub-sidornas summary-loaders (use*HubSummary).
 *
 * Flyttade hit 2026-07-10 (C1) från components/widgets/*DataContext.tsx
 * när widget-grid-systemet arkiverades (archive/2026-07-widget-system/) —
 * hubbarna använder HubPage-funktionskort, inte widgets, men loaders och
 * deras typer är levande.
 */

/** Söka jobb-hubbens datasnitt */
export interface JobsokSummary {
  cv: { id: string; updated_at: string; completion_pct?: number } | null
  coverLetters: Array<{ id: string; title?: string; created_at: string }>
  interviewSessions: Array<{ id: string; score: number | null; created_at: string }>
  applicationStats: {
    total: number
    byStatus: Record<string, number>
    segments: Array<{ label: string; count: number; deEmphasized?: boolean }>
  }
  spontaneousCount: number
  /** Kommande uppföljningar för spontanansökningar (30 dagar framåt) */
  spontaneousFollowups?: { count: number; nextDate: string | null }
  // salary + international are optional — loader omits if tables don't exist
  salary?: { median: number; low: number; high: number; roleLabel: string } | null
  international?: { countries: string[] } | null
}

/** Karriär-hubbens datasnitt */
export interface KarriarSummary {
  careerGoals: {
    shortTerm?: string
    longTerm?: string
    preferredRoles?: string[]
    targetIndustries?: string[]
    updatedAt?: string
  } | null
  linkedinUrl: string | null
  latestSkillsAnalysis: {
    dream_job: string
    skills_comparison: unknown
    match_percentage: number
    created_at: string
  } | null
  latestBrandAudit: {
    score: number
    dimensions: unknown
    created_at: string
  } | null
}

/** Min vardag-hubbens datasnitt */
export interface MinVardagSummary {
  recentMoodLogs: Array<{ mood_level: number; energy_level: number; log_date: string }>
  diaryEntryCount: number
  latestDiaryEntry: { id: string; created_at: string } | null
  upcomingEvents: Array<{
    id: string
    title: string
    date: string
    time: string | null
    type: string | null
  }>
  networkContactsCount: number
  consultant: { id: string; full_name: string | null; avatar_url: string | null } | null
}

/** Resurser-hubbens datasnitt */
export interface ResurserSummary {
  cv: { id: string; updated_at: string } | null
  coverLetters: Array<{ id: string; title?: string; created_at: string }>
  recentArticles: Array<{
    article_id: string
    progress_percent: number
    is_completed: boolean
    completed_at: string | null
  }>
  articleCompletedCount: number
  aiTeamSessions: Array<{ agent_id: string; updated_at: string }>
  aiTeamSessionCount: number
}
