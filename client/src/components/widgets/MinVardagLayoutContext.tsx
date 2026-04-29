import { createContext, useContext, type ReactNode } from 'react'
import type { WidgetLayoutItem, WidgetSize } from './types'

/**
 * Layout state distributed to widgets in the MinVardagHub.
 * Peer to MinVardagDataContext (data layer); both wrap the hub in MinVardagHub.tsx.
 *
 * Provider order (locked from 04-CONTEXT.md):
 *   <MinVardagLayoutProvider>     ← outer (resolves first)
 *     <MinVardagDataProvider>     ← inner (data fetch can depend on visible widgets)
 *       {children}
 *     </MinVardagDataProvider>
 *   </MinVardagLayoutProvider>
 */
export interface MinVardagLayoutValue {
  layout: WidgetLayoutItem[]
  editMode: boolean
  setEditMode: (next: boolean) => void
  hideWidget: (id: string) => void
  showWidget: (id: string) => void
  updateSize: (id: string, size: WidgetSize) => void
  resetLayout: () => void
  isLoading: boolean
}

const MinVardagLayoutContext = createContext<MinVardagLayoutValue | null>(null)

export function MinVardagLayoutProvider({
  value,
  children,
}: {
  value: MinVardagLayoutValue
  children: ReactNode
}) {
  return (
    <MinVardagLayoutContext.Provider value={value}>
      {children}
    </MinVardagLayoutContext.Provider>
  )
}

export function useMinVardagLayout(): MinVardagLayoutValue {
  const ctx = useContext(MinVardagLayoutContext)
  if (!ctx) {
    throw new Error('useMinVardagLayout must be used inside <MinVardagLayoutProvider>')
  }
  return ctx
}
