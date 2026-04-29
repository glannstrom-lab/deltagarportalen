import { createContext, useContext, type ReactNode } from 'react'

/** Shape of the data the loader emits. Each field maps to a widget's slice. */
export interface ResurserSummary {
  // Mina dokument — same data as JobsokHub but Resurser is a documents-canonical view
  cv: { id: string; updated_at: string } | null
  coverLetters: Array<{ id: string; title?: string; created_at: string }>
  // Kunskapsbank — article_reading_progress
  recentArticles: Array<{
    article_id: string
    progress_percent: number
    is_completed: boolean
    completed_at: string | null
  }>
  articleCompletedCount: number
  // AI-team — ai_team_sessions
  aiTeamSessions: Array<{ agent_id: string; updated_at: string }>
  aiTeamSessionCount: number
  // Externa resurser, Utskriftsmaterial, Övningar are STATIC — no slice required.
  // (Per RESEARCH.md Pitfall G: Övningar ships static for v1.0 because no completion table exists.)
}

const ResurserDataContext = createContext<ResurserSummary | undefined>(undefined)

export function ResurserDataProvider({
  value,
  children,
}: {
  value: ResurserSummary | undefined
  children: ReactNode
}) {
  return (
    <ResurserDataContext.Provider value={value}>
      {children}
    </ResurserDataContext.Provider>
  )
}

/** Returns the data slice for a widget, or undefined while loader is pending. */
export function useResurserWidgetData<K extends keyof ResurserSummary>(
  slice: K
): ResurserSummary[K] | undefined {
  const ctx = useContext(ResurserDataContext)
  if (!ctx) return undefined
  return ctx[slice]
}

/** Returns the entire summary (for widgets needing multiple slices, e.g. MyDocuments). */
export function useResurserSummary(): ResurserSummary | undefined {
  return useContext(ResurserDataContext)
}
