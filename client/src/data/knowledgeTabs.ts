/**
 * Knowledge Base Tabs Configuration
 *
 * 6 tabs: För dig, Komma igång, Ämnen, Snabbhjälp, Min resa, Verktyg.
 *
 * Single source of truth — `KnowledgeBase.tsx` imports `knowledgeTabDefs`
 * direkt och deriverar sin TabId-union från det här. Lägg INTE till en
 * tab här utan att samtidigt lägga in en switch-case i `renderContent()`,
 * annars failar TS-exhaustiveness-vakten i KnowledgeBase.tsx.
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Sparkles,
  Rocket,
  BookOpen,
  AlertCircle,
  Route,
  Wrench,
} from '@/components/ui/icons'

// Tab definitions with i18n keys (used by KnowledgeBase.tsx)
export const knowledgeTabDefs = [
  { id: 'for-you', labelKey: 'knowledgeBase.tabs.forYou', path: '/knowledge-base', icon: Sparkles },
  { id: 'getting-started', labelKey: 'knowledgeBase.tabs.gettingStarted', path: '/knowledge-base?tab=getting-started', icon: Rocket },
  { id: 'topics', labelKey: 'knowledgeBase.tabs.topics', path: '/knowledge-base?tab=topics', icon: BookOpen },
  { id: 'quick-help', labelKey: 'knowledgeBase.tabs.quickHelp', path: '/knowledge-base?tab=quick-help', icon: AlertCircle },
  { id: 'my-journey', labelKey: 'knowledgeBase.tabs.myJourney', path: '/knowledge-base?tab=my-journey', icon: Route },
  { id: 'tools', labelKey: 'knowledgeBase.tabs.tools', path: '/knowledge-base?tab=tools', icon: Wrench },
] as const

export type KnowledgeTabId = typeof knowledgeTabDefs[number]['id']

// Same set in raw-label form, used by `getTabsForPath` i pageTabs.ts.
export const knowledgeTabs: Tab[] = [
  { id: 'for-you', label: 'För dig', path: '/knowledge-base', icon: Sparkles },
  { id: 'getting-started', label: 'Komma igång', path: '/knowledge-base?tab=getting-started', icon: Rocket },
  { id: 'topics', label: 'Ämnen', path: '/knowledge-base?tab=topics', icon: BookOpen },
  { id: 'quick-help', label: 'Snabbhjälp', path: '/knowledge-base?tab=quick-help', icon: AlertCircle },
  { id: 'my-journey', label: 'Min resa', path: '/knowledge-base?tab=my-journey', icon: Route },
  { id: 'tools', label: 'Verktyg', path: '/knowledge-base?tab=tools', icon: Wrench },
]
