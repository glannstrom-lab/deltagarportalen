/**
 * FocusJobSearchWizard — NPF-anpassad jobbsökning steg-för-steg.
 *
 * Steg: vad letar du efter? → var? → resultat (sparas senare i normalvyn).
 * Använder searchJobs från befintliga arbetsformedlingenApi — ingen ny endpoint.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, ListChecks, Briefcase, ExternalLink, Loader2, Heart } from '@/components/ui/icons'
import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { cn } from '@/lib/utils'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusJobSearchWizard({ onExit }: Props) {
  const { t } = useTranslation()
  // Spara-möjlighet även i fokusläget — tidigare enda jobbvyn utan den,
  // vilket drabbade just de användare som fokusläget finns för.
  const { saveJob, removeJob, isSaved } = useSavedJobs()

  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [results, setResults] = useState<PlatsbankenJob[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'query',
      icon: Search,
      title: t('focus.jobSearch.queryTitle', 'Vilket jobb letar du efter?'),
      hint: t('focus.jobSearch.queryHint', 'Skriv en yrkesroll eller en bransch.'),
    },
    {
      id: 'city',
      icon: MapPin,
      title: t('focus.jobSearch.cityTitle', 'Var vill du jobba?'),
      hint: t('focus.jobSearch.cityHint', 'Skriv en stad eller lämna tomt för hela Sverige.'),
    },
    {
      id: 'results',
      icon: ListChecks,
      title: t('focus.jobSearch.resultsTitle', 'Här är jobben vi hittade'),
    },
  ] as const

  const current = STEPS[step]

  const runSearch = async () => {
    setSearching(true)
    setError(null)
    try {
      const res = await searchJobs({ query: query.trim() || undefined, municipality: city.trim() || undefined, limit: 10 })
      setResults(res.hits ?? [])
    } catch (err) {
      console.error('Job search failed', err)
      setError(t('focus.jobSearch.searchError', 'Något gick fel. Prova igen.'))
    } finally {
      setSearching(false)
    }
  }

  const handleNext = async () => {
    if (current.id === 'query') {
      setStep(1)
      return
    }
    if (current.id === 'city') {
      await runSearch()
      setStep(2)
      return
    }
    onExit()
  }

  const canNext = current.id === 'query' ? query.trim().length > 0 : true

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={canNext}
      busy={searching}
    >
      {current.id === 'query' && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('focus.jobSearch.queryPlaceholder', 't.ex. lärare, lager, kock')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'city' && (
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('focus.jobSearch.cityPlaceholder', 't.ex. Stockholm, Göteborg')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'results' && (
        <div className="space-y-3">
          {searching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--c-solid)]" />
            </div>
          )}
          {!searching && error && (
            <p className="text-stone-600 dark:text-stone-300">{error}</p>
          )}
          {!searching && !error && results.length === 0 && (
            <p className="text-stone-600 dark:text-stone-300">
              {t('focus.jobSearch.noResults', 'Inga jobb hittades. Prova en annan sökning.')}
            </p>
          )}
          {!searching && results.map((job) => (
            <div
              key={job.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900"
            >
              <a
                href={`https://arbetsformedlingen.se/platsbanken/annonser/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 min-w-0 flex-1 rounded-lg hover:bg-[var(--c-accent)]/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--c-accent)]/40 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-[var(--c-solid)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-800 dark:text-stone-100 truncate">
                    {job.headline}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                    {job.employer?.name ?? ''}
                    {job.workplace_address?.municipality
                      ? ` · ${job.workplace_address.municipality}`
                      : ''}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-stone-400 flex-shrink-0 mt-1" />
              </a>
              <button
                type="button"
                onClick={() => (isSaved(job.id) ? removeJob(job.id) : saveJob(job))}
                aria-pressed={isSaved(job.id)}
                aria-label={
                  isSaved(job.id)
                    ? t('focus.jobSearch.unsaveJob', 'Ta bort från sparade jobb')
                    : t('focus.jobSearch.saveJob', 'Spara jobb')
                }
                className={cn(
                  'p-2 rounded-lg transition-colors flex-shrink-0',
                  isSaved(job.id)
                    ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                )}
              >
                <Heart className={cn('w-5 h-5', isSaved(job.id) && 'fill-current')} />
              </button>
            </div>
          ))}
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusJobSearchWizard
