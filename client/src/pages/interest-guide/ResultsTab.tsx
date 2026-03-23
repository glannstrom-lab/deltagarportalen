/**
 * Results Tab - Display RIASEC profile and personality analysis
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { calculateUserProfile, calculateJobMatches, type UserProfile } from '@/services/interestGuideData'
import { ResultsView } from '@/components/interest-guide/ResultsView'
import { LoadingState, InfoCard, Button, Card } from '@/components/ui'
import { interestGuideApi } from '@/services/cloudStorage'
import {
  ClipboardList,
  Sparkles,
  Download,
  Share2,
  BarChart3,
  Trophy,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export default function ResultsTab() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComparisonHint, setShowComparisonHint] = useState(true)

  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true)
        const data = await interestGuideApi.getProgress()

        if (data?.is_completed && data.answers) {
          const calculatedProfile = calculateUserProfile(data.answers)
          setProfile(calculatedProfile)
        }
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

      {/* Top Job Matches Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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

      {/* Comparison Hint */}
      {showComparisonHint && (
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
