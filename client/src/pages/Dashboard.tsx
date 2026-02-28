import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { MobileOptimizer } from '@/components/MobileOptimizer'
import { DashboardGrid, getWidgetGridClasses } from '@/components/dashboard/DashboardGrid'
import { WidgetFilter, type WidgetType } from '@/components/dashboard/WidgetFilter'
import { WidgetSizeSelector, type WidgetSize } from '@/components/dashboard/WidgetSizeSelector'
import {
  CVWidget,
  CoverLetterWidget,
  JobSearchWidget,
  CareerWidget,
  InterestWidget,
  ExercisesWidget,
  DiaryWidget,
  KnowledgeWidget,
  ApplicationsWidget,
} from '@/components/dashboard'
import { cn } from '@/lib/utils'

// Default widget sizes - all small (1/4) as standard
const defaultWidgetSizes: Record<WidgetType, WidgetSize> = {
  cv: 'small',
  coverLetter: 'small',
  jobSearch: 'small',
  applications: 'small',
  career: 'small',
  interests: 'small',
  exercises: 'small',
  diary: 'small',
  knowledge: 'small',
}

// Default visible widgets - all visible
const defaultVisibleWidgets: WidgetType[] = [
  'cv',
  'coverLetter',
  'jobSearch',
  'applications',
  'career',
  'interests',
  'exercises',
  'diary',
  'knowledge',
]

// Storage keys
const STORAGE_KEY_VISIBLE = 'dashboard_visible_widgets'
const STORAGE_KEY_SIZES = 'dashboard_widget_sizes'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()

  // State for visible widgets
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_VISIBLE)
      return saved ? JSON.parse(saved) : defaultVisibleWidgets
    }
    return defaultVisibleWidgets
  })

  // State for widget sizes
  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetType, WidgetSize>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SIZES)
      return saved ? JSON.parse(saved) : defaultWidgetSizes
    }
    return defaultWidgetSizes
  })

  // Persist changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visibleWidgets))
  }, [visibleWidgets])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SIZES, JSON.stringify(widgetSizes))
  }, [widgetSizes])

  // Toggle widget visibility
  const handleToggleWidget = useCallback((widgetId: WidgetType) => {
    setVisibleWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    )
  }, [])

  // Show all widgets
  const handleShowAll = useCallback(() => {
    setVisibleWidgets(defaultVisibleWidgets)
  }, [])

  // Hide all widgets
  const handleHideAll = useCallback(() => {
    setVisibleWidgets([])
  }, [])

  // Change widget size
  const handleSizeChange = useCallback((widgetId: WidgetType, size: WidgetSize) => {
    setWidgetSizes((prev) => ({
      ...prev,
      [widgetId]: size,
    }))
  }, [])

  // Render widget with size selector wrapper
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
          {/* Size selector - absolutely positioned */}
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

  return (
    <div className="space-y-6">
      {/* Mobile Optimizer */}
      <MobileOptimizer />

      {/* Välkomstmeddelande */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Hej{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Här är din översikt för idag.
        </p>
      </div>

      {/* Widget Filter */}
      <WidgetFilter
        visibleWidgets={visibleWidgets}
        onToggleWidget={handleToggleWidget}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      {/* Widget Grid with dynamic sizing */}
      <DashboardGrid>
        {/* CV Widget */}
        {visibleWidgets.includes('cv') &&
          renderWidget(
            'cv',
            <CVWidget
              hasCV={data?.cv.hasCV ?? false}
              progress={data?.cv.progress ?? 0}
              atsScore={data?.cv.atsScore ?? 0}
              missingSections={data?.cv.missingSections}
              loading={loading}
              error={error}
              onRetry={refetch}
            />
          )}

        {/* Cover Letter Widget */}
        {visibleWidgets.includes('coverLetter') &&
          renderWidget(
            'coverLetter',
            <CoverLetterWidget
              count={data?.coverLetters.count ?? 0}
              recentLetters={data?.coverLetters.recentLetters}
              loading={loading}
            />
          )}

        {/* Job Search Widget */}
        {visibleWidgets.includes('jobSearch') &&
          renderWidget(
            'jobSearch',
            <JobSearchWidget
              savedCount={data?.jobs.savedCount ?? 0}
              newMatches={data?.jobs.newMatches}
              recentJobs={data?.jobs.recentSavedJobs}
              loading={loading}
            />
          )}

        {/* Applications Widget */}
        {visibleWidgets.includes('applications') &&
          renderWidget(
            'applications',
            <ApplicationsWidget
              total={data?.applications.total ?? 0}
              statusBreakdown={data?.applications.statusBreakdown}
              nextFollowUp={data?.applications.nextFollowUp}
              loading={loading}
            />
          )}

        {/* Career Widget */}
        {visibleWidgets.includes('career') &&
          renderWidget(
            'career',
            <CareerWidget
              exploredCount={data?.interest.hasResult ? 1 : 0}
              recommendedOccupations={data?.interest.topRecommendations}
              loading={loading}
            />
          )}

        {/* Interest Widget */}
        {visibleWidgets.includes('interests') &&
          renderWidget(
            'interests',
            <InterestWidget
              hasResult={data?.interest.hasResult ?? false}
              topRecommendations={data?.interest.topRecommendations}
              completedAt={data?.interest.completedAt}
              loading={loading}
            />
          )}

        {/* Exercises Widget */}
        {visibleWidgets.includes('exercises') &&
          renderWidget(
            'exercises',
            <ExercisesWidget
              completedCount={0}
              streakDays={0}
              loading={loading}
            />
          )}

        {/* Diary Widget */}
        {visibleWidgets.includes('diary') &&
          renderWidget(
            'diary',
            <DiaryWidget
              entriesCount={0}
              streakDays={0}
              hasEntryToday={false}
              loading={loading}
            />
          )}

        {/* Knowledge Widget */}
        {visibleWidgets.includes('knowledge') &&
          renderWidget(
            'knowledge',
            <KnowledgeWidget
              readCount={0}
              savedCount={0}
              totalArticles={0}
              loading={loading}
            />
          )}
      </DashboardGrid>

      {/* Empty state when no widgets visible */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500 mb-2">Inga moduler synliga</p>
          <p className="text-sm text-slate-400">
            Använd filtret ovan för att visa moduler
          </p>
        </div>
      )}
    </div>
  )
}
