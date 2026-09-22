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
  Sparkles,
  Download,
  Share2,
  BarChart3,
  Trophy,
  ArrowRight,
  CheckCircle,
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
  const [showComparisonHint, setShowComparisonHint] = useState(true)
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

  const goodMatches = jobMatches.filter(m => m.matchPercentage >= 70).length

  return (
    <MotionConfig reducedMotion="user">
    <div className="max-w-5xl mx-auto space-y-8 min-h-screen  p-4">
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

      {/* Results Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">{t('interestGuide.results.riasecType')}</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {Object.entries(profile.riasec)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([key]) => key)
                  .join('')}
              </p>
            </div>
            <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">{t('interestGuide.results.goodMatches')}</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{goodMatches}</p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">{t('interestGuide.results.goodMatchesUnit')}</p>
            </div>
            <Trophy className="w-6 h-6 text-green-600 dark:text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--c-solid)] dark:text-[var(--c-solid)] font-medium mb-2">{t('interestGuide.results.totalOccupations')}</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{jobMatches.length}</p>
              <p className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)] mt-1">{t('interestGuide.results.toExplore')}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-[var(--c-solid)] dark:text-[var(--c-solid)] opacity-50" />
          </div>
        </Card>
      </motion.div>

      {/* History Comparison Section */}
      {history.length > 1 && previousResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-[var(--c-text)] dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('interestGuide.results.comparisonWithPreviousTest')}</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {t('interestGuide.results.fromDate', { date: new Date(previousResult.completed_at).toLocaleDateString(sprak) })}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-blue-100 dark:bg-blue-800/50 text-[var(--c-text)] dark:text-blue-300 px-2 py-1 rounded-full">
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
                        index === 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
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
                                <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
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
                                  <span className="font-medium text-amber-600 dark:text-amber-400">{occ.matchPercentage}%</span>
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
              className="gap-2 text-amber-600 dark:text-amber-400"
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
                  <p className="text-sm text-gray-700 dark:text-gray-300">{match.occupation.description.substring(0, 60)}...</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{match.matchPercentage}%</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{t('interestGuide.results.matchLabel')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
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
        />
      </motion.div>

      {/* Main Results View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ResultsView profile={profile} onRestart={handleRestart} />
      </motion.div>

      {/* Comparison Hint - only show if no history yet */}
      {showComparisonHint && history.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] relative">
            <button
              type="button"
              onClick={() => setShowComparisonHint(false)}
              aria-label={t('common.close')}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              x
            </button>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{t('interestGuide.results.tipLabel')}</span> {t('interestGuide.results.tipText')}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Next Step: CV CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Link
          to="/cv"
          className="block bg-[var(--c-solid)] hover:brightness-110 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-amber-100 text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                {t('interestGuide.results.nextStep')}
              </div>
              <h2 className="text-xl font-bold">{t('interestGuide.results.createCvHeading')}</h2>
              <p className="text-amber-100 text-sm mt-1">
                {t('interestGuide.results.createCvText')}
              </p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Link>
      </motion.div>

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
          <Sparkles className="w-4 h-4" />
          {t('interestGuide.results.restart')}
        </Button>
      </motion.div>
    </div>
    </MotionConfig>
  )
}
