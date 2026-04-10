/**
 * Salary Insights Panel
 * AI-powered salary market data and negotiation insights
 */

import { useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Lightbulb,
  Award,
  ChevronRight,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AiConsentGate } from './AiConsentGate'
import {
  AIResultCard,
  CollapsibleSection,
  AIList,
  AIStatBlock,
} from './AIResultCard'
import {
  getSalaryCompass,
  type SalaryCompassParams,
  type SalaryCompassResult,
} from '@/services/aiCareerAssistantApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

interface SalaryInsightsPanelProps {
  occupation?: string
  region?: string
  experienceYears?: number
  currentSalary?: number
  skills?: string[]
  className?: string
}

export function SalaryInsightsPanel({
  occupation: initialOccupation,
  region: initialRegion,
  experienceYears: initialExperience,
  currentSalary: initialSalary,
  skills: initialSkills,
  className,
}: SalaryInsightsPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SalaryCompassResult | null>(null)

  // Form state
  const [occupation, setOccupation] = useState(initialOccupation || '')
  const [region, setRegion] = useState(initialRegion || '')
  const [experience, setExperience] = useState(initialExperience?.toString() || '')

  if (!AI_FEATURES.SALARY_COMPASS) {
    return null
  }

  const handleAnalyze = async () => {
    if (!occupation.trim()) {
      setError('Ange ett yrke')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params: SalaryCompassParams = {
        occupation: occupation.trim(),
        region: region.trim() || undefined,
        experienceYears: experience ? parseInt(experience) : undefined,
        currentSalary: initialSalary,
        skills: initialSkills,
      }

      const response = await getSalaryCompass(params)
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  if (!result && !isLoading && !error) {
    return (
      <AiConsentGate compact featureName="Lönekompass">
        <div className={cn('p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800', className)}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">
                AI Lönekompass
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-600">
                Få aktuell lönedata och förhandlingstips
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Yrke (t.ex. Systemutvecklare)"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Region (valfritt)"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
              <Input
                placeholder="Erfarenhet (år)"
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              className="w-full"
              leftIcon={<TrendingUp className="w-4 h-4" />}
            >
              Hämta lönedata
            </Button>
          </div>
        </div>
      </AiConsentGate>
    )
  }

  return (
    <AiConsentGate compact featureName="Lönekompass">
      <AIResultCard
        title="AI Lönekompass"
        subtitle={`${occupation}${region ? ` i ${region}` : ''}`}
        icon={<TrendingUp className="w-5 h-5 text-white" />}
        isLoading={isLoading}
        loadingText="Hämtar marknadsdata..."
        error={error}
        onRetry={handleAnalyze}
        sources={result?.sources}
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
            {/* Market Data Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AIStatBlock
                label="Medellön"
                value={result.marketData.averageSalary}
              />
              <AIStatBlock
                label="Intervall"
                value={result.marketData.salaryRange}
              />
              <AIStatBlock
                label="25:e percentil"
                value={result.marketData.percentile25}
                subValue="Lägre kvartil"
              />
              <AIStatBlock
                label="75:e percentil"
                value={result.marketData.percentile75}
                subValue="Högre kvartil"
              />
            </div>

            {/* Salary Progression */}
            <CollapsibleSection
              title="Löneutveckling"
              icon={<BarChart3 className="w-4 h-4" />}
              defaultOpen
            >
              <div className="flex items-end justify-between gap-4 py-4">
                <div className="text-center">
                  <div className="h-16 w-12 bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-lg flex items-end justify-center">
                    <span className="text-white text-xs font-medium pb-1">1 år</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-600 mt-2">
                    {result.progression.year1}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 mb-8" />
                <div className="text-center">
                  <div className="h-24 w-12 bg-gradient-to-t from-sky-500 to-sky-400 rounded-t-lg flex items-end justify-center">
                    <span className="text-white text-xs font-medium pb-1">3 år</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-600 mt-2">
                    {result.progression.year3}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 mb-8" />
                <div className="text-center">
                  <div className="h-32 w-12 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg flex items-end justify-center">
                    <span className="text-white text-xs font-medium pb-1">5 år</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-600 mt-2">
                    {result.progression.year5}
                  </p>
                </div>
              </div>
            </CollapsibleSection>

            {/* High Value Skills */}
            {result.highValueSkills.length > 0 && (
              <CollapsibleSection
                title="Kompetenser som höjer lönen"
                icon={<Award className="w-4 h-4" />}
                badge={result.highValueSkills.length}
              >
                <div className="space-y-2">
                  {result.highValueSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {skill.skill}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {skill.salaryImpact}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Negotiation Insights */}
            {result.negotiationInsights.length > 0 && (
              <CollapsibleSection
                title="Förhandlingsinsikter"
                icon={<Lightbulb className="w-4 h-4" />}
                badge={result.negotiationInsights.length}
              >
                <AIList items={result.negotiationInsights} />
              </CollapsibleSection>
            )}

            {/* Comparisons */}
            {result.comparisons.length > 0 && (
              <CollapsibleSection
                title="Jämförelser"
                icon={<DollarSign className="w-4 h-4" />}
              >
                <div className="space-y-2">
                  {result.comparisons.map((comp, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-600">
                          {comp.industry}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-600">
                          {comp.region}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-600">
                          {comp.experience}
                        </span>
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

export default SalaryInsightsPanel
