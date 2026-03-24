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
} from 'lucide-react'

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

        console.log('Results tab - Interest guide data:', data)
        console.log('Results tab - History:', historyData)

        if (data?.is_completed && data.answers) {
          try {
            const calculatedProfile = calculateUserProfile(data.answers)
            console.log('Results tab - Calculated profile:', calculatedProfile)
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
    const text = `Jag har genomfört intressetestet i deltagarportalen och hittat yrken som passar mig! 🎯`
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
    if (Math.abs(diff) < 3) return { icon: Minus, color: 'text-gray-400', text: 'Oförändrad' }
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-500', text: `+${diff}` }
    return { icon: TrendingDown, color: 'text-red-500', text: `${diff}` }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title={t('common.loading') || 'Laddar resultat...'} size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <ClipboardList className="w-8 h-8 text-indigo-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {t('interestGuide.noResultsYet') || 'Inga resultat än'}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('interestGuide.completeTestToSeeResults') || 'Du behöver genomföra intressetestet för att se dina resultat.'}
        </p>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
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
    <div className="max-w-5xl mx-auto space-y-8">
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
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium mb-2">Din RIASEC-typ</p>
              <p className="text-2xl font-bold text-indigo-900">
                {Object.entries(profile.riasec)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([key]) => key)
                  .join('')}
              </p>
            </div>
            <BarChart3 className="w-6 h-6 text-indigo-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium mb-2">Bra matchningar</p>
              <p className="text-2xl font-bold text-green-900">{goodMatches}</p>
              <p className="text-xs text-green-700 mt-1">yrken (70%+)</p>
            </div>
            <Trophy className="w-6 h-6 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium mb-2">Totalt yrken</p>
              <p className="text-2xl font-bold text-purple-900">{jobMatches.length}</p>
              <p className="text-xs text-purple-700 mt-1">att utforska</p>
            </div>
            <CheckCircle className="w-6 h-6 text-purple-600 opacity-50" />
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
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Jämförelse med tidigare test</h3>
                  <p className="text-xs text-slate-500">
                    Från {new Date(previousResult.completed_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {history.length} tester totalt
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(profile.riasec).map(([key, value]) => {
                const prevValue = previousResult.riasec_profile?.[key] ?? value
                const change = getChangeIndicator(value, prevValue)
                const ChangeIcon = change.icon

                return (
                  <div key={key} className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">{RIASEC_NAMES[key]}</p>
                    <p className="text-lg font-bold text-slate-900">{value}</p>
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
          <Card className="overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-700">
                  Tidigare resultat ({history.length} {history.length === 1 ? 'test' : 'tester'})
                </span>
              </div>
              {showHistory ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showHistory && (
              <div className="border-t border-slate-100">
                <div className="max-h-96 overflow-y-auto">
                  {history.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`p-4 border-b border-slate-100 last:border-0 ${
                        index === 0 ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      } transition-colors cursor-pointer`}
                      onClick={() => setSelectedHistoryId(selectedHistoryId === entry.id ? null : entry.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {index === 0 ? '★' : index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {new Date(entry.completed_at).toLocaleDateString('sv-SE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {index === 0 && (
                                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  Aktuellt
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-slate-500">
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
                            <p className="text-sm text-slate-600">
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
                          className="mt-4 pt-4 border-t border-slate-200"
                        >
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                            {Object.entries(entry.riasec_profile).map(([key, value]) => (
                              <div key={key} className="text-center p-2 bg-white rounded-lg">
                                <p className="text-xs text-slate-500">{key}</p>
                                <p className="font-bold text-slate-900">{value as number}</p>
                              </div>
                            ))}
                          </div>
                          {entry.top_occupations && entry.top_occupations.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-slate-500 mb-2">Topp 5 yrkesmatchningar:</p>
                              {entry.top_occupations.slice(0, 5).map((occ, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-slate-700">{i + 1}. {occ.name}</span>
                                  <span className="font-medium text-indigo-600">{occ.matchPercentage}%</span>
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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Dina topp 3 yrkesmatchningar</h3>
            <Button
              variant="ghost"
              onClick={() => navigate('/interest-guide/occupations')}
              className="gap-2 text-indigo-600"
            >
              Se alla
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {topMatches.map((match, index) => (
              <div key={match.occupation.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{match.occupation.name}</p>
                  <p className="text-sm text-slate-500">{match.occupation.description.substring(0, 60)}...</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-indigo-600">{match.matchPercentage}%</p>
                  <p className="text-xs text-slate-500">match</p>
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
        transition={{ delay: 0.2 }}
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
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 relative">
            <button
              onClick={() => setShowComparisonHint(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">💡 Tips:</span> Gör om testet senare om dina intressen ändras. Du kan då jämföra resultaten över tid för att se hur du utvecklas.
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
          className="block bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                Nästa steg
              </div>
              <h2 className="text-xl font-bold">Skapa ditt CV</h2>
              <p className="text-indigo-200 text-sm mt-1">
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
