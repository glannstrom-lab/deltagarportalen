/**
 * History Tab - Previous test results and comparisons
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  calculateUserProfile,
  riasecNames,
  bigFiveNames,
  type UserProfile,
} from '@/services/interestGuideData'
import { RiasecChart } from '@/components/interest-guide/RiasecChart'
import { LoadingState, Button, InfoCard } from '@/components/ui'
import { interestGuideApi } from '@/services/cloudStorage'
import {
  History,
  ClipboardList,
  Sparkles,
  Calendar,
  Target,
  Brain,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'

interface HistoryEntry {
  id: string
  date: string
  profile: UserProfile
  answers: Record<string, number>
}

export default function HistoryTab() {
  const navigate = useNavigate()
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const data = await interestGuideApi.getProgress()

        if (data?.is_completed && data.answers) {
          const calculatedProfile = calculateUserProfile(data.answers)
          setCurrentProfile(calculatedProfile)

          // Create a history entry from current data
          // In a real implementation, this would fetch from a history table
          const historyEntry: HistoryEntry = {
            id: 'current',
            date: new Date().toISOString(),
            profile: calculatedProfile,
            answers: data.answers,
          }
          setHistory([historyEntry])
        }
      } catch (err) {
        console.error('Failed to load history:', err)
        setError('Kunde inte ladda historiken')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTopRiasec = (profile: UserProfile) => {
    return Object.entries(profile.riasec)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => riasecNames[key])
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title="Laddar historik..." size="lg" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <History className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ingen historik än</h2>
        <p className="text-gray-600 mb-6">
          När du genomfört testet kommer dina resultat att sparas här.
          Du kan göra om testet när som helst och jämföra resultaten.
        </p>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Sparkles className="w-4 h-4" />
          Starta testet
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
          <History className="w-4 h-4" />
          Din historik
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Testresultat över tid</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Här kan du se och jämföra dina tidigare testresultat.
          Dina intressen och personlighet kan utvecklas över tid.
        </p>
      </div>

      {/* Current Profile Summary */}
      {currentProfile && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 mb-1">Din nuvarande profil</h3>
              <p className="text-indigo-800 text-sm mb-3">
                Topp intressen: {getTopRiasec(currentProfile).join(', ')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/interest-guide/results')}
                  className="gap-1"
                >
                  <Brain className="w-4 h-4" />
                  Se fullständiga resultat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/interest-guide')}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Gör om testet
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          Tidigare resultat
        </h2>

        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => setExpandedEntry(
                expandedEntry === entry.id ? null : entry.id
              )}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{formatDate(entry.date)}</h3>
                  <p className="text-sm text-gray-500">
                    Topp: {getTopRiasec(entry.profile).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entry.id === 'current' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                    Aktuell
                  </span>
                )}
                {expandedEntry === entry.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedEntry === entry.id && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="py-4">
                  {/* RIASEC Chart */}
                  <div className="flex justify-center mb-6">
                    <RiasecChart scores={entry.profile.riasec} size={200} />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(entry.profile.riasec)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-gray-50 rounded-lg p-3 text-center"
                        >
                          <p className="text-xs text-gray-500 mb-1">{riasecNames[key]}</p>
                          <p className="text-lg font-bold text-gray-900">{value}/5</p>
                        </div>
                      ))}
                  </div>

                  {/* Big Five Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Personlighetsdrag</h4>
                    <div className="space-y-2">
                      {Object.entries(entry.profile.bigFive).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 w-32">{bigFiveNames[key]?.name ?? key}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">
                            {value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Om din historik</h3>
        <p className="text-sm text-gray-600 mb-4">
          Dina intressen och personlighetsdrag kan förändras över tid baserat på
          nya erfarenheter, utbildning och livssituationer. Vi rekommenderar att
          göra om testet med jämna mellanrum för att se hur du utvecklas.
        </p>
        <p className="text-sm text-gray-500">
          Tips: Gör testet var 6:e månad eller efter större förändringar i ditt liv.
        </p>
      </div>
    </div>
  )
}
