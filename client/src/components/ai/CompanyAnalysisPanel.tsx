/**
 * Company Analysis Panel
 * Deep AI analysis of companies for spontaneous applications
 */

import { useState } from 'react'
import {
  Building2,
  Newspaper,
  TrendingUp,
  Users,
  Briefcase,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { AiConsentGate } from './AiConsentGate'
import {
  AIResultCard,
  CollapsibleSection,
  AIList,
  CopyButton,
} from './AIResultCard'
import {
  getCompanyAnalysis,
  type CompanyAnalysisParams,
  type CompanyAnalysisResult,
} from '@/services/aiCareerAssistantApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

interface CompanyAnalysisPanelProps {
  companyName: string
  orgNumber?: string
  industry?: string
  onClose?: () => void
  className?: string
}

export function CompanyAnalysisPanel({
  companyName,
  orgNumber,
  industry,
  onClose,
  className,
}: CompanyAnalysisPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompanyAnalysisResult | null>(null)
  const [hasStarted, setHasStarted] = useState(false)

  if (!AI_FEATURES.COMPANY_ANALYSIS) {
    return null
  }

  const handleAnalyze = async () => {
    setIsLoading(true)
    setHasStarted(true)
    setError(null)

    try {
      const params: CompanyAnalysisParams = {
        companyName,
        orgNumber,
        industry,
      }

      const response = await getCompanyAnalysis(params)
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="w-3 h-3 text-green-500" />
      case 'negative':
        return <ThumbsDown className="w-3 h-3 text-red-500" />
      default:
        return <Minus className="w-3 h-3 text-stone-600" />
    }
  }

  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'negative':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      default:
        return 'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50'
    }
  }

  if (!hasStarted) {
    return (
      <AiConsentGate compact featureName="Företagsanalys">
        <div className={cn('p-4 rounded-xl bg-gradient-to-br from-[var(--c-bg)] to-sky-50 dark:from-[var(--c-bg)]/30 dark:to-sky-900/20', className)}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50">
              <Building2 className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-stone-800 dark:text-stone-200 mb-1">
                Analysera {companyName}
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-600 mb-3">
                Få AI-genererade insikter om nyheter, kultur och tips för din spontanansökan.
              </p>
              <Button
                onClick={handleAnalyze}
                size="sm"
                leftIcon={<Building2 className="w-4 h-4" />}
              >
                Analysera företag
              </Button>
            </div>
          </div>
        </div>
      </AiConsentGate>
    )
  }

  return (
    <AiConsentGate compact featureName="Företagsanalys">
      <AIResultCard
        title="Företagsanalys"
        subtitle={companyName}
        icon={<Building2 className="w-5 h-5 text-white" />}
        isLoading={isLoading}
        loadingText="Analyserar företaget..."
        error={error}
        onRetry={handleAnalyze}
        className={className}
        headerActions={
          onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Stäng
            </Button>
          )
        }
      >
        {result && (
          <div className="space-y-4">
            {/* Recent News */}
            {result.recentNews.length > 0 && (
              <CollapsibleSection
                title="Senaste nyheterna"
                icon={<Newspaper className="w-4 h-4" />}
                badge={result.recentNews.length}
                defaultOpen
              >
                <div className="space-y-2">
                  {result.recentNews.map((news, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-3 rounded-lg border',
                        getSentimentColor(news.sentiment)
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="text-sm font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
                          {getSentimentIcon(news.sentiment)}
                          {news.title}
                        </h5>
                        <span className="text-xs text-stone-600 flex-shrink-0">
                          {news.date}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-600">
                        {news.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Financial Status */}
            <CollapsibleSection
              title="Ekonomisk status"
              icon={<TrendingUp className="w-4 h-4" />}
              defaultOpen
            >
              <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">
                {result.financialStatus.summary}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {result.financialStatus.revenue && (
                  <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 text-center">
                    <p className="text-xs text-stone-700 mb-0.5">Omsättning</p>
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {result.financialStatus.revenue}
                    </p>
                  </div>
                )}
                {result.financialStatus.employees && (
                  <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 text-center">
                    <p className="text-xs text-stone-700 mb-0.5">Anställda</p>
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {result.financialStatus.employees}
                    </p>
                  </div>
                )}
                {result.financialStatus.growth && (
                  <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 text-center">
                    <p className="text-xs text-stone-700 mb-0.5">Tillväxt</p>
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {result.financialStatus.growth}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Recruitment Needs */}
            <CollapsibleSection
              title="Rekryteringsbehov"
              icon={<Briefcase className="w-4 h-4" />}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    result.recruitmentNeeds.hiring
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-600'
                  )}
                >
                  {result.recruitmentNeeds.hiring ? 'Rekryterar aktivt' : 'Ej aktiv rekrytering'}
                </span>
              </div>

              {result.recruitmentNeeds.roles.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-stone-700 dark:text-stone-600 mb-2">
                    Roller som efterfrågas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.recruitmentNeeds.roles.map((role, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-accent)] text-xs rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.recruitmentNeeds.signals.length > 0 && (
                <>
                  <p className="text-xs font-medium text-stone-700 dark:text-stone-600 mb-2">
                    Signaler
                  </p>
                  <AIList items={result.recruitmentNeeds.signals} />
                </>
              )}
            </CollapsibleSection>

            {/* Company Culture */}
            <CollapsibleSection
              title="Företagskultur"
              icon={<Users className="w-4 h-4" />}
            >
              <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">
                {result.companyCulture.summary}
              </p>

              {result.companyCulture.values.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-stone-700 dark:text-stone-600 mb-2">
                    Värderingar
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.companyCulture.values.map((value, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-stone-600 dark:text-stone-600">
                {result.companyCulture.workEnvironment}
              </p>

              {result.companyCulture.ratings && (
                <div className="flex gap-4 mt-3">
                  {result.companyCulture.ratings.glassdoor && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-stone-600 dark:text-stone-600">
                        Glassdoor: {result.companyCulture.ratings.glassdoor}
                      </span>
                    </div>
                  )}
                  {result.companyCulture.ratings.indeed && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-stone-600 dark:text-stone-600">
                        Indeed: {result.companyCulture.ratings.indeed}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* Application Tips */}
            <CollapsibleSection
              title="Tips för din ansökan"
              icon={<Lightbulb className="w-4 h-4" />}
              defaultOpen
            >
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
                  <p className="text-xs font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] mb-1">
                    Bästa approach
                  </p>
                  <p className="text-sm text-stone-700 dark:text-stone-300">
                    {result.spontaneousApplicationTips.bestApproach}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-stone-700 dark:text-stone-600 mb-2">
                    Samtalsämnen att lyfta
                  </p>
                  <div className="space-y-1">
                    {result.spontaneousApplicationTips.talkingPoints.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50"
                      >
                        <span className="text-sm text-stone-700 dark:text-stone-300">
                          {point}
                        </span>
                        <CopyButton text={point} />
                      </div>
                    ))}
                  </div>
                </div>

                {result.spontaneousApplicationTips.avoidTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                      Undvik att nämna
                    </p>
                    <AIList items={result.spontaneousApplicationTips.avoidTopics} />
                  </div>
                )}

                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <strong>Bästa tid att kontakta:</strong> {result.spontaneousApplicationTips.bestTimeToApply}
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}
      </AIResultCard>
    </AiConsentGate>
  )
}

export default CompanyAnalysisPanel
