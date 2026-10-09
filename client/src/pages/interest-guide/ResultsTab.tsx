/**
 * Results Tab - Display RIASEC profile and personality analysis
 * With history comparison feature
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, MotionConfig } from 'framer-motion'
import { calculateUserProfile, calculateJobMatches, type UserProfile } from '@/services/interestGuideData'
import { useYrken, useRiasecNamn } from '@/services/useIntresseguideInnehall'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { datumSprak } from '@/lib/datumsprak'
import { ResultsView } from '@/components/interest-guide/ResultsView'
import { CareerRecommendationsPanel } from '@/components/interest-guide/CareerRecommendationsPanel'
import { LoadingState, InfoCard, Button, Card, EmptyState } from '@/components/ui'
import { interestGuideApi, type InterestGuideHistoryEntry } from '@/services/cloudStorage'
import { showToast } from '@/components/Toast'
import { riasecForandring } from './riasecForandring'
import {
  RotateCcw,
  Download,
  Share2,
  ArrowRight,
  FileText,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ChevronDown,
  ChevronUp
} from '@/components/ui/icons'

export default function ResultsTab() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const sprak = datumSprak(i18n.language)
  const riasecNamn = useRiasecNamn()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<InterestGuideHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

  const yrken = useYrken()

  /*
    Låg tidigare EFTER två tidiga `return` nedan (laddar/inget resultat), vilket
    bryter hook-regeln nu när beräkningen behöver `useYrken()`. Flyttad hit och
    skyddad mot `profile === null` — samma mönster som OccupationsTab.tsx.
  */
  const jobMatches = useMemo(
    () => (profile ? calculateJobMatches(profile) : []),
    [profile]
  )

  /*
    Bara för "Dina topp 3 yrkesmatchningar" nedan. `CareerRecommendationsPanel`
    får `jobMatches` OÖVERSATT via `topMatches`-propen (se den komponenten) —
    den använder yrkesnamnet som sökterm mot SCB:s lönedata och
    utbildningsregistret, som är svenska källor. `calculateJobMatches` saknar
    dessutom den tredje parametern (yrkeslistan) som skulle gjort detta i ett
    steg — se kommentaren i OccupationsTab.tsx.
  */
  const oversattaTopMatches = useMemo(() => {
    const yrkeOversattPerId = new Map(yrken.map(o => [o.id, o]))
    return jobMatches.slice(0, 3).map(m => ({
      ...m,
      occupation: yrkeOversattPerId.get(m.occupation.id) ?? m.occupation,
    }))
  }, [jobMatches, yrken])

  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load current progress and history in parallel
        const [data, historyData] = await Promise.all([
          interestGuideApi.getProgress(),
          interestGuideApi.getHistory(10)
        ])

        if (data?.is_completed && data.answers) {
          try {
            const calculatedProfile = calculateUserProfile(data.answers)
            setProfile(calculatedProfile)
          } catch (calcErr) {
            console.error('Failed to calculate profile:', calcErr)
            setError(t('interestGuide.results.calcFailed'))
          }
        }

        setHistory(historyData)
      } catch (err) {
        console.error('Failed to load results:', err)
        setError(t('interestGuide.couldNotLoadResults'))
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [t])

  const handleRestart = async () => {
    try {
      await interestGuideApi.reset()
      navigate('/interest-guide')
    } catch (err) {
      console.error('Failed to restart:', err)
      setError(t('interestGuide.couldNotRestartTest'))
    }
  }

  const handleDownloadResults = () => {
    if (!profile) return

    const topp3 = Object.entries(profile.riasec)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => `${key} (${riasecNamn[key] ?? key})`)
      .join(', ')
    const resultsText = [
      t('interestGuide.results.fileHeading'),
      '',
      t('interestGuide.results.fileRiasec', { types: topp3 }),
      '',
      t('interestGuide.results.fileBigFive'),
      '',
      t('interestGuide.results.fileCreated', { date: new Date().toLocaleDateString(sprak) }),
    ].join('\n')

    const blob = new Blob([resultsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t('interestGuide.results.fileName')}-${formatLocalDate(new Date())}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Båda löftena avvisas i normal drift: `share` när användaren stänger
  // delningsrutan (AbortError), `writeText` när sidan saknar fokus eller
  // behörighet. Ofångade blev de ohanterade avvisningar — och "Kopierat!"
  // visades även när ingenting kopierats.
  const handleShareResults = async () => {
    const text = t('interestGuide.results.shareText')
    if (navigator.share) {
      try {
        await navigator.share({ title: t('interestGuide.results.shareTitle'), text })
      } catch {
        // Avbruten delning är användarens val, inget fel att visa
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast.success(t('common.copied'))
    } catch {
      showToast.error(t('interestGuide.shareFailed'))
    }
  }

  // Get the previous result for comparison (skip the most recent which is current)
  const previousResult = history.length > 1 ? history[1] : null

  // Förändring mot förra testet. Skalan är 1–5 i hela steg — se riasecForandring.ts.
  const getChangeIndicator = (current: number, previous: number) => {
    const { riktning, diff } = riasecForandring(current, previous)
    if (riktning === 'oforandrad') return { icon: Minus, color: 'text-stone-600 dark:text-stone-400', text: t('interestGuide.results.unchanged') }
    if (riktning === 'upp') return { icon: TrendingUp, color: 'text-green-700 dark:text-green-400', text: `+${diff}` }
    return { icon: TrendingDown, color: 'text-red-700 dark:text-red-400', text: `${diff}` }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 ">
        <LoadingState title={t('common.loading')} size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto min-h-screen">
        <EmptyState
          illustration="karriar"
          title={t('interestGuide.noResultsYet', 'Här visas dina resultat')}
          description={t('interestGuide.completeTestToSeeResults', 'Du behöver genomföra intressetestet för att se dina resultat.')}
          action={{
            label: t('interestGuide.startTest', 'Starta testet'),
            onClick: () => navigate('/interest-guide'),
          }}
        />
      </div>
    )
  }

  /*
    Designpasset 2026-10-09 ("för texttungt"): fliken var ~750 ord och 7 000 px.
    Tre färgade sammanfattningskort (RIASEC-koden, närmaste yrket, antal yrken)
    upprepade det som står i topp 3 och i profilen; ett tipskort om att göra om
    testet senare och en andra knapprad i ResultsView dubblerade knapparna
    längst ner. De är borta. Ordningen är nu: hälsning → topp 3 → profilen →
    karriärvägar → historik → nästa steg → knappar.
  */
  return (
    <MotionConfig reducedMotion="user">
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}

      {/* Slutförande-hälsning (Fas 5 — success-spot) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
      >
        <img
          src="/illustrations/success-intresse.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-24 h-24 flex-shrink-0 select-none"
        />
        <div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t('interestGuide.results.doneHeading')}</h2>
          <p className="text-stone-600 dark:text-stone-300 mt-1">
            {t('interestGuide.results.doneLead')}
          </p>
        </div>
      </motion.div>

      {/* Top Job Matches Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('interestGuide.results.top3Heading')}</h3>
            <Button
              variant="ghost"
              onClick={() => navigate('/interest-guide/occupations')}
              className="gap-2 text-[var(--c-text)] dark:text-stone-100"
            >
              {t('interestGuide.results.seeAll')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {oversattaTopMatches.map((match, index) => (
              <div key={match.occupation.id} className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-[var(--c-solid)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{match.occupation.name}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{match.occupation.description}</p>
                  {/* Plats i stället för procent: se matchningsplats i interestGuideData. */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('interestGuide.results.rankPlace', 'Nr {{place}} av {{total}} utifrån dina svar', { place: index + 1, total: jobMatches.length })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Main Results View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ResultsView profile={profile} />
      </motion.div>

      {/* Career Recommendations Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CareerRecommendationsPanel
          profile={profile}
          topMatches={jobMatches.slice(0, 5)}
          totalMatches={jobMatches.length}
        />
      </motion.div>

      {/* History Comparison Section */}
      {history.length > 1 && previousResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-5 bg-[var(--c-bg)] border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-[var(--c-text)] dark:text-stone-100" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('interestGuide.results.comparisonWithPreviousTest')}</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {t('interestGuide.results.fromDate', { date: new Date(previousResult.completed_at).toLocaleDateString(sprak) })}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-white dark:bg-stone-800 text-[var(--c-text)] dark:text-stone-100 px-2 py-1 rounded-full">
                {t('interestGuide.results.testsTotal', { count: history.length })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(profile.riasec).map(([key, value]) => {
                const prevValue = previousResult.riasec_profile?.[key] ?? value
                const change = getChangeIndicator(value, prevValue)
                const ChangeIcon = change.icon

                return (
                  <div key={key} className="bg-white dark:bg-stone-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">{riasecNamn[key] ?? key}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
                    <div className={`flex items-center justify-center gap-1 text-xs ${change.color}`}>
                      <ChangeIcon className="w-3 h-3" />
                      <span>{change.text}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* History Timeline (expandable) */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setShowHistory(!showHistory)}
              aria-expanded={showHistory}
              className="w-full p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t('interestGuide.results.earlierResults', { count: history.length })}
                </span>
              </div>
              {showHistory ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              )}
            </button>

            {showHistory && (
              <div className="border-t border-stone-100 dark:border-stone-700">
                <div className="max-h-96 overflow-y-auto">
                  {history.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`p-4 border-b border-stone-100 dark:border-stone-700 last:border-0 ${
                        index === 0 ? 'bg-[var(--c-bg)]' : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
                      } transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--c-solid)]`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={selectedHistoryId === entry.id}
                      onClick={() => setSelectedHistoryId(selectedHistoryId === entry.id ? null : entry.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedHistoryId(selectedHistoryId === entry.id ? null : entry.id)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-[var(--c-solid)] hover:brightness-110 text-white' : 'bg-stone-200 dark:bg-stone-700 text-gray-600 dark:text-gray-300'
                          }`}>
                            {index === 0 ? '*' : index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {new Date(entry.completed_at).toLocaleDateString(sprak, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {index === 0 && (
                                <span className="ml-2 text-xs bg-[var(--c-bg)] text-[var(--c-text)] dark:text-stone-100 border border-[var(--c-accent)] px-2 py-0.5 rounded-full">
                                  {t('interestGuide.results.current')}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              RIASEC: {Object.entries(entry.riasec_profile)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 3)
                                .map(([key]) => key)
                                .join('')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {entry.top_occupations && entry.top_occupations.length > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('interestGuide.results.topOccupation', { name: entry.top_occupations[0].name })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {selectedHistoryId === entry.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700"
                        >
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                            {Object.entries(entry.riasec_profile).map(([key, value]) => (
                              <div key={key} className="text-center p-2 bg-white dark:bg-stone-900/50 rounded-lg">
                                <p className="text-xs text-gray-700 dark:text-gray-300">{key}</p>
                                <p className="font-bold text-gray-900 dark:text-gray-100">{value as number}</p>
                              </div>
                            ))}
                          </div>
                          {entry.top_occupations && entry.top_occupations.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{t('interestGuide.results.top5Heading')}</p>
                              {entry.top_occupations.slice(0, 5).map((occ, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-gray-700 dark:text-gray-300">{i + 1}. {occ.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Nästa steg: CV. Var en helfärgad banderoll med ikonplatta, etikett,
          rubrik och ett stycke; nu ett vanligt länkkort. (2026-10-09) */}
      <Link
        to="/cv"
        className="flex items-center gap-4 rounded-2xl p-4 sm:p-5 bg-[var(--c-bg)] border border-[var(--c-accent)] hover:border-[var(--c-solid)] transition-colors group"
      >
        <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-[var(--c-solid)]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{t('interestGuide.results.nextStep')}</p>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">{t('interestGuide.results.createCvHeading')}</h2>
        </div>
        <ArrowRight className="w-5 h-5 text-[var(--c-solid)] group-hover:translate-x-1 transition-transform flex-shrink-0" aria-hidden="true" />
      </Link>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          onClick={handleDownloadResults}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {t('interestGuide.results.download')}
        </Button>
        <Button
          onClick={handleShareResults}
          variant="outline"
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          {t('interestGuide.results.share')}
        </Button>
        <Button
          onClick={handleRestart}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          {t('interestGuide.results.restart')}
        </Button>
      </motion.div>
    </div>
    </MotionConfig>
  )
}
