/**
 * SamlingarFab — global snabbväg till "Mina samlingar"
 *
 * Stackad ovanför CoachWidget i nedre höger hörn. Klick öppnar en panel
 * med direktlänkar till de 6 destinationerna som annars ligger djupt
 * inne i navigationen:
 *   - Mina ansökningar       /applications
 *   - Mina CV                /cv
 *   - Mina personliga brev   /cover-letter
 *   - Mina kontakter         /applications/contacts
 *   - Mina företag           /spontanansökan/mina-foretag
 *   - Mina yrken             /interest-guide/occupations
 *
 * Tonal anpassning: data-domain="info" → Resurser-huben (sky),
 * eftersom samlingarna är dokumentcentrerade. Inga gradienter,
 * inga prestationssiffror — bara genvägar.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bookmark,
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardList,
  Compass,
  FileText,
  Mail,
  Users,
  X,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

type Destination = {
  label: string
  description: string
  path: string
  icon: typeof FileText
}

const DESTINATIONS: Destination[] = [
  {
    label: 'Mina ansökningar',
    description: 'Pipeline, status och uppföljning',
    path: '/applications',
    icon: ClipboardList,
  },
  {
    label: 'Mina CV',
    description: 'Sparade CV och mallar',
    path: '/cv',
    icon: FileText,
  },
  {
    label: 'Mina personliga brev',
    description: 'Sparade brev och utkast',
    path: '/cover-letter',
    icon: Mail,
  },
  {
    label: 'Mina kontakter',
    description: 'Nätverk kopplat till ansökningar',
    path: '/applications/contacts',
    icon: Users,
  },
  {
    label: 'Mina företag',
    description: 'Sparade företag för spontanansökan',
    path: '/spontanansökan/mina-foretag',
    icon: Building2,
  },
  {
    label: 'Mina yrken',
    description: 'Sparade från Intresseguiden',
    path: '/interest-guide/occupations',
    icon: Briefcase,
  },
]

export function SamlingarFab() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const navigate = useNavigate()

  // ESC stänger
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Fokushantering: öppna → close-btn, stäng → restore
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      closeBtnRef.current?.focus()
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  const handleTabKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }, [])

  const handleNavigate = useCallback(
    (path: string) => {
      setIsOpen(false)
      navigate(path)
    },
    [navigate],
  )

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Öppna mina samlingar"
          aria-expanded={false}
          className={cn(
            'group fixed z-40',
            // Stackad ovanför CoachWidget (bottom-20 sm:bottom-6, höjd ~48px)
            'bottom-36 right-4 sm:bottom-[88px] sm:right-6',
            'flex items-center gap-2 pl-2 pr-3 py-1.5',
            'rounded-full bg-white dark:bg-stone-800 shadow-lg hover:shadow-xl',
            'border border-stone-200 dark:border-stone-700',
            'transition-all duration-200 hover:scale-105 active:scale-95',
          )}
        >
          <span
            className="flex items-center justify-center w-10 h-10 rounded-full"
            style={{ background: 'var(--info-50, #e0f2fe)' }}
          >
            <Bookmark
              className="w-5 h-5"
              style={{ color: 'var(--info-700, #0369a1)' }}
              aria-hidden="true"
            />
          </span>
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200 pr-1">
            Mina samlingar
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={handleTabKey}
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Stäng mina samlingar"
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm cursor-default"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            data-domain="info"
            className={cn(
              'relative w-full sm:w-[420px] max-h-[85vh] flex flex-col',
              'bg-white dark:bg-stone-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden',
              'animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 fade-in duration-200',
            )}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center gap-3 border-b border-stone-100 dark:border-stone-800"
              style={{ background: 'var(--c-bg)' }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                style={{ background: 'var(--info-100, #bae6fd)' }}
              >
                <Bookmark
                  className="w-5 h-5"
                  style={{ color: 'var(--info-700, #0369a1)' }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  id={titleId}
                  className="text-base font-semibold text-stone-900 dark:text-stone-100 m-0"
                >
                  Mina samlingar
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400 m-0">
                  Snabbväg till det du har sparat
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Stäng"
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/60 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-4 h-4 text-stone-600 dark:text-stone-300" aria-hidden="true" />
              </button>
            </div>

            {/* List */}
            <ul className="overflow-y-auto flex-1 p-2">
              {DESTINATIONS.map((dest) => {
                const Icon = dest.icon
                return (
                  <li key={dest.path}>
                    <Link
                      to={dest.path}
                      onClick={(e) => {
                        // Use programmatic navigate so panel-close runs first
                        e.preventDefault()
                        handleNavigate(dest.path)
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl',
                        'text-stone-800 dark:text-stone-200 no-underline',
                        'hover:bg-stone-50 dark:hover:bg-stone-800/60',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)]',
                        'transition-colors',
                      )}
                    >
                      <span
                        className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                        style={{ background: 'var(--info-50, #e0f2fe)' }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: 'var(--info-700, #0369a1)' }}
                          aria-hidden="true"
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold m-0">{dest.label}</div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 m-0 truncate">
                          {dest.description}
                        </div>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 text-stone-400 flex-shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

export default SamlingarFab
