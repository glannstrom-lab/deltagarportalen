/**
 * Interest Guide Page Tabs Configuration
 * 5 tabs: Testet, Resultat, Yrken, Utforska, Historik
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  ClipboardList,
  PieChart,
  Briefcase,
  Compass,
  History,
} from 'lucide-react'

// Tab definitions with i18n keys - labels are resolved at render time
export const interestGuideTabDefs = [
  { id: 'test', labelKey: 'interestGuide.tabs.test', path: '/interest-guide', icon: ClipboardList },
  { id: 'results', labelKey: 'interestGuide.tabs.results', path: '/interest-guide/results', icon: PieChart },
  { id: 'occupations', labelKey: 'interestGuide.tabs.occupations', path: '/interest-guide/occupations', icon: Briefcase },
  { id: 'explore', labelKey: 'interestGuide.tabs.explore', path: '/interest-guide/explore', icon: Compass },
  { id: 'history', labelKey: 'interestGuide.tabs.history', path: '/interest-guide/history', icon: History },
]

// For backwards compatibility - static tabs (Swedish)
export const interestGuideTabs: Tab[] = [
  { id: 'test', label: 'Testet', path: '/interest-guide', icon: ClipboardList },
  { id: 'results', label: 'Resultat', path: '/interest-guide/results', icon: PieChart },
  { id: 'occupations', label: 'Yrken', path: '/interest-guide/occupations', icon: Briefcase },
  { id: 'explore', label: 'Utforska', path: '/interest-guide/explore', icon: Compass },
  { id: 'history', label: 'Historik', path: '/interest-guide/history', icon: History },
]
