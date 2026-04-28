/**
 * FocusComplete - Gratulationsskärm när guiden är klar
 */

import { useTranslation } from 'react-i18next'
import { PartyPopper, RefreshCw, Home, ArrowRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FocusCompleteProps {
  onExit: () => void
  onRestart: () => void
}

export function FocusComplete({ onExit, onRestart }: FocusCompleteProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Celebration icon */}
      <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <PartyPopper className="w-12 h-12 text-white" />
      </div>

      {/* Congratulations */}
      <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
        {t('focusGuide.complete.title', 'Fantastiskt jobbat!')}
      </h1>

      <p className="text-lg text-stone-600 dark:text-stone-300 mb-6 max-w-md">
        {t('focusGuide.complete.message', 'Du har gått igenom alla steg i fokusläget. Nu är du redo att fortsätta din jobbsökning!')}
      </p>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-[var(--c-bg)] to-sky-50 dark:from-[var(--c-bg)]/30 dark:to-sky-900/20 rounded-2xl p-6 mb-8 max-w-md w-full border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50/50">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
          {t('focusGuide.complete.whatYouDid', 'Det här har du gjort:')}
        </h2>
        <ul className="space-y-3 text-left">
          <CompletedItem
            emoji="👤"
            text={t('focusGuide.complete.profile', 'Fyllt i din profil')}
          />
          <CompletedItem
            emoji="📄"
            text={t('focusGuide.complete.cv', 'Skapat ditt CV')}
          />
          <CompletedItem
            emoji="🔍"
            text={t('focusGuide.complete.jobs', 'Utforskat jobb')}
          />
          <CompletedItem
            emoji="✉️"
            text={t('focusGuide.complete.letter', 'Skrivit personligt brev')}
          />
        </ul>
      </div>

      {/* Next steps hint */}
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 max-w-sm">
        {t('focusGuide.complete.nextSteps', 'Du kan alltid komma tillbaka till fokusläget genom att klicka på fokusikonen i menyn.')}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onExit}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg transition-all',
            'bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-solid)]/30'
          )}
        >
          <Home className="w-5 h-5" />
          {t('focusGuide.complete.goToDashboard', 'Till startsidan')}
        </button>

        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('focusGuide.complete.restart', 'Gå igenom guiden igen')}
        </button>
      </div>
    </div>
  )
}

function CompletedItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="w-8 h-8 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center shadow-sm"
        role="img"
        aria-hidden="true"
      >
        {emoji}
      </span>
      <span className="text-stone-700 dark:text-stone-300">{text}</span>
    </li>
  )
}
