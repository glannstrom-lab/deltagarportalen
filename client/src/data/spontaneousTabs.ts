/**
 * Spontaneous Application Page Tabs Configuration
 * 3 tabs: Sök företag, Mina företag, Statistik
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Search,
  Building2,
  BarChart3,
} from '@/components/ui/icons'

// Tab definitions with i18n keys
export const spontaneousTabDefs = [
  {
    id: 'search',
    labelKey: 'spontaneous.tabs.search',
    descriptionKey: 'spontaneous.tabs.searchDesc',
    path: '/spontanansökan',
    icon: Search,
  },
  {
    id: 'companies',
    labelKey: 'spontaneous.tabs.companies',
    descriptionKey: 'spontaneous.tabs.companiesDesc',
    path: '/spontanansökan/mina-foretag',
    icon: Building2,
  },
  {
    id: 'stats',
    labelKey: 'spontaneous.tabs.stats',
    descriptionKey: 'spontaneous.tabs.statsDesc',
    path: '/spontanansökan/statistik',
    icon: BarChart3,
  },
]

// For backwards compatibility - tabs with hardcoded Swedish labels
export const spontaneousTabs: Tab[] = [
  {
    id: 'search',
    label: 'Sök företag',
    path: '/spontanansökan',
    icon: Search,
  },
  {
    id: 'companies',
    label: 'Mina företag',
    path: '/spontanansökan/mina-foretag',
    icon: Building2,
  },
  {
    id: 'stats',
    label: 'Statistik',
    path: '/spontanansökan/statistik',
    icon: BarChart3,
  },
]
