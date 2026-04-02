/**
 * CV Page Tabs Configuration
 * 4 tabs: Skapa CV, Mina CV, ATS-analys, CV-tips
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  FileEdit,
  Folder,
  Target,
  BookOpen,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const cvTabDefs = [
  { id: 'create', labelKey: 'cv.tabs.create', path: '/cv', icon: FileEdit },
  { id: 'my-cvs', labelKey: 'cv.tabs.myCvs', path: '/cv/my-cvs', icon: Folder },
  { id: 'ats', labelKey: 'cv.tabs.ats', path: '/cv/ats', icon: Target },
  { id: 'tips', labelKey: 'cv.tabs.tips', path: '/cv/tips', icon: BookOpen },
]

// For backwards compatibility - static tabs (Swedish)
export const cvTabs: Tab[] = [
  { id: 'create', label: 'Skapa CV', path: '/cv', icon: FileEdit },
  { id: 'my-cvs', label: 'Mina CV', path: '/cv/my-cvs', icon: Folder },
  { id: 'ats', label: 'ATS-analys', path: '/cv/ats', icon: Target },
  { id: 'tips', label: 'CV-tips', path: '/cv/tips', icon: BookOpen },
]
