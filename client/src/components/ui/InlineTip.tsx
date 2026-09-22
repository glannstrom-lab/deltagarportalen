/**
 * InlineTip — kort förklaringsruta som ersätter modaler för micro-onboarding.
 *
 * KONTRAKT (DESIGN.md §12):
 *   - Visas inline på sidan, inte som modal
 *   - Dismissable (kryss i hörnet) men kommer ALDRIG tillbaka för samma key
 *   - Ingen scroll-lock, ingen backdrop, blockerar inte UI
 *   - Använder hub-färgen via --c-* tokens
 *   - Max 2 meningar text
 *
 * ANVÄND ISTÄLLET FÖR:
 *   - Sido-specifika onboarding-modaler (CVOnboarding, AI Team-modal etc.)
 *   - "Välkommen!"-modaler som bara säger en sak
 *   - Tour-overlays som förklarar EN sak om sidan
 *
 * ANVÄND INTE ISTÄLLET FÖR:
 *   - Onboarding som kräver användarens input (använd OnboardingFlow)
 *   - Multi-step tours (omdesigna UI:t i stället, lös grundproblemet)
 *
 * EXEMPEL:
 *   <InlineTip storageKey="cv-builder-tip" icon={Lightbulb}>
 *     Klicka på en mall nedan för att börja. Du kan ändra design senare.
 *   </InlineTip>
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from '@/components/ui/icons'
import type { LucideIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface InlineTipProps {
  /**
   * Unik identifier som lagras i localStorage så tipset inte visas igen
   * efter dismiss. Format: 'feature-context-tip' (t.ex. 'cv-builder-tip').
   */
  storageKey: string

  /** Ikon till vänster om texten (default: Lightbulb-emoji). */
  icon?: LucideIcon

  /** Innehåll — max 2 meningar enligt DESIGN.md §12. */
  children: React.ReactNode

  /** Optional CTA-knapp till höger. */
  action?: {
    label: string
    onClick: () => void
  }

  className?: string
}

const STORAGE_PREFIX = 'inline-tip-dismissed:'

export function InlineTip({
  storageKey,
  icon: Icon,
  children,
  action,
  className,
}: InlineTipProps) {
  const { t } = useTranslation()

  function lasDismissed(key: string): boolean {
    try {
      return localStorage.getItem(STORAGE_PREFIX + key) === 'true'
    } catch {
      return false
    }
  }

  // Läser localStorage direkt i initieraren (körs en gång vid montering) i
  // stället för i en effekt, så komponenten inte flashar det odismissade
  // läget innan effekten hunnit köra.
  const [isDismissed, setIsDismissed] = useState(() => lasDismissed(storageKey))

  // Om storageKey byts efter montering (samma komponentinstans återanvänd för
  // ett annat tips) läses det nya lagrade läget in — härlett under render.
  const [foregaendeKey, setForegaendeKey] = useState(storageKey)
  if (storageKey !== foregaendeKey) {
    setForegaendeKey(storageKey)
    setIsDismissed(lasDismissed(storageKey))
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_PREFIX + storageKey, 'true')
    } catch {
      // localStorage may be unavailable in private mode — ignore
    }
    setIsDismissed(true)
  }

  if (isDismissed) return null

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl',
        'bg-[var(--c-bg)] border border-[var(--c-accent)]',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center" aria-hidden="true">
        {Icon ? (
          <Icon className="w-4 h-4 text-[var(--c-text)]" />
        ) : (
          <span className="text-base">💡</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--c-text)] leading-relaxed m-0">
          {children}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-[var(--c-text)] hover:text-[var(--c-solid)] transition-colors"
          >
            {action.label} →
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        aria-label={t('inlineTip.aria.close', 'Stäng tips')}
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[var(--c-text)]/60 hover:text-[var(--c-text)] hover:bg-white/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default InlineTip
