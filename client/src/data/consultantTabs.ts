/**
 * Consultant Page Tabs Configuration
 * 6 tabs: Översikt, Deltagare, Rapporter, Kommunikation, Resurser, Inställningar
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  LayoutDashboard,
  Users,
  Building2,
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
    id: 'placeringar',
    // AG1 (2026-08-31): egen labelKey lagd till, men fallback-strängen
    // nedan i `consultantTabs` (Swedish, oöversatt) är den som faktiskt
    // renderas — se `consultant.tabs.placeringar` bara om i18n-uppslaget
    // används på nytt någonstans.
    labelKey: 'consultant.tabs.placeringar',
    descriptionKey: 'consultant.tabs.placeringarDesc',
    path: '/consultant/platser',
    icon: Building2
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
  { id: 'placeringar', label: 'Platser', path: '/consultant/platser', icon: Building2 },
  { id: 'analytics', label: 'Rapporter', path: '/consultant/analytics', icon: BarChart3 },
  { id: 'communication', label: 'Kommunikation', path: '/consultant/communication', icon: MessageSquare },
  { id: 'resources', label: 'Resurser', path: '/consultant/resources', icon: Wrench },
  { id: 'settings', label: 'Inställningar', path: '/consultant/settings', icon: Settings },
]

/**
 * KSL15 (2026-10-12): en kommunhandläggare (org-roll `handlaggare` i
 * organization_members) har ingen läsrätt på deltagarna — hon når bara
 * underlagen som lämnats till henne (rpc `mina_mottagna_underlag`, definer).
 * Deltagare, Platser, Kommunikation och Resurser var därför tomma för henne.
 * Hon ser Översikt (där underlagen ligger), Rapporter och Inställningar.
 */
export const HANDLAGGARE_FLIK_IDS = ['overview', 'analytics', 'settings'] as const

/** Handläggare = medlem i minst en organisation och handläggare i ALLA sina. */
export function arEnbartHandlaggare(roller: readonly string[]): boolean {
  return roller.length > 0 && roller.every((r) => r === 'handlaggare')
}

export function flikarForRoll(enbartHandlaggare: boolean): Tab[] {
  return enbartHandlaggare
    ? consultantTabs.filter((t) => (HANDLAGGARE_FLIK_IDS as readonly string[]).includes(t.id))
    : consultantTabs
}

/** Får handläggaren öppna sökvägen? Deltagarsidor, platser m.m. är dolda. */
export function handlaggareFarOppna(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '')
  return flikarForRoll(true).some((t) => p === t.path || (t.path !== '/consultant' && p.startsWith(`${t.path}/`)))
}
