import type { WidgetSize } from '@/components/widgets/types'

export interface WidgetSizeFlags {
  isS: boolean
  isM: boolean
  isL: boolean
  isXL: boolean
  /** True only at S — render KPI number, no body text, no footer */
  compact: boolean
  /** True at S or M — no large visualization, no L-size visual elements */
  minimal: boolean
}

export function useWidgetSize(size: WidgetSize): WidgetSizeFlags {
  return {
    isS: size === 'S',
    isM: size === 'M',
    isL: size === 'L',
    isXL: size === 'XL',
    compact: size === 'S',
    minimal: size === 'S' || size === 'M',
  }
}
