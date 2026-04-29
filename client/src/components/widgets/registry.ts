import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { WidgetProps, WidgetSize } from './types'

export interface WidgetRegistryEntry {
  /** Lazy-loaded component — never imported statically */
  component: LazyExoticComponent<ComponentType<WidgetProps>>
  defaultSize: WidgetSize
  allowedSizes: WidgetSize[]
}

/**
 * All widgets MUST use lazy() per Bundle / Code-Split Contract (02-UI-SPEC.md).
 * Files referenced here are created in plans 02-02 and 02-03.
 * Do NOT add static imports for any widget file.
 */
export const WIDGET_REGISTRY = {
  // Söka jobb hub (8 widgets — built in plans 02-02 and 02-03)
  cv:             { component: lazy(() => import('./CvWidget')),            defaultSize: 'L' as const,  allowedSizes: ['S', 'M', 'L'] as WidgetSize[] },
  'cover-letter': { component: lazy(() => import('./CoverLetterWidget')),   defaultSize: 'M' as const,  allowedSizes: ['S', 'M', 'L'] as WidgetSize[] },
  interview:      { component: lazy(() => import('./InterviewWidget')),     defaultSize: 'M' as const,  allowedSizes: ['S', 'M', 'L'] as WidgetSize[] },
  'job-search':   { component: lazy(() => import('./JobSearchWidget')),     defaultSize: 'L' as const,  allowedSizes: ['M', 'L', 'XL'] as WidgetSize[] },
  applications:   { component: lazy(() => import('./ApplicationsWidget')),  defaultSize: 'M' as const,  allowedSizes: ['S', 'M', 'L'] as WidgetSize[] },
  spontaneous:    { component: lazy(() => import('./SpontaneousWidget')),   defaultSize: 'S' as const,  allowedSizes: ['S', 'M'] as WidgetSize[] },
  salary:         { component: lazy(() => import('./SalaryWidget')),        defaultSize: 'M' as const,  allowedSizes: ['S', 'M'] as WidgetSize[] },
  international:  { component: lazy(() => import('./InternationalWidget')), defaultSize: 'S' as const,  allowedSizes: ['S', 'M'] as WidgetSize[] },
  // Karriär hub (6 widgets — Phase 5 / HUB-02)
  'karriar-mal':          { component: lazy(() => import('./CareerGoalWidget')),     defaultSize: 'M' as const, allowedSizes: ['S', 'M', 'L'] as WidgetSize[] },
  intresseguide:          { component: lazy(() => import('./InterestGuideWidget')),  defaultSize: 'M' as const, allowedSizes: ['S', 'M', 'L'] as WidgetSize[] },
  kompetensgap:           { component: lazy(() => import('./SkillGapWidget')),       defaultSize: 'L' as const, allowedSizes: ['M', 'L'] as WidgetSize[] },
  'personligt-varumarke': { component: lazy(() => import('./PersonalBrandWidget')),  defaultSize: 'M' as const, allowedSizes: ['S', 'M', 'L'] as WidgetSize[] },
  utbildning:             { component: lazy(() => import('./EducationWidget')),      defaultSize: 'S' as const, allowedSizes: ['S', 'M'] as WidgetSize[] },
  linkedin:               { component: lazy(() => import('./LinkedInWidget')),       defaultSize: 'S' as const, allowedSizes: ['S', 'M'] as WidgetSize[] },
} satisfies Record<string, WidgetRegistryEntry>

export type WidgetId = keyof typeof WIDGET_REGISTRY
