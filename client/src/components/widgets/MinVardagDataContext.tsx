import { createContext, useContext, type ReactNode } from 'react'

/** Shape of the data the loader emits. Each field maps to a widget's slice. */
export interface MinVardagSummary {
  // Hälsa — last 7 days for sparkline
  recentMoodLogs: Array<{ mood_level: number; energy_level: number; log_date: string }>
  // Dagbok — count + most recent
  diaryEntryCount: number
  latestDiaryEntry: { id: string; created_at: string } | null
  // Kalender — next 3 upcoming events
  upcomingEvents: Array<{
    id: string
    title: string
    date: string
    time: string | null
    type: string | null
  }>
  // Nätverk — count only
  networkContactsCount: number
  // Min konsulent — joined consultant from profiles
  consultant: { id: string; full_name: string | null; avatar_url: string | null } | null
}

const MinVardagDataContext = createContext<MinVardagSummary | undefined>(undefined)

export function MinVardagDataProvider({
  value,
  children,
}: {
  value: MinVardagSummary | undefined
  children: ReactNode
}) {
  return (
    <MinVardagDataContext.Provider value={value}>
      {children}
    </MinVardagDataContext.Provider>
  )
}

/** Returns the data slice for a widget, or undefined while loader is pending. */
export function useMinVardagWidgetData<K extends keyof MinVardagSummary>(
  slice: K
): MinVardagSummary[K] | undefined {
  const ctx = useContext(MinVardagDataContext)
  if (!ctx) return undefined
  return ctx[slice]
}

/** Returns the entire summary (for widgets needing multiple slices). */
export function useMinVardagSummary(): MinVardagSummary | undefined {
  return useContext(MinVardagDataContext)
}
