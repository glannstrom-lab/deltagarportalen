/**
 * Wellness Page Tabs Configuration
 * 4 tabs: Hälsa, Rutiner, Kognitiv träning, Akut stöd
 * (Energy tab removed per user request)
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Heart,
  CalendarDays,
  Brain,
  Siren,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const wellnessTabDefs = [
  { id: 'health', labelKey: 'wellness.tabs.health', descriptionKey: 'wellness.tabs.healthDesc', path: '/wellness', icon: Heart },
  { id: 'routines', labelKey: 'wellness.tabs.routines', descriptionKey: 'wellness.tabs.routinesDesc', path: '/wellness/routines', icon: CalendarDays },
  { id: 'cognitive', labelKey: 'wellness.tabs.cognitive', descriptionKey: 'wellness.tabs.cognitiveDesc', path: '/wellness/cognitive', icon: Brain },
  { id: 'crisis', labelKey: 'wellness.tabs.crisis', descriptionKey: 'wellness.tabs.crisisDesc', path: '/wellness/crisis', icon: Siren, variant: 'danger' },
]

// For backwards compatibility - static tabs (Swedish)
export const wellnessTabs: Tab[] = [
  { id: 'health', label: 'Hälsa', path: '/wellness', icon: Heart },
  { id: 'routines', label: 'Rutiner', path: '/wellness/routines', icon: CalendarDays },
  { id: 'cognitive', label: 'Kognitiv träning', path: '/wellness/cognitive', icon: Brain },
  { id: 'crisis', label: 'Akut stöd', path: '/wellness/crisis', icon: Siren },
]
