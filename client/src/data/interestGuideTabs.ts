/**
 * Interest Guide Page Tabs Configuration
 * 5 tabs: Testet, Resultat, Yrken, Utforska, Historik
 */

import {
  ClipboardList,
  PieChart,
  Briefcase,
  Compass,
  History,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const interestGuideTabDefs = [
  { id: 'test', labelKey: 'interestGuide.tabs.test', path: '/interest-guide', icon: ClipboardList },
  { id: 'results', labelKey: 'interestGuide.tabs.results', path: '/interest-guide/results', icon: PieChart },
  { id: 'occupations', labelKey: 'interestGuide.tabs.occupations', path: '/interest-guide/occupations', icon: Briefcase },
  { id: 'explore', labelKey: 'interestGuide.tabs.explore', path: '/interest-guide/explore', icon: Compass },
  { id: 'history', labelKey: 'interestGuide.tabs.history', path: '/interest-guide/history', icon: History },
]

/*
  Den hårdkodade svenska listan "interestGuideTabs" låg här, märkt "for
  backwards compatibility". Den hade noll importörer: getTabsForPath i
  data/pageTabs.ts har ingen /interest-guide-gren, och InterestGuide.tsx
  skickar tabs={...} byggd ur defs ovan — vilket kortsluter fallbacken helt.
  Samma dubblett som careerTabs.ts, raderad samma dag. En sanning räcker.
  (2026-08-21)
*/
