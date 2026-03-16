/**
 * Page Tabs Component
 * Modern tab designs with multiple style variants
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

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
      'hidden md:flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl',
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
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
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
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive && 'text-white/90')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
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
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-600')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
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
    <div className={cn('hidden md:flex items-center gap-6 border-b border-slate-200', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = isTabActive(tab.path)

        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              'group relative flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors',
              isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-violet-500' : 'text-slate-400 group-hover:text-slate-600')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full font-bold bg-violet-100 text-violet-700">
                {tab.badge}
              </span>
            )}
            {/* Underline indicator */}
            <span className={cn(
              'absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-200',
              isActive ? 'bg-violet-600' : 'bg-transparent group-hover:bg-slate-200'
            )} />
          </Link>
        )
      })}
    </div>
  )

  // Variant: Glass - Glassmorphism effect
  const GlassTabs = () => (
    <div className={cn(
      'flex items-center gap-1 p-1.5 overflow-x-auto',
      'bg-white/60 backdrop-blur-xl rounded-2xl',
      'border border-white/40 shadow-lg shadow-slate-200/50',
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
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
              isActive
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive && 'text-white/90')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-700'
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
          'bg-white border border-slate-200',
          'text-slate-800 shadow-sm',
          'transition-all duration-200',
          'active:scale-[0.99]'
        )}
      >
        <div className="flex items-center gap-3">
          {activeTab?.icon && <activeTab.icon className="w-5 h-5 text-violet-600" />}
          <span className="font-semibold">{activeTab?.label || 'Välj sida'}</span>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-slate-400 transition-transform duration-300',
          isExpanded && 'rotate-180'
        )} />
      </button>

      {isExpanded && (
        <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
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
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-700 hover:bg-slate-50',
                  index !== tabs.length - 1 && 'border-b border-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      isActive ? 'bg-violet-100' : 'bg-slate-100'
                    )}>
                      <Icon className={cn('w-4 h-4', isActive ? 'text-violet-600' : 'text-slate-500')} />
                    </div>
                  )}
                  <span className="font-medium">{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-violet-100 text-violet-700">
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

  // Glass variant shows on all screens, no need for mobile dropdown
  const showMobileDropdown = collapsible && variant !== 'glass'

  return (
    <>
      {renderDesktopTabs()}
      {showMobileDropdown && <MobileDropdown />}
    </>
  )
}

/**
 * Page Header with Tabs
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
  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-base text-slate-500 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <PageTabs tabs={tabs} variant={tabVariant} />
      )}
    </div>
  )
}

export default PageTabs
