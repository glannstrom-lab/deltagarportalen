/**
 * Resultatvyn för kompetensanalysen.
 *
 * Vad som togs bort här 2026-08-21, och varför:
 *
 * · **Procentsiffran i hjälteposition.** En 64 px cirkel i solid rosa med
 *   `{match_percentage}%` i vit fetstil, följd av en 100 %-bred progressbar
 *   med `role="progressbar"` och `aria-valuenow`. Talet är en språkmodells
 *   helhetsomdöme om en människas CV — två körningar på samma underlag gav
 *   25 respektive 22 i prod — och det stod som det första ögat föll på.
 *   "22 %" läser som ett underkänt prov för någon som varit arbetslös länge.
 *   Ersatt av ett räknat tal med definition: hur många av de kompetenser
 *   analysen tog upp som redan är på plats. Kolumnen `match_percentage` är
 *   kvar i databasen (äldre analyser bär den) men styr inget i gränssnittet.
 *
 * · **Uppmuntranrutan i amber med `AlertCircle`.** Formen sa "något är fel",
 *   texten sa "Du har en stark grund!". Och för under 60 % stod det "Det
 *   finns potential!", vilket läser som ett artigt nej.
 *
 * · **Hela jobbannonsen mitt i meningen.** `dream_job` är fritext och tar
 *   emot inklistrade annonser; strängen skrevs rakt in två gånger. Nu en
 *   kort etikett, med hela texten bakom `<details>`.
 *
 * · **Nivåerna som omdöme om personen.** "Nuvarande: 3/5" / "Mål: 5/5" /
 *   "Gap: 2 nivåer" — i rött, orange och gult. Ramen är omskriven: `target`
 *   är vad yrket brukar kräva, alltså en beskrivning av yrket.
 */
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Target, CheckCircle, BookOpen, Sparkles, Download,
  BarChart3, Award, History, Trash2, Plus, ExternalLink, AlertCircle
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import type { SkillsAnalysis } from '@/services/careerApi'
import type { Education } from '@/services/educationApi'
import { antalKlara, arLangDromjobb, forhandsvisning, kortDromjobb, sakerUrl } from './dromjobb'
import type { Utbildningslage } from './useSkillsGap'

/**
 * Skillnadens storlek som text plus en intensitet av sidans egen hubbfärg.
 *
 * De gamla klasserna var fyra främmande färgfamiljer på en rosa sida, och
 * fyra kontrastfall under AA: `text-yellow-600` på `bg-yellow-100` mätte
 * 2,74:1, grönt 3,00:1, orange 3,10:1, rött 3,97:1 mot kravet 4,5:1.
 * Färgen bar dessutom informationen ensam (SC 1.4.1) — badgetexten var
 * densamma oavsett färg. Nu bär texten den, och färgen förstärker bara.
 */
const SKILLNAD_STIL: Record<string, string> = {
  none: 'bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/30 dark:text-stone-100',
  small: 'bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/30 dark:text-stone-100',
  medium: 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-100',
  large: 'bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-50',
}

interface Props {
  analysis: SkillsAnalysis
  previousAnalyses: SkillsAnalysis[]
  showHistory: boolean
  setShowHistory: (v: boolean) => void
  utbildningar: Education[]
  utbildningslage: Utbildningslage
  matchatYrke: string | null
  isAddingToPlan: boolean
  addedToPlan: boolean
  dateLocale: string
  onDelete: (id: string) => void
  onDownload: () => void
  onAddToPlan: () => void
  onSelect: (a: SkillsAnalysis) => void
  onNew: () => void
}

export function SkillsGapResult({
  analysis, previousAnalyses, showHistory, setShowHistory,
  utbildningar, utbildningslage, matchatYrke,
  isAddingToPlan, addedToPlan, dateLocale,
  onDelete, onDownload, onAddToPlan, onSelect, onNew,
}: Props) {
  const { t } = useTranslation()
  const rubrikRef = useRef<HTMLHeadingElement>(null)

  const skills = analysis.skills_comparison || []
  const actionPlan = analysis.action_plan || []
  const etikett = kortDromjobb(analysis.dream_job)
  const klara = antalKlara(skills)

  /**
   * Fokus flyttas hit när resultatet kommer. Tidigare byttes hela trädet:
   * laddningskortet med `aria-live` AVMONTERADES i stället för att
   * uppdateras — en avmonterad live-region annonserar ingenting — och
   * fokus, som satt på "Analysera"-knappen, föll till `<body>`. Skärmläsar-
   * och tangentbordsanvändaren fick varken besked eller någon punkt att
   * fortsätta från.
   */
  useEffect(() => {
    rubrikRef.current?.focus()
  }, [analysis.id])

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <img
          src="/illustrations/success-kompetens.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-20 h-20 flex-shrink-0 select-none"
        />
        <div className="min-w-0">
          <h2
            ref={rubrikRef}
            tabIndex={-1}
            className="text-xl font-bold text-stone-800 dark:text-stone-100 outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] rounded"
          >
            {t('skillsGapAnalysis.result.heading')}
          </h2>
          <p className="text-stone-600 dark:text-stone-300 mt-1">
            {etikett
              ? t('skillsGapAnalysis.result.intro', { yrke: etikett })
              : t('skillsGapAnalysis.result.introNoTitle')}
          </p>
        </div>
      </div>

      {/* Resultathuvud */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" data-ai-generated="true">
        {/* `justify-between` utan stackningsbrytpunkt pressade textblocket
            till en ~190 px remsa på mobil. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {t('skillsGapAnalysis.result.title')}
            </h3>
            <p className="text-stone-700 dark:text-stone-300">
              {t('skillsGapAnalysis.dreamJobLabel')}: {etikett || <em className="not-italic text-stone-600 dark:text-stone-400">”{forhandsvisning(analysis.dream_job)}”</em>}
            </p>
            {arLangDromjobb(analysis.dream_job) && (
              <details className="mt-1">
                <summary className="text-sm text-[var(--c-text)] dark:text-stone-300 cursor-pointer">
                  {t('skillsGapAnalysis.result.showFullAd')}
                </summary>
                <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {analysis.dream_job}
                </p>
              </details>
            )}
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {new Date(analysis.created_at).toLocaleDateString(dateLocale)}
            </p>
          </div>

          {/* Ikonknapparna saknade tillgängligt namn — den ena raderar. */}
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <Button variant="outline" onClick={onDownload} aria-label={t('skillsGapAnalysis.result.downloadLabel')}>
              <Download className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              className="text-red-700 dark:text-red-300"
              onClick={() => onDelete(analysis.id)}
              aria-label={t('skillsGapAnalysis.result.deleteLabel')}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/25 rounded-lg border border-[var(--c-accent)]">
            <Sparkles className="w-5 h-5 text-[var(--c-solid)] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-stone-800 dark:text-stone-100">
              {t('skillsGapAnalysis.result.summary', { klara, totalt: skills.length })}
            </p>
          </div>
        )}

        {/* "Ny analys" låg tidigare INUTI handlingsplanskortet, som bara
            renderas när planen har poster. Kom det tillbaka en analys utan
            handlingsplan fanns ingen väg tillbaka till formuläret alls. */}
        <Button variant="outline" className="w-full mt-4" onClick={onNew}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('skillsGapAnalysis.newAnalysis')}
        </Button>

        <AIGeneratedWatermark contentType="analys" />
      </Card>

      {/* Kompetenserna */}
      {skills.length > 0 && (
        <Card
          className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700"
          role="region"
          aria-label={t('skillsGapAnalysis.skillsComparison')}
        >
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('skillsGapAnalysis.skillsComparison')}
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            {t('skillsGapAnalysis.skillsIntro')}
          </p>

          {/* `role="list"` utan `role="listitem"` på barnen annonseras som
              "lista, 0 objekt". Riktiga ul/li i stället. */}
          <ul className="space-y-4 list-none p-0 m-0">
            {skills.map((skill, idx) => {
              const skillnad = Math.max(0, skill.target - skill.current)
              return (
                <li key={`${skill.name}-${idx}`} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-stone-800 dark:text-stone-100">{skill.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${SKILLNAD_STIL[skill.gap] ?? SKILLNAD_STIL.medium}`}>
                      {skillnad === 0
                        ? t('skillsGapAnalysis.gapNone')
                        : t('skillsGapAnalysis.gapSteps', { antal: skillnad })}
                    </span>
                  </div>
                  {/* `justify-between` utan radbrytning lät de två texterna
                      stöta ihop på 390 px: "Ditt CV visar 1 avYrket brukar
                      kräva 5 av 5". De stackar nu tills det finns plats. */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-x-4 text-sm text-stone-700 dark:text-stone-300 mb-1">
                    <span>{t('skillsGapAnalysis.currentLevel', { niva: skill.current })}</span>
                    <span>{t('skillsGapAnalysis.roleLevel', { niva: skill.target })}</span>
                  </div>
                  {/* Stapeln visade tidigare BARA nuvarande nivå — det var
                      inte skillnaden som ritades ut, trots att kortet
                      handlade om den. Nu ligger yrkets nivå som ljus ram och
                      den egna nivån fylld inuti. Talen står i texten ovan,
                      så stapeln är dekor för skärmläsaren. */}
                  <div
                    className="h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full bg-[var(--c-accent)] rounded-full relative"
                      style={{ width: `${(Math.max(skill.current, skill.target) / 5) * 100}%` }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--c-solid)] rounded-full"
                        style={{ width: `${skill.target > 0 ? (skill.current / Math.max(skill.current, skill.target)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Utbildningar — riktiga, från Arbetsförmedlingens JobEd Connect */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
          {t('skillsGapAnalysis.educations.title')}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {matchatYrke
            ? t('skillsGapAnalysis.educations.sourceMatched', { yrke: matchatYrke })
            : t('skillsGapAnalysis.educations.source')}
        </p>

        {utbildningslage === 'hamtar' && (
          <p className="text-sm text-stone-600 dark:text-stone-400" role="status" aria-live="polite">
            {t('skillsGapAnalysis.educations.loading')}
          </p>
        )}

        {/* Ett avbrott mot Arbetsförmedlingen är inte ett besked om att det
            saknas utbildningar. De två fick inte se likadana ut. */}
        {utbildningslage === 'fel' && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-stone-50 dark:bg-stone-700" role="alert">
            <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {t('skillsGapAnalysis.educations.failed')}
            </p>
          </div>
        )}

        {utbildningslage === 'klar' && utbildningar.length === 0 && (
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('skillsGapAnalysis.educations.none')}
          </p>
        )}

        {utbildningslage === 'klar' && utbildningar.length > 0 && (
          <ul className="space-y-3 list-none p-0 m-0">
            {utbildningar.map((u) => {
              const lank = sakerUrl(u.url || u.providerUrl)
              return (
                <li
                  key={u.id}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700"
                >
                  <h4 className="font-semibold text-stone-800 dark:text-stone-100">{u.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-700 dark:text-stone-300 mt-1">
                    {u.formLabel && <span>{u.formLabel}</span>}
                    {u.provider && <span>{u.provider}</span>}
                    {u.distance && <span>{t('skillsGapAnalysis.educations.distance')}</span>}
                    {u.startDate && (
                      <span>{t('skillsGapAnalysis.educations.starts', {
                        datum: new Date(u.startDate).toLocaleDateString(dateLocale),
                      })}</span>
                    )}
                  </div>
                  {lank && (
                    <a
                      href={lank}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm mt-2 text-[var(--c-text)] dark:text-stone-200 underline"
                    >
                      {t('skillsGapAnalysis.learnMore')}
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="sr-only">{t('common.opensInNewTab', 'öppnas i ny flik')}</span>
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <Link
          to="/education"
          className="inline-flex items-center gap-1 text-sm mt-4 text-[var(--c-text)] dark:text-stone-200 underline"
        >
          {t('skillsGapAnalysis.educations.searchMore')}
        </Link>
      </Card>

      {/* Handlingsplan */}
      {actionPlan.length > 0 && (
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('skillsGapAnalysis.yourActionPlan')}
          </h3>
          <ol className="space-y-3 list-none p-0 m-0">
            {actionPlan.map((item) => (
              <li key={item.order} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
                <div className="w-6 h-6 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[var(--c-text)] dark:text-stone-100">{item.order}</span>
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-100">{item.title}</p>
                  <p className="text-sm text-stone-700 dark:text-stone-300">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-600">
            {addedToPlan ? (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/25 border border-[var(--c-accent)]">
                <CheckCircle className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
                <span className="text-sm text-stone-800 dark:text-stone-100">
                  {t('skillsGapAnalysis.addedToCareerPlan')}
                </span>
                <Link
                  to="/career/plan"
                  className="ml-auto text-sm font-medium text-[var(--c-text)] dark:text-stone-200 underline"
                >
                  {t('skillsGapAnalysis.viewPlan')} →
                </Link>
              </div>
            ) : (
              <Button
                onClick={onAddToPlan}
                disabled={isAddingToPlan}
                isLoading={isAddingToPlan}
                loadingText={t('skillsGapAnalysis.addingToPlan')}
                className="w-full bg-[var(--c-solid)] hover:brightness-110 text-white dark:text-stone-900"
              >
                <Target className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('skillsGapAnalysis.addToCareerPlan')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Rådgivarråd låg tidigare bara i inmatningsläget — inte här, där
          handlingsplanen står och jobbcoachens tips passar bäst. */}
      <RadgivarTips pathname="/skills-gap-analysis" index={1} />

      {/* Historik */}
      {previousAnalyses.length > 1 && (
        <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-stone-700 dark:text-stone-200"
            aria-expanded={showHistory}
            aria-controls="kompetens-historik"
          >
            <span className="font-medium flex items-center gap-2">
              <History className="w-4 h-4" aria-hidden="true" />
              {t('skillsGapAnalysis.showPreviousAnalyses', { count: previousAnalyses.length - 1 })}
            </span>
            {/* Tecknet lästes upp som "minus"/"plus" — aria-expanded bär redan
                tillståndet för skärmläsaren. */}
            <span aria-hidden="true">{showHistory ? '−' : '+'}</span>
          </button>

          {showHistory && (
            <div id="kompetens-historik" className="mt-3 space-y-2">
              {previousAnalyses.filter(a => a.id !== analysis.id).map(a => (
                <button
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className="w-full text-left p-3 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] transition-colors"
                >
                  <span className="block font-medium text-stone-800 dark:text-stone-100">
                    {kortDromjobb(a.dream_job) || forhandsvisning(a.dream_job)}
                  </span>
                  <span className="block text-xs text-stone-600 dark:text-stone-400">
                    {new Date(a.created_at).toLocaleDateString(dateLocale)}
                    {' · '}
                    {t('skillsGapAnalysis.historySkills', { antal: (a.skills_comparison || []).length })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  )
}
