/**
 * Overview Tab - Main dashboard view with widgets
 */
import { useState, useCallback, useEffect } from 'react'
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

const defaultVisibleWidgets: WidgetType[] = ['cv', 'coverLetter', 'jobSearch']

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
      </DashboardGrid>
    </div>
  )
}
