/**
 * Wellness Page Tabs Configuration
 * 5 tabs: Hälsa, Energi, Rutiner, Kognitiv träning, Akut stöd
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Heart,
  Zap,
  CalendarDays,
  Brain,
  Siren,
} from 'lucide-react'

// Tab definitions with i18n keys - labels are resolved at render time
export const wellnessTabDefs = [
  { id: 'health', labelKey: 'wellness.tabs.health', descriptionKey: 'wellness.tabs.healthDesc', path: '/wellness', icon: Heart },
  { id: 'energy', labelKey: 'wellness.tabs.energy', descriptionKey: 'wellness.tabs.energyDesc', path: '/wellness/energy', icon: Zap },
  { id: 'routines', labelKey: 'wellness.tabs.routines', descriptionKey: 'wellness.tabs.routinesDesc', path: '/wellness/routines', icon: CalendarDays },
  { id: 'cognitive', labelKey: 'wellness.tabs.cognitive', descriptionKey: 'wellness.tabs.cognitiveDesc', path: '/wellness/cognitive', icon: Brain },
  { id: 'crisis', labelKey: 'wellness.tabs.crisis', descriptionKey: 'wellness.tabs.crisisDesc', path: '/wellness/crisis', icon: Siren, variant: 'danger' },
]

// For backwards compatibility - static tabs (Swedish)
export const wellnessTabs: Tab[] = [
  { id: 'health', label: 'Hälsa', path: '/wellness', icon: Heart, description: 'Välmående och hälsotips' },
  { id: 'energy', label: 'Energi', path: '/wellness/energy', icon: Zap, description: 'Spåra din energi och planera aktiviteter' },
  { id: 'routines', label: 'Rutiner', path: '/wellness/routines', icon: CalendarDays, description: 'Bygg hållbara dagliga rutiner' },
  { id: 'cognitive', label: 'Kognitiv träning', path: '/wellness/cognitive', icon: Brain, description: 'Träna minne och koncentration' },
  { id: 'crisis', label: 'Akut stöd', path: '/wellness/crisis', icon: Siren, description: 'Hjälp vid psykisk ohälsa', variant: 'danger' },
]
