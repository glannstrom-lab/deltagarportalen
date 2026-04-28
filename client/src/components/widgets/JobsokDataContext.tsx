import { createContext, useContext, type ReactNode } from 'react'

/** Shape of the data the loader emits. Each field maps to a widget's slice. */
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
  // salary + international are optional — loader omits if tables don't exist
  salary?: { median: number; low: number; high: number; roleLabel: string } | null
  international?: { countries: string[] } | null
}

const JobsokDataContext = createContext<JobsokSummary | undefined>(undefined)

export function JobsokDataProvider({ value, children }: { value: JobsokSummary | undefined; children: ReactNode }) {
  return <JobsokDataContext.Provider value={value}>{children}</JobsokDataContext.Provider>
}

/** Returns the data slice for a widget, or undefined while loader is pending. */
export function useJobsokWidgetData<K extends keyof JobsokSummary>(slice: K): JobsokSummary[K] | undefined {
  const ctx = useContext(JobsokDataContext)
  if (!ctx) return undefined
  return ctx[slice]
}

/** Returns the entire summary (for widgets needing multiple slices, e.g. JobSearchWidget). */
export function useJobsokSummary(): JobsokSummary | undefined {
  return useContext(JobsokDataContext)
}
