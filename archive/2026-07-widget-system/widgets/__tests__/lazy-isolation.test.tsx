import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { WIDGET_REGISTRY } from '../registry'

const REGISTRY_PATH = resolve(__dirname, '../registry.ts')
const REGISTRY_SRC = readFileSync(REGISTRY_PATH, 'utf8')

const EXPECTED_WIDGETS = [
  // Söka jobb hub (Phase 2)
  'CvWidget',
  'CoverLetterWidget',
  'InterviewWidget',
  'JobSearchWidget',
  'ApplicationsWidget',
  'SpontaneousWidget',
  'SalaryWidget',
  'InternationalWidget',
  // Karriär hub (Phase 5 / HUB-02)
  'CareerGoalWidget',
  'InterestGuideWidget',
  'SkillGapWidget',
  'PersonalBrandWidget',
  'EducationWidget',
  'LinkedInWidget',
  // Resurser hub (Phase 5 / HUB-03)
  'MyDocumentsWidget',
  'KnowledgeBaseWidget',
  'ExternalResourcesWidget',
  'PrintResourcesWidget',
  'AITeamWidget',
  'ExercisesWidget',
  // Min Vardag hub (Phase 5 / HUB-04)
  'HealthWidget',
  'DiaryWidget',
  'CalendarWidget',
  'NetworkWidget',
  'ConsultantWidget',
  // Översikt rebuilt as static page (HubOverview.tsx) — no widgets in registry.
]

describe('Widget registry — lazy isolation (Bundle / Code-Split Contract)', () => {
  it('contains exactly EXPECTED_WIDGETS entries (post-Översikt-rebuild: 25 widgets across 4 hubs)', () => {
    expect(Object.keys(WIDGET_REGISTRY).length).toBe(EXPECTED_WIDGETS.length)
  })

  it('every entry has a component field', () => {
    for (const [id, entry] of Object.entries(WIDGET_REGISTRY)) {
      expect(entry.component, `${id}.component`).toBeDefined()
    }
  })

  it('every entry has a defaultSize that is one of S/M/L/XL', () => {
    for (const [id, entry] of Object.entries(WIDGET_REGISTRY)) {
      expect(['S', 'M', 'L', 'XL'], `${id}.defaultSize`).toContain(entry.defaultSize)
    }
  })

  it('every entry has allowedSizes as a non-empty subset of S/M/L/XL', () => {
    for (const [id, entry] of Object.entries(WIDGET_REGISTRY)) {
      expect(entry.allowedSizes.length, `${id}.allowedSizes`).toBeGreaterThan(0)
      for (const s of entry.allowedSizes) {
        expect(['S', 'M', 'L', 'XL'], `${id}.allowedSizes`).toContain(s)
      }
    }
  })

  it('registry source has NO static widget imports (only lazy)', () => {
    for (const widget of EXPECTED_WIDGETS) {
      // A static import would look like: `import XxxWidget from './XxxWidget'`
      const staticImportPattern = new RegExp(`^\\s*import\\s+${widget}\\s+from\\s+['"]\\./${widget}['"]`, 'm')
      expect(
        staticImportPattern.test(REGISTRY_SRC),
        `Static import for ${widget} found in registry.ts — must use lazy() instead`
      ).toBe(false)
    }
  })

  it('registry source has exactly one lazy() call per widget', () => {
    // Count only lazy() calls that are actual code (not in comments).
    // We exclude lines that start with optional whitespace + '*' or '//' (comment lines).
    const codeLines = REGISTRY_SRC
      .split('\n')
      .filter(line => !/^\s*(\/\/|\*)/.test(line))
      .join('\n')
    const lazyCount = (codeLines.match(/lazy\(/g) ?? []).length
    expect(lazyCount).toBe(EXPECTED_WIDGETS.length)
  })

  it('every expected widget name appears inside a lazy import path', () => {
    for (const widget of EXPECTED_WIDGETS) {
      const lazyPattern = new RegExp(`lazy\\(\\(\\)\\s*=>\\s*import\\(['"]\\./${widget}['"]\\)\\)`)
      expect(
        lazyPattern.test(REGISTRY_SRC),
        `lazy(() => import('./${widget}')) not found in registry.ts`
      ).toBe(true)
    }
  })
})
