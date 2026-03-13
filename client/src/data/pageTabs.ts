/**
 * Page Tabs Configuration
 * Defines tabs for each main page
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
} from 'lucide-react'

// Import new tab configurations
import { wellnessTabs } from './wellnessTabs'
import { jobTrackerTabs } from './jobTrackerTabs'
import { dashboardTabs } from './dashboardTabs'
import { careerTabs } from './careerTabs'
import { knowledgeTabs } from './knowledgeTabs'

// Dashboard navigation (sidebar)
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

// CV Builder tabs
export const cvBuilderTabs: Tab[] = [
  { id: 'design', label: 'Design', path: '/cv', icon: LayoutDashboard },
  { id: 'content', label: 'Innehåll', path: '/cv/content', icon: FileText },
  { id: 'preview', label: 'Förhandsgranska', path: '/cv/preview', icon: User },
]

// Cover Letter tabs
export const coverLetterTabs: Tab[] = [
  { id: 'generator', label: 'Generator', path: '/cover-letter', icon: Sparkles },
  { id: 'templates', label: 'Mallar', path: '/cover-letter/templates', icon: FileText },
  { id: 'saved', label: 'Sparade brev', path: '/cover-letter/saved', icon: Bookmark },
]

// Job Search tabs (main navigation)
export const jobSearchTabs: Tab[] = [
  { id: 'search', label: 'Sök', path: '/job-search', icon: Briefcase },
  { id: 'tracker', label: 'Ansöknings tracker', path: '/job-tracker', icon: Target },
  { id: 'saved', label: 'Sparade jobb', path: '/resources', icon: Bookmark },
]

// Profile tabs
export const profileTabs: Tab[] = [
  { id: 'profile', label: 'Profil', path: '/profile', icon: User },
  { id: 'settings', label: 'Inställningar', path: '/settings', icon: Settings },
]

// Resources tabs
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
  if (path.startsWith('/job-tracker')) return jobTrackerTabs
  if (path.startsWith('/career')) return careerTabs
  if (path.startsWith('/skills-gap')) return careerTabs
  if (path.startsWith('/career-plan')) return careerTabs
  if (path.startsWith('/wellness')) return wellnessTabs
  if (path.startsWith('/knowledge-base')) return knowledgeTabs
  if (path.startsWith('/resources')) return resourcesTabs
  if (path.startsWith('/profile') || path.startsWith('/settings')) return profileTabs
  if (path.startsWith('/dashboard')) return dashboardTabs
  return []
}
