/**
 * Interest Guide Page Tabs Configuration
 * 5 tabs: Testet, Resultat, Yrken, Utforska, Historik
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  ClipboardList,
  PieChart,
  Briefcase,
  Compass,
  History,
} from 'lucide-react'

export const interestGuideTabs: Tab[] = [
  {
    id: 'test',
    label: 'Testet',
    path: '/interest-guide',
    icon: ClipboardList,
  },
  {
    id: 'results',
    label: 'Resultat',
    path: '/interest-guide/results',
    icon: PieChart,
  },
  {
    id: 'occupations',
    label: 'Yrken',
    path: '/interest-guide/occupations',
    icon: Briefcase,
  },
  {
    id: 'explore',
    label: 'Utforska',
    path: '/interest-guide/explore',
    icon: Compass,
  },
  {
    id: 'history',
    label: 'Historik',
    path: '/interest-guide/history',
    icon: History,
  },
]
