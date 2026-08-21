/**
 * Inmatningsläget: underlaget, drömjobbet, knappen.
 *
 * Tre saker rättades här 2026-08-21:
 *
 * · **Ett nätverksfel såg ut som "du har inget CV".** Fyra tysta `.catch()`
 *   i laddningen gjorde ett avbrott identiskt med tom data, och sidan bad då
 *   någon med fullständigt CV att gå och fylla i det. De två lägena är nu
 *   åtskilda och det ena har en Försök igen-knapp.
 *
 * · **Tröskeln var ett teckenantal.** `profileSummary.length > 50` släppte
 *   igenom ett CV med bara namn och titel, och stoppade ett med tre
 *   kompetenser — utan att i något av fallen säga VAD som saknades.
 *
 * · **Den utgråade knappen gav ingen anledning.** Utgråade knappar utan
 *   förklaring är en känd fälla för kognitiv tillgänglighet. Knappen är
 *   aktiv och pekar ut vad som fattas via `aria-describedby`.
 */
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Search, CheckCircle, Sparkles, User, FileText, AlertCircle, Heart, History, RefreshCw
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import type { SkillsAnalysis, FavoriteOccupation } from '@/services/careerApi'
import type { Profiltackning } from './profilunderlag'
import { forhandsvisning, kortDromjobb } from './dromjobb'
import type { Felsort } from './useSkillsGap'

interface Props {
  profileSummary: string
  tackning: Profiltackning | null
  laddningsfel: 'cv' | 'analyser' | 'bada' | null
  dreamJob: string
  setDreamJob: (v: string) => void
  previousAnalyses: SkillsAnalysis[]
  favoriteOccupations: FavoriteOccupation[]
  analysisError: Felsort | null
  isAnalyzing: boolean
  dateLocale: string
  onAnalyze: () => void
  onSelect: (a: SkillsAnalysis) => void
  onReload: () => void
}

export function SkillsGapForm({
  profileSummary, tackning, laddningsfel, dreamJob, setDreamJob,
  previousAnalyses, favoriteOccupations, analysisError, isAnalyzing,
  dateLocale, onAnalyze, onSelect, onReload,
}: Props) {
  const { t } = useTranslation()
  const dromjobbRef = useRef<HTMLTextAreaElement>(null)
  const underlagRef = useRef<HTMLDivElement>(null)

  const cvFel = laddningsfel === 'cv' || laddningsfel === 'bada'
  const underlagRacker = !!tackning?.racker
  const saknasText = (tackning?.saknas ?? [])
    .map(del => t(`skillsGapAnalysis.missing.${del}`))
    .join(', ')

  const hinder = !underlagRacker
    ? t('skillsGapAnalysis.blockedByProfile', { delar: saknasText })
    : !dreamJob.trim()
      ? t('skillsGapAnalysis.blockedByDreamJob')
      : null

  /**
   * Knappen är AKTIV även när något fattas, och klicket tar användaren till
   * det som fattas. Den låg tidigare utgråad och `analyze()` returnerade
   * dessutom tyst — alltså två lager tystnad ovanpå varandra: ingen
   * anledning angavs, och den som ändå klickade fick ingenting att hända.
   */
  const klick = () => {
    if (!underlagRacker) {
      underlagRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!dreamJob.trim()) {
      dromjobbRef.current?.focus()
      return
    }
    onAnalyze()
  }

  return (
    <>
      {/* Tidigare analyser */}
      {previousAnalyses.length > 0 && (
        <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <History className="w-4 h-4" aria-hidden="true" />
              {t('skillsGapAnalysis.previousAnalyses')}
            </h2>
            <span className="text-sm text-stone-600 dark:text-stone-400">
              {t('skillsGapAnalysis.savedCount', { antal: previousAnalyses.length })}
            </span>
          </div>
          <ul className="space-y-2 list-none p-0 m-0">
            {previousAnalyses.slice(0, 3).map(analysis => (
              <li key={analysis.id}>
                <button
                  onClick={() => onSelect(analysis)}
                  className="w-full text-left p-3 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] transition-colors"
                >
                  <span className="block font-medium text-stone-800 dark:text-stone-100">
                    {kortDromjobb(analysis.dream_job) || forhandsvisning(analysis.dream_job)}
                  </span>
                  <span className="block text-xs text-stone-600 dark:text-stone-400">
                    {new Date(analysis.created_at).toLocaleDateString(dateLocale)}
                    {' · '}
                    {t('skillsGapAnalysis.historySkills', { antal: (analysis.skills_comparison || []).length })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Underlaget */}
      <Card className="p-4 sm:p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div ref={underlagRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-stone-800 dark:text-stone-100">
                {t('skillsGapAnalysis.yourCurrentProfile')}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {t('skillsGapAnalysis.fetchedFromCVAndProfile')}
              </p>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-2 sm:flex-shrink-0">
            <Link to="/profile" className="text-sm text-[var(--c-text)] dark:text-stone-200 underline flex items-center gap-1">
              <User className="w-4 h-4" aria-hidden="true" />
              {t('skillsGapAnalysis.profileLink')}
            </Link>
            <Link to="/cv" className="text-sm text-[var(--c-text)] dark:text-stone-200 underline flex items-center gap-1">
              <FileText className="w-4 h-4" aria-hidden="true" />
              CV
            </Link>
          </div>
        </div>

        {cvFel ? (
          /* Ett avbrott är inte tomhet. Den som har ett CV ska inte få
             beskedet att gå och skriva ett. */
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-stone-50 dark:bg-stone-700" role="alert">
            <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-stone-800 dark:text-stone-100 flex-1">
              {t('skillsGapAnalysis.loadFailed')}
            </p>
            <Button variant="outline" onClick={onReload} className="sm:flex-shrink-0">
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('common.tryAgain')}
            </Button>
          </div>
        ) : underlagRacker ? (
          <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4 max-h-48 overflow-y-auto">
            <pre className="text-sm text-stone-700 dark:text-stone-200 whitespace-pre-wrap font-sans">
              {profileSummary}
            </pre>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title={t('skillsGapAnalysis.needMoreInfoTitle')}
            description={t('skillsGapAnalysis.needMoreInfoBody', { delar: saknasText })}
            action={{ label: t('skillsGapAnalysis.goToCV'), onClick: () => { window.location.hash = '#/cv' } }}
            compact
          />
        )}
      </Card>

      <RadgivarTips pathname="/skills-gap-analysis" index={0} />

      {/* Drömjobbet */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--c-solid)] flex items-center justify-center flex-shrink-0">
            {/* Vit text/ikon på `--c-solid` faller till 2,0:1 i mörkt läge —
                `.dark` sätter coaching-solid till en ljus rosa (#E8A4AE). */}
            <Search className="w-5 h-5 text-white dark:text-stone-900" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('skillsGapAnalysis.dreamJob.title')}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('skillsGapAnalysis.dreamJobDescription')}
            </p>
          </div>
        </div>

        {favoriteOccupations.length > 0 && !dreamJob && (
          <div className="mb-4 p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/25 rounded-lg border border-[var(--c-accent)]">
            <div className="flex items-center gap-2 text-sm text-[var(--c-text)] dark:text-stone-200 mb-2">
              <Heart className="w-4 h-4" aria-hidden="true" />
              {t('skillsGapAnalysis.favoriteOccupations')}
            </div>
            <div className="flex flex-wrap gap-2">
              {favoriteOccupations.slice(0, 5).map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => setDreamJob(fav.occupation_title)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-stone-700 rounded-full border border-[var(--c-accent)] text-[var(--c-text)] dark:text-stone-200 hover:bg-[var(--c-bg)] dark:hover:bg-stone-600 transition-colors"
                >
                  {fav.occupation_title}
                </button>
              ))}
            </div>
          </div>
        )}

        <label
          htmlFor="skillsgap-dreamjob"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
        >
          {t('skillsGapAnalysis.dreamJob.label')}
        </label>
        <textarea
          id="skillsgap-dreamjob"
          ref={dromjobbRef}
          value={dreamJob}
          onChange={(e) => setDreamJob(e.target.value)}
          placeholder={t('skillsGapAnalysis.dreamJob.placeholder')}
          rows={6}
          aria-describedby="skillsgap-dreamjob-tips"
          className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none resize-y bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
        />
        <p id="skillsgap-dreamjob-tips" className="text-xs text-stone-600 dark:text-stone-400 mt-2">
          {t('skillsGapAnalysis.dreamJob.tip')}
        </p>
      </Card>

      {/* Fel från analysen — olika fel kräver olika väg framåt */}
      {analysisError && (
        <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-stone-800 dark:text-stone-100">
                {t(`skillsGapAnalysis.error.${analysisError}`)}
              </p>
              {analysisError === 'ai-avstangd' && (
                <Link to="/profile?tab=integritet" className="text-sm text-[var(--c-text)] dark:text-stone-200 underline mt-1 inline-block">
                  {t('skillsGapAnalysis.error.aiSettingsLink')}
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col items-center gap-2">
        <Button
          onClick={klick}
          disabled={isAnalyzing}
          isLoading={isAnalyzing}
          loadingText={t('skillsGapAnalysis.analyzing')}
          aria-describedby={hinder ? 'skillsgap-hinder' : undefined}
          className="px-8 py-4 text-lg bg-[var(--c-solid)] hover:brightness-110 text-white dark:text-stone-900"
        >
          <Sparkles className="w-6 h-6 mr-2" aria-hidden="true" />
          {t('skillsGapAnalysis.analyzeGap')}
        </Button>
        {hinder && (
          <p id="skillsgap-hinder" className="text-sm text-stone-700 dark:text-stone-300 text-center">
            {hinder}
          </p>
        )}
      </div>
    </>
  )
}
