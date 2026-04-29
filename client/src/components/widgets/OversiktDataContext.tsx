import { createContext, useContext, type ReactNode } from 'react'
import type { JobsokSummary } from './JobsokDataContext'
import type { KarriarSummary } from './KarriarDataContext'
import type { ResurserSummary } from './ResurserDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'

/**
 * Shape of the data the Översikt aggregator emits.
 *
 * Pitfall D resolution: Översikt does NOT issue its own SELECTs for the four
 * sub-hubs. Instead, useOversiktHubSummary triggers the four other hub-loaders
 * (which dedup via React Query if cached). This summary surfaces the cached
 * slices alongside the Översikt-specific profile fetch (onboarded_hubs +
 * full_name).
 *
 * Per Pitfall D: any sub-hub slice can be `undefined` during initial load —
 * cross-hub widgets must handle undefined gracefully (terse empty / loading state).
 */
export interface OversiktSummary {
  profile: { onboarded_hubs: string[]; full_name: string | null } | null
  jobsok: JobsokSummary | undefined
  karriar: KarriarSummary | undefined
  resurser: ResurserSummary | undefined
  minVardag: MinVardagSummary | undefined
}

const OversiktDataContext = createContext<OversiktSummary | undefined>(undefined)

export function OversiktDataProvider({
  value,
  children,
}: {
  value: OversiktSummary | undefined
  children: ReactNode
}) {
  return (
    <OversiktDataContext.Provider value={value}>
      {children}
    </OversiktDataContext.Provider>
  )
}

/** Returns the data slice for a widget, or undefined while loader is pending. */
export function useOversiktWidgetData<K extends keyof OversiktSummary>(
  slice: K
): OversiktSummary[K] | undefined {
  const ctx = useContext(OversiktDataContext)
  if (!ctx) return undefined
  return ctx[slice]
}

/** Returns the entire summary (for OnboardingWidget which needs multiple slices). */
export function useOversiktSummary(): OversiktSummary | undefined {
  return useContext(OversiktDataContext)
}
