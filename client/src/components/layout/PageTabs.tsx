/**
 * Page Tabs Component
 * Collapsible tabs for page navigation
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronDown, Menu } from 'lucide-react'

export interface Tab {
  id: string
  label: string
  path: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number
}

interface PageTabsProps {
  tabs: Tab[]
  className?: string
  collapsible?: boolean
}

export function PageTabs({ tabs, className, collapsible = true }: PageTabsProps) {
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const activeTab = tabs.find(tab => 
    location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)
  )
  
  // Desktop: Horizontal tabs
  // Mobile: Collapsible dropdown
  return (
    <>
      {/* Desktop Tabs */}
      <div className={cn(
        'hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-xl',
        className
      )}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                )}>
                  {tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Mobile Collapsible Tabs */}
      {collapsible && (
        <div className={cn('md:hidden', className)}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors',
              isExpanded 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-700'
            )}
          >
            <div className="flex items-center gap-2">
              <Menu className="w-5 h-5" />
              <span className="font-medium">
                {activeTab?.label || 'Välj sida'}
              </span>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </button>
          
          {isExpanded && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden animate-fade-in">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)
                
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    onClick={() => setIsExpanded(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50',
                      index !== tabs.length - 1 && 'border-b border-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="w-5 h-5" />}
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
                      )}>
                        {tab.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}

/**
 * Page Header with Tabs
 * Combines title, description, and tabs
 */
interface PageHeaderProps {
  title: string
  description?: string
  tabs?: Tab[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, tabs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {description && (
            <p className="text-slate-600 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      
      {tabs && tabs.length > 0 && (
        <PageTabs tabs={tabs} />
      )}
    </div>
  )
}

export default PageTabs
