/**
 * PageFocusShell — gemensam fokus-shell för per-sida wizards.
 *
 * SYFTE (NPF-anpassat):
 * Fokusläget är till för användare med neuropsykiatriska
 * funktionsvariationer (ADHD, autism m.fl.) som behöver göra saker
 * EN SAK I TAGET, MYCKET TYDLIGT. Detta är inte ett "stilval" — det
 * är ett tillgänglighetskrav. Allt som distraherar är fel.
 *
 * KONTRAKT FÖR PER-SIDA WIZARDS som använder denna shell:
 *   1. EN fråga eller ETT val per skärm. Aldrig två.
 *   2. Tydlig progress: "Steg X av N" + progress-bar överst.
 *   3. Stort, enkelt språk. Inga tekniska termer eller jargong.
 *   4. EN primär CTA per skärm (Nästa / Klar) + Tillbaka + Hoppa över.
 *   5. 48px min touch-targets (CSS-regel i index.css).
 *   6. Inga sidofält, staplade kort, eller parallella val-spår.
 *   7. Ingen animation/rörelse (CSS-regel i index.css).
 *   8. Spara automatiskt vid varje "Nästa" så användaren aldrig
 *      tappar arbete om de avbryter.
 *   9. Användaren ska aldrig se mer än en sak att tänka på samtidigt.
 *
 * Shell:n tar hand om:
 *   - Hub-färgad header med ikon, titel, "Avsluta fokus"-knapp
 *   - Centrerad, smal innehållskolumn (max-w-2xl)
 *   - Hub-färg via data-domain → tokens.css → --c-*
 *
 * Per-sida wizard renderar sina egna steg innanför shell — inkl. progress,
 * input-fält, knappar. Återanvändbara step-komponenter finns i
 * ../steps/Focus*.tsx (FocusWelcome, FocusProfile, FocusCV, FocusJobSearch,
 * FocusCoverLetter, FocusComplete).
 *
 * Användning (i en sida):
 *
 *   const { isFocusMode, toggleFocusMode } = useFocusMode()
 *   if (isFocusMode) {
 *     return (
 *       <PageFocusShell title="Personligt brev" icon={Mail} domain="activity">
 *         <FocusCoverLetter onComplete={toggleFocusMode} ... />
 *       </PageFocusShell>
 *     )
 *   }
 *   // normalvy nedan — orörd
 *
 * DESIGN.md-respekt:
 *   - Hub-färg via prop `domain` (sätter data-domain → tokens.css → --c-*)
 *   - Inga gradients
 *   - Lugn vy: ingen sidebar/topbar-extras (CSS i index.css hanterar det)
 */

import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from '@/components/ui/icons'
import type { LucideIcon } from 'lucide-react'
import type { ColorDomain } from '@/components/layout/PageLayout'
import { useFocusMode } from '@/components/FocusModeProvider'
import { cn } from '@/lib/utils'

interface PageFocusShellProps {
  title: string
  icon?: LucideIcon
  domain?: ColorDomain
  children: ReactNode
  /** Visa "Avsluta fokus"-knapp i headern. Default true. */
  showExit?: boolean
  /** Override exit-handler. Default: toggleFocusMode(). */
  onExit?: () => void
  className?: string
}

export function PageFocusShell({
  title,
  icon: Icon,
  domain,
  children,
  showExit = true,
  onExit,
  className,
}: PageFocusShellProps) {
  const { t } = useTranslation()
  const { toggleFocusMode } = useFocusMode()

  const handleExit = onExit ?? toggleFocusMode

  return (
    <div
      data-domain={domain}
      className={cn(
        'min-h-[calc(100vh-120px)] flex flex-col',
        className
      )}
    >
      {/* Header — hub-färgad accent + exit */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700/50 px-4 py-3 mb-6 -mx-4 sm:mx-0 sm:rounded-t-2xl sm:border-l-[4px] sm:border-l-[var(--c-solid)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 flex items-center justify-center flex-shrink-0"
              >
                <Icon className="w-5 h-5 text-[var(--c-solid)]" />
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-semibold text-stone-800 dark:text-stone-100 truncate">
              {title}
            </h1>
          </div>

          {showExit && (
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex-shrink-0"
              aria-label={t('focus.exit', 'Avsluta fokusläge')}
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{t('focus.exit', 'Avsluta fokusläge')}</span>
            </button>
          )}
        </div>
      </header>

      {/* Content — smalt, centrerat */}
      <div className="flex-1 px-4">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default PageFocusShell
