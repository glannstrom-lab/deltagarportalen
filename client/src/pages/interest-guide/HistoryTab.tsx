/**
 * History Tab - Previous test results and comparisons
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  calculateUserProfile,
  riasecNames,
  bigFiveNames,
  type UserProfile,
} from '@/services/interestGuideData'
import { RiasecChart } from '@/components/interest-guide/RiasecChart'
import { LoadingState, Button, InfoCard, EmptyState } from '@/components/ui'
import { interestGuideApi } from '@/services/cloudStorage'
import {
  Calendar,
  Target,
  Brain,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
} from '@/components/ui/icons'

interface HistoryEntry {
  id: string
  /** null när posten saknar datering — visa inget hellre än dagens datum. */
  date: string | null
  profile: UserProfile
  answers: Record<string, number>
}

export default function HistoryTab() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  /*
    Fliken som heter Historik var den enda som inte läste historiken.

    Den hämtade den AKTUELLA raden ur `interest_guide_progress` och byggde en
    enda påhittad post av den, med kommentaren "In a real implementation, this
    would fetch from a history table". Tabellen finns — `interest_guide_history`
    med 10 rader i prod — den skrivs vid varje avslutat test och läses redan av
    ResultsTab och useInterestProfile.

    Värre: `date: new Date().toISOString()` satte DAGENS datum under rubriken
    "Tidigare resultat". Ett test gjort i april stod som gjort idag. Nu används
    `completed_at` ur posten, och saknas det visas ingen datering alls.
    (Granskning 2026-08-21.)
  */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [aktuell, historik] = await Promise.all([
          interestGuideApi.getProgress(),
          interestGuideApi.getHistory(10),
        ])

        if (aktuell?.is_completed && aktuell.answers) {
          setCurrentProfile(calculateUserProfile(aktuell.answers))
        }

        setHistory(
          (historik || []).map(rad => ({
            id: rad.id,
            date: rad.completed_at || rad.created_at || null,
            profile: calculateUserProfile(rad.answers || {}),
            answers: rad.answers || {},
          }))
        )
      } catch (err) {
        console.error('Failed to load history:', err)
        setError(t('interestGuide.history.errorLoading'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [t])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'sv-SE', {
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
      <div className="flex items-center justify-center py-12 ">
        <LoadingState title={t('interestGuide.history.loading')} size="lg" />
      </div>
    )
  }

  /*
    Ordningen är laddar → fel → tomt → data. Tidigare returnerade
    tomtillståndet FÖRE felkortet, så ett laddningsfel visades som "du har
    aldrig gjort testet" och felmeddelandet kunde aldrig renderas.
  */
  if (error) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div role="alert">
          <InfoCard variant="error">
            <h2 className="font-semibold mb-1">{t('interestGuide.history.errorLoading')}</h2>
            <p className="mb-3">{t('interestGuide.history.errorBody')}</p>
            <Button onClick={() => window.location.reload()}>
              {t('interestGuide.history.retry')}
            </Button>
          </InfoCard>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <EmptyState
          illustration="karriar"
          title={t('interestGuide.history.noHistory')}
          description={t('interestGuide.history.noHistoryDesc')}
          action={{ label: t('interestGuide.history.startTest'), onClick: () => navigate('/interest-guide') }}
        />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Badge + centrerad h1 låg här — en kvarglömd hjälte som upprepade
          skenan, och en andra <h1> på sidan. */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
          {t('interestGuide.history.title')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          {t('interestGuide.history.description')}
        </p>
      </div>

      {/* Current Profile Summary */}
      {currentProfile && (
        <div className="bg-[var(--c-bg)] rounded-2xl p-6 border border-[var(--c-accent)] mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--c-solid)] rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{t('interestGuide.history.currentProfile')}</h3>
              <p className="text-stone-700 dark:text-stone-300 text-sm mb-3">
                {t('interestGuide.history.topInterests')}: {getTopRiasec(currentProfile).join(', ')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/interest-guide/results')}
                  className="gap-1"
                >
                  <Brain className="w-4 h-4" />
                  {t('interestGuide.history.seeFullResults')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/interest-guide')}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('interestGuide.history.retakeTest')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          {t('interestGuide.history.previousResults')}
        </h2>

        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden"
          >
            <button
              onClick={() => setExpandedEntry(
                expandedEntry === entry.id ? null : entry.id
              )}
              aria-expanded={expandedEntry === entry.id}
              aria-controls={`historik-${entry.id}`}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(entry.date) ?? t('interestGuide.history.noDate')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('interestGuide.history.topInterests')}: {getTopRiasec(entry.profile).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entry.id === 'current' && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                    Aktuell
                  </span>
                )}
                {expandedEntry === entry.id ? (
                  <ChevronUp className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                )}
              </div>
            </button>

            {expandedEntry === entry.id && (
              <div id={`historik-${entry.id}`} className="px-4 pb-4 border-t border-stone-100 dark:border-stone-700">
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
                          className="bg-stone-50 dark:bg-stone-900/50 rounded-lg p-3 text-center"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{riasecNames[key]}</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}/5</p>
                        </div>
                      ))}
                  </div>

                  {/* Big Five Summary */}
                  <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Personlighetsdrag</h4>
                    <div className="space-y-2">
                      {Object.entries(entry.profile.bigFive).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-32">{bigFiveNames[key]?.name ?? key}</span>
                          <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--c-solid)] rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
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
      <div className="mt-8 bg-stone-50 dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Om din historik</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Dina intressen och personlighetsdrag kan förändras över tid baserat på
          nya erfarenheter, utbildning och livssituationer. Vi rekommenderar att
          göra om testet med jämna mellanrum för att se hur du utvecklas.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tips: Gör testet var 6:e månad eller efter större förändringar i ditt liv.
        </p>
      </div>
    </div>
  )
}
