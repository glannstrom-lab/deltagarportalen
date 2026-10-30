/**
 * AIX7 — första steget i dag, under ett steg i handlingsplanen.
 *
 * Texten är AI-förslag och märks så. Länken till kunskapsbanken kommer ur en
 * fast karta (`forstaSteg.ts`), aldrig ur modellens svar.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from '@/components/ui/icons'
import { showToast } from '@/components/Toast'
import { artikelForForstaSteg, laggForstaStegIKalendern } from './forstaSteg'

interface Props {
  steg: string
  typ?: string
  /** Stegets rubrik i handlingsplanen — blir uppgiftens titel. */
  rubrik: string
}

export function ForstaStegRad({ steg, typ, rubrik }: Props) {
  const { t } = useTranslation()
  const [laggs, setLaggs] = useState(false)
  const [lagd, setLagd] = useState(false)
  const slug = artikelForForstaSteg(typ)

  const lagg = async () => {
    if (laggs || lagd) return
    setLaggs(true)
    try {
      await laggForstaStegIKalendern(steg, t('skillsGapAnalysis.firstStep.taskPrefix', 'Första steget') + ': ' + rubrik)
      setLagd(true)
      showToast.success(t('skillsGapAnalysis.firstStep.added', 'Lagt i din kalender för i dag.'))
    } catch (err) {
      console.error('Kompetensanalys: kunde inte lägga första steget i kalendern', err)
      showToast.error(t('skillsGapAnalysis.firstStep.failed', 'Det gick inte att lägga steget i kalendern. Försök igen.'))
    } finally {
      setLaggs(false)
    }
  }

  return (
    <div className="mt-3 p-3 rounded-lg bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/25 border border-[var(--c-accent)]">
      <p className="text-sm font-semibold text-[var(--c-text)] dark:text-stone-100">
        {t('skillsGapAnalysis.firstStep.title', 'Första steget i dag')}
      </p>
      <p className="text-sm text-stone-700 dark:text-stone-300">
        {t('skillsGapAnalysis.firstStep.meta', 'Ungefär 15 minuter. Kostar inget.')}
      </p>
      <p className="mt-1 text-stone-800 dark:text-stone-100">{steg}</p>
      <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
        {t('skillsGapAnalysis.firstStep.aiNote', 'Förslag från AI. Du bestämmer om det passar.')}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {lagd ? (
          <span className="inline-flex items-center gap-1 text-sm text-stone-800 dark:text-stone-100" role="status">
            <CheckCircle className="w-4 h-4 text-[var(--c-solid)]" aria-hidden="true" />
            {t('skillsGapAnalysis.firstStep.addedShort', 'Finns i din kalender')}
            <Link to="/calendar" className="ml-2 underline text-[var(--c-text)] dark:text-stone-200">
              {t('skillsGapAnalysis.firstStep.openCalendar', 'Öppna kalendern')}
            </Link>
          </span>
        ) : (
          <Button size="sm" variant="outline" onClick={lagg} disabled={laggs} isLoading={laggs} className="rounded-xl">
            {t('skillsGapAnalysis.firstStep.addToCalendar', 'Lägg i min kalender för i dag')}
          </Button>
        )}
        {slug && (
          <Link to={'/knowledge-base/article/' + slug} className="text-sm underline text-[var(--c-text)] dark:text-stone-200">
            {t('skillsGapAnalysis.firstStep.readMore', 'Läs mer i kunskapsbanken')}
          </Link>
        )}
      </div>
    </div>
  )
}
