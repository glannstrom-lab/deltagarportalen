/**
 * CV Page Tabs Configuration
 * 5 tabs: Skapa CV, Mina CV, Mallar, ATS-analys, CV-tips
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  FileEdit,
  Folder,
  Layout,
  Target,
  BookOpen,
} from 'lucide-react'

// Tab definitions with i18n keys - labels are resolved at render time
export const cvTabDefs = [
  { id: 'create', labelKey: 'cv.tabs.create', path: '/cv', icon: FileEdit },
  { id: 'my-cvs', labelKey: 'cv.tabs.myCvs', path: '/cv/my-cvs', icon: Folder },
  { id: 'templates', labelKey: 'cv.tabs.templates', path: '/cv/templates', icon: Layout },
  { id: 'ats', labelKey: 'cv.tabs.ats', path: '/cv/ats', icon: Target },
  { id: 'tips', labelKey: 'cv.tabs.tips', path: '/cv/tips', icon: BookOpen },
]

// For backwards compatibility - static tabs (Swedish)
export const cvTabs: Tab[] = [
  { id: 'create', label: 'Skapa CV', path: '/cv', icon: FileEdit },
  { id: 'my-cvs', label: 'Mina CV', path: '/cv/my-cvs', icon: Folder },
  { id: 'templates', label: 'Mallar', path: '/cv/templates', icon: Layout },
  { id: 'ats', label: 'ATS-analys', path: '/cv/ats', icon: Target },
  { id: 'tips', label: 'CV-tips', path: '/cv/tips', icon: BookOpen },
]
