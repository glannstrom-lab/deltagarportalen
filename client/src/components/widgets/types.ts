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
  /** Phase 4: when provided AND editMode=true, renders the hide-button (×) in Header */
  onHide?: () => void
}

export interface WidgetLayoutItem {
  id: string
  size: WidgetSize
  order: number
  /** Phase 4: defaults to true. Set to false when user hides via hide-button. */
  visible: boolean
}
