/**
 * Journey Page - Min Jobbresa
 * Main page showing the user's job seeking journey
 */

import { useState } from 'react'
import { Map, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useJourney } from '@/hooks/useJourney'
import {
  JourneyProgress,
  JourneyMap,
  JourneyNextSteps,
  JourneyTimeline,
  JourneyWeekSummary,
  JourneyPhaseDetail
} from '@/components/journey'
import type { JourneyPhase } from '@/types/journey.types'

export default function Journey() {
  const {
    progress,
    stats,
    activities,
    nextSteps,
    weeklySummary,
    phases,
    currentPhase,
    isLoading,
    error,
    refresh
  } = useJourney()

  const [selectedPhase, setSelectedPhase] = useState<JourneyPhase | null>(null)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Laddar din jobbresa...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Kunde inte ladda din resa
          </h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Försök igen
          </Button>
        </div>
      </div>
    )
  }

  // Empty state (new user)
  if (!progress || !currentPhase) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
              <Map className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Välkommen till Min Jobbresa
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Här kan du följa din väg mot anställning. Vi guidar dig steg för steg
              genom jobbsökarprocessen och firar dina framsteg längs vägen.
            </p>
          </div>

          <JourneyMap
            phases={phases}
            currentPhaseId={1}
            phaseProgress={{}}
            onPhaseClick={setSelectedPhase}
          />

          <div className="mt-8 text-center">
            <Button size="lg" onClick={() => window.location.href = '/'}>
              Börja din resa
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Min Jobbresa</h1>
              <p className="text-slate-600">Följ din väg mot anställning</p>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Uppdatera
          </Button>
        </div>

        {/* Progress Hero */}
        <div className="mb-8">
          <JourneyProgress progress={progress} currentPhase={currentPhase} />
        </div>

        {/* Journey Map */}
        <div className="mb-8">
          <JourneyMap
            phases={phases}
            currentPhaseId={progress.currentPhase}
            phaseProgress={progress.phaseProgress}
            onPhaseClick={setSelectedPhase}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Next Steps */}
          <div className="lg:col-span-2 space-y-8">
            <JourneyNextSteps steps={nextSteps} />

            {/* Weekly Summary (Desktop) */}
            <div className="hidden lg:block">
              {weeklySummary && <JourneyWeekSummary summary={weeklySummary} />}
            </div>
          </div>

          {/* Right Column - Timeline */}
          <div className="space-y-8">
            <JourneyTimeline activities={activities} maxItems={10} />

            {/* Weekly Summary (Mobile) */}
            <div className="lg:hidden">
              {weeklySummary && <JourneyWeekSummary summary={weeklySummary} />}
            </div>
          </div>
        </div>

        {/* Phase Detail Modal */}
        {selectedPhase && progress.phaseProgress[selectedPhase.id] && (
          <JourneyPhaseDetail
            phase={selectedPhase}
            progress={progress.phaseProgress[selectedPhase.id]}
            completedMilestones={progress.milestonesCompleted}
            onClose={() => setSelectedPhase(null)}
          />
        )}
      </div>
    </div>
  )
}
