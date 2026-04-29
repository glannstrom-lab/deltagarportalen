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
  // Söka jobb hub
  cv:              'Mitt CV',
  'cover-letter':  'Personligt brev',
  interview:       'Intervjuträning',
  'job-search':    'Sök jobb',
  applications:    'Mina ansökningar',
  spontaneous:     'Spontanansökan',
  salary:          'Lön & förhandling',
  international:   'Internationellt',
  // Karriär hub (Phase 5 — HUB-02)
  'karriar-mal':          'Karriärmål',
  intresseguide:          'Intresseguide',
  kompetensgap:           'Kompetensgap',
  'personligt-varumarke': 'Personligt varumärke',
  utbildning:             'Utbildning',
  linkedin:               'LinkedIn',
  // Resurser hub (Phase 5 — HUB-03)
  'mina-dokument':     'Mina dokument',
  kunskapsbanken:      'Kunskapsbanken',
  'externa-resurser':  'Externa resurser',
  utskriftsmaterial:   'Utskriftsmaterial',
  'ai-team':           'AI-team',
  ovningar:            'Övningar',
}
