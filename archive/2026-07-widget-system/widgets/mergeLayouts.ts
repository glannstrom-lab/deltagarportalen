import { WIDGET_REGISTRY } from './registry'
import type { WidgetLayoutItem } from './types'

/**
 * Reconcile persisted layout against current default.
 *
 * Pitfall 7: Phase 5 will add new widgets to defaults. Users with persisted layouts
 * must NOT lose access to new widgets, and old removed widget IDs must NOT crash render.
 *
 * Rules:
 *  - Persisted entries with IDs no longer in WIDGET_REGISTRY are dropped.
 *  - Default entries missing from persisted are appended at the end with visible: true.
 *  - Persisted entries with IDs still in registry keep user-set size and visibility.
 */
export function mergeLayouts(
  persisted: WidgetLayoutItem[],
  defaultLayout: WidgetLayoutItem[]
): WidgetLayoutItem[] {
  const validIds = new Set(Object.keys(WIDGET_REGISTRY))
  const persistedIds = new Set(persisted.map(w => w.id))

  // Drop removed widgets, preserve user state for valid ones
  const valid = persisted.filter(w => validIds.has(w.id))

  // Append widgets that are in default but not yet in persisted (Phase 5 additions)
  const appended = defaultLayout
    .filter(w => !persistedIds.has(w.id))
    .map(w => ({ ...w, visible: w.visible ?? true }))

  return [...valid, ...appended]
}
