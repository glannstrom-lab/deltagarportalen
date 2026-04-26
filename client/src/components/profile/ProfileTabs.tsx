/**
 * ProfileTabs - Accessible tab navigation with reduced tabs (9 → 5)
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
const TAB_ICONS: Record<TabId, React.ReactNode> = {
  overview: <User className="w-4 h-4" />,
  jobbsok: <Briefcase className="w-4 h-4" />,
  kompetens: <Star className="w-4 h-4" />,
  stod: <Heart className="w-4 h-4" />,
  installningar: <Settings className="w-4 h-4" />
}

export function ProfileTabs() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab, completion } = useProfileStore()
  const tabRefs = useRef<Map<TabId, HTMLButtonElement>>(new Map())

  // Get incomplete status for each tab
  const getTabStatus = useCallback((tabId: TabId): 'incomplete' | 'complete' | 'none' => {
    // Simple logic - can be enhanced
    const { nextStep } = completion
    if (nextStep?.tab === tabId) return 'incomplete'
    return 'none'
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
    <div className="mb-6">
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto scrollbar-hide">
        <nav
          role="tablist"
          aria-label={t('profile.tabs.ariaLabel')}
          className="flex gap-1 p-1 min-w-max bg-stone-100 dark:bg-stone-800 rounded-xl"
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id
            const status = getTabStatus(tab.id)

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
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                )}
              >
                <span aria-hidden="true">{TAB_ICONS[tab.id]}</span>
                <span>{t(tab.shortLabelKey)}</span>
                {status === 'incomplete' && (
                  <span
                    className="w-1.5 h-1.5 bg-amber-400 rounded-full"
                    aria-label={t('profile.tabs.incompleteFields')}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Desktop: Full tabs */}
      <nav
        role="tablist"
        aria-label={t('profile.tabs.ariaLabel')}
        className="hidden md:flex items-center justify-center gap-1 p-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id
          const status = getTabStatus(tab.id)

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
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2',
                isActive
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-brand-50 dark:hover:bg-stone-700/50'
              )}
            >
              <span aria-hidden="true">{TAB_ICONS[tab.id]}</span>
              <span>{t(tab.labelKey)}</span>
              {status === 'incomplete' && (
                <span
                  className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                  aria-label={t('profile.tabs.incompleteFields')}
                />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
