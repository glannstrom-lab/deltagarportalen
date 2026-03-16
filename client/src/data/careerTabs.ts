/**
 * Career Page Tabs Configuration
 * 6 tabs: Utforska, Nätverk, Anpassning, Företag, Karriärplan, Kompetens
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Compass,
  Network,
  Accessibility,
  Building2,
  Target,
  BarChart3,
} from 'lucide-react'

// Tab definitions with i18n keys - labels are resolved at render time
export const careerTabDefs = [
  { id: 'explore', labelKey: 'career.tabs.explore', descriptionKey: 'career.tabs.exploreDesc', path: '/career', icon: Compass },
  { id: 'network', labelKey: 'career.tabs.network', descriptionKey: 'career.tabs.networkDesc', path: '/career/network', icon: Network, badgeKey: 'career.new' },
  { id: 'adaptation', labelKey: 'career.tabs.adaptation', descriptionKey: 'career.tabs.adaptationDesc', path: '/career/adaptation', icon: Accessibility, badgeKey: 'career.new' },
  { id: 'companies', labelKey: 'career.tabs.companies', descriptionKey: 'career.tabs.companiesDesc', path: '/career/companies', icon: Building2, badgeKey: 'career.new' },
  { id: 'plan', labelKey: 'career.tabs.plan', descriptionKey: 'career.tabs.planDesc', path: '/career-plan', icon: Target },
  { id: 'skills', labelKey: 'career.tabs.skills', descriptionKey: 'career.tabs.skillsDesc', path: '/skills-gap', icon: BarChart3 },
]

// For backwards compatibility - static tabs (Swedish)
export const careerTabs: Tab[] = [
  { id: 'explore', label: 'Utforska yrken', path: '/career', icon: Compass, description: 'Upptäck nya yrkesmöjligheter' },
  { id: 'network', label: 'Nätverk', path: '/career/network', icon: Network, description: 'Bygg och underhåll ditt nätverk', badge: 'Ny!' },
  { id: 'adaptation', label: 'Anpassning', path: '/career/adaptation', icon: Accessibility, description: 'Arbetsanpassning och stöd', badge: 'Ny!' },
  { id: 'companies', label: 'Företag', path: '/career/companies', icon: Building2, description: 'Utforska arbetsgivare', badge: 'Ny!' },
  { id: 'plan', label: 'Karriärplan', path: '/career-plan', icon: Target, description: 'Skapa din karriärväg' },
  { id: 'skills', label: 'Kompetens', path: '/skills-gap', icon: BarChart3, description: 'Analysera och utveckla kompetenser' },
]
