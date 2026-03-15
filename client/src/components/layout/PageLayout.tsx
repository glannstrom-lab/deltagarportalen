/**
 * Page Layout with Tabs
 * Wraps page content with tabs for better navigation
 */

import { useLocation } from 'react-router-dom'
import { PageTabs, PageHeader, type Tab } from './PageTabs'
import { cn } from '@/lib/utils'
import { getTabsForPath } from '@/data/pageTabs'

type TabVariant = 'minimal' | 'pills' | 'floating' | 'underline' | 'glass'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  customTabs?: Tab[]
  tabVariant?: TabVariant
  showTabs?: boolean
  showHeader?: boolean
  className?: string
  contentClassName?: string
}

export function PageLayout({
  children,
  title,
  description,
  actions,
  customTabs,
  tabVariant = 'minimal',
  showTabs = true,
  showHeader = true,
  className,
  contentClassName,
}: PageLayoutProps) {
  const location = useLocation()
  const tabs = customTabs || (showTabs ? getTabsForPath(location.pathname) : [])
  
  // Don't show tabs if there's only one tab
  const shouldShowTabs = tabs.length > 1 && showTabs

  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header with Tabs */}
      {showHeader && (title || shouldShowTabs) && (
        <PageHeader
          title={title || ''}
          description={description}
          tabs={shouldShowTabs ? tabs : undefined}
          tabVariant={tabVariant}
          actions={actions}
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
      'bg-white rounded-2xl border-2 border-slate-200 overflow-hidden',
      'hover:border-slate-300 transition-colors duration-300',
      className
    )}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </section>
  )
}

export default PageLayout
