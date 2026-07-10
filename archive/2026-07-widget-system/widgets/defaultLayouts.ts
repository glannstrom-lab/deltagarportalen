import type { HubId, WidgetLayoutItem } from './types'

/**
 * Default widget layouts per hub.
 * Phase 4 extends: adds `visible: true` to all items, and accepts optional breakpoint param.
 * Söka jobb is the demo hub — full 8-widget layout.
 * Other hubs get 1 placeholder widget so navigation works visually.
 * Phase 5 fills in the rest (HUB-02..HUB-04).
 */
export function getDefaultLayout(
  hubId: HubId,
  breakpoint: 'desktop' | 'mobile' = 'desktop'
): WidgetLayoutItem[] {
  const desktop: Record<HubId, WidgetLayoutItem[]> = {
    jobb: [
      // Section 1: Skapa & öva (focal point: CV at L, position 0)
      { id: 'cv',           size: 'L', order: 0, visible: true },
      { id: 'cover-letter', size: 'M', order: 1, visible: true },
      { id: 'interview',    size: 'M', order: 2, visible: true },
      // Section 2: Sök & ansök
      { id: 'job-search',   size: 'L', order: 3, visible: true },
      { id: 'applications', size: 'M', order: 4, visible: true },
      { id: 'spontaneous',  size: 'S', order: 5, visible: true },
      // Section 3: Marknad
      { id: 'salary',        size: 'M', order: 6, visible: true },
      { id: 'international', size: 'S', order: 7, visible: true },
    ],
    // Phase 5 full widget sets — replacing Phase 2 placeholders
    karriar: [
      { id: 'karriar-mal',          size: 'M', order: 0, visible: true },
      { id: 'intresseguide',        size: 'M', order: 1, visible: true },
      { id: 'kompetensgap',         size: 'L', order: 2, visible: true },
      { id: 'personligt-varumarke', size: 'M', order: 3, visible: true },
      { id: 'utbildning',           size: 'S', order: 4, visible: true },
      { id: 'linkedin',             size: 'S', order: 5, visible: true },
    ],
    resurser: [
      { id: 'mina-dokument',     size: 'M', order: 0, visible: true },
      { id: 'kunskapsbanken',    size: 'M', order: 1, visible: true },
      { id: 'externa-resurser',  size: 'S', order: 2, visible: true },
      { id: 'utskriftsmaterial', size: 'S', order: 3, visible: true },
      { id: 'ai-team',           size: 'L', order: 4, visible: true },
      { id: 'ovningar',          size: 'M', order: 5, visible: true },
    ],
    'min-vardag': [
      { id: 'halsa',         size: 'M', order: 0, visible: true },
      { id: 'dagbok',        size: 'M', order: 1, visible: true },
      { id: 'kalender',      size: 'L', order: 2, visible: true },
      { id: 'natverk',       size: 'S', order: 3, visible: true },
      { id: 'min-konsulent', size: 'M', order: 4, visible: true },
    ],
    // Översikt rebuilt as static page (HubOverview.tsx) — no widget layout needed.
    oversikt: [],
  }
  const base = desktop[hubId]
  if (breakpoint === 'mobile') {
    // Mobile cap: L→M, XL→M (mobile grid is 2-col)
    return base.map(item => ({
      ...item,
      size: (item.size === 'L' || item.size === 'XL') ? 'M' as const : item.size,
    }))
  }
  return base
}

/**
 * For Phase 2/3, jobb-hub layout grouped into named sections.
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

/**
 * Karriär hub layout grouped into named sections (Phase 5 — HUB-02).
 * Three sections: Utforska / Analysera / Utveckla.
 */
export function getKarriarSections(): SectionedLayout[] {
  const all = getDefaultLayout('karriar')
  return [
    { title: 'Utforska',  items: all.slice(0, 2) }, // Karriärmål, Intresseguide
    { title: 'Analysera', items: all.slice(2, 4) }, // Kompetensgap, Personligt varumärke
    { title: 'Utveckla',  items: all.slice(4, 6) }, // Utbildning, LinkedIn
  ]
}

/**
 * Resurser hub layout grouped into named sections (Phase 5 — HUB-03).
 * Three sections: Mina / Bibliotek / Vägledning.
 */
export function getResurserSections(): SectionedLayout[] {
  const all = getDefaultLayout('resurser')
  return [
    { title: 'Mina',       items: all.slice(0, 2) }, // Mina dokument, Kunskapsbanken
    { title: 'Bibliotek',  items: all.slice(2, 4) }, // Externa resurser, Utskriftsmaterial
    { title: 'Vägledning', items: all.slice(4, 6) }, // AI-team, Övningar
  ]
}

/**
 * Min Vardag hub layout grouped into named sections (Phase 5 — HUB-04).
 * Two sections: Mig själv / Mitt stöd.
 */
export function getMinVardagSections(): SectionedLayout[] {
  const all = getDefaultLayout('min-vardag')
  return [
    { title: 'Mig själv', items: all.slice(0, 3) }, // Hälsa, Dagbok, Kalender
    { title: 'Mitt stöd', items: all.slice(3, 5) }, // Nätverk, Min konsulent
  ]
}

// Översikt rebuilt as a static page — getOversiktSections removed.
