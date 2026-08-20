/**
 * AI-lönekompassen.
 *
 * Tre fel som rättades 2026-08-20:
 *
 * · Panelen tog emot `currentSalary` från kalkylatorn och skickade det till
 *   modellen som "NUVARANDE LÖN". Användaren hade aldrig angett någon lön —
 *   talet var kalkylatorns egen uppskattning. Propen finns inte längre.
 * · "Källor" under svaret var `result.sources`, alltså det modellen själv
 *   skrivit in i sin JSON. De riktiga citationerna från Perplexity fanns i
 *   svarets `citations` och kastades bort. Nu visas de riktiga, eller inga.
 * · Yrke, region och erfarenhet kopierades till eget tillstånd vid montering,
 *   då kalkylatorns fält alltid är tomma. Valen syntes därför aldrig här.
 *   Nu läses propsen tills användaren själv ändrar fältet.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  skills?: string[]
  className?: string
}

export function SalaryInsightsPanel({
  occupation: initialOccupation,
  region: initialRegion,
  experienceYears: initialExperience,
  skills: initialSkills,
  className,
}: SalaryInsightsPanelProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SalaryCompassResult | null>(null)
  const [citations, setCitations] = useState<string[]>([])

  // Egna ändringar vinner över propsen, men bara när användaren gjort någon.
  const [egetYrke, setEgetYrke] = useState<string | null>(null)
  const [egenRegion, setEgenRegion] = useState<string | null>(null)
  const [egenErfarenhet, setEgenErfarenhet] = useState<string | null>(null)

  const occupation = egetYrke ?? initialOccupation ?? ''
  const region = egenRegion ?? initialRegion ?? ''
  const experience = egenErfarenhet ?? (initialExperience?.toString() || '')

  if (!AI_FEATURES.SALARY_COMPASS) {
    return null
  }

  const handleAnalyze = async () => {
    if (!occupation.trim()) {
      setError(t('salary.insights.missingOccupation'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params: SalaryCompassParams = {
        occupation: occupation.trim(),
        region: region.trim() || undefined,
        experienceYears: experience ? parseInt(experience) : undefined,
        skills: initialSkills,
      }

      const response = await getSalaryCompass(params)
      setResult(response.result)
      setCitations(response.citations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('salary.insights.genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!result && !isLoading && !error) {
    return (
      <AiConsentGate compact featureName={t('salary.insights.title')}>
        <div className={cn('p-5 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50', className)}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30">
              <TrendingUp className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-medium text-stone-800 dark:text-stone-100">
                {t('salary.insights.title')}
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                {t('salary.insights.subtitle')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label={t('salary.insights.occupationLabel')}
              value={occupation}
              onChange={(e) => setEgetYrke(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('salary.insights.regionLabel')}
                value={region}
                onChange={(e) => setEgenRegion(e.target.value)}
              />
              <Input
                label={t('salary.insights.experienceLabel')}
                hint={t('salary.insights.experienceHint')}
                type="number"
                value={experience}
                onChange={(e) => setEgenErfarenhet(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              className="w-full"
              leftIcon={<TrendingUp className="w-4 h-4" />}
            >
              {t('salary.insights.fetch')}
            </Button>
          </div>
        </div>
      </AiConsentGate>
    )
  }

  return (
    <AiConsentGate compact featureName={t('salary.insights.title')}>
      <AIResultCard
        aiGenerated={!!result}
        title={t('salary.insights.title')}
        subtitle={`${occupation}${region ? ` · ${region}` : ''}`}
        icon={<TrendingUp className="w-5 h-5 text-white" />}
        isLoading={isLoading}
        loadingText={t('salary.insights.loading')}
        error={error}
        onRetry={handleAnalyze}
        sources={citations.length > 0 ? citations : undefined}
        className={className}
        headerActions={
          result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setResult(null); setCitations([]) }}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {t('salary.insights.newSearch')}
            </Button>
          )
        }
      >
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AIStatBlock label={t('salary.insights.average')} value={result.marketData.averageSalary} />
              <AIStatBlock label={t('salary.insights.range')} value={result.marketData.salaryRange} />
              <AIStatBlock
                label={t('salary.insights.p25')}
                value={result.marketData.percentile25}
                subValue={t('salary.insights.p25Sub')}
              />
              <AIStatBlock
                label={t('salary.insights.p75')}
                value={result.marketData.percentile75}
                subValue={t('salary.insights.p75Sub')}
              />
            </div>

            <CollapsibleSection
              title={t('salary.insights.progression')}
              icon={<BarChart3 className="w-4 h-4" />}
              defaultOpen
            >
              <div className="flex items-end justify-between gap-4 py-4">
                {([
                  { hojd: 'h-16', etikett: t('salary.insights.year1'), text: result.progression.year1, ton: 'bg-[var(--c-solid)]/60' },
                  { hojd: 'h-24', etikett: t('salary.insights.year3'), text: result.progression.year3, ton: 'bg-[var(--c-solid)]/80' },
                  { hojd: 'h-32', etikett: t('salary.insights.year5'), text: result.progression.year5, ton: 'bg-[var(--c-solid)]' },
                ]).map((steg, i) => (
                  <div key={steg.etikett} className="flex items-end gap-4">
                    {i > 0 && <ChevronRight className="w-4 h-4 text-stone-500 mb-8" aria-hidden="true" />}
                    <div className="text-center">
                      <div className={cn(steg.hojd, 'w-12 rounded-t-lg flex items-end justify-center', steg.ton)}>
                        <span className="text-white text-xs font-medium pb-1">{steg.etikett}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-2">{steg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {result.highValueSkills.length > 0 && (
              <CollapsibleSection
                title={t('salary.insights.highValueSkills')}
                icon={<Award className="w-4 h-4" />}
                badge={result.highValueSkills.length}
              >
                <div className="space-y-2">
                  {result.highValueSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50"
                    >
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                        {skill.skill}
                      </span>
                      <span className="text-sm font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">
                        {skill.salaryImpact}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {result.negotiationInsights.length > 0 && (
              <CollapsibleSection
                title={t('salary.insights.negotiationInsights')}
                icon={<Lightbulb className="w-4 h-4" />}
                badge={result.negotiationInsights.length}
              >
                <AIList items={result.negotiationInsights} />
              </CollapsibleSection>
            )}

            {result.comparisons.length > 0 && (
              <CollapsibleSection
                title={t('salary.insights.comparisons')}
                icon={<DollarSign className="w-4 h-4" />}
              >
                <div className="space-y-2">
                  {result.comparisons.map((comp, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-stone-200 dark:border-stone-700"
                    >
                      <div className="flex flex-wrap gap-2 text-xs">
                        {[comp.industry, comp.region, comp.experience].map((del) => (
                          <span
                            key={del}
                            className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-600 dark:text-stone-300"
                          >
                            {del}
                          </span>
                        ))}
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
