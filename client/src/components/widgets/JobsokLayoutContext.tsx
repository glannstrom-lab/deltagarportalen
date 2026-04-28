import { createContext, useContext, type ReactNode } from 'react'
import type { WidgetLayoutItem, WidgetSize } from './types'

/**
 * Layout state distributed to widgets in the JobsokHub.
 * Peer to JobsokDataContext (data layer); both wrap the hub in JobsokHub.tsx.
 *
 * Provider order (locked from 04-CONTEXT.md):
 *   <JobsokLayoutProvider>     ← outer (resolves first)
 *     <JobsokDataProvider>     ← inner (data fetch can depend on visible widgets)
 *       {children}
 *     </JobsokDataProvider>
 *   </JobsokLayoutProvider>
 */
export interface JobsokLayoutValue {
  layout: WidgetLayoutItem[]
  editMode: boolean
  setEditMode: (next: boolean) => void
  hideWidget: (id: string) => void
  showWidget: (id: string) => void
  updateSize: (id: string, size: WidgetSize) => void
  resetLayout: () => void
  isLoading: boolean
}

const JobsokLayoutContext = createContext<JobsokLayoutValue | null>(null)

export function JobsokLayoutProvider({
  value,
  children,
}: {
  value: JobsokLayoutValue
  children: ReactNode
}) {
  return (
    <JobsokLayoutContext.Provider value={value}>
      {children}
    </JobsokLayoutContext.Provider>
  )
}

export function useJobsokLayout(): JobsokLayoutValue {
  const ctx = useContext(JobsokLayoutContext)
  if (!ctx) {
    throw new Error('useJobsokLayout must be used inside <JobsokLayoutProvider>')
  }
  return ctx
}

/** Helper for hidden-widgets-panel: returns layout items with visible: false */
export function selectHiddenWidgets(layout: WidgetLayoutItem[]): WidgetLayoutItem[] {
  return layout.filter((item) => item.visible === false)
}
