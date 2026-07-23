/**
 * CoachWidget — sidkontextuell coach-FAB
 *
 * Visas längst ner till höger på sidor som har coach-innehåll i `coaches.ts`.
 * Stängs/öppnas via toggle i Settings (profilen preferences.ui.showCoachWidget).
 *
 * När stängd: en stack av coach-avatarer (1-3 st) som "tittar fram" från
 * cirkeln. Klick → expanderar till panel med tabs per coach + tips/FAQ-länkar.
 */

import { useEffect, useId, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { X, ChevronDown, ChevronUp, MessageCircle, Lightbulb, ExternalLink } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useHideOnScrollDown } from '@/hooks/useHideOnScrollDown'
import {
  COACHES,
  getCoachContentForPage,
  type CoachId,
  type PageCoachContent,
} from '@/data/coaches'

interface CoachWidgetProps {
  /**
   * Nyckel som matchar `PAGE_COACH_CONTENT[pageKey]` i `coaches.ts`.
   * Om innehåll saknas eller pageKey är undefined renderar widgeten inget.
   */
  pageKey: string | undefined
}

export function CoachWidget({ pageKey }: CoachWidgetProps) {
  const content = getCoachContentForPage(pageKey)
  const [isOpen, setIsOpen] = useState(false)
  const [activeCoach, setActiveCoach] = useState<CoachId | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // Initiera activeCoach när content laddas
  useEffect(() => {
    if (content && content.coachIds.length > 0 && !activeCoach) {
      setActiveCoach(content.coachIds[0])
    }
    if (!content) {
      setIsOpen(false)
      setActiveCoach(null)
    }
  }, [content, activeCoach])

  // Escape-key för stängning
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Focus management (öppna → close-btn, stäng → restore)
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      closeBtnRef.current?.focus()
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  // Reset FAQ-expansion vid coach-byte
  useEffect(() => {
    setExpandedFaq(null)
  }, [activeCoach])

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

  if (!content) return null

  return (
    <>
      {/* Floating launcher — stack of coach avatars */}
      {!isOpen && (
        <CoachLauncher content={content} onOpen={() => setIsOpen(true)} />
      )}

      {/* Modal panel */}
      {isOpen && activeCoach && (
        <CoachPanel
          content={content}
          activeCoach={activeCoach}
          onSelectCoach={setActiveCoach}
          onClose={() => setIsOpen(false)}
          expandedFaq={expandedFaq}
          setExpandedFaq={setExpandedFaq}
          panelRef={panelRef}
          closeBtnRef={closeBtnRef}
          titleId={titleId}
          onKeyDown={handleTabKey}
        />
      )}
    </>
  )
}

// ===========================================================================
// LAUNCHER — stapel av avatarer som knappar
// ===========================================================================

function CoachLauncher({
  content,
  onOpen,
}: {
  content: PageCoachContent
  onOpen: () => void
}) {
  const coaches = content.coachIds.slice(0, 3).map((id) => COACHES[id])
  const hiddenOnScroll = useHideOnScrollDown()

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Öppna coachtips${coaches.length > 1 ? ` från ${coaches.length} coacher` : ''}`}
      className={cn(
        'group fixed z-40 bottom-20 sm:bottom-6 right-4 sm:right-6',
        // Ikon-only (avatarstack) på mobil, etikett-pill på desktop
        'flex items-center gap-0 sm:gap-2 p-1.5 sm:pl-1.5 sm:pr-3',
        'rounded-full bg-white dark:bg-stone-800 shadow-lg hover:shadow-xl',
        'border border-stone-200 dark:border-stone-700',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        // Dölj vid scroll nedåt (endast mobil) så knappen inte täcker innehåll
        hiddenOnScroll ? 'translate-y-[220%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
        'sm:translate-y-0 sm:opacity-100 sm:pointer-events-auto',
      )}
    >
      <div className="flex -space-x-3">
        {coaches.map((c) => (
          <img
            key={c.id}
            src={c.avatarSm}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-stone-800 object-cover"
          />
        ))}
      </div>
      <span className="hidden sm:inline text-sm font-medium text-stone-700 dark:text-stone-200 pr-1">
        Tips
      </span>
    </button>
  )
}

// ===========================================================================
// PANEL — full vy med coach-tabs
// ===========================================================================

function CoachPanel({
  content,
  activeCoach,
  onSelectCoach,
  onClose,
  expandedFaq,
  setExpandedFaq,
  panelRef,
  closeBtnRef,
  titleId,
  onKeyDown,
}: {
  content: PageCoachContent
  activeCoach: CoachId
  onSelectCoach: (id: CoachId) => void
  onClose: () => void
  expandedFaq: number | null
  setExpandedFaq: (n: number | null) => void
  panelRef: React.RefObject<HTMLDivElement>
  closeBtnRef: React.RefObject<HTMLButtonElement>
  titleId: string
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const { t } = useTranslation()
  const coach = COACHES[activeCoach]
  const coachContent = content.byCoach[activeCoach]

  if (!coachContent) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('coachWidget.aria.closeTips', 'Stäng coachtips')}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm cursor-default"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        data-domain={coach.accent}
        className={cn(
          'relative w-full sm:w-[420px] max-h-[85vh] flex flex-col',
          'bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 fade-in duration-200',
        )}
      >
        {/* Header med vald coach */}
        <div
          className="px-5 py-4 flex items-start gap-3 border-b border-stone-100 dark:border-stone-800"
          style={{ background: 'var(--c-bg)' }}
        >
          <img
            src={coach.avatar}
            alt=""
            aria-hidden="true"
            className="w-14 h-14 rounded-full ring-2 ring-white object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide font-semibold text-stone-500">
              {coach.role}
            </div>
            <h2 id={titleId} className="text-base font-semibold text-stone-900 dark:text-stone-100 truncate">
              {coach.name}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 truncate">{coach.tagline}</p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.close', 'Stäng')}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4 text-stone-600 dark:text-stone-300" aria-hidden="true" />
          </button>
        </div>

        {/* Coach-tabs (om flera) */}
        {content.coachIds.length > 1 && (
          <div className="flex gap-1 px-3 pt-3 border-b border-stone-100 dark:border-stone-800 -mb-px overflow-x-auto">
            {content.coachIds.map((id) => {
              const c = COACHES[id]
              const isActive = id === activeCoach
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectCoach(id)}
                  aria-pressed={isActive}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition-colors flex-shrink-0',
                    isActive
                      ? 'border-[var(--c-solid)] text-stone-900 dark:text-stone-100'
                      : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
                  )}
                >
                  <img
                    src={c.avatarSm}
                    alt=""
                    aria-hidden="true"
                    className={cn(
                      'w-6 h-6 rounded-full object-cover',
                      !isActive && 'opacity-70 grayscale',
                    )}
                  />
                  {c.role}
                </button>
              )
            })}
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Tips */}
          {coachContent.tips.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold mb-2 text-sm">
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--c-solid)' }} aria-hidden="true" />
                Tips från {coach.name}
              </div>
              <ul className="space-y-2">
                {coachContent.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed flex gap-2"
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--c-solid)' }}
                      aria-hidden="true"
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FAQs */}
          {coachContent.faqs && coachContent.faqs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold mb-2 text-sm">
                <MessageCircle className="w-4 h-4" style={{ color: 'var(--c-solid)' }} aria-hidden="true" />
                Vanliga frågor
              </div>
              <div className="space-y-1.5">
                {coachContent.faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      aria-expanded={expandedFaq === i}
                      className={cn(
                        'w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-sm',
                        'hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors',
                        expandedFaq === i && 'bg-stone-50 dark:bg-stone-800/50',
                      )}
                    >
                      <span className="font-medium text-stone-800 dark:text-stone-200">{faq.question}</span>
                      {expandedFaq === i ? (
                        <ChevronUp className="w-4 h-4 text-stone-500 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0" aria-hidden="true" />
                      )}
                    </button>
                    {expandedFaq === i && (
                      <div className="px-3 pb-3 pt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Länkar */}
          {coachContent.links && coachContent.links.length > 0 && (
            <section>
              <div className="text-xs uppercase tracking-wide font-semibold text-stone-500 dark:text-stone-400 mb-2">
                Gå vidare
              </div>
              <div className="space-y-1.5">
                {coachContent.links.map((link, i) => {
                  const isExternal = link.href.startsWith('http')
                  const Comp = isExternal
                    ? ('a' as const)
                    : (Link as unknown as 'a')
                  const linkProps = isExternal
                    ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
                    : ({ to: link.href } as Record<string, unknown>)
                  return (
                    <Comp
                      key={i}
                      {...(linkProps as Record<string, string>)}
                      className={cn(
                        'flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
                        'text-sm font-medium text-stone-800 dark:text-stone-200',
                        'bg-stone-50 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800',
                        'transition-colors',
                      )}
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" aria-hidden="true" />
                    </Comp>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center">
            Coachtipsen kan slås av i Inställningar.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CoachWidget
