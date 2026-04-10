/**
 * Commute Planner Panel
 * AI-powered commute analysis for job search
 */

import { useState } from 'react'
import {
  MapPin,
  Train,
  Car,
  Bike,
  Clock,
  DollarSign,
  Lightbulb,
  Home,
  Building2,
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
  getCommutePlan,
  type CommutePlannerParams,
  type CommutePlannerResult,
} from '@/services/aiCareerAssistantApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

interface CommutePlannerPanelProps {
  workAddress?: string
  workCompanyName?: string
  savedHomeAddress?: string
  className?: string
}

export function CommutePlannerPanel({
  workAddress: initialWorkAddress,
  workCompanyName,
  savedHomeAddress,
  className,
}: CommutePlannerPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CommutePlannerResult | null>(null)

  // Form state
  const [homeAddress, setHomeAddress] = useState(savedHomeAddress || '')
  const [workAddress, setWorkAddress] = useState(initialWorkAddress || '')

  if (!AI_FEATURES.COMMUTE_PLANNER) {
    return null
  }

  const handleAnalyze = async () => {
    if (!homeAddress.trim()) {
      setError('Ange din hemadress')
      return
    }
    if (!workAddress.trim()) {
      setError('Ange arbetsplatsens adress')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params: CommutePlannerParams = {
        homeAddress: homeAddress.trim(),
        workAddress: workAddress.trim(),
      }

      const response = await getCommutePlan(params)
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  if (!result && !isLoading && !error) {
    return (
      <AiConsentGate compact featureName="Pendlingsplaneraren">
        <div className={cn('p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800', className)}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
              <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">
                Pendlingsplanerare
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-600">
                Beräkna restid och kostnad
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <Input
                placeholder="Din hemadress"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <Input
                placeholder={workCompanyName || "Arbetsplatsens adress"}
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              className="w-full"
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              Beräkna pendling
            </Button>
          </div>
        </div>
      </AiConsentGate>
    )
  }

  return (
    <AiConsentGate compact featureName="Pendlingsplaneraren">
      <AIResultCard
        title="Pendlingsanalys"
        subtitle={workCompanyName || workAddress}
        icon={<MapPin className="w-5 h-5 text-white" />}
        isLoading={isLoading}
        loadingText="Beräknar pendlingsalternativ..."
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
              Ny beräkning
            </Button>
          )
        }
      >
        {result && (
          <div className="space-y-4">
            {/* Transport Options Grid */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Public Transit */}
              {result.publicTransit && (
                <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Train className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Kollektivtrafik
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Restid</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {result.publicTransit.duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Byten</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {result.publicTransit.transfers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Månadskostnad</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {result.publicTransit.monthlyCost}
                      </span>
                    </div>
                    {result.publicTransit.lines.length > 0 && (
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                        <div className="flex flex-wrap gap-1">
                          {result.publicTransit.lines.map((line, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Car */}
              {result.car && (
                <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-5 h-5 text-slate-600 dark:text-slate-600" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Bil
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Restid</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {result.car.duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Avstånd</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {result.car.distance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Månadskostnad</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {result.car.monthlyCost}
                      </span>
                    </div>
                    {result.car.parkingInfo && (
                      <p className="text-xs text-slate-700 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {result.car.parkingInfo}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Bike */}
              {result.bike && (
                <div className="p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Bike className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Cykel
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Restid</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {result.bike.duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Avstånd</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {result.bike.distance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Kostnad</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        0 kr
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 pt-2 border-t border-green-200 dark:border-green-800">
                      {result.bike.feasibility}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendation */}
            {result.recommendation && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 border border-teal-200 dark:border-teal-800">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                      Rekommendation
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {result.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Remote Work Suggestion */}
            {result.remoteWorkSuggestion && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Distansarbete:</strong> {result.remoteWorkSuggestion}
                </p>
              </div>
            )}

            {/* Alternative Jobs Suggestion */}
            {result.alternativeJobs?.suggestion && (
              <CollapsibleSection
                title="Alternativa jobb"
                icon={<Building2 className="w-4 h-4" />}
              >
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {result.alternativeJobs.suggestion}
                </p>
              </CollapsibleSection>
            )}

            {/* Summary Stats */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 text-center">
                Från: {homeAddress} → Till: {workAddress}
              </p>
            </div>
          </div>
        )}
      </AIResultCard>
    </AiConsentGate>
  )
}

export default CommutePlannerPanel
