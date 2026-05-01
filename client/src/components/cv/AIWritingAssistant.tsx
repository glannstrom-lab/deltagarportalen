/**
 * AI Writing Assistant - Säker version
 * Använder server-side Vercel API med autentisering
 */

import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Wand2, RefreshCw, Check, AlertCircle, Globe, TrendingUp, Zap, Shield, RotateCcw } from '@/components/ui/icons'
import { callAI } from '@/services/aiApi'

interface CVDataForAI {
  title?: string
  firstName?: string
  lastName?: string
  workExperience?: Array<{ title?: string; company?: string; description?: string }>
  education?: Array<{ degree?: string; school?: string; field?: string }>
  skills?: Array<{ name: string; level?: number }>
}

interface AIWritingAssistantProps {
  content: string
  onChange: (newText: string) => void
  type: 'summary' | 'experience' | 'skills'
  cvData?: CVDataForAI
}

type FeatureType = 'improve' | 'quantify' | 'translate' | 'generate'

const featureIcons: Record<FeatureType, { icon: typeof Zap; color: string }> = {
  improve: { icon: Zap, color: 'text-amber-500' },
  quantify: { icon: TrendingUp, color: 'text-green-500' },
  translate: { icon: Globe, color: 'text-blue-500' },
  generate: { icon: Sparkles, color: 'text-[var(--c-solid)]' }
}

export function AIWritingAssistant({ content, onChange, type, cvData }: AIWritingAssistantProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState('')
  const [activeFeature, setActiveFeature] = useState<FeatureType | null>(null)
  // För att kunna ångra power-word-replace. Snapshot innan replace.
  const [powerWordSnapshot, setPowerWordSnapshot] = useState<string | null>(null)

  // Auto-rensa undo-snapshot efter 15s så knappen inte ligger kvar för evigt.
  useEffect(() => {
    if (!powerWordSnapshot) return
    const t = setTimeout(() => setPowerWordSnapshot(null), 15000)
    return () => clearTimeout(t)
  }, [powerWordSnapshot])

  // Power words with translations
  const powerWords = useMemo(() => [
    { weak: t('cv.aiWriting.powerWords.wasResponsibleFor'), strong: t('cv.aiWriting.powerWords.led') },
    { weak: t('cv.aiWriting.powerWords.helpedWith'), strong: t('cv.aiWriting.powerWords.drove') },
    { weak: t('cv.aiWriting.powerWords.did'), strong: t('cv.aiWriting.powerWords.executed') },
    { weak: t('cv.aiWriting.powerWords.workedWith'), strong: t('cv.aiWriting.powerWords.specialized') },
    { weak: t('cv.aiWriting.powerWords.got'), strong: t('cv.aiWriting.powerWords.achieved') },
    { weak: t('cv.aiWriting.powerWords.goodAt'), strong: t('cv.aiWriting.powerWords.expertIn') },
    { weak: t('cv.aiWriting.powerWords.assisted'), strong: t('cv.aiWriting.powerWords.supported') },
    { weak: t('cv.aiWriting.powerWords.agreedTo'), strong: t('cv.aiWriting.powerWords.tookOn') },
    { weak: t('cv.aiWriting.powerWords.lookedAt'), strong: t('cv.aiWriting.powerWords.analyzed') },
    { weak: t('cv.aiWriting.powerWords.fixed'), strong: t('cv.aiWriting.powerWords.solved') },
  ], [t])

  // Features with translations
  const features = useMemo(() => ({
    improve: {
      label: t('cv.aiWriting.features.improve'),
      description: t('cv.aiWriting.features.improveDesc'),
      ...featureIcons.improve
    },
    quantify: {
      label: t('cv.aiWriting.features.quantify'),
      description: t('cv.aiWriting.features.quantifyDesc'),
      ...featureIcons.quantify
    },
    translate: {
      label: t('cv.aiWriting.features.translate'),
      description: t('cv.aiWriting.features.translateDesc'),
      ...featureIcons.translate
    },
    generate: {
      label: t('cv.aiWriting.features.generate'),
      description: t('cv.aiWriting.features.generateDesc'),
      ...featureIcons.generate
    }
  }), [t])

  // SÄKER implementation - anropa autentiserat API
  const callSecureAI = async (feature: FeatureType) => {
    // For 'generate' we can work with cvData even without content
    // For other features we need existing content to improve
    if (!content?.trim() && feature !== 'generate') {
      setError(t('cv.aiWriting.errors.writeFirst'))
      return
    }

    // For generate, check that we have some CV data to work with
    if (feature === 'generate' && !content?.trim()) {
      const hasData = cvData?.title || cvData?.workExperience?.length || cvData?.skills?.length
      if (!hasData) {
        setError(t('cv.aiWriting.errors.fillCVFirst', 'Fyll i lite information om dig först (titel, erfarenhet eller kompetenser)'))
        return
      }
    }

    setLoading(true)
    setError(null)
    setActiveFeature(feature)

    try {
      const data = await callAI<{ result: string }>('cv-writing', {
        content,
        type,
        feature,
        cvData
      })

      if (!data.success) {
        throw new Error(t('cv.aiWriting.errors.aiCouldNotGenerate'))
      }

      setSuggestion((data as { result?: string }).result || '')
    } catch (err) {
      console.error('AI-fel:', err)
      setError(err instanceof Error ? err.message : t('cv.aiWriting.errors.couldNotContact'))
    } finally {
      setLoading(false)
    }
  }

  const analyzeText = () => {
    if (!content) return [];
    const foundWeakWords = powerWords.filter(pw =>
      content.toLowerCase().includes(pw.weak?.toLowerCase())
    )
    return foundWeakWords
  }

  const applyPowerWords = () => {
    const before = content || ''
    let improved = before
    powerWords.forEach(({ weak, strong }) => {
      improved = improved.replace(new RegExp(weak, 'gi'), strong)
    })
    if (improved === before) return
    setPowerWordSnapshot(before)
    onChange(improved)
  }

  const undoPowerWords = () => {
    if (powerWordSnapshot == null) return
    onChange(powerWordSnapshot)
    setPowerWordSnapshot(null)
  }

  const weakWords = analyzeText()

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[var(--c-text)] hover:text-[var(--c-text)] font-medium"
      >
        <Shield size={16} />
        <Sparkles size={16} />
        <span>{t('cv.aiWriting.title')}</span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-xl border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
          {/* Säkerhetsbadge */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              {t('cv.aiWriting.secureConnection')}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* AI Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {(Object.keys(features) as FeatureType[]).map((key) => {
              const feat = features[key]
              const Icon = feat.icon
              return (
                <button
                  key={key}
                  onClick={() => callSecureAI(key)}
                  disabled={loading && activeFeature === key}
                  className="flex flex-col items-center gap-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] transition-colors disabled:opacity-50"
                  title={feat.description}
                >
                  {loading && activeFeature === key ? (
                    <RefreshCw size={18} className={`${feat.color} animate-spin`} />
                  ) : (
                    <Icon size={18} className={feat.color} />
                  )}
                  <span className="text-xs">{feat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Weak words detection */}
          {weakWords.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                {t('cv.aiWriting.foundWeakPhrases')}:
              </p>
              <div className="space-y-1">
                {weakWords.slice(0, 3).map((word, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-700 dark:text-amber-400 line-through">{word.weak}</span>
                    <span className="text-amber-600 dark:text-amber-500">→</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">{word.strong}</span>
                  </div>
                ))}
                {weakWords.length > 3 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    +{weakWords.length - 3} {t('cv.aiWriting.more')}...
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={applyPowerWords}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--c-solid)] text-white text-sm rounded-lg hover:bg-[var(--c-text)]"
                >
                  <Wand2 size={14} />
                  {t('cv.aiWriting.replaceAutomatically')}
                </button>
                {powerWordSnapshot != null && (
                  <button
                    onClick={undoPowerWords}
                    className="flex items-center gap-1 px-3 py-1.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-sm rounded-lg hover:bg-white dark:hover:bg-stone-800"
                    aria-label={t('cv.aiWriting.undoReplacements', 'Ångra ersättningar')}
                  >
                    <RotateCcw size={14} />
                    {t('cv.aiWriting.undo', 'Ångra')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="p-4 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-center">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
              <p className="text-sm text-stone-600 dark:text-stone-400">{t('cv.aiWriting.aiWorking')}</p>
              <p className="text-xs text-stone-600 dark:text-stone-500 mt-1">{t('cv.aiWriting.mayTakeSeconds')}</p>
            </div>
          )}

          {/* Suggestion */}
          {!loading && suggestion && (
            <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-stone-200 dark:border-stone-700">
              <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
                {activeFeature && features[activeFeature]?.label}
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{suggestion}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    onChange(suggestion)
                    setSuggestion('')
                    setActiveFeature(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--c-solid)] text-white text-sm rounded-lg hover:bg-[var(--c-text)]"
                >
                  <Check size={14} />
                  {t('cv.aiWriting.use')}
                </button>
                <button
                  onClick={() => {
                    setSuggestion('')
                    setActiveFeature(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-sm rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !suggestion && !error && (
            <div className="text-center py-4 text-stone-700 dark:text-stone-400 text-sm">
              {t('cv.aiWriting.selectFeatureAbove')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AIWritingAssistant
