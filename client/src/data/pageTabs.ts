/**
 * Page Tabs Configuration
 * Defines tabs for each main page with i18n support
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Target,
  Compass,
  BookOpen,
  BookHeart,
  Dumbbell,
  Bookmark,
  Mail,
  Calendar,
  Settings,
  User,
  Sparkles,
} from '@/components/ui/icons'

// Import new tab configurations
import { wellnessTabs } from './wellnessTabs'
import { dashboardTabs } from './dashboardTabs'
import { careerTabs } from './careerTabs'
import { knowledgeTabs } from './knowledgeTabs'
import { consultantTabs } from './consultantTabs'

// Tab definitions with i18n keys - labels are resolved at render time
export const dashboardNavTabDefs = [
  { id: 'overview', labelKey: 'nav.dashboard', path: '/', icon: LayoutDashboard },
  { id: 'cv', labelKey: 'nav.cv', path: '/cv', icon: FileText },
  { id: 'cover-letter', labelKey: 'nav.coverLetter', path: '/cover-letter', icon: Mail },
  { id: 'job-search', labelKey: 'nav.jobSearch', path: '/job-search', icon: Briefcase },
  { id: 'career', labelKey: 'nav.career', path: '/career', icon: Target },
  { id: 'interest-guide', labelKey: 'nav.interestGuide', path: '/interest-guide', icon: Compass },
  { id: 'exercises', labelKey: 'nav.exercises', path: '/exercises', icon: Dumbbell },
  { id: 'diary', labelKey: 'nav.diary', path: '/diary', icon: BookHeart },
  { id: 'wellness', labelKey: 'nav.wellness', path: '/wellness', icon: BookHeart },
  { id: 'knowledge-base', labelKey: 'nav.knowledgeBase', path: '/knowledge-base', icon: BookOpen },
  { id: 'resources', labelKey: 'nav.resources', path: '/resources', icon: Bookmark },
]

// CV Builder tab definitions with i18n keys
export const cvBuilderTabDefs = [
  { id: 'design', labelKey: 'pageTabs.cv.design', path: '/cv', icon: LayoutDashboard },
  { id: 'content', labelKey: 'pageTabs.cv.content', path: '/cv/content', icon: FileText },
  { id: 'preview', labelKey: 'pageTabs.cv.preview', path: '/cv/preview', icon: User },
]

// Cover Letter tab definitions with i18n keys
export const coverLetterPageTabDefs = [
  { id: 'generator', labelKey: 'pageTabs.coverLetter.generator', path: '/cover-letter', icon: Sparkles },
  { id: 'templates', labelKey: 'pageTabs.coverLetter.templates', path: '/cover-letter/templates', icon: FileText },
  { id: 'saved', labelKey: 'pageTabs.coverLetter.saved', path: '/cover-letter/saved', icon: Bookmark },
]

// Job Search tab definitions with i18n keys
export const jobSearchTabDefs = [
  { id: 'search', labelKey: 'pageTabs.jobSearch.search', path: '/job-search', icon: Briefcase },
  { id: 'tracker', labelKey: 'pageTabs.jobSearch.tracker', path: '/job-tracker', icon: Target },
  { id: 'saved', labelKey: 'pageTabs.jobSearch.saved', path: '/resources', icon: Bookmark },
]

// Profile tab definitions with i18n keys
export const profileTabDefs = [
  { id: 'profile', labelKey: 'pageTabs.profile.profile', path: '/profile', icon: User },
  { id: 'settings', labelKey: 'pageTabs.profile.settings', path: '/settings', icon: Settings },
]

// Resources tab definitions with i18n keys
export const resourcesTabDefs = [
  { id: 'all', labelKey: 'pageTabs.resources.all', path: '/resources' },
  { id: 'documents', labelKey: 'pageTabs.resources.documents', path: '/resources?tab=documents' },
  { id: 'jobs', labelKey: 'pageTabs.resources.jobs', path: '/resources?tab=jobs' },
  { id: 'articles', labelKey: 'pageTabs.resources.articles', path: '/resources?tab=articles' },
]

// Dashboard navigation (sidebar) - backwards compatibility
export const dashboardNavTabs: Tab[] = [
  { id: 'overview', label: 'Översikt', path: '/', icon: LayoutDashboard },
  { id: 'cv', label: 'CV', path: '/cv', icon: FileText },
  { id: 'cover-letter', label: 'Personligt brev', path: '/cover-letter', icon: Mail },
  { id: 'job-search', label: 'Sök jobb', path: '/job-search', icon: Briefcase },
  { id: 'career', label: 'Karriär', path: '/career', icon: Target },
  { id: 'interest-guide', label: 'Intresseguide', path: '/interest-guide', icon: Compass },
  { id: 'exercises', label: 'Övningar', path: '/exercises', icon: Dumbbell },
  { id: 'diary', label: 'Dagbok', path: '/diary', icon: BookHeart },
  { id: 'wellness', label: 'Hälsa', path: '/wellness', icon: BookHeart },
  { id: 'knowledge-base', label: 'Kunskapsbank', path: '/knowledge-base', icon: BookOpen },
  { id: 'resources', label: 'Resurser', path: '/resources', icon: Bookmark },
]

// CV Builder tabs - backwards compatibility
export const cvBuilderTabs: Tab[] = [
  { id: 'design', label: 'Design', path: '/cv', icon: LayoutDashboard },
  { id: 'content', label: 'Innehåll', path: '/cv/content', icon: FileText },
  { id: 'preview', label: 'Förhandsgranska', path: '/cv/preview', icon: User },
]

// Cover Letter tabs - backwards compatibility
export const coverLetterTabs: Tab[] = [
  { id: 'generator', label: 'Generator', path: '/cover-letter', icon: Sparkles },
  { id: 'templates', label: 'Mallar', path: '/cover-letter/templates', icon: FileText },
  { id: 'saved', label: 'Sparade brev', path: '/cover-letter/saved', icon: Bookmark },
]

// Job Search tabs (main navigation) - backwards compatibility
export const jobSearchTabs: Tab[] = [
  { id: 'search', label: 'Sök', path: '/job-search', icon: Briefcase },
  { id: 'tracker', label: 'Ansöknings tracker', path: '/job-tracker', icon: Target },
  { id: 'saved', label: 'Sparade jobb', path: '/resources', icon: Bookmark },
]

// Profile tabs - backwards compatibility
export const profileTabs: Tab[] = [
  { id: 'profile', label: 'Profil', path: '/profile', icon: User },
  { id: 'settings', label: 'Inställningar', path: '/settings', icon: Settings },
]

// Resources tabs - backwards compatibility
export const resourcesTabs: Tab[] = [
  { id: 'all', label: 'Alla filer', path: '/resources' },
  { id: 'documents', label: 'Dokument', path: '/resources?tab=documents' },
  { id: 'jobs', label: 'Jobb', path: '/resources?tab=jobs' },
  { id: 'articles', label: 'Artiklar', path: '/resources?tab=articles' },
]

// Helper to get tabs for a path
export function getTabsForPath(path: string): Tab[] {
  if (path.startsWith('/cv')) return cvBuilderTabs
  if (path.startsWith('/cover-letter')) return coverLetterTabs
  if (path.startsWith('/job-search')) return jobSearchTabs
  if (path.startsWith('/job-tracker')) return jobSearchTabs // Redirect old path to job search tabs
  if (path.startsWith('/career')) return careerTabs
  if (path.startsWith('/skills-gap')) return careerTabs
  if (path.startsWith('/career-plan')) return careerTabs
  if (path.startsWith('/wellness')) return wellnessTabs
  if (path.startsWith('/knowledge-base')) return knowledgeTabs
  if (path.startsWith('/resources')) return resourcesTabs
  if (path.startsWith('/profile') || path.startsWith('/settings')) return profileTabs
  if (path.startsWith('/dashboard')) return dashboardTabs
  if (path.startsWith('/consultant')) return consultantTabs
  return []
}
