/**
 * Journey Page - Min Jobbresa
 * Main page showing the user's job seeking journey with gamification
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 page-transition flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-300">{t('journey.loading')}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 page-transition flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {t('journey.errorLoading')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.tryAgain')}
          </Button>
        </div>
      </div>
    )
  }

  // Empty state (new user)
  if (!progress || !currentPhase) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 page-transition">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-200 dark:shadow-teal-900/30">
              <Map className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {t('journey.welcomeTitle')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('journey.welcomeDescription')}
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
              {t('journey.startJourney')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 page-transition">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200 dark:shadow-teal-900/30">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('journey.title')}</h1>
              <p className="text-gray-600 dark:text-gray-300">{t('journey.subtitle')}</p>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.refresh')}
          </Button>
        </div>

        {/* Progress Hero */}
        <div className="mb-8">
          <JourneyProgress progress={progress} currentPhase={currentPhase} />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-stone-200 dark:border-stone-700 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'overview'
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }
            `}
          >
            <Map className="w-4 h-4" />
            {t('journey.tabs.overview')}
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'goals'
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }
            `}
          >
            <Target className="w-4 h-4" />
            {t('journey.tabs.goals')}
            {goals.filter(g => !g.is_completed).length > 0 && (
              <span className="bg-teal-500 dark:bg-teal-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {goals.filter(g => !g.is_completed).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'achievements'
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }
            `}
          >
            <Trophy className="w-4 h-4" />
            {t('journey.tabs.achievements')}
            {achievements.filter(a => a.is_unlocked).length > 0 && (
              <span className="bg-amber-500 dark:bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {achievements.filter(a => a.is_unlocked).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === 'stats'
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }
            `}
          >
            <BarChart3 className="w-4 h-4" />
            {t('journey.tabs.stats')}
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
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-6 border border-teal-100 dark:border-teal-800">
                <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-3">{t('journey.goalTips.title')}</h4>
                <ul className="space-y-2 text-sm text-teal-700 dark:text-teal-300">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 dark:text-teal-400 mt-0.5">•</span>
                    {t('journey.goalTips.tip1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 dark:text-teal-400 mt-0.5">•</span>
                    {t('journey.goalTips.tip2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 dark:text-teal-400 mt-0.5">•</span>
                    {t('journey.goalTips.tip3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 dark:text-teal-400 mt-0.5">•</span>
                    {t('journey.goalTips.tip4')}
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
