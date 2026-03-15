/**
 * Overview Tab - Main dashboard view with widgets
 * Uppdaterad med riktig data, energianpassning och nya funktioner
 */
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
// Energy store removed - widgets shown based on user progress only
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
  QuestsWidget,
} from '@/components/dashboard'
import { NextStepWidget } from '@/components/dashboard/widgets/NextStepWidget'
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist'
import { WeeklySummary } from '@/components/dashboard/WeeklySummary'
import { cn } from '@/lib/utils'

// Alla tillgängliga widgets
const allWidgets: WidgetType[] = [
  'cv', 'coverLetter', 'jobSearch', 'applications', 'career', 
  'interests', 'exercises', 'diary', 'wellness', 'knowledge', 'quests'
]

// Standardstorlekar per widget (dynamiskt baserat på prioritet)
const getDefaultWidgetSizes = (data: any): Record<WidgetType, WidgetSize> => {
  const isNewUser = !data?.cv?.hasCV
  
  if (isNewUser) {
    return {
      cv: 'large',        // Stor för nya användare - viktigast
      coverLetter: 'small',
      jobSearch: 'small',
      applications: 'small',
      career: 'small',
      interests: 'small',
      exercises: 'small',
      diary: 'small',
      wellness: 'medium', // Medium för välmående
      knowledge: 'small',
      quests: 'small',
    }
  }
  
  // För mer avancerade användare
  return {
    cv: data?.cv?.progress < 100 ? 'medium' : 'small',
    coverLetter: 'small',
    jobSearch: data?.jobs?.savedCount > 0 ? 'medium' : 'small',
    applications: data?.applications?.total > 0 ? 'medium' : 'small',
    career: 'small',
    interests: data?.interest?.hasResult ? 'small' : 'medium',
    exercises: 'small',
    diary: 'small',
    wellness: 'small',
    knowledge: 'small',
    quests: 'medium', // Medium för att uppmuntra quests
  }
}

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()
  // Widget-storlekar baserat på data
  const defaultWidgetSizes = useMemo(() => 
    getDefaultWidgetSizes(data),
    [data]
  )
  
  // Synliga widgets - visa alla som standard
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(allWidgets)
  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetType, WidgetSize>>(defaultWidgetSizes)

  // Uppdatera widget-storlekar när data laddas
  useEffect(() => {
    if (data) {
      setWidgetSizes(getDefaultWidgetSizes(data))
    }
  }, [data])

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

  // Check if user is new (for showing checklist)
  const isNewUser = useMemo(() => {
    if (!data) return false
    return !data.cv.hasCV || data.cv.progress < 30
  }, [data])

  // Rendera widget med rätt storlek
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
    return (
      <div className="space-y-6">
        <DashboardGridSkeleton count={4} />
      </div>
    )
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
      {/* Nästa steg-widget - alltid överst och prominent */}
      {data && !isNewUser && (
        <NextStepWidget />
      )}

      {/* Getting Started Checklist för nya användare */}
      {isNewUser && (
        <GettingStartedChecklist />
      )}

      {/* Filter */}
      <CompactWidgetFilter
        visibleWidgets={visibleWidgets}
        onToggleWidget={handleToggleWidget}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      {/* Widget Grid */}
      <DashboardGrid>
        {/* CV Widget - alltid först om den finns */}
        {visibleWidgets.includes('cv') && data &&
          renderWidget(
            'cv',
            <CVWidget
              hasCV={data.cv.hasCV}
              progress={data.cv.progress}
              atsScore={data.cv.atsScore}
              missingSections={data.cv.missingSections}
              savedCVs={data.cv.savedCVs}
              currentTemplate={data.cv.currentTemplate}
              error={error}
              onRetry={refetch}
              size={widgetSizes['cv']}
            />
          )}

        {visibleWidgets.includes('coverLetter') && data &&
          renderWidget(
            'coverLetter',
            <CoverLetterWidget
              count={data.coverLetters.count}
              recentLetters={data.coverLetters.recentLetters}
              applicationsCount={data.applications.total}
              applicationsStatus={data.applications.statusBreakdown}
              size={widgetSizes['coverLetter']}
            />
          )}

        {visibleWidgets.includes('jobSearch') && data &&
          renderWidget(
            'jobSearch',
            <JobSearchWidget
              savedCount={data.jobs.savedCount}
              newMatches={data.jobs.newMatches}
              recentJobs={data.jobs.recentSavedJobs}
              size={widgetSizes['jobSearch']}
            />
          )}

        {visibleWidgets.includes('applications') && data &&
          renderWidget(
            'applications',
            <ApplicationsWidget
              total={data.applications.total}
              statusBreakdown={data.applications.statusBreakdown}
              nextFollowUp={data.applications.nextFollowUp}
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

        {visibleWidgets.includes('interests') && data &&
          renderWidget(
            'interests',
            <InterestWidget
              hasResult={data.interest.hasResult}
              topRecommendations={data.interest.topRecommendations}
              completedAt={data.interest.completedAt}
              answeredQuestions={data.interest.answeredQuestions}
              totalQuestions={data.interest.totalQuestions}
              riasecProfile={data.interest.riasecProfile}
              size={widgetSizes['interests']}
            />
          )}

        {visibleWidgets.includes('exercises') && data &&
          renderWidget(
            'exercises',
            <ExercisesWidget
              totalExercises={data.exercises.totalExercises}
              completedCount={data.exercises.completedExercises}
              completionRate={data.exercises.completionRate}
              streakDays={data.exercises.streakDays}
              size={widgetSizes['exercises']}
            />
          )}

        {visibleWidgets.includes('diary') && data &&
          renderWidget(
            'diary',
            <DiaryWidget
              upcomingEvents={data.calendar.upcomingEvents}
              eventsThisWeek={data.calendar.eventsThisWeek}
              hasConsultantMeeting={data.calendar.hasConsultantMeeting}
              streakDays={data.activity.streakDays}
              size={widgetSizes['diary']}
            />
          )}

        {visibleWidgets.includes('wellness') && data &&
          renderWidget(
            'wellness',
            <WellnessWidget
              completedActivities={data.wellness.completedActivities}
              streakDays={data.wellness.streakDays}
              moodToday={data.wellness.moodToday}
              size={widgetSizes['wellness']}
            />
          )}

        {visibleWidgets.includes('knowledge') && data &&
          renderWidget(
            'knowledge',
            <KnowledgeWidget
              readCount={data.knowledge.readCount}
              savedCount={data.knowledge.savedCount}
              totalArticles={data.knowledge.totalArticles}
              size={widgetSizes['knowledge']}
            />
          )}

        {visibleWidgets.includes('quests') && data &&
          renderWidget(
            'quests',
            <QuestsWidget
              completedQuests={data.quests.completed}
              totalQuests={data.quests.total}
              quests={data.quests.items}
              streakDays={data.activity.streakDays}
              size={widgetSizes['quests']}
            />
          )}
      </DashboardGrid>

      {/* Empty state */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500 mb-1">Inga widgets synliga</p>
          <p className="text-sm text-slate-400">
            Klicka på "Filter" för att välja vad du vill se
          </p>
        </div>
      )}

      {/* Weekly Summary - i botten */}
      {data && (
        <WeeklySummary />
      )}

    </div>
  )
}
