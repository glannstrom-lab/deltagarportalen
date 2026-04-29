import { createContext, useContext, type ReactNode } from 'react'
import type { WidgetLayoutItem, WidgetSize } from './types'

/**
 * Layout state distributed to widgets in the KarriarHub.
 * Peer to KarriarDataContext (data layer); both wrap the hub in KarriarHub.tsx.
 *
 * Provider order (locked from 04-CONTEXT.md):
 *   <KarriarLayoutProvider>     ← outer (resolves first)
 *     <KarriarDataProvider>     ← inner (data fetch can depend on visible widgets)
 *       {children}
 *     </KarriarDataProvider>
 *   </KarriarLayoutProvider>
 */
export interface KarriarLayoutValue {
  layout: WidgetLayoutItem[]
  editMode: boolean
  setEditMode: (next: boolean) => void
  hideWidget: (id: string) => void
  showWidget: (id: string) => void
  updateSize: (id: string, size: WidgetSize) => void
  resetLayout: () => void
  isLoading: boolean
}

const KarriarLayoutContext = createContext<KarriarLayoutValue | null>(null)

export function KarriarLayoutProvider({
  value,
  children,
}: {
  value: KarriarLayoutValue
  children: ReactNode
}) {
  return (
    <KarriarLayoutContext.Provider value={value}>
      {children}
    </KarriarLayoutContext.Provider>
  )
}

export function useKarriarLayout(): KarriarLayoutValue {
  const ctx = useContext(KarriarLayoutContext)
  if (!ctx) {
    throw new Error('useKarriarLayout must be used inside <KarriarLayoutProvider>')
  }
  return ctx
}
