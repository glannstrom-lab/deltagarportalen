/**
 * Cover Letter Page Tabs Configuration
 * 3 tabs: Skriv brev, Mina brev, Färdiga mallar
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  FileEdit,
  Folder,
  Layout,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const coverLetterTabDefs = [
  { id: 'write', labelKey: 'coverLetter.tabs.write', path: '/cover-letter', icon: FileEdit },
  { id: 'my-letters', labelKey: 'coverLetter.tabs.myLetters', path: '/cover-letter/my-letters', icon: Folder },
  { id: 'templates', labelKey: 'coverLetter.tabs.templates', path: '/cover-letter/templates', icon: Layout },
]

// For backwards compatibility - static tabs (Swedish)
export const coverLetterTabs: Tab[] = [
  { id: 'write', label: 'Skriv brev', path: '/cover-letter', icon: FileEdit },
  { id: 'my-letters', label: 'Mina brev', path: '/cover-letter/my-letters', icon: Folder },
  { id: 'templates', label: 'Färdiga mallar', path: '/cover-letter/templates', icon: Layout },
]
