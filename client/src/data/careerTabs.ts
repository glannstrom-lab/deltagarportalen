/**
 * Career Page Tabs Configuration
 * 7 tabs: Arbetsmarknad, Anpassning, Företag, Credentials, Flytt, Karriärplan, Kompetens
 * Note: Nätverk has been moved to its own page (/nätverk)
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  TrendingUp,
  Accessibility,
  Building2,
  Target,
  BarChart3,
  GraduationCap,
  Home,
} from '@/components/ui/icons'

// Tab definitions with i18n keys - labels are resolved at render time
export const careerTabDefs = [
  { id: 'labor-market', labelKey: 'career.tabs.laborMarket', descriptionKey: 'career.tabs.laborMarketDesc', path: '/career', icon: TrendingUp },
  { id: 'adaptation', labelKey: 'career.tabs.adaptation', descriptionKey: 'career.tabs.adaptationDesc', path: '/career/adaptation', icon: Accessibility, badgeKey: 'career.new' },
  { id: 'companies', labelKey: 'career.tabs.companies', descriptionKey: 'career.tabs.companiesDesc', path: '/career/companies', icon: Building2, badgeKey: 'career.new' },
  { id: 'credentials', labelKey: 'career.tabs.credentials', descriptionKey: 'career.tabs.credentialsDesc', path: '/career/credentials', icon: GraduationCap, badgeKey: 'career.new' },
  { id: 'relocation', labelKey: 'career.tabs.relocation', descriptionKey: 'career.tabs.relocationDesc', path: '/career/relocation', icon: Home, badgeKey: 'career.new' },
  { id: 'plan', labelKey: 'career.tabs.plan', descriptionKey: 'career.tabs.planDesc', path: '/career-plan', icon: Target },
  { id: 'skills', labelKey: 'career.tabs.skills', descriptionKey: 'career.tabs.skillsDesc', path: '/skills-gap', icon: BarChart3 },
]

// For backwards compatibility - static tabs (Swedish)
export const careerTabs: Tab[] = [
  { id: 'labor-market', label: 'Arbetsmarknad', path: '/career', icon: TrendingUp },
  { id: 'adaptation', label: 'Anpassning', path: '/career/adaptation', icon: Accessibility, badge: undefined },
  { id: 'companies', label: 'Företag', path: '/career/companies', icon: Building2, badge: undefined },
  { id: 'credentials', label: 'Credentials', path: '/career/credentials', icon: GraduationCap, badge: undefined },
  { id: 'relocation', label: 'Flytta', path: '/career/relocation', icon: Home, badge: undefined },
  { id: 'plan', label: 'Karriärplan', path: '/career-plan', icon: Target },
  { id: 'skills', label: 'Kompetens', path: '/skills-gap', icon: BarChart3 },
]
