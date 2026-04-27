/**
 * FocusWelcome - Välkomstskärm för fokusläget
 */

import { useTranslation } from 'react-i18next'
import { Heart, ArrowRight, X } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FocusWelcomeProps {
  firstName: string
  onStart: () => void
  onExit: () => void
}

export function FocusWelcome({ firstName, onStart, onExit }: FocusWelcomeProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Warm icon */}
      <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-8">
        <Heart className="w-10 h-10 text-teal-500" />
      </div>

      {/* Greeting */}
      <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
        {firstName
          ? t('focusGuide.welcome.titleWithName', 'Hej {{name}}!', { name: firstName })
          : t('focusGuide.welcome.title', 'Hej och välkommen!')
        }
      </h1>

      {/* Main message */}
      <p className="text-lg text-stone-600 dark:text-stone-300 mb-4 max-w-md">
        {t('focusGuide.welcome.message', 'Välkommen till fokusläget, där vi tar allting lite lugnare, ett steg i taget.')}
      </p>

      {/* Explanation */}
      <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-6 mb-8 max-w-md">
        <p className="text-stone-600 dark:text-stone-400 mb-4">
          {t('focusGuide.welcome.explanation', 'Här guidar vi dig genom att:')}
        </p>
        <ul className="text-left space-y-3">
          <WelcomeListItem emoji="👤" text={t('focusGuide.welcome.step1', 'Fylla i din profil')} />
          <WelcomeListItem emoji="📄" text={t('focusGuide.welcome.step2', 'Skapa ditt CV')} />
          <WelcomeListItem emoji="🔍" text={t('focusGuide.welcome.step3', 'Hitta intressanta jobb')} />
          <WelcomeListItem emoji="✉️" text={t('focusGuide.welcome.step4', 'Skriva personliga brev')} />
        </ul>
      </div>

      {/* Reassurance */}
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 max-w-sm">
        {t('focusGuide.welcome.reassurance', 'Du kan ta pauser när du vill. Allt sparas automatiskt.')}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onStart}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg transition-all',
            'bg-teal-500 text-white hover:bg-teal-600',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30'
          )}
        >
          {t('focusGuide.welcome.start', 'Sätt igång')}
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={onExit}
          className="flex items-center justify-center gap-2 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          <X className="w-4 h-4" />
          {t('focusGuide.welcome.exit', 'Nej tack, stäng fokusläget')}
        </button>
      </div>
    </div>
  )
}

function WelcomeListItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="text-xl" role="img" aria-hidden="true">{emoji}</span>
      <span className="text-stone-700 dark:text-stone-300">{text}</span>
    </li>
  )
}
