/**
 * JobTracker Page Tabs Configuration
 * 5 tabs: Sök jobb, Sparade, Ansökningar, Bevakningar, Matchningar
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Search,
  Bookmark,
  ClipboardList,
  Bell,
  Sparkles,
} from 'lucide-react'

export const jobTrackerTabs: Tab[] = [
  {
    id: 'search',
    label: 'Sök jobb',
    path: '/job-tracker',
    icon: Search,
  },
  {
    id: 'saved',
    label: 'Sparade',
    path: '/job-tracker/saved',
    icon: Bookmark,
  },
  {
    id: 'applications',
    label: 'Ansökningar',
    path: '/job-tracker/applications',
    icon: ClipboardList,
  },
  {
    id: 'alerts',
    label: 'Bevakningar',
    path: '/job-tracker/alerts',
    icon: Bell,
  },
  {
    id: 'matches',
    label: 'Matchningar',
    path: '/job-tracker/matches',
    icon: Sparkles,
  },
]
