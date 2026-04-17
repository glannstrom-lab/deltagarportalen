/**
 * Career Page Tabs Configuration
 * 5 tabs: Arbetsmarknad, Anpassning, Credentials, Flytt, Karriärplan
 * Note: Nätverk moved to /nätverk, Företag removed (duplicate of Spontanansökan)
 * Note: Kompetens removed - merged into standalone /skills-gap page
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  TrendingUp,
  Accessibility,
  Target,
  GraduationCap,
  Home,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const careerTabDefs = [
  { id: 'labor-market', labelKey: 'career.tabs.laborMarket', descriptionKey: 'career.tabs.laborMarketDesc', path: '/career', icon: TrendingUp },
  { id: 'adaptation', labelKey: 'career.tabs.adaptation', descriptionKey: 'career.tabs.adaptationDesc', path: '/career/adaptation', icon: Accessibility, badgeKey: 'career.new' },
  { id: 'credentials', labelKey: 'career.tabs.credentials', descriptionKey: 'career.tabs.credentialsDesc', path: '/career/credentials', icon: GraduationCap, badgeKey: 'career.new' },
  { id: 'relocation', labelKey: 'career.tabs.relocation', descriptionKey: 'career.tabs.relocationDesc', path: '/career/relocation', icon: Home, badgeKey: 'career.new' },
  { id: 'plan', labelKey: 'career.tabs.plan', descriptionKey: 'career.tabs.planDesc', path: '/career/plan', icon: Target },
]

// For backwards compatibility - static tabs (Swedish)
export const careerTabs: Tab[] = [
  { id: 'labor-market', label: 'Arbetsmarknad', path: '/career', icon: TrendingUp },
  { id: 'adaptation', label: 'Anpassning', path: '/career/adaptation', icon: Accessibility, badge: undefined },
  { id: 'credentials', label: 'Credentials', path: '/career/credentials', icon: GraduationCap, badge: undefined },
  { id: 'relocation', label: 'Flytta', path: '/career/relocation', icon: Home, badge: undefined },
  { id: 'plan', label: 'Karriärplan', path: '/career/plan', icon: Target },
]
