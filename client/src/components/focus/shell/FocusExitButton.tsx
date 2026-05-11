/**
 * FocusExitButton — floating "Avsluta fokus"-knapp.
 *
 * Visas BARA när focus-mode är aktivt, fixed top-right på alla sidor.
 * Komplement till TopBar-toggle och Settings-switchen — säkerställer
 * att användaren aldrig fastnar i fokusläget. Mountas i App.tsx på
 * samma nivå som FocusModeProvider.
 */

import { useTranslation } from 'react-i18next'
import { X } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'

export function FocusExitButton() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (!isFocusMode) return null

  return (
    <button
      onClick={toggleFocusMode}
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[60] flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-full shadow-lg hover:bg-stone-50 dark:hover:bg-stone-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-solid)]/30"
      aria-label={t('focus.exit', 'Avsluta fokusläge')}
      title={t('focus.exit', 'Avsluta fokusläge')}
    >
      <X className="w-4 h-4" aria-hidden="true" />
      <span className="text-sm font-medium">{t('focus.exit', 'Avsluta fokusläge')}</span>
    </button>
  )
}

export default FocusExitButton
