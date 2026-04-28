import type { HubId } from '@/components/layout/navigation'

export type { HubId }

export type WidgetSize = 'S' | 'M' | 'L' | 'XL'

export interface WidgetProps {
  /** Stable identifier — matches WIDGET_REGISTRY key */
  id: string
  /** Currently rendered size (controlled by hub) */
  size: WidgetSize
  /** Called when user clicks an S/M/L toggle button */
  onSizeChange?: (newSize: WidgetSize) => void
  /** Sizes the widget supports (subset of WidgetSize). Defaults to ['S','M','L'] */
  allowedSizes?: WidgetSize[]
  /** Whether customization controls are visible permanently. Phase 2 = false default */
  editMode?: boolean
  className?: string
}

export interface WidgetLayoutItem {
  id: string
  size: WidgetSize
  order: number
}
