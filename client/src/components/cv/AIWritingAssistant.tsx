/**
 * AI Writing Assistant - Säker version
 * Använder server-side Vercel API med autentisering
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Wand2, RefreshCw, Check, AlertCircle, Globe, TrendingUp, Zap, Shield } from '@/components/ui/icons'
import { callAI } from '@/services/aiApi'

interface AIWritingAssistantProps {
  content: string
  onChange: (newText: string) => void
  type: 'summary' | 'experience' | 'skills'
}

type FeatureType = 'improve' | 'quantify' | 'translate' | 'generate'

const featureIcons: Record<FeatureType, { icon: typeof Zap; color: string }> = {
  improve: { icon: Zap, color: 'text-amber-500' },
  quantify: { icon: TrendingUp, color: 'text-green-500' },
  translate: { icon: Globe, color: 'text-blue-500' },
  generate: { icon: Sparkles, color: 'text-teal-500' }
}

export function AIWritingAssistant({ content, onChange, type }: AIWritingAssistantProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState('')
  const [activeFeature, setActiveFeature] = useState<FeatureType | null>(null)

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
    if (!content?.trim()) {
      setError(t('cv.aiWriting.errors.writeFirst'))
      return
    }

    setLoading(true)
    setError(null)
    setActiveFeature(feature)

    try {
      const data = await callAI<{ result: string }>('cv-writing', {
        content,
        type,
        feature
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
    let improved = content || ''
    powerWords.forEach(({ weak, strong }) => {
      improved = improved.replace(new RegExp(weak, 'gi'), strong)
    })
    onChange(improved)
  }

  const weakWords = analyzeText()

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
      >
        <Shield size={16} />
        <Sparkles size={16} />
        <span>{t('cv.aiWriting.title')}</span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-200 dark:border-teal-800">
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
                  disabled={loading}
                  className="flex flex-col items-center gap-1 px-3 py-2 bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg text-sm text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors disabled:opacity-50"
                  title={feat.description}
                >
                  <Icon size={18} className={feat.color} />
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
              <button
                onClick={applyPowerWords}
                className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
              >
                <Wand2 size={14} />
                {t('cv.aiWriting.replaceAutomatically')}
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="p-4 bg-white dark:bg-stone-800 rounded-lg border border-slate-200 dark:border-stone-700 text-center">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-teal-600 dark:text-teal-400" />
              <p className="text-sm text-slate-600 dark:text-stone-400">{t('cv.aiWriting.aiWorking')}</p>
              <p className="text-xs text-slate-600 dark:text-stone-500 mt-1">{t('cv.aiWriting.mayTakeSeconds')}</p>
            </div>
          )}

          {/* Suggestion */}
          {!loading && suggestion && (
            <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-slate-200 dark:border-stone-700">
              <p className="text-xs font-medium text-slate-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
                {activeFeature && features[activeFeature]?.label}
              </p>
              <p className="text-sm text-slate-700 dark:text-stone-300 whitespace-pre-wrap">{suggestion}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    onChange(suggestion)
                    setSuggestion('')
                    setActiveFeature(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                >
                  <Check size={14} />
                  {t('cv.aiWriting.use')}
                </button>
                <button
                  onClick={() => {
                    setSuggestion('')
                    setActiveFeature(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-stone-600 text-slate-700 dark:text-stone-300 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-stone-700"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !suggestion && !error && (
            <div className="text-center py-4 text-slate-700 dark:text-stone-400 text-sm">
              {t('cv.aiWriting.selectFeatureAbove')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AIWritingAssistant
