/**
 * Education Path Panel
 * AI-powered education and learning recommendations
 */

import { useState } from 'react'
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  DollarSign,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Lightbulb,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AiConsentGate } from './AiConsentGate'
import {
  AIResultCard,
  CollapsibleSection,
  AIStatBlock,
} from './AIResultCard'
import {
  getEducationGuide,
  type EducationGuideParams,
  type EducationGuideResult,
} from '@/services/aiCareerAssistantApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

interface EducationPathPanelProps {
  targetOccupation?: string
  currentSkills?: string[]
  className?: string
}

export function EducationPathPanel({
  targetOccupation: initialOccupation,
  currentSkills,
  className,
}: EducationPathPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EducationGuideResult | null>(null)

  // Form state
  const [occupation, setOccupation] = useState(initialOccupation || '')
  const [budget, setBudget] = useState('')
  const [timeAvailable, setTimeAvailable] = useState('')

  if (!AI_FEATURES.EDUCATION_GUIDE) {
    return null
  }

  const handleAnalyze = async () => {
    if (!occupation.trim()) {
      setError('Ange ett målyrke')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params: EducationGuideParams = {
        targetOccupation: occupation.trim(),
        currentSkills,
        budget: budget.trim() || undefined,
        timeAvailable: timeAvailable.trim() || undefined,
      }

      const response = await getEducationGuide(params)
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  if (!result && !isLoading && !error) {
    return (
      <AiConsentGate compact featureName="Utbildningsguiden">
        <div className={cn('p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800', className)}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">
                AI Utbildningsguide
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-600">
                Hitta rätt kurser och certifieringar
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Målyrke (t.ex. Fullstack-utvecklare)"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Budget (t.ex. 10 000 kr)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <Input
                placeholder="Tid (t.ex. 6 månader)"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              className="w-full"
              leftIcon={<GraduationCap className="w-4 h-4" />}
            >
              Hitta utbildningsvägar
            </Button>
          </div>
        </div>
      </AiConsentGate>
    )
  }

  return (
    <AiConsentGate compact featureName="Utbildningsguiden">
      <AIResultCard
        title="Utbildningsguide"
        subtitle={occupation}
        icon={<GraduationCap className="w-5 h-5 text-white" />}
        isLoading={isLoading}
        loadingText="Söker utbildningar..."
        error={error}
        onRetry={handleAnalyze}
        className={className}
        headerActions={
          result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResult(null)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Ny sökning
            </Button>
          )
        }
      >
        {result && (
          <div className="space-y-4">
            {/* ROI Analysis */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-medium text-slate-800 dark:text-slate-200">
                  ROI-analys
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <AIStatBlock
                  label="Tidsåtgång"
                  value={result.roiAnalysis.investmentTime}
                />
                <AIStatBlock
                  label="Kostnad"
                  value={result.roiAnalysis.estimatedCost}
                />
                <AIStatBlock
                  label="Löneökning"
                  value={result.roiAnalysis.expectedSalaryIncrease}
                  trend="up"
                />
                <AIStatBlock
                  label="Återbetalningstid"
                  value={result.roiAnalysis.paybackPeriod}
                />
              </div>
            </div>

            {/* Learning Path */}
            {result.learningPath.length > 0 && (
              <CollapsibleSection
                title="Rekommenderad läroplan"
                icon={<Lightbulb className="w-4 h-4" />}
                defaultOpen
              >
                <div className="relative pl-4">
                  {/* Timeline line */}
                  <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-500 to-sky-500" />

                  <div className="space-y-4">
                    {result.learningPath.map((step) => (
                      <div key={step.step} className="relative flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className="absolute -left-4 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white dark:ring-slate-900" />

                        <div className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                              Steg {step.step}
                            </span>
                            <span className="text-xs text-slate-600">
                              {step.timeframe}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                            {step.action}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-600">
                            Resultat: {step.outcome}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Free Courses */}
            {result.freeCourses.length > 0 && (
              <CollapsibleSection
                title="Gratiskurser"
                icon={<BookOpen className="w-4 h-4" />}
                badge={result.freeCourses.length}
                defaultOpen
              >
                <div className="space-y-2">
                  {result.freeCourses.map((course, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                            {course.title}
                          </h5>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full">
                              {course.provider}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-600 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.duration}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-600 rounded-full">
                              {course.level}
                            </span>
                          </div>
                        </div>
                        {course.url && (
                          <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-700" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Certifications */}
            {result.certifications.length > 0 && (
              <CollapsibleSection
                title="Certifieringar"
                icon={<Award className="w-4 h-4" />}
                badge={result.certifications.length}
              >
                <div className="space-y-2">
                  {result.certifications.map((cert, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {cert.name}
                        </h5>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          {cert.cost}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-600 rounded-full">
                          {cert.provider}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-600 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cert.timeToComplete}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-600">
                        {cert.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Formal Education */}
            {result.formalEducation.length > 0 && (
              <CollapsibleSection
                title="Formella utbildningar"
                icon={<GraduationCap className="w-4 h-4" />}
                badge={result.formalEducation.length}
              >
                <div className="space-y-2">
                  {result.formalEducation.map((edu, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                          {edu.type}
                        </span>
                      </div>
                      <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                        {edu.provider}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {edu.duration}
                        </span>
                        <span>{edu.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        )}
      </AIResultCard>
    </AiConsentGate>
  )
}

export default EducationPathPanel
