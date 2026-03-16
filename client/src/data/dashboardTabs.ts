/**
 * Dashboard Tabs Configuration
 * 2 tabs: Översikt, Mina Quests
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  LayoutDashboard,
  Trophy,
} from 'lucide-react'

// Tab definitions with i18n keys
export const dashboardTabDefs = [
  { id: 'overview', labelKey: 'dashboard.tabs.overview', descriptionKey: 'dashboard.tabs.overviewDesc', path: '/', icon: LayoutDashboard },
  { id: 'quests', labelKey: 'dashboard.tabs.quests', descriptionKey: 'dashboard.tabs.questsDesc', path: '/quests', icon: Trophy, badgeKey: 'common.new' },
]

// For backwards compatibility
export const dashboardTabs: Tab[] = [
  { id: 'overview', label: 'Översikt', path: '/', icon: LayoutDashboard, description: 'Din personliga översikt' },
  { id: 'quests', label: 'Mina Quests', path: '/quests', icon: Trophy, description: 'Dagliga utmaningar och belöningar', badge: 'Ny!' },
]
