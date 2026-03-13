/**
 * Dashboard Tabs Configuration
 * 2 tabs: Översikt, Mina Quests
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  LayoutDashboard,
  Trophy,
} from 'lucide-react'

export const dashboardTabs: Tab[] = [
  { 
    id: 'overview', 
    label: 'Översikt', 
    path: '/', 
    icon: LayoutDashboard,
    description: 'Din personliga översikt'
  },
  { 
    id: 'quests', 
    label: 'Mina Quests', 
    path: '/dashboard/quests', 
    icon: Trophy,
    description: 'Dagliga utmaningar och belöningar',
    badge: 'Ny!'
  },
]
