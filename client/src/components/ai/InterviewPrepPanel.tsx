/**
 * Interview Preparation Panel
 * AI-powered interview preparation with company research and question prep
 */

import { useState } from 'react'
import {
  MessageSquare,
  Building2,
  HelpCircle,
  Lightbulb,
  DollarSign,
  Newspaper,
  Users,
  AlertTriangle,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { AiConsentGate } from './AiConsentGate'
import {
  AIResultCard,
  AILoadingIndicator,
  CollapsibleSection,
  AIList,
  CopyButton,
} from './AIResultCard'
import {
  getInterviewPrep,
  type InterviewPrepParams,
  type InterviewPrepResult,
} from '@/services/aiCareerAssistantApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

interface InterviewPrepPanelProps {
  companyName: string
  orgNumber?: string
  jobTitle?: string
  jobDescription?: string
  className?: string
}

export function InterviewPrepPanel({
  companyName,
  orgNumber,
  jobTitle,
  jobDescription,
  className,
}: InterviewPrepPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InterviewPrepResult | null>(null)

  if (!AI_FEATURES.INTERVIEW_PREP) {
    return null
  }

  const handleAnalyze = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: InterviewPrepParams = {
        companyName,
        orgNumber,
        jobTitle,
        jobDescription,
      }

      const response = await getInterviewPrep(params)
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  if (!result && !isLoading && !error) {
    return (
      <AiConsentGate compact featureName="Intervjuförberedelse">
        <div className={cn('p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20', className)}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50">
              <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                Förbered dig för intervjun
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-600 mb-3">
                Få AI-genererade intervjutips, företagsinformation och förväntade frågor.
              </p>
              <Button
                onClick={handleAnalyze}
                size="sm"
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Förbered intervju
              </Button>
            </div>
          </div>
        </div>
      </AiConsentGate>
    )
  }

  return (
    <AiConsentGate compact featureName="Intervjuförberedelse">
      <AIResultCard
        title="Intervjuförberedelse"
        subtitle={`${companyName}${jobTitle ? ` - ${jobTitle}` : ''}`}
        icon={<MessageSquare className="w-5 h-5 text-white" />}
        isLoading={isLoading}
        loadingText="Analyserar företaget..."
        error={error}
        onRetry={handleAnalyze}
        className={className}
      >
        {result && (
          <div className="space-y-4">
            {/* Company Info */}
            <CollapsibleSection
              title="Om företaget"
              icon={<Building2 className="w-4 h-4" />}
              defaultOpen
            >
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                {result.companyInfo.summary}
              </p>

              {result.companyInfo.recentNews.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2 flex items-center gap-1">
                    <Newspaper className="w-3 h-3" />
                    Senaste nyheterna
                  </p>
                  <AIList items={result.companyInfo.recentNews} />
                </div>
              )}

              {result.companyInfo.culture && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Företagskultur
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {result.companyInfo.culture}
                  </p>
                </div>
              )}

              {result.companyInfo.challenges.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Utmaningar att diskutera
                  </p>
                  <AIList items={result.companyInfo.challenges} />
                </div>
              )}
            </CollapsibleSection>

            {/* Interview Questions */}
            <CollapsibleSection
              title="Förväntade intervjufrågor"
              icon={<HelpCircle className="w-4 h-4" />}
              badge={
                result.interviewQuestions.common.length +
                result.interviewQuestions.roleSpecific.length +
                result.interviewQuestions.behavioral.length
              }
              defaultOpen
            >
              {result.interviewQuestions.common.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2">
                    Vanliga frågor
                  </p>
                  <AIList items={result.interviewQuestions.common} />
                </div>
              )}

              {result.interviewQuestions.roleSpecific.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2">
                    Rollspecifika frågor
                  </p>
                  <AIList items={result.interviewQuestions.roleSpecific} />
                </div>
              )}

              {result.interviewQuestions.behavioral.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2">
                    Beteendefrågor
                  </p>
                  <AIList items={result.interviewQuestions.behavioral} />
                </div>
              )}
            </CollapsibleSection>

            {/* Tips */}
            <CollapsibleSection
              title="Tips inför intervjun"
              icon={<Lightbulb className="w-4 h-4" />}
              badge={result.tipsForCandidate.length}
            >
              <AIList items={result.tipsForCandidate} />
            </CollapsibleSection>

            {/* Questions to Ask */}
            <CollapsibleSection
              title="Frågor att ställa"
              icon={<MessageSquare className="w-4 h-4" />}
              badge={result.questionsToAsk.length}
            >
              <div className="space-y-2">
                {result.questionsToAsk.map((question, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {question}
                    </span>
                    <CopyButton text={question} />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Salary Expectations */}
            <CollapsibleSection
              title="Löneförväntningar"
              icon={<DollarSign className="w-4 h-4" />}
            >
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 mb-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Förväntat löneintervall: {result.salaryExpectations.range}
                </p>
              </div>
              {result.salaryExpectations.negotiationTips.length > 0 && (
                <>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2">
                    Förhandlingstips
                  </p>
                  <AIList items={result.salaryExpectations.negotiationTips} />
                </>
              )}
            </CollapsibleSection>
          </div>
        )}
      </AIResultCard>
    </AiConsentGate>
  )
}

export default InterviewPrepPanel
