/**
 * HubBottomNav — 5-tab persistent mobile bottom navigation
 *
 * Hub-nav är permanent sedan 2026-07-10 (C3) — flaggreturen är borttagen.
 *
 * Active-tab detection uses getActiveHub() (explicit pageToHub map),
 * NEVER URL prefix matching (PITFALLS.md Pitfall 2).
 *
 * Each tab meets WCAG 2.1 AA SC 2.5.5 Target Size (min 44x44px).
 */

import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navHubs, getActiveHub } from './navigation'
import { cn } from '@/lib/utils'

export function HubBottomNav() {
  const location = useLocation()
  const { t } = useTranslation()

  const activeHub = getActiveHub(location.pathname)

  // UX10 (2026-07-27): annat fixerat innehåll måste veta att navet finns, annars
  // lägger det sig ovanpå. Cookiebannern gjorde exakt det och blockerade alla fem
  // hubbar vid första besöket. Variabeln sätts bara när navet är monterat — på
  // publika sidor (login/registrering) är den 0, så bannern ligger kvar där den låg.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bottom-nav-h', '64px')
    return () => {
      root.style.removeProperty('--bottom-nav-h')
    }
  }, [])

  return (
    <nav
      role="navigation"
      aria-label={t('hubBottomNav.label', 'Hubnavigering')}
      // UX32: mobilens synliga huvudnavigation. Sidebarens <nav> äger id:t
      // "main-navigation" (den är display:none under lg), så vi märker upp
      // den här som alternativt mål i stället för att dubblera id:t.
      data-skip-target="main-navigation"
      tabIndex={-1}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 lg:hidden outline-none',
        'bg-white dark:bg-stone-900',
        'border-t border-stone-200 dark:border-stone-700',
        'pb-safe'
      )}
    >
      <ul className="flex flex-row items-stretch justify-between">
        {navHubs.map((hub) => {
          const isActive = activeHub?.id === hub.id
          const Icon = hub.icon
          return (
            <li
              key={hub.id}
              data-domain={hub.domain}
              className="flex-1"
            >
              <Link
                to={hub.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5',
                  'min-h-[44px] min-w-[44px] py-2 px-1',
                  'text-[10px] font-medium',
                  'transition-colors',
                  isActive
                    ? 'bg-[var(--c-bg)] text-[var(--c-text)] font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-[var(--c-text)]'
                )}
              >
                <Icon
                  className={cn('w-5 h-5', isActive ? 'text-[var(--c-solid)]' : '')}
                  aria-hidden="true"
                />
                <span className="truncate max-w-full">
                  {t(hub.labelKey, hub.fallbackLabel)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default HubBottomNav
