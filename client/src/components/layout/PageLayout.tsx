/**
 * Page Layout with Tabs
 * Wraps page content with tabs for better navigation
 * Supports semantic color domains from DESIGN.md
 */

import { useLocation } from 'react-router-dom'
import { PageTabs, PageHeader, type Tab, type PageStat } from './PageTabs'
import { cn } from '@/lib/utils'
import { getTabsForPath } from '@/data/pageTabs'
import { getDomainForPath, type LegacyColorDomain } from '@/lib/domains'

type TabVariant = 'minimal' | 'pills' | 'floating' | 'underline' | 'glass'

/**
 * Semantic color domains.
 * Nya systemet (DESIGN.md 2026-04-28): 'action' | 'reflection' | 'outbound'.
 * Bakåtkompatibla alias: 'info' | 'activity' | 'wellbeing' | 'coaching'.
 */
export type ColorDomain = LegacyColorDomain

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  tabs?: Tab[]
  customTabs?: Tab[]
  tabVariant?: TabVariant
  showTabs?: boolean
  showHeader?: boolean
  className?: string
  contentClassName?: string
  /** Semantic color domain for accent colors */
  domain?: ColorDomain
  icon?: React.ComponentType<{ className?: string }>
  /** Optional inline stat chips rendered in the header (right side) */
  stats?: PageStat[]
}

export function PageLayout({
  children,
  title,
  subtitle,
  description,
  actions,
  tabs: tabsProp,
  customTabs,
  tabVariant = 'glass',
  showTabs = true,
  showHeader = true,
  className,
  contentClassName,
  domain,
  icon,
  stats,
}: PageLayoutProps) {
  const location = useLocation()
  // Support both "tabs" and "customTabs" props for flexibility
  const tabs = tabsProp || customTabs || (showTabs ? getTabsForPath(location.pathname) : [])

  // Don't show tabs if there's only one tab
  const shouldShowTabs = tabs.length > 1 && showTabs

  // Auto-resolve domain from route if not explicitly provided.
  // tokens.css mappar [data-domain] → CSS-variabler som driver --c-* per sida.
  const resolvedDomain = domain ?? getDomainForPath(location.pathname)

  return (
    <div className={cn(
      // Removed min-h-screen — Layout.tsx already provides the scrolling <main> container.
      // Adding min-h-screen here created a second scroll viewport (dubbel scrollbar).
      'space-y-4 sm:space-y-5 md:space-y-6',
      'page-transition',
      className
    )} data-domain={resolvedDomain}>
      {/* Page Header with Tabs */}
      {showHeader && (title || shouldShowTabs) && (
        <PageHeader
          title={title || ''}
          description={subtitle || description}
          tabs={shouldShowTabs ? tabs : undefined}
          tabVariant={tabVariant}
          actions={actions}
          stats={stats}
        />
      )}

      {/* Page Content */}
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  )
}

/**
 * Simple page container without tabs
 */
interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function PageContainer({ 
  children, 
  className,
  maxWidth = '2xl'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full',
  }

  return (
    <div className={cn(maxWidthClasses[maxWidth], 'mx-auto', className)}>
      {children}
    </div>
  )
}

/**
 * Page section with consistent styling
 */
interface PageSectionProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
}

export function PageSection({
  children,
  title,
  description,
  actions,
  className,
}: PageSectionProps) {
  return (
    <section className={cn(
      'bg-white dark:bg-stone-900',
      'rounded-2xl', // Consistent border radius
      'border-2 border-stone-200 dark:border-stone-700 overflow-hidden',
      'hover:border-stone-300 dark:hover:border-stone-600',
      'transition-all duration-200',
      'surface-2', // Consistent shadow hierarchy
      className
    )}>
      {(title || actions) && (
        <div className={cn(
          'px-4 py-3 sm:px-5 sm:py-4 md:px-6',
          'border-b sm:border-b-2 border-stone-100 dark:border-stone-800',
          'flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4'
        )}>
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="p-4 sm:p-5 md:p-6">
        {children}
      </div>
    </section>
  )
}

export default PageLayout
