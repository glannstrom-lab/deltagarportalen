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
} from 'lucide-react'

// Dashboard tabs
export const dashboardTabs: Tab[] = [
  { id: 'overview', label: 'Översikt', path: '/dashboard', icon: LayoutDashboard },
  { id: 'cv', label: 'CV', path: '/dashboard/cv', icon: FileText },
  { id: 'cover-letter', label: 'Personligt brev', path: '/dashboard/cover-letter', icon: Mail },
  { id: 'job-search', label: 'Sök jobb', path: '/dashboard/job-search', icon: Briefcase },
  { id: 'career', label: 'Karriär', path: '/dashboard/career', icon: Target },
  { id: 'interest-guide', label: 'Intresseguide', path: '/dashboard/interest-guide', icon: Compass },
  { id: 'exercises', label: 'Övningar', path: '/dashboard/exercises', icon: Dumbbell },
  { id: 'diary', label: 'Dagbok', path: '/dashboard/diary', icon: BookHeart },
  { id: 'knowledge-base', label: 'Kunskapsbank', path: '/dashboard/knowledge-base', icon: BookOpen },
  { id: 'resources', label: 'Resurser', path: '/dashboard/resources', icon: Bookmark },
]

// CV Builder tabs
export const cvBuilderTabs: Tab[] = [
  { id: 'design', label: 'Design', path: '/dashboard/cv', icon: LayoutDashboard },
  { id: 'content', label: 'Innehåll', path: '/dashboard/cv/content', icon: FileText },
  { id: 'preview', label: 'Förhandsgranska', path: '/dashboard/cv/preview', icon: User },
]

// Cover Letter tabs
export const coverLetterTabs: Tab[] = [
  { id: 'generator', label: 'Generator', path: '/dashboard/cover-letter', icon: Sparkles },
  { id: 'templates', label: 'Mallar', path: '/dashboard/cover-letter/templates', icon: FileText },
  { id: 'saved', label: 'Sparade brev', path: '/dashboard/cover-letter/saved', icon: Bookmark },
]

// Job Search tabs
export const jobSearchTabs: Tab[] = [
  { id: 'search', label: 'Sök', path: '/dashboard/job-search', icon: Briefcase },
  { id: 'tracker', label: 'Ansöknings tracker', path: '/dashboard/job-tracker', icon: Target },
  { id: 'saved', label: 'Sparade jobb', path: '/dashboard/resources', icon: Bookmark },
]

// Career tabs
export const careerTabs: Tab[] = [
  { id: 'explore', label: 'Utforska yrken', path: '/dashboard/career', icon: Compass },
  { id: 'plan', label: 'Karriärplan', path: '/dashboard/career-plan', icon: Target },
  { id: 'skills', label: 'Kompetensanalys', path: '/dashboard/skills-gap', icon: LayoutDashboard },
]

// Knowledge Base tabs
export const knowledgeTabs: Tab[] = [
  { id: 'articles', label: 'Artiklar', path: '/dashboard/knowledge-base', icon: BookOpen },
  { id: 'resources', label: 'Mina resurser', path: '/dashboard/resources', icon: Bookmark },
]

// Profile tabs
export const profileTabs: Tab[] = [
  { id: 'profile', label: 'Profil', path: '/profile', icon: User },
  { id: 'settings', label: 'Inställningar', path: '/settings', icon: Settings },
]

// Resources tabs
export const resourcesTabs: Tab[] = [
  { id: 'all', label: 'Alla filer', path: '/dashboard/resources' },
  { id: 'documents', label: 'Dokument', path: '/dashboard/resources?tab=documents' },
  { id: 'jobs', label: 'Jobb', path: '/dashboard/resources?tab=jobs' },
  { id: 'articles', label: 'Artiklar', path: '/dashboard/resources?tab=articles' },
]

// Helper to get tabs for a path
export function getTabsForPath(path: string): Tab[] {
  if (path.startsWith('/dashboard/cv')) return cvBuilderTabs
  if (path.startsWith('/dashboard/cover-letter')) return coverLetterTabs
  if (path.startsWith('/dashboard/job-search') || path.startsWith('/dashboard/job-tracker')) return jobSearchTabs
  if (path.startsWith('/dashboard/career')) return careerTabs
  if (path.startsWith('/dashboard/knowledge-base')) return knowledgeTabs
  if (path.startsWith('/dashboard/resources')) return resourcesTabs
  if (path.startsWith('/profile') || path.startsWith('/settings')) return profileTabs
  return dashboardTabs
}

// Lucide icons need to be imported
import { Sparkles } from 'lucide-react'
