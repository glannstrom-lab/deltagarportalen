/**
 * Spontaneous Application Page Tabs Configuration
 * 3 tabs: Sök företag, Mina företag, Statistik
 */

import {
  Search,
  Building2,
  BarChart3,
} from '@/components/ui/icons'

// Tab definitions with i18n keys.
//
// `fallback` är den svenska texten som visas om nyckeln saknas. Tidigare
// härleddes den ur nyckeln själv (`labelKey.split('.').pop()`), vilket dels
// gav `string | undefined` och ett typfel, dels hade renderat "search",
// "companies" och "stats" — engelska nyckelfragment — för en svensk användare
// om en nyckel någon gång försvann. En fallback ska vara läsbar text.
export const spontaneousTabDefs = [
  {
    id: 'search',
    labelKey: 'spontaneous.tabs.search',
    fallback: 'Hitta företag',
    descriptionKey: 'spontaneous.tabs.searchDesc',
    path: '/spontanansökan',
    icon: Search,
  },
  {
    id: 'companies',
    labelKey: 'spontaneous.tabs.companies',
    fallback: 'Dina företag',
    descriptionKey: 'spontaneous.tabs.companiesDesc',
    path: '/spontanansökan/mina-foretag',
    icon: Building2,
  },
  {
    id: 'stats',
    labelKey: 'spontaneous.tabs.stats',
    fallback: 'Din överblick',
    descriptionKey: 'spontaneous.tabs.statsDesc',
    path: '/spontanansökan/statistik',
    icon: BarChart3,
  },
]
