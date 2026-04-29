import { createContext, useContext, type ReactNode } from 'react'

/** Shape of the data the loader emits. Each field maps to a widget's slice. */
export interface KarriarSummary {
  // From profiles row (single fetch — Pitfall E: avoid double profiles query)
  careerGoals: {
    shortTerm?: string
    longTerm?: string
    preferredRoles?: string[]
    targetIndustries?: string[]
    updatedAt?: string
  } | null
  linkedinUrl: string | null
  // From skills_analyses (latest row)
  latestSkillsAnalysis: {
    dream_job: string
    skills_comparison: unknown // JSONB — widget extracts top-3 missing skills
    match_percentage: number   // used for QUALITATIVE label only — never displayed raw
    created_at: string
  } | null
  // From personal_brand_audits (PLURAL — Phase 3 table; Pitfall C)
  latestBrandAudit: {
    score: number
    dimensions: unknown
    created_at: string
  } | null
  // Intresseguide + Utbildning are SELF-CONTAINED widgets (Pitfall F deferred — they call existing hooks)
  // No slice in summary for them.
}

const KarriarDataContext = createContext<KarriarSummary | undefined>(undefined)

export function KarriarDataProvider({
  value,
  children,
}: {
  value: KarriarSummary | undefined
  children: ReactNode
}) {
  return (
    <KarriarDataContext.Provider value={value}>
      {children}
    </KarriarDataContext.Provider>
  )
}

/** Returns the data slice for a widget, or undefined while loader is pending. */
export function useKarriarWidgetData<K extends keyof KarriarSummary>(
  slice: K
): KarriarSummary[K] | undefined {
  const ctx = useContext(KarriarDataContext)
  if (!ctx) return undefined
  return ctx[slice]
}

/** Returns the entire summary (for widgets needing multiple slices). */
export function useKarriarSummary(): KarriarSummary | undefined {
  return useContext(KarriarDataContext)
}
