/**
 * Cover Letter Page Tabs Configuration
 * 2 tabs: Skriv brev, Mina brev
 */

import {
  FileEdit,
  Folder,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const coverLetterTabDefs = [
  { id: 'write', labelKey: 'coverLetter.tabs.write', path: '/cover-letter', icon: FileEdit },
  { id: 'my-letters', labelKey: 'coverLetter.tabs.myLetters', path: '/cover-letter/my-letters', icon: Folder },
]

// Den hårdkodade svenska dubbletten som stod här ("For backwards
// compatibility") hade noll konsumenter och togs bort 2026-08-19. Den var
// dessutom svår att upptäcka: `CoverLetterPage.tsx` deklarerar en LOKAL const
// med exakt samma namn, så en namnsökning såg använd ut.
// Reservvägen för sidor utan `customTabs` bor i `data/pageTabs.ts`.
