import type { HubId, WidgetLayoutItem } from './types'

/**
 * Default widget layouts per hub for Phase 2.
 * Söka jobb is the demo hub — full 8-widget layout.
 * Other hubs get 1-2 placeholder widgets so navigation works visually.
 * Phase 5 fills in the rest (HUB-02..HUB-04).
 */
export function getDefaultLayout(hubId: HubId): WidgetLayoutItem[] {
  const defaults: Record<HubId, WidgetLayoutItem[]> = {
    jobb: [
      // Section 1: Skapa & öva (focal point: CV at L, position 0)
      { id: 'cv',           size: 'L', order: 0 },
      { id: 'cover-letter', size: 'M', order: 1 },
      { id: 'interview',    size: 'M', order: 2 },
      // Section 2: Sök & ansök
      { id: 'job-search',   size: 'L', order: 3 },
      { id: 'applications', size: 'M', order: 4 },
      { id: 'spontaneous',  size: 'S', order: 5 },
      // Section 3: Marknad
      { id: 'salary',        size: 'M', order: 6 },
      { id: 'international', size: 'S', order: 7 },
    ],
    // Phase 2 placeholder hubs — single S widget each, real widgets in Phase 5
    karriar:      [{ id: 'cv', size: 'S', order: 0 }],
    resurser:     [{ id: 'cv', size: 'S', order: 0 }],
    'min-vardag': [{ id: 'cv', size: 'S', order: 0 }],
    oversikt:     [{ id: 'cv', size: 'S', order: 0 }],
  }
  return defaults[hubId]
}

/**
 * For Phase 2, jobb-hub layout grouped into named sections.
 * Each section gets a labeled HubGrid.Section in JobsokHub.
 */
export interface SectionedLayout {
  title: string
  items: WidgetLayoutItem[]
}

export function getJobbSections(): SectionedLayout[] {
  const all = getDefaultLayout('jobb')
  return [
    { title: 'Skapa & öva', items: all.slice(0, 3) },
    { title: 'Sök & ansök', items: all.slice(3, 6) },
    { title: 'Marknad',     items: all.slice(6, 8) },
  ]
}
