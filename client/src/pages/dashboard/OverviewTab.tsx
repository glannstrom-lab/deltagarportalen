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

      {/* Debug info */}
      <div className="p-4 bg-blue-50 rounded-lg text-sm">
        <p><strong>Debug:</strong></p>
        <p>Data loaded: {data ? 'Ja' : 'Nej'}</p>
        <p>User: {user?.email || 'Ej inloggad'}</p>
        <p>Widgets: {visibleWidgets.join(', ')}</p>
      </div>

      {/* Widget Grid */}
      <DashboardGrid>
        {visibleWidgets.includes('cv') &&
          renderWidget(
            'cv',
            <div className="p-6 bg-white rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-800">CV Widget</h3>
              <p className="text-sm text-slate-600 mt-2">
                Har CV: {data?.cv?.hasCV ? 'Ja' : 'Nej'}
              </p>
            </div>
          )}

        {visibleWidgets.includes('coverLetter') &&
          renderWidget(
            'coverLetter',
            <div className="p-6 bg-white rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-800">Brev Widget</h3>
              <p className="text-sm text-slate-600 mt-2">
                Antal brev: {data?.coverLetters?.count ?? 0}
              </p>
            </div>
          )}

        {visibleWidgets.includes('jobSearch') &&
          renderWidget(
            'jobSearch',
            <div className="p-6 bg-white rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-800">Jobb Widget</h3>
              <p className="text-sm text-slate-600 mt-2">
                Sparade jobb: {data?.jobs?.savedCount ?? 0}
              </p>
            </div>
          )}
      </DashboardGrid>
    </div>
  )
}
