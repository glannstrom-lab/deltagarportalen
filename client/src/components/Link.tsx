/**
 * Link component that works with hash-based routing
 * Use this instead of react-router-dom's Link for internal navigation
 */

import { Link as RouterLink, LinkProps } from 'react-router-dom'
import { ReactNode } from 'react'

interface AppLinkProps extends Omit<LinkProps, 'to'> {
  to: string
  children: ReactNode
  className?: string
}

/**
 * Link component that handles hash-based routing correctly
 * Converts regular paths to hash-based paths
 */
export function Link({ to, children, className, ...props }: AppLinkProps) {
  // For internal links, use RouterLink as-is (it handles hash routing)
  return (
    <RouterLink to={to} className={className} {...props}>
      {children}
    </RouterLink>
  )
}

/**
 * Utility to create correct paths
 * All paths should start with /dashboard/ for protected routes
 */
export function createPath(path: string): string {
  // Remove leading hash if present
  const cleanPath = path.replace(/^#/, '')
  
  // Ensure path starts with /
  if (!cleanPath.startsWith('/')) {
    return '/' + cleanPath
  }
  
  return cleanPath
}

// Common paths used throughout the app
export const paths = {
  dashboard: '/dashboard',
  cv: '/dashboard/cv',
  cvWithId: (id: string) => `/dashboard/cv?id=${id}`,
  coverLetter: '/dashboard/cover-letter',
  coverLetterWithParams: (params: { jobId?: string; company?: string; title?: string; desc?: string }) => {
    const searchParams = new URLSearchParams()
    if (params.jobId) searchParams.set('jobId', params.jobId)
    if (params.company) searchParams.set('company', params.company)
    if (params.title) searchParams.set('title', params.title)
    if (params.desc) searchParams.set('desc', params.desc)
    return `/dashboard/cover-letter?${searchParams.toString()}`
  },
  jobSearch: '/dashboard/job-search',
  jobSearchWithQuery: (query: string) => `/dashboard/job-search?query=${encodeURIComponent(query)}`,
  knowledgeBase: '/dashboard/knowledge-base',
  knowledgeBaseWithTab: (tab: string) => `/dashboard/knowledge-base?tab=${tab}`,
  article: (id: string) => `/dashboard/knowledge-base/article/${id}`,
  interestGuide: '/dashboard/interest-guide',
  exercises: '/dashboard/exercises',
  profile: '/dashboard/profile',
  profileWithId: (id: string) => `/dashboard/profile/${id}`,
  diary: '/dashboard/diary',
  wellness: '/dashboard/wellness',
  resources: '/dashboard/resources',
  help: '/dashboard/help',
  settings: '/dashboard/settings',
  consultant: '/dashboard/consultant',
  admin: '/dashboard/admin',
  // Legacy redirects
  jobs: '/dashboard/job-search',
  applications: '/dashboard/job-tracker',
} as const

export default Link
