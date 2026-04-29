import { createContext, useContext, type ReactNode } from 'react'
import type { WidgetLayoutItem, WidgetSize } from './types'

/**
 * Layout state distributed to widgets in the ResurserHub.
 * Peer to ResurserDataContext (data layer); both wrap the hub in ResurserHub.tsx.
 *
 * Provider order (locked from 04-CONTEXT.md):
 *   <ResurserLayoutProvider>     ← outer (resolves first)
 *     <ResurserDataProvider>     ← inner (data fetch can depend on visible widgets)
 *       {children}
 *     </ResurserDataProvider>
 *   </ResurserLayoutProvider>
 */
export interface ResurserLayoutValue {
  layout: WidgetLayoutItem[]
  editMode: boolean
  setEditMode: (next: boolean) => void
  hideWidget: (id: string) => void
  showWidget: (id: string) => void
  updateSize: (id: string, size: WidgetSize) => void
  resetLayout: () => void
  isLoading: boolean
}

const ResurserLayoutContext = createContext<ResurserLayoutValue | null>(null)

export function ResurserLayoutProvider({
  value,
  children,
}: {
  value: ResurserLayoutValue
  children: ReactNode
}) {
  return (
    <ResurserLayoutContext.Provider value={value}>
      {children}
    </ResurserLayoutContext.Provider>
  )
}

export function useResurserLayout(): ResurserLayoutValue {
  const ctx = useContext(ResurserLayoutContext)
  if (!ctx) {
    throw new Error('useResurserLayout must be used inside <ResurserLayoutProvider>')
  }
  return ctx
}
