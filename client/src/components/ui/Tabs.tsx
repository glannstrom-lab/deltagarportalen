/**
 * Tabs Component
 * State-based tabs for inline tab navigation
 * Follows DESIGN.md: brand colors, rounded-lg, no shadows
 */

import { useCallback, useRef, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

export interface Tab {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string; size?: number }>
  badge?: number | string
  disabled?: boolean
}

type TabVariant = 'solid' | 'underline' | 'pills'
type TabSize = 'sm' | 'md' | 'lg'

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: TabVariant
  size?: TabSize
  fullWidth?: boolean
  className?: string
  'aria-label'?: string
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  className,
  'aria-label': ariaLabel = 'Tabs',
}: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledTabs = tabs.filter(t => !t.disabled)
    const currentEnabledIndex = enabledTabs.findIndex(t => t.id === tabs[currentIndex].id)

    let newIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        newIndex = (currentEnabledIndex + 1) % enabledTabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        newIndex = (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = enabledTabs.length - 1
        break
    }

    if (newIndex !== null) {
      const newTab = enabledTabs[newIndex]
      onChange(newTab.id)
      tabRefs.current.get(newTab.id)?.focus()
    }
  }, [tabs, onChange])

  // Size classes
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-1.5',
    lg: 'px-5 py-2.5 text-base gap-2',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  }

  // Variant: Solid - Filled background for active
  const SolidTabs = () => (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'inline-flex items-center justify-center rounded-md font-medium transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2',
              sizeClasses[size],
              fullWidth && 'flex-1',
              isActive
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {Icon && <Icon className="flex-shrink-0" size={iconSizes[size]} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive
                  ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  // Variant: Underline - Border bottom indicator
  const UnderlineTabs = () => (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-4 border-b border-stone-200 dark:border-stone-700',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative inline-flex items-center font-medium transition-colors pb-2',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2',
              sizeClasses[size],
              fullWidth && 'flex-1 justify-center',
              isActive
                ? 'text-brand-900 dark:text-brand-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {Icon && <Icon className="flex-shrink-0" size={iconSizes[size]} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 text-xs rounded-full font-bold bg-brand-100 text-brand-700">
                {tab.badge}
              </span>
            )}
            {/* Underline indicator */}
            <span className={cn(
              'absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-colors',
              isActive ? 'bg-brand-900 dark:bg-brand-400' : 'bg-transparent'
            )} />
          </button>
        )
      })}
    </div>
  )

  // Variant: Pills - Rounded pill-shaped tabs
  const PillsTabs = () => (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-2',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'inline-flex items-center justify-center rounded-full font-medium transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2',
              sizeClasses[size],
              fullWidth && 'flex-1',
              isActive
                ? 'bg-brand-900 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {Icon && <Icon className="flex-shrink-0" size={iconSizes[size]} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  switch (variant) {
    case 'underline': return <UnderlineTabs />
    case 'pills': return <PillsTabs />
    default: return <SolidTabs />
  }
}

// TabPanel component for content areas
interface TabPanelProps {
  id: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (activeTab !== id) return null

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  )
}

export default Tabs
