/**
 * Consultant Page Tabs Configuration
 * 6 tabs: Översikt, Deltagare, Rapporter, Kommunikation, Resurser, Inställningar
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  Wrench,
  Settings,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const consultantTabDefs = [
  {
    id: 'overview',
    labelKey: 'consultant.tabs.overview',
    descriptionKey: 'consultant.tabs.overviewDesc',
    path: '/consultant',
    icon: LayoutDashboard
  },
  {
    id: 'participants',
    labelKey: 'consultant.tabs.participants',
    descriptionKey: 'consultant.tabs.participantsDesc',
    path: '/consultant/participants',
    icon: Users
  },
  {
    id: 'analytics',
    labelKey: 'consultant.tabs.analytics',
    descriptionKey: 'consultant.tabs.analyticsDesc',
    path: '/consultant/analytics',
    icon: BarChart3
  },
  {
    id: 'communication',
    labelKey: 'consultant.tabs.communication',
    descriptionKey: 'consultant.tabs.communicationDesc',
    path: '/consultant/communication',
    icon: MessageSquare
  },
  {
    id: 'resources',
    labelKey: 'consultant.tabs.resources',
    descriptionKey: 'consultant.tabs.resourcesDesc',
    path: '/consultant/resources',
    icon: Wrench
  },
  {
    id: 'settings',
    labelKey: 'consultant.tabs.settings',
    descriptionKey: 'consultant.tabs.settingsDesc',
    path: '/consultant/settings',
    icon: Settings
  },
]

// For backwards compatibility - static tabs (Swedish)
export const consultantTabs: Tab[] = [
  { id: 'overview', label: 'Översikt', path: '/consultant', icon: LayoutDashboard },
  { id: 'participants', label: 'Deltagare', path: '/consultant/participants', icon: Users },
  { id: 'analytics', label: 'Rapporter', path: '/consultant/analytics', icon: BarChart3 },
  { id: 'communication', label: 'Kommunikation', path: '/consultant/communication', icon: MessageSquare },
  { id: 'resources', label: 'Resurser', path: '/consultant/resources', icon: Wrench },
  { id: 'settings', label: 'Inställningar', path: '/consultant/settings', icon: Settings },
]
