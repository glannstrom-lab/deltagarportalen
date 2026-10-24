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
    /**
     * `key`, inte färdig text: etiketten översätts av vyn
     * (`hubOverview.panel.segment.<key>`). Låg tidigare som svenska strängar
     * här i datalagret och kunde därför aldrig översättas.
     */
    segments: Array<{ key: string; count: number; deEmphasized?: boolean }>
    /**
     * Ansökningsdatum för den ÄLDSTA ansökan som väntar på svar (status
     * applied/screening), eller null när ingen väntar eller ingen av dem har
     * ett datum. Bär Översiktens nästa-steg-kort: "följ upp" föreslås bara
     * när det gått minst en vecka, och utan datum föreslås det inte alls.
     */
    awaitingSince: string | null
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
  /**
   * FN3: senaste intervjun (kalenderhändelse av typen intervju) de senaste
   * dagarna, för frågan "Hur gick intervjun?". `null` = ingen, `undefined` = ej hämtad.
   */
  senasteIntervju?: { id: string; title: string; date: string; job_application_id: string | null } | null
  networkContactsCount: number
  consultant: { id: string; full_name: string | null; avatar_url: string | null } | null
  /**
   * DL4 (2026-10-19): nästa bokade möte med konsulenten och nästa pass i
   * aktivitetsplanen. Kalenderraden på Översikt läste bara `calendar_events`
   * och sa "inget inbokat" till en deltagare med möte i morgon och pass hela veckan.
   */
  nastaMote?: { id: string; scheduled_at: string } | null
  nastaPass?: {
    id: string
    title: string
    date: string
    start_time: string | null
    /** Deltagarens egen incheckning ("Jag är här"). Nästa steg-regeln läser den. */
    self_checkin_at?: string | null
    /** Konsulentens markering. Satt = passet är redan hanterat. */
    attendance?: string | null
    /** Deltagaren har anmält frånvaro. */
    absence_reported_at?: string | null
  } | null
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
