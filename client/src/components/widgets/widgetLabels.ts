import type { WidgetId } from './registry'

/**
 * Swedish display names for widgets — used in:
 *   - Hide-button aria-label: "Dölj widget {WIDGET_LABELS[id]}"  (Plan 04 wires this)
 *   - HiddenWidgetsPanel rows
 *   - Future: keyboard layout-edit announcements
 *
 * Keep in sync with WIDGET_REGISTRY keys (Phase 5 adds new widgets — extend this map).
 */
export const WIDGET_LABELS: Record<WidgetId, string> = {
  cv:              'Mitt CV',
  'cover-letter':  'Personligt brev',
  interview:       'Intervjuträning',
  'job-search':    'Sök jobb',
  applications:    'Mina ansökningar',
  spontaneous:     'Spontanansökan',
  salary:          'Lön & förhandling',
  international:   'Internationellt',
}
