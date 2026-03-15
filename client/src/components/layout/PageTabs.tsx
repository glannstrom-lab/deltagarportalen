/**
 * Page Tabs Component
 * Modern, premium tab design
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
  
  return (
    <>
      {/* Desktop Tabs - Modern Premium Design */}
      <div className={cn(
        'hidden md:flex items-center gap-1 p-1',
        'bg-gradient-to-b from-slate-100 to-slate-200/80',
        'rounded-xl border border-slate-200/80 shadow-inner',
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
                'group relative flex items-center gap-2 px-4 py-2.5 rounded-lg',
                'text-sm font-semibold transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
                isActive
                  ? 'text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {/* Active background with gradient */}
              {isActive && (
                <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600" />
              )}
              
              {/* Hover background for inactive tabs */}
              {!isActive && (
                <span className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/60 transition-colors" />
              )}
              
              {/* Content */}
              <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className={cn('w-4 h-4', isActive && 'text-white/90')} />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={cn(
                    'ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full font-bold',
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Mobile Dropdown - Modern Design */}
      {collapsible && (
        <div className={cn('md:hidden', className)}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-full flex items-center justify-between',
              'px-4 py-3 rounded-xl',
              'bg-gradient-to-r from-indigo-500 to-violet-600',
              'text-white shadow-lg shadow-indigo-500/25',
              'transition-all duration-200',
              'active:scale-[0.98] active:shadow-md'
            )}
          >
            <div className="flex items-center gap-3">
              {activeTab?.icon && <activeTab.icon className="w-5 h-5 text-white/90" />}
              <span className="font-semibold">
                {activeTab?.label || 'Välj sida'}
              </span>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 text-white/80 transition-transform duration-300',
              isExpanded && 'rotate-180'
            )} />
          </button>
          
          {isExpanded && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)
                
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    onClick={() => setIsExpanded(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 transition-colors',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50/50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50',
                      index !== tabs.length - 1 && 'border-b border-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          isActive ? 'bg-indigo-100' : 'bg-slate-100'
                        )}>
                          <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600' : 'text-slate-500')} />
                        </div>
                      )}
                      <span className="font-semibold">{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full font-bold',
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
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
        <PageTabs tabs={tabs} />
      )}
    </div>
  )
}

export default PageTabs
