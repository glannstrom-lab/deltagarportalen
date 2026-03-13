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

export const wellnessTabs: Tab[] = [
  { 
    id: 'health', 
    label: 'Hälsa', 
    path: '/wellness', 
    icon: Heart,
    description: 'Välmående och hälsotips'
  },
  { 
    id: 'energy', 
    label: 'Energi', 
    path: '/wellness/energy', 
    icon: Zap,
    description: 'Spåra din energi och planera aktiviteter'
  },
  { 
    id: 'routines', 
    label: 'Rutiner', 
    path: '/wellness/routines', 
    icon: CalendarDays,
    description: 'Bygg hållbara dagliga rutiner'
  },
  { 
    id: 'cognitive', 
    label: 'Kognitiv träning', 
    path: '/wellness/cognitive', 
    icon: Brain,
    description: 'Träna minne och koncentration'
  },
  { 
    id: 'crisis', 
    label: 'Akut stöd', 
    path: '/wellness/crisis', 
    icon: Siren,
    description: 'Hjälp vid psykisk ohälsa',
    variant: 'danger'
  },
]
