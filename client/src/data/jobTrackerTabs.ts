/**
 * JobTracker Page Tabs Configuration
 * 2 tabs: Ansökningar, Analys
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  List,
  LineChart,
} from 'lucide-react'

export const jobTrackerTabs: Tab[] = [
  { 
    id: 'applications', 
    label: 'Ansökningar', 
    path: '/job-tracker', 
    icon: List,
    description: 'Hantera dina jobbansökningar'
  },
  { 
    id: 'analytics', 
    label: 'Analys', 
    path: '/job-tracker/analytics', 
    icon: LineChart,
    description: 'Insikter om ditt jobbsökande',
    badge: 'Ny!'
  },
]
