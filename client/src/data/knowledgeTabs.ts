/**
 * Knowledge Base Tabs Configuration
 * 8 tabs: För dig, Komma igång, Ämnen, Snabbhjälp, Min resa, Verktyg, Trendar, Berättelser
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Sparkles,
  Rocket,
  BookOpen,
  AlertCircle,
  Route,
  Wrench,
  Flame,
  Users,
} from '@/components/ui/icons'

// Tab definitions with i18n keys
export const knowledgeTabDefs = [
  { id: 'for-you', labelKey: 'knowledgeBase.tabs.forYou', path: '/knowledge-base', icon: Sparkles },
  { id: 'getting-started', labelKey: 'knowledgeBase.tabs.gettingStarted', path: '/knowledge-base?tab=getting-started', icon: Rocket },
  { id: 'topics', labelKey: 'knowledgeBase.tabs.topics', path: '/knowledge-base?tab=topics', icon: BookOpen },
  { id: 'quick-help', labelKey: 'knowledgeBase.tabs.quickHelp', path: '/knowledge-base?tab=quick-help', icon: AlertCircle },
  { id: 'my-journey', labelKey: 'knowledgeBase.tabs.myJourney', path: '/knowledge-base?tab=my-journey', icon: Route },
  { id: 'tools', labelKey: 'knowledgeBase.tabs.tools', path: '/knowledge-base?tab=tools', icon: Wrench },
  { id: 'trending', labelKey: 'knowledgeBase.tabs.trending', path: '/knowledge-base?tab=trending', icon: Flame },
  { id: 'stories', labelKey: 'knowledgeBase.tabs.stories', path: '/knowledge-base?tab=stories', icon: Users, badgeKey: 'common.new' },
]

// For backwards compatibility
export const knowledgeTabs: Tab[] = [
  { id: 'for-you', label: 'För dig', path: '/knowledge-base', icon: Sparkles },
  { id: 'getting-started', label: 'Komma igång', path: '/knowledge-base?tab=getting-started', icon: Rocket },
  { id: 'topics', label: 'Ämnen', path: '/knowledge-base?tab=topics', icon: BookOpen },
  { id: 'quick-help', label: 'Snabbhjälp', path: '/knowledge-base?tab=quick-help', icon: AlertCircle },
  { id: 'my-journey', label: 'Min resa', path: '/knowledge-base?tab=my-journey', icon: Route },
  { id: 'tools', label: 'Verktyg', path: '/knowledge-base?tab=tools', icon: Wrench },
  { id: 'trending', label: 'Trendar', path: '/knowledge-base?tab=trending', icon: Flame },
  { id: 'stories', label: 'Berättelser', path: '/knowledge-base?tab=stories', icon: Users, badge: undefined },
]
