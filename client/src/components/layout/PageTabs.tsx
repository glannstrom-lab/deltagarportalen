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
                isActive ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)] text-[var(--c-text)] dark:text-[var(--c-text)]' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
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
                ? 'bg-[var(--c-solid)] text-white shadow-lg '
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive && 'text-white/90')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-[var(--c-accent)]/40 text-[var(--c-text)]'
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
                isActive ? 'bg-white/20 text-white' : 'bg-[var(--c-accent)]/40 text-[var(--c-text)]'
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
              isActive ? 'text-[var(--c-text)] dark:text-[var(--c-text)]' : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-[var(--c-solid)] dark:text-[var(--c-text)]' : 'text-stone-600 dark:text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full font-bold bg-[var(--c-accent)]/40 text-[var(--c-text)]">
                {tab.badge}
              </span>
            )}
            {/* Underline indicator */}
            <span className={cn(
              'absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-200',
              isActive ? 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)]' : 'bg-transparent group-hover:bg-stone-200 dark:group-hover:bg-stone-600'
            )} />
          </Link>
        )
      })}
    </div>
  )

  // Variant: Glass - Inline pill tabs sitting directly on the hero background.
  // No outer wrapper — tabs read as content elements, not as a separate input field.
  // Compact mode for many tabs (>5)
  const isCompact = tabs.length > 5
  const GlassTabs = () => (
    <div className={cn(
      'hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide',
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
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg whitespace-nowrap transition-colors',
              'text-sm font-medium',
              isCompact ? 'px-2.5 py-1.5' : 'px-3 py-2',
              isActive
                ? 'bg-[var(--c-bg)] text-[var(--c-text)] ring-1 ring-[var(--c-accent)] dark:bg-[var(--c-bg)]/60 dark:ring-[var(--c-accent)]/40'
                : 'text-[var(--header-muted)] hover:text-[var(--header-text)] hover:bg-white/60 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800/50'
            )}
          >
            {Icon && (
              <Icon className={cn(
                'w-4 h-4 flex-shrink-0',
                isActive ? 'text-[var(--c-solid)] dark:text-[var(--c-text)]' : ''
              )} />
            )}
            <span className={cn(isCompact && !isActive && 'hidden lg:inline')}>
              {tab.label}
            </span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-[11px] rounded-full font-semibold tabular-nums',
                isActive
                  ? 'bg-[var(--c-accent)]/70 text-[var(--c-text)]'
                  : 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300'
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
          {activeTab?.icon && <activeTab.icon className="w-5 h-5 text-[var(--c-text)]" />}
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
                    ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800',
                  index !== tabs.length - 1 && 'border-b border-stone-100 dark:border-stone-700'
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      isActive ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]' : 'bg-stone-100 dark:bg-stone-800'
                    )}>
                      <Icon className={cn('w-4 h-4', isActive ? 'text-[var(--c-text)] dark:text-[var(--c-text)]' : 'text-stone-700 dark:text-stone-300')} />
                    </div>
                  )}
                  <span className="font-medium">{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-[var(--c-accent)]/40 text-[var(--c-text)]">
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
 * Page Stat — small chip shown inline in the page header.
 * Optional `to` makes the chip a link.
 */
export interface PageStat {
  label: string
  value: string | number
  icon?: React.ComponentType<{ className?: string }>
  to?: string
}

/**
 * Page Header with Tabs — neutral card surface with 4 px domain edge.
 * Title + tabs share a single rounded card. Identity comes from the peach
 * left edge. Optional stat-chips render in the right cluster.
 */
interface PageHeaderProps {
  title: string
  description?: string
  tabs?: Tab[]
  tabVariant?: TabVariant
  actions?: React.ReactNode
  stats?: PageStat[]
  className?: string
}

export function PageHeader({ title, description, tabs, tabVariant = 'minimal', actions, stats, className }: PageHeaderProps) {
  const hasTabs = tabs && tabs.length > 0
  const hasStats = stats && stats.length > 0

  return (
    <div className={cn(
      'bg-[var(--header-bg)] rounded-2xl border border-[var(--header-border)]',
      'border-l-4 border-l-[var(--c-solid)]',
      className
    )}>
      {/* Header content */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--header-text)] tracking-tight truncate">{title}</h1>
            {description && (
              <p className="text-sm text-[var(--header-muted)] mt-1">{description}</p>
            )}
          </div>

          {/* Right cluster: stats + actions */}
          {(hasStats || actions) && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {hasStats && stats!.map((stat) => {
                const StatIcon = stat.icon
                const chipClass = 'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--header-border)] bg-white/80 hover:bg-white transition-colors'
                const inner = (
                  <>
                    <div className="w-7 h-7 rounded-md bg-[var(--c-bg)] flex items-center justify-center flex-shrink-0">
                      {StatIcon && <StatIcon className="w-3.5 h-3.5 text-[var(--c-solid)]" />}
                    </div>
                    <div className="text-left leading-tight">
                      <div className="text-sm font-bold text-[var(--header-text)] tabular-nums">{stat.value}</div>
                      <div className="text-[11px] text-[var(--header-muted)]">{stat.label}</div>
                    </div>
                  </>
                )
                return stat.to ? (
                  <Link key={stat.label} to={stat.to} className={chipClass}>{inner}</Link>
                ) : (
                  <div key={stat.label} className={chipClass}>{inner}</div>
                )
              })}
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Tabs integrated in header — inline on hero bg, no wrapper */}
      {hasTabs && (
        <div className="px-5 pb-4 pt-0">
          <PageTabs tabs={tabs} variant={tabVariant} />
        </div>
      )}
    </div>
  )
}

export default PageTabs
