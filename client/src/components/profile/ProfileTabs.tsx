/**
 * ProfileTabs - Clean minimal tab navigation
 */

import { useCallback, KeyboardEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User, Briefcase, Star, Heart, Settings
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'
import { TABS, type TabId } from './constants'

// Tab icons mapping
const TAB_ICONS: Record<TabId, React.ElementType> = {
  overview: User,
  jobbsok: Briefcase,
  kompetens: Star,
  stod: Heart,
  installningar: Settings
}

export function ProfileTabs() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab, completion } = useProfileStore()
  const tabRefs = useRef<Map<TabId, HTMLButtonElement>>(new Map())

  // Get incomplete status for each tab
  const getTabStatus = useCallback((tabId: TabId): boolean => {
    const { nextStep } = completion
    return nextStep?.tab === tabId
  }, [completion])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let newIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        newIndex = (currentIndex + 1) % TABS.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        newIndex = (currentIndex - 1 + TABS.length) % TABS.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = TABS.length - 1
        break
    }

    if (newIndex !== null) {
      const newTab = TABS[newIndex]
      setActiveTab(newTab.id)
      tabRefs.current.get(newTab.id)?.focus()
    }
  }, [setActiveTab])

  return (
    <div className="border-b border-stone-200 dark:border-stone-800">
      {/* Scrollable container */}
      <nav
        role="tablist"
        aria-label={t('profile.tabs.ariaLabel')}
        className="flex overflow-x-auto scrollbar-hide -mb-px"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id
          const hasIncomplete = getTabStatus(tab.id)
          const Icon = TAB_ICONS[tab.id]

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el)
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                'focus:outline-none focus-visible:bg-stone-50 dark:focus-visible:bg-stone-800',
                isActive
                  ? 'text-[var(--c-text)] dark:text-[var(--c-solid)]'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              <span className="sm:hidden">{t(tab.shortLabelKey)}</span>

              {/* Incomplete indicator */}
              {hasIncomplete && (
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}

              {/* Active indicator line */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--c-solid)]" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
