/**
 * Results Tab - Display RIASEC profile and personality analysis
 * With history comparison feature
 */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { calculateUserProfile, calculateJobMatches, type UserProfile } from '@/services/interestGuideData'
import { ResultsView } from '@/components/interest-guide/ResultsView'
import { CareerRecommendationsPanel } from '@/components/interest-guide/CareerRecommendationsPanel'
import { LoadingState, InfoCard, Button, Card } from '@/components/ui'
import { interestGuideApi, type InterestGuideHistoryEntry } from '@/services/cloudStorage'
import {
  ClipboardList,
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

// RIASEC type names in Swedish
const RIASEC_NAMES: Record<string, string> = {
  R: 'Realistisk',
  I: 'Undersökande',
  A: 'Konstnärlig',
  S: 'Social',
  E: 'Företagsam',
  C: 'Konventionell'
}

export default function ResultsTab() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComparisonHint, setShowComparisonHint] = useState(true)
  const [history, setHistory] = useState<InterestGuideHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

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
            setError('Kunde inte beräkna din profil. Försök göra om testet.')
          }
        }

        setHistory(historyData)
      } catch (err) {
        console.error('Failed to load results:', err)
        setError(t('interestGuide.couldNotLoadResults') || 'Kunde inte ladda resultaten')
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
      setError(t('interestGuide.couldNotRestartTest') || 'Kunde inte starta om testet')
    }
  }

  const handleDownloadResults = () => {
    if (!profile) return

    const resultsText = `
INTRESSEGUIDE RESULTAT
=====================

Din RIASEC-profil: ${Object.entries(profile.riasec)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => key)
      .join(', ')}

Din personlighetsprofil är baserad på 5 dimensioner av Big Five-modellen.

Genererad: ${new Date().toLocaleDateString('sv-SE')}
    `.trim()

    const blob = new Blob([resultsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intresseguide-resultat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShareResults = () => {
    const text = `Jag har genomfört intressetestet i deltagarportalen och hittat yrken som passar mig!`
    if (navigator.share) {
      navigator.share({
        title: 'Intresseguide Resultat',
        text: text,
      })
    } else {
      navigator.clipboard.writeText(text)
      alert(t('common.copied') || 'Kopierad!')
    }
  }

  // Get the previous result for comparison (skip the most recent which is current)
  const previousResult = history.length > 1 ? history[1] : null

  // Calculate change between current and previous
  const getChangeIndicator = (current: number, previous: number) => {
    const diff = current - previous
    if (Math.abs(diff) < 3) return { icon: Minus, color: 'text-gray-400 dark:text-gray-500', text: 'Oförändrad' }
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-500 dark:text-green-400', text: `+${diff}` }
    return { icon: TrendingDown, color: 'text-red-500 dark:text-red-400', text: `${diff}` }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950">
        <LoadingState title={t('common.loading') || 'Laddar resultat...'} size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 min-h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <ClipboardList className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('interestGuide.noResultsYet') || 'Inga resultat än'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('interestGuide.completeTestToSeeResults') || 'Du behöver genomföra intressetestet för att se dina resultat.'}
        </p>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600"
        >
          <Sparkles className="w-4 h-4" />
          {t('interestGuide.startTest') || 'Starta testet'}
        </Button>
      </div>
    )
  }

  const jobMatches = calculateJobMatches(profile)
  const topMatches = jobMatches.slice(0, 3)
  const goodMatches = jobMatches.filter(m => m.matchPercentage >= 70).length

  return (
    <div className="max-w-5xl mx-auto space-y-8 min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 p-4">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}

      {/* Results Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">Din RIASEC-typ</p>
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

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">Bra matchningar</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{goodMatches}</p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">yrken (70%+)</p>
            </div>
            <Trophy className="w-6 h-6 text-green-600 dark:text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">Totalt yrken</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{jobMatches.length}</p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">att utforska</p>
            </div>
            <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 opacity-50" />
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
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Jämförelse med tidigare test</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Från {new Date(previousResult.completed_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                {history.length} tester totalt
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(profile.riasec).map(([key, value]) => {
                const prevValue = previousResult.riasec_profile?.[key] ?? value
                const change = getChangeIndicator(value, prevValue)
                const ChangeIcon = change.icon

                return (
                  <div key={key} className="bg-white dark:bg-stone-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">{RIASEC_NAMES[key]}</p>
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
              className="w-full p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Tidigare resultat ({history.length} {history.length === 1 ? 'test' : 'tester'})
                </span>
              </div>
              {showHistory ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                      } transition-colors cursor-pointer`}
                      onClick={() => setSelectedHistoryId(selectedHistoryId === entry.id ? null : entry.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-gray-600 dark:text-gray-300'
                          }`}>
                            {index === 0 ? '*' : index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {new Date(entry.completed_at).toLocaleDateString('sv-SE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {index === 0 && (
                                <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                  Aktuellt
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
                              Topp: {entry.top_occupations[0].name}
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
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Topp 5 yrkesmatchningar:</p>
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Dina topp 3 yrkesmatchningar</h3>
            <Button
              variant="ghost"
              onClick={() => navigate('/interest-guide/occupations')}
              className="gap-2 text-amber-600 dark:text-amber-400"
            >
              Se alla
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {topMatches.map((match, index) => (
              <div key={match.occupation.id} className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{match.occupation.name}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{match.occupation.description.substring(0, 60)}...</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{match.matchPercentage}%</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">match</p>
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
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 relative">
            <button
              onClick={() => setShowComparisonHint(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              x
            </button>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Tips:</span> Gör om testet senare om dina intressen ändras. Du kan då jämföra resultaten över tid för att se hur du utvecklas.
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
          className="block bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-amber-100 text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                Nästa steg
              </div>
              <h2 className="text-xl font-bold">Skapa ditt CV</h2>
              <p className="text-amber-100 text-sm mt-1">
                Använd dina insikter från intresseguiden för att bygga ett professionellt CV
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
          Ladda ner resultat
        </Button>
        <Button
          onClick={handleShareResults}
          variant="outline"
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Dela resultat
        </Button>
        <Button
          onClick={handleRestart}
          variant="outline"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Gör om testet
        </Button>
      </motion.div>
    </div>
  )
}
