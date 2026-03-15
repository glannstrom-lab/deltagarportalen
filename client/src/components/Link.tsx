/**
 * Link component that works with hash-based routing
 * 
 * IMPORTANT: With HashRouter, all links should be WITHOUT /dashboard prefix!
 * HashRouter uses URL format: https://example.com/#/path
 * Not: https://example.com/dashboard/#/path
 * 
 * So links should be:
 * - to="/cv" (NOT to="/dashboard/cv")
 * - to="/profile" (NOT to="/dashboard/profile")
 */

import { Link as RouterLink, LinkProps } from 'react-router-dom'
import { ReactNode } from 'react'

interface AppLinkProps extends Omit<LinkProps, 'to'> {
  to: string
  children: ReactNode
  className?: string
}

/**
 * Link component for HashRouter navigation
 * All links should start with / but NOT include /dashboard
 */
export function Link({ to, children, className, ...props }: AppLinkProps) {
  return (
    <RouterLink to={to} className={className} {...props}>
      {children}
    </RouterLink>
  )
}

/**
 * Utility to create correct paths for HashRouter
 * All paths should start with / but NOT include /dashboard
 */
export function createPath(path: string): string {
  // Remove /dashboard/ prefix if present (legacy fix)
  if (path.startsWith('/dashboard/')) {
    return path.replace('/dashboard/', '/')
  }
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    return '/' + path
  }
  
  return path
}

// Common paths used throughout the app (HashRouter format - NO /dashboard prefix)
export const paths = {
  dashboard: '/',
  cv: '/cv',
  cvWithId: (id: string) => `/cv?id=${id}`,
  coverLetter: '/cover-letter',
  coverLetterWithParams: (params: { jobId?: string; company?: string; title?: string; desc?: string }) => {
    const searchParams = new URLSearchParams()
    if (params.jobId) searchParams.set('jobId', params.jobId)
    if (params.company) searchParams.set('company', params.company)
    if (params.title) searchParams.set('title', params.title)
    if (params.desc) searchParams.set('desc', params.desc)
    return `/cover-letter?${searchParams.toString()}`
  },
  jobSearch: '/job-search',
  jobSearchWithQuery: (query: string) => `/job-search?query=${encodeURIComponent(query)}`,
  knowledgeBase: '/knowledge-base',
  knowledgeBaseWithTab: (tab: string) => `/knowledge-base?tab=${tab}`,
  article: (id: string) => `/knowledge-base/article/${id}`,
  interestGuide: '/interest-guide',
  exercises: '/exercises',
  profile: '/profile',
  profileWithId: (id: string) => `/profile/${id}`,
  diary: '/diary',
  wellness: '/wellness',
  resources: '/resources',
  help: '/help',
  settings: '/settings',
  consultant: '/consultant',
  admin: '/admin',
  // Legacy redirects
  jobs: '/job-search',
  applications: '/job-search',
} as const

export default Link
