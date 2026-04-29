import { createContext, useContext, type ReactNode } from 'react'
import type { WidgetLayoutItem, WidgetSize } from './types'

/**
 * Layout state distributed to widgets in the HubOverview (Översikt) page.
 * Peer to OversiktDataContext (data layer); both wrap the hub in HubOverview.tsx.
 *
 * Provider order (locked from 04-CONTEXT.md / replicated through Plans 02-04):
 *   <OversiktLayoutProvider>     ← outer (resolves first)
 *     <OversiktDataProvider>     ← inner (data fetch can depend on visible widgets)
 *       {children}
 *     </OversiktDataProvider>
 *   </OversiktLayoutProvider>
 */
export interface OversiktLayoutValue {
  layout: WidgetLayoutItem[]
  editMode: boolean
  setEditMode: (next: boolean) => void
  hideWidget: (id: string) => void
  showWidget: (id: string) => void
  updateSize: (id: string, size: WidgetSize) => void
  resetLayout: () => void
  isLoading: boolean
}

const OversiktLayoutContext = createContext<OversiktLayoutValue | null>(null)

export function OversiktLayoutProvider({
  value,
  children,
}: {
  value: OversiktLayoutValue
  children: ReactNode
}) {
  return (
    <OversiktLayoutContext.Provider value={value}>
      {children}
    </OversiktLayoutContext.Provider>
  )
}

export function useOversiktLayout(): OversiktLayoutValue {
  const ctx = useContext(OversiktLayoutContext)
  if (!ctx) {
    throw new Error('useOversiktLayout must be used inside <OversiktLayoutProvider>')
  }
  return ctx
}
