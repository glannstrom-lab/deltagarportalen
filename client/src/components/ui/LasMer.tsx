/**
 * "Läs mer" — det sällan behövda bakom ett klick (designpass 2026-10-09).
 *
 * Inbyggd <details>/<summary>: tangentbord och skärmläsarens utfällt/infällt-
 * tillstånd fungerar utan egen kod. Texten ligger kvar i DOM:en även infälld,
 * så den är sökbar med Ctrl+F och testbar.
 *
 * En komponent för hela portalen. Under passet fanns två likadana (minvecka/
 * och international/); de slogs ihop hit samma dag. min-h-11 = 44 px
 * tryckyta (WCAG 2.5.5).
 */
import { useTranslation } from 'react-i18next'
import { ChevronDown } from '@/components/ui/icons'

export function LasMer({ children, etikett, className }: { children: React.ReactNode; etikett?: string; className?: string }) {
  const { t } = useTranslation()
  return (
    <details className={`group ${className ?? 'mt-3'}`}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-[var(--c-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)] [&::-webkit-details-marker]:hidden">
        {etikett ?? t('common.lasMer', 'Läs mer')}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-1 space-y-2 text-sm text-stone-700 dark:text-stone-300">{children}</div>
    </details>
  )
}
