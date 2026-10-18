/**
 * Krysslistan: deltagaren väljer vilka faktorer som räknas i matchningen
 * (beslut Mikael 2026-10-18). En faktor utan data går inte att kryssa i — den
 * visas med vad som saknas och var det fylls i, i stället för att försvinna.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { UNDERLAG, VILLKOR, harData, type Faktor, type MatchUnderlag } from '@/services/matchning'

/** Var data för en faktor fylls i. */
const KALLA: Record<Faktor, string> = {
  onskadeYrken: '/profile', tidigareYrken: '/cv', intresseguiden: '/interest-guide', kompetenser: '/cv',
  utbildning: '/cv', legitimation: '/cv', besvar: '/interest-guide', bransch: '/profile',
  anstallningsform: '/profile', distans: '/profile', korkort: '/profile',
}

export function FaktorPanel({ underlag, av, onVaxla, sparFel }: {
  underlag: MatchUnderlag
  av: ReadonlySet<Faktor>
  onVaxla: (f: Faktor) => void
  sparFel: boolean
}) {
  const { t } = useTranslation()
  const grupp = (rubrik: string, faktorer: Faktor[]) => (
    <fieldset className="m-0 p-0 border-0 min-w-0">
      <legend className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2">{rubrik}</legend>
      <ul className="m-0 p-0 list-none grid gap-2 sm:grid-cols-2">
        {faktorer.map((f) => {
          const finns = harData(underlag, f)
          const id = `faktor-${f}`
          return (
            <li key={f} className="flex items-start gap-2 min-w-0">
              <input id={id} type="checkbox" className="mt-1 w-4 h-4 shrink-0" checked={finns && !av.has(f)} disabled={!finns} onChange={() => onVaxla(f)} />
              <label htmlFor={id} className={finns ? 'text-sm text-stone-800 dark:text-stone-200' : 'text-sm text-stone-500 dark:text-stone-400'}>
                {t(`jobs.matches.faktor.${f}.namn`)}
                <span className="block text-xs text-stone-600 dark:text-stone-400">
                  {finns ? t(`jobs.matches.faktor.${f}.hjalp`) : (
                    <>
                      {t(`jobs.matches.faktor.${f}.saknas`)}{' '}
                      <Link to={KALLA[f]} className="underline underline-offset-2">{t('jobs.matches.faktor.fyllI')}</Link>
                    </>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
  return (
    <div className="space-y-4" data-testid="faktorpanel">
      {grupp(t('jobs.matches.faktor.underlagRubrik'), UNDERLAG)}
      {grupp(t('jobs.matches.faktor.villkorRubrik'), VILLKOR)}
      <p className="m-0 text-xs text-stone-600 dark:text-stone-400">{t('jobs.matches.faktor.pendling')}</p>
      {sparFel && <p role="alert" className="m-0 text-xs text-red-700 dark:text-red-300">{t('jobs.matches.faktor.sparFel')}</p>}
    </div>
  )
}
