/**
 * Page Tabs Component
 * Modern tab designs with multiple style variants
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ChevronDown } from '@/components/ui/icons'

export interface Tab {
  id: string
  label: string
  path: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number
}

type TabVariant = 'minimal' | 'pills' | 'floating' | 'underline' | 'glass'

interface PageTabsProps {
  tabs: Tab[]
  className?: string
  collapsible?: boolean
  variant?: TabVariant
}

export function PageTabs({ tabs, className, collapsible = true, variant = 'minimal' }: PageTabsProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)

  const isTabActive = (tabPath: string) => {
    if (tabPath.includes('?')) {
      const [path, query] = tabPath.split('?')
      const [key, value] = query.split('=')
      const params = new URLSearchParams(location.search)
      return location.pathname === path && params.get(key) === value
    }
    return location.pathname === tabPath || location.pathname.startsWith(`${tabPath}/`)
  }

  const activeTab = tabs.find(tab => isTabActive(tab.path))

  // Variant: Minimal - Clean with subtle backgrounds
  const MinimalTabs = () => (
    <div className={cn(
      'hidden md:flex items-center gap-1 p-1 bg-stone-100/80 dark:bg-stone-800 rounded-xl',
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = isTabActive(tab.path)

        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/50 dark:hover:bg-stone-700/50'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
              )}>
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  // Variant: Pills - Colorful pill-shaped tabs
  const PillsTabs = () => (
    <div className={cn('hidden md:flex items-center gap-2', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = isTabActive(tab.path)

        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive && 'text-white/90')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
              )}>
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  // Variant: Floating - No container, individual floating tabs
  const FloatingTabs = () => (
    <div className={cn('hidden md:flex items-center gap-1', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = isTabActive(tab.path)

        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              'group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-white/80' : 'text-stone-600 group-hover:text-stone-600')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
              )}>
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  // Variant: Underline - Clean with animated underline
  const UnderlineTabs = () => (
    <div className={cn('hidden md:flex items-center gap-6 border-b border-stone-200 dark:border-stone-700', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = isTabActive(tab.path)

        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              'group relative flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors',
              isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-600 dark:text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full font-bold bg-brand-100 text-brand-700">
                {tab.badge}
              </span>
            )}
            {/* Underline indicator */}
            <span className={cn(
              'absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-200',
              isActive ? 'bg-brand-600 dark:bg-brand-500' : 'bg-transparent group-hover:bg-stone-200 dark:group-hover:bg-stone-600'
            )} />
          </Link>
        )
      })}
    </div>
  )

  // Variant: Glass - Soft pastel style matching Dashboard/Profile
  // Compact mode for many tabs (>5)
  const isCompact = tabs.length > 5
  const GlassTabs = () => (
    <div className={cn(
      'hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide',
      'pb-1', // Space for shadow
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = isTabActive(tab.path)

        return (
          <Link
            key={tab.id}
            to={tab.path}
            title={tab.label}
            className={cn(
              'flex items-center gap-1.5 rounded-xl',
              'text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap',
              isCompact ? 'px-2.5 py-1.5 min-h-[36px]' : 'px-4 py-2 min-h-[44px]',
              isActive
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-brand-50 dark:hover:bg-stone-700'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-brand-600 dark:text-brand-400' : '')} />}
            {/* Hide label on compact mode for inactive tabs on smaller screens */}
            <span className={cn(isCompact && !isActive && 'hidden lg:inline')}>
              {tab.label}
            </span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-brand-200' : 'bg-brand-100 text-brand-700'
              )}>
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  // Render the selected variant
  const renderDesktopTabs = () => {
    switch (variant) {
      case 'pills': return <PillsTabs />
      case 'floating': return <FloatingTabs />
      case 'underline': return <UnderlineTabs />
      case 'glass': return <GlassTabs />
      default: return <MinimalTabs />
    }
  }

  // Mobile dropdown (shared across all variants)
  const MobileDropdown = () => (
    <div className={cn('md:hidden', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-4 py-3 rounded-xl',
          'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700',
          'text-stone-800 dark:text-stone-100 shadow-sm',
          'transition-all duration-200',
          'active:scale-[0.99]',
          'min-h-[48px]' // Touch-friendly minimum height
        )}
      >
        <div className="flex items-center gap-3">
          {activeTab?.icon && <activeTab.icon className="w-5 h-5 text-brand-600" />}
          <span className="font-semibold">{activeTab?.label || t('layout.pageTabs.selectPage')}</span>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform duration-300',
          isExpanded && 'rotate-180'
        )} />
      </button>

      {isExpanded && (
        <div className="mt-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = isTabActive(tab.path)

            return (
              <Link
                key={tab.id}
                to={tab.path}
                onClick={() => setIsExpanded(false)}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5 transition-colors',
                  'min-h-[52px]', // Touch-friendly minimum height
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800',
                  index !== tabs.length - 1 && 'border-b border-stone-100 dark:border-stone-700'
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      isActive ? 'bg-brand-100 dark:bg-brand-900' : 'bg-stone-100 dark:bg-stone-800'
                    )}>
                      <Icon className={cn('w-4 h-4', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-700 dark:text-stone-300')} />
                    </div>
                  )}
                  <span className="font-medium">{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-brand-100 text-brand-700">
                    {tab.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )

  // Show mobile dropdown for all variants when collapsible is enabled
  const showMobileDropdown = collapsible

  return (
    <>
      {renderDesktopTabs()}
      {showMobileDropdown && <MobileDropdown />}
    </>
  )
}

/**
 * Page Header with Tabs - Soft Pastel Style
 */
interface PageHeaderProps {
  title: string
  description?: string
  tabs?: Tab[]
  tabVariant?: TabVariant
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, tabs, tabVariant = 'minimal', actions, className }: PageHeaderProps) {
  const hasTabs = tabs && tabs.length > 0

  return (
    <div className={cn(
      'bg-white dark:bg-stone-900',
      'rounded-2xl border border-stone-200 dark:border-stone-700',
      className
    )}>
      {/* Header content */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight truncate">{title}</h1>
            {description && (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Tabs integrated in header */}
      {hasTabs && (
        <div className="px-4 pb-3 pt-0">
          <div className="bg-stone-50/60 dark:bg-stone-800/40 rounded-xl px-2 py-1.5 border border-stone-100 dark:border-stone-700/50">
            <PageTabs tabs={tabs} variant={tabVariant} />
          </div>
        </div>
      )}
    </div>
  )
}

export default PageTabs
