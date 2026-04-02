/**
 * Journey Page - Min Jobbresa
 * Main page showing the user's job seeking journey with gamification
 */

import { useState } from 'react'
import { Map, RefreshCw, Loader2, Trophy, Target, BarChart3 } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { useJourney } from '@/hooks/useJourney'
import {
  JourneyProgress,
  JourneyMap,
  JourneyNextSteps,
  JourneyTimeline,
  JourneyWeekSummary,
  JourneyPhaseDetail,
  JourneyGoals,
  JourneyAchievements,
  JourneyCelebration,
  JourneyStats
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
    goals,
    achievements,
    recentCompletions,
    recentAchievements,
    isLoading,
    error,
    refresh,
    createGoal,
    updateGoalProgress,
    deleteGoal,
    dismissCompletions
  } = useJourney()

  const [selectedPhase, setSelectedPhase] = useState<JourneyPhase | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'achievements' | 'stats'>('overview')

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" aria-hidden="true" />
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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'overview'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <Map className="w-4 h-4" />
            Översikt
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'goals'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <Target className="w-4 h-4" />
            Mål
            {goals.filter(g => !g.is_completed).length > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {goals.filter(g => !g.is_completed).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'achievements'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <Trophy className="w-4 h-4" />
            Achievements
            {achievements.filter(a => a.is_unlocked).length > 0 && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {achievements.filter(a => a.is_unlocked).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'stats'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <BarChart3 className="w-4 h-4" />
            Statistik
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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

              {/* Right Column - Timeline & Compact Widgets */}
              <div className="space-y-6">
                {/* Compact Achievements */}
                <JourneyAchievements achievements={achievements} compact />

                <JourneyTimeline activities={activities} maxItems={8} />

                {/* Weekly Summary (Mobile) */}
                <div className="lg:hidden">
                  {weeklySummary && <JourneyWeekSummary summary={weeklySummary} />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <JourneyGoals
              goals={goals}
              onCreateGoal={createGoal}
              onUpdateProgress={updateGoalProgress}
              onDeleteGoal={deleteGoal}
            />

            <div className="space-y-6">
              {/* Weekly Summary */}
              {weeklySummary && <JourneyWeekSummary summary={weeklySummary} />}

              {/* Tips for goal setting */}
              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h4 className="font-semibold text-indigo-900 mb-3">Tips för att sätta mål</h4>
                <ul className="space-y-2 text-sm text-indigo-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    Börja med små, uppnåeliga mål
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    Sätt veckomål istället för månadsmål
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    Fira varje uppnått mål - du förtjänar det!
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    Fokusera på aktiviteter, inte resultat
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <JourneyAchievements achievements={achievements} />
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <JourneyStats stats={stats} />

            <div className="space-y-6">
              {/* Weekly Summary */}
              {weeklySummary && <JourneyWeekSummary summary={weeklySummary} />}

              {/* Activity Timeline */}
              <JourneyTimeline activities={activities} maxItems={10} />
            </div>
          </div>
        )}

        {/* Phase Detail Modal */}
        {selectedPhase && progress.phaseProgress[selectedPhase.id] && (
          <JourneyPhaseDetail
            phase={selectedPhase}
            progress={progress.phaseProgress[selectedPhase.id]}
            completedMilestones={progress.milestonesCompleted}
            onClose={() => setSelectedPhase(null)}
          />
        )}

        {/* Celebration Modal */}
        {((recentCompletions && recentCompletions.completed.length > 0) ||
          (recentAchievements && recentAchievements.unlocked.length > 0)) && (
          <JourneyCelebration
            completedMilestones={recentCompletions?.completed || []}
            unlockedAchievements={recentAchievements?.unlocked || []}
            xpEarned={(recentCompletions?.xpEarned || 0) + (recentAchievements?.xpEarned || 0)}
            onDismiss={dismissCompletions}
          />
        )}
      </div>
    </div>
  )
}
