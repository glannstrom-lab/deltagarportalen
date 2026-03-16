/**
 * Cover Letter Page Tabs Configuration
 * 5 tabs: Skriv brev, Mina brev, Dina ansökningar, Färdiga mallar, Din statistik
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  FileEdit,
  Folder,
  Send,
  Layout,
  BarChart3,
} from 'lucide-react'

// Tab definitions with i18n keys - labels are resolved at render time
export const coverLetterTabDefs = [
  { id: 'write', labelKey: 'coverLetter.tabs.write', path: '/cover-letter', icon: FileEdit },
  { id: 'my-letters', labelKey: 'coverLetter.tabs.myLetters', path: '/cover-letter/my-letters', icon: Folder },
  { id: 'applications', labelKey: 'coverLetter.tabs.applications', path: '/cover-letter/applications', icon: Send },
  { id: 'templates', labelKey: 'coverLetter.tabs.templates', path: '/cover-letter/templates', icon: Layout },
  { id: 'statistics', labelKey: 'coverLetter.tabs.statistics', path: '/cover-letter/statistics', icon: BarChart3 },
]

// For backwards compatibility - static tabs (Swedish)
export const coverLetterTabs: Tab[] = [
  { id: 'write', label: 'Skriv brev', path: '/cover-letter', icon: FileEdit },
  { id: 'my-letters', label: 'Mina brev', path: '/cover-letter/my-letters', icon: Folder },
  { id: 'applications', label: 'Dina ansökningar', path: '/cover-letter/applications', icon: Send },
  { id: 'templates', label: 'Färdiga mallar', path: '/cover-letter/templates', icon: Layout },
  { id: 'statistics', label: 'Din statistik', path: '/cover-letter/statistics', icon: BarChart3 },
]
