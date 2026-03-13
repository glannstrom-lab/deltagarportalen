/**
 * Overview Tab - Main dashboard view with widgets
 */
import { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { DashboardGrid, getWidgetGridClasses } from '@/components/dashboard/DashboardGrid'
import { CompactWidgetFilter, type WidgetType } from '@/components/dashboard/CompactWidgetFilter'
import { WidgetSizeSelector, type WidgetSize } from '@/components/dashboard/WidgetSizeSelector'
import { DashboardGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui'
import {
  CVWidget,
  CoverLetterWidget,
  JobSearchWidget,
  ApplicationsWidget,
  CareerWidget,
  InterestWidget,
  ExercisesWidget,
  DiaryWidget,
  WellnessWidget,
  KnowledgeWidget,
} from '@/components/dashboard'
import { cn } from '@/lib/utils'

const defaultWidgetSizes: Record<WidgetType, WidgetSize> = {
  cv: 'small',
  coverLetter: 'small',
  jobSearch: 'small',
  applications: 'small',
  career: 'small',
  interests: 'small',
  exercises: 'small',
  diary: 'small',
  wellness: 'small',
  knowledge: 'small',
  quests: 'small',
}

const allWidgets: WidgetType[] = [
  'cv', 'coverLetter', 'jobSearch', 'applications', 'career', 'interests', 'exercises', 'diary', 'wellness', 'knowledge', 'quests',
]

const defaultVisibleWidgets: WidgetType[] = ['cv', 'coverLetter', 'jobSearch', 'applications', 'career', 'interests', 'exercises', 'diary', 'wellness', 'knowledge']

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()

  const loadSavedWidgets = (): WidgetType[] => {
    return defaultVisibleWidgets
  }

  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(loadSavedWidgets)
  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetType, WidgetSize>>(defaultWidgetSizes)

  const handleToggleWidget = useCallback((widgetId: WidgetType) => {
    setVisibleWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    )
  }, [])

  const handleShowAll = useCallback(() => setVisibleWidgets(allWidgets), [])
  const handleHideAll = useCallback(() => setVisibleWidgets([]), [])

  const handleSizeChange = useCallback((widgetId: WidgetType, size: WidgetSize) => {
    setWidgetSizes((prev) => ({ ...prev, [widgetId]: size }))
  }, [])

  const renderWidget = (widgetId: WidgetType, content: React.ReactNode) => {
    const size = widgetSizes[widgetId] || 'small'

    return (
      <div
        key={widgetId}
        className={cn(
          getWidgetGridClasses(size),
          'transition-all duration-300 ease-in-out'
        )}
      >
        <div className="relative h-full">
          <div className="absolute top-2 right-2 z-10">
            <WidgetSizeSelector
              currentSize={size}
              onSizeChange={(newSize) => handleSizeChange(widgetId, newSize)}
            />
          </div>
          {content}
        </div>
      </div>
    )
  }

  if (loading) {
    return <DashboardGridSkeleton count={4} />
  }

  if (error) {
    return (
      <ErrorState
        title="Kunde inte ladda dashboard"
        message="Något gick fel när vi hämtade din data. Försök igen."
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <CompactWidgetFilter
        visibleWidgets={visibleWidgets}
        onToggleWidget={handleToggleWidget}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      {/* Widget Grid */}
      <DashboardGrid>
        {visibleWidgets.includes('cv') &&
          renderWidget(
            'cv',
            <CVWidget
              hasCV={data?.cv?.hasCV ?? false}
              progress={data?.cv?.progress ?? 0}
              atsScore={data?.cv?.atsScore ?? 0}
              missingSections={data?.cv?.missingSections}
              savedCVs={data?.cv?.savedCVs}
              currentTemplate={data?.cv?.currentTemplate}
              error={error}
              onRetry={refetch}
              size={widgetSizes['cv']}
            />
          )}

        {visibleWidgets.includes('coverLetter') &&
          renderWidget(
            'coverLetter',
            <CoverLetterWidget
              count={data?.coverLetters?.count ?? 0}
              recentLetters={data?.coverLetters?.recentLetters}
              applicationsCount={data?.applications?.total ?? 0}
              applicationsStatus={data?.applications?.statusBreakdown}
              size={widgetSizes['coverLetter']}
            />
          )}

        {visibleWidgets.includes('jobSearch') &&
          renderWidget(
            'jobSearch',
            <JobSearchWidget
              savedCount={data?.jobs?.savedCount ?? 0}
              newMatches={data?.jobs?.newMatches}
              recentJobs={data?.jobs?.recentSavedJobs}
              size={widgetSizes['jobSearch']}
            />
          )}

        {visibleWidgets.includes('applications') &&
          renderWidget(
            'applications',
            <ApplicationsWidget
              total={data?.applications?.total ?? 0}
              statusBreakdown={data?.applications?.statusBreakdown}
              nextFollowUp={data?.applications?.nextFollowUp}
              size={widgetSizes['applications']}
            />
          )}

        {visibleWidgets.includes('career') &&
          renderWidget(
            'career',
            <CareerWidget
              exploredCount={data?.interest?.hasResult ? 1 : 0}
              recommendedOccupations={data?.interest?.topRecommendations}
              riasecProfile={data?.interest?.riasecProfile}
              size={widgetSizes['career']}
            />
          )}

        {visibleWidgets.includes('interests') &&
          renderWidget(
            'interests',
            <InterestWidget
              hasResult={data?.interest?.hasResult ?? false}
              topRecommendations={data?.interest?.topRecommendations}
              completedAt={data?.interest?.completedAt}
              answeredQuestions={data?.interest?.answeredQuestions}
              totalQuestions={data?.interest?.totalQuestions}
              riasecProfile={data?.interest?.riasecProfile}
              size={widgetSizes['interests']}
            />
          )}

        {visibleWidgets.includes('exercises') &&
          renderWidget(
            'exercises',
            <ExercisesWidget
              totalExercises={data?.exercises?.totalExercises ?? 38}
              completedCount={data?.exercises?.completedExercises ?? 0}
              completionRate={data?.exercises?.completionRate ?? 0}
              streakDays={data?.exercises?.streakDays ?? 0}
              size={widgetSizes['exercises']}
            />
          )}

        {visibleWidgets.includes('diary') &&
          renderWidget(
            'diary',
            <DiaryWidget
              upcomingEvents={data?.calendar?.upcomingEvents}
              eventsThisWeek={data?.calendar?.eventsThisWeek ?? 0}
              hasConsultantMeeting={data?.calendar?.hasConsultantMeeting ?? false}
              streakDays={data?.activity?.streakDays ?? 0}
              size={widgetSizes['diary']}
            />
          )}

        {visibleWidgets.includes('wellness') &&
          renderWidget(
            'wellness',
            <WellnessWidget
              completedActivities={0}
              streakDays={0}
              moodToday={null}
              size={widgetSizes['wellness']}
            />
          )}

        {visibleWidgets.includes('knowledge') &&
          renderWidget(
            'knowledge',
            <KnowledgeWidget
              readCount={0}
              savedCount={0}
              totalArticles={0}
              size={widgetSizes['knowledge']}
            />
          )}
      </DashboardGrid>
    </div>
  )
}
