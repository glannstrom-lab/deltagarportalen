/**
 * FocusWizardFrame — gemensam ram för per-sida fokus-wizards.
 *
 * NPF-kontraktet (icke-förhandlingsbart):
 *  1. EN fråga/val per skärm. Aldrig två.
 *  2. Tydlig progress: "Steg X av N" + progress-bar + steg-dots
 *  3. EN primär CTA per skärm (Nästa/Klar) + Tillbaka + Avsluta
 *  4. 48px min touch-targets (CSS i index.css)
 *  5. Ingen animation utöver progress-bar-fill (CSS säkerställer rest)
 *  6. Spara automatiskt via onNext (autosave)
 *
 * Användning i wizard:
 *
 *   const STEPS = [{id, icon, title}, ...]
 *   const [step, setStep] = useState(0)
 *
 *   return (
 *     <FocusWizardFrame
 *       steps={STEPS}
 *       current={step}
 *       onNext={async () => { ...autosave...; setStep(s => s+1) }}
 *       onBack={() => setStep(s => s - 1)}
 *       onExit={onExit}
 *       canNext={...}
 *     >
 *       {STEPS[step].id === 'foo' && <FooInput .../>}
 *       {STEPS[step].id === 'bar' && <BarInput .../>}
 *     </FocusWizardFrame>
 *   )
 */

import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, SkipForward, Loader2 } from '@/components/ui/icons'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FocusWizardStep {
  id: string
  icon: LucideIcon
  title: string
  /** Optional inline hint shown under the title. Keep short. */
  hint?: string
}

interface FocusWizardFrameProps {
  steps: ReadonlyArray<FocusWizardStep>
  current: number
  onNext: () => void | Promise<void>
  onBack?: () => void
  onExit: () => void
  /** Disable "Nästa" if validation fails on current step. */
  canNext?: boolean
  /** Show a loader inside the Next button (autosave/AI in progress). */
  busy?: boolean
  /** Override last-step CTA label (default: "Klar"). */
  finishLabel?: string
  /** Override Next CTA label (default: "Nästa"). */
  nextLabel?: string
  children: ReactNode
}

export function FocusWizardFrame({
  steps,
  current,
  onNext,
  onBack,
  onExit,
  canNext = true,
  busy = false,
  finishLabel,
  nextLabel,
  children,
}: FocusWizardFrameProps) {
  const { t } = useTranslation()
  const step = steps[current]
  const StepIcon = step.icon
  const isLast = current === steps.length - 1
  const progress = ((current + 1) / steps.length) * 100

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-stone-500 dark:text-stone-400">
            {t('focus.stepOf', 'Steg {{current}} av {{total}}', {
              current: current + 1,
              total: steps.length,
            })}
          </span>
          <span className="font-medium text-[var(--c-text)]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--c-solid)] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = i === current
            const isDone = i < current
            return (
              <div
                key={s.id}
                aria-hidden="true"
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center',
                  isActive &&
                    'bg-[var(--c-solid)] text-white ring-4 ring-[var(--c-solid)]/20',
                  isDone &&
                    'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)]',
                  !isActive && !isDone && 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Card with current step content (EN sak) */}
      <div className="bg-white dark:bg-stone-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <StepIcon className="w-6 h-6 text-[var(--c-solid)]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              {step.title}
            </h2>
            {step.hint && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {step.hint}
              </p>
            )}
          </div>
        </div>

        {children}
      </div>

      {/* Actions — EN primär CTA */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onNext()}
          disabled={!canNext || busy}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg',
            'bg-[var(--c-solid)] text-white',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-solid)]/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {busy ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('focus.saving', 'Sparar...')}
            </>
          ) : isLast ? (
            <>
              <Check className="w-5 h-5" />
              {finishLabel ?? t('focus.finish', 'Klar')}
            </>
          ) : (
            <>
              {nextLabel ?? t('focus.next', 'Nästa')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {current > 0 && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            {t('focus.back', 'Tillbaka')}
          </button>
        )}

        <button
          type="button"
          onClick={onExit}
          className="flex items-center justify-center gap-2 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
        >
          <SkipForward className="w-4 h-4" />
          {t('focus.skip', 'Hoppa över')}
        </button>
      </div>
    </div>
  )
}

export default FocusWizardFrame
