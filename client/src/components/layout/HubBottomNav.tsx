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

import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navHubs, getActiveHub } from './navigation'
import { cn } from '@/lib/utils'

export function HubBottomNav() {
  const location = useLocation()
  const { t } = useTranslation()

  const activeHub = getActiveHub(location.pathname)
  const navRef = useRef<HTMLElement>(null)

  // UX10 (2026-07-27): annat fixerat innehåll måste veta att navet finns, annars
  // lägger det sig ovanpå. Cookiebannern gjorde exakt det och blockerade alla fem
  // hubbar vid första besöket. Variabeln sätts bara när navet är monterat — på
  // publika sidor (login/registrering) är den 0, så bannern ligger kvar där den låg.
  //
  // MB2 (2026-09-08): värdet MÄTS nu i stället för att gissas. `'64px'` stod
  // hårdkodat medan navet mätte 65 i prod (kantlinjen), och `pb-safe` var en
  // klass som inte finns i Tailwind 4 — på en telefon med hemindikator hade
  // navet alltså ingen safe-area alls, och ingen konsument av variabeln
  // (CookieConsent, CV-byggarens knapprad, scroll-padding i tokens.css) kunde
  // veta det. ResizeObserver fångar också fokusläget: `[data-focus-chrome]`
  // sätter display:none på navets wrapper, höjden blir 0, och ingen plats
  // reserveras för ett nav som inte syns.
  useEffect(() => {
    const root = document.documentElement
    const nav = navRef.current
    const matt = () => {
      const h = nav ? nav.getBoundingClientRect().height : 0
      root.style.setProperty('--bottom-nav-h', `${Math.round(h)}px`)
    }
    matt()
    const ro = nav && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(matt) : null
    if (ro && nav) ro.observe(nav)
    return () => {
      ro?.disconnect()
      root.style.removeProperty('--bottom-nav-h')
    }
  }, [])

  return (
    <nav
      ref={navRef}
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
        // Inte `pb-safe` — den klassen finns inte i Tailwind 4 (kontrollerat i
        // prod-CSS:en 2026-09-08) och gav därför ingen safe-area. Layout.tsx
        // reserverar `5rem + env(safe-area-inset-bottom)` under innehållet
        // på samma antagande, så de två hänger ihop.
        'pb-[env(safe-area-inset-bottom)]'
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
