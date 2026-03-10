import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useMobileOptimization } from '@/components/MobileOptimizer'
import { DashboardGrid, getWidgetGridClasses } from '@/components/dashboard/DashboardGrid'
import { CompactWidgetFilter, type WidgetType } from '@/components/dashboard/CompactWidgetFilter'
import { WidgetSizeSelector, type WidgetSize } from '@/components/dashboard/WidgetSizeSelector'
import { MobileDashboard } from '@/components/dashboard/MobileDashboard'
import { DashboardGridSkeleton } from '@/components/ui/Skeleton'
import {
  CVWidget,
  CoverLetterWidget,
  JobSearchWidget,
  CareerWidget,
  InterestWidget,
  ExercisesWidget,
  DiaryWidget,
  KnowledgeWidget,
} from '@/components/dashboard'
// Widget-baserad dashboard utan AI-assistent
import { cn } from '@/lib/utils'
import { dashboardPreferencesApi } from '@/services/cloudStorage'

// Default widget sizes
const defaultWidgetSizes: Record<WidgetType, WidgetSize> = {
  cv: 'small',
  coverLetter: 'small',
  jobSearch: 'small',
  career: 'small',
  interests: 'small',
  exercises: 'small',
  diary: 'small',
  knowledge: 'small',
}

// Default visible widgets
const defaultVisibleWidgets: WidgetType[] = [
  'cv', 'coverLetter', 'jobSearch', 'career', 'interests', 'exercises', 'diary', 'knowledge',
]

// Storage keys (fallback)
const STORAGE_KEY_VISIBLE = 'dashboard_visible_widgets'
const STORAGE_KEY_SIZES = 'dashboard_widget_sizes'

export default function Dashboard() {
  const { isMobile } = useMobileOptimization()
  
  // Mobile gets the list view
  if (isMobile) {
    return <MobileDashboard />
  }

  // Desktop gets the grid view with size options
  return <DesktopDashboard />
}

// Desktop Dashboard Component - Grid layout with compact widgets
function DesktopDashboard() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()

  // State for visible widgets
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(defaultVisibleWidgets)
  
  // State for widget sizes
  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetType, WidgetSize>>(defaultWidgetSizes)
  
  // Loading state for preferences
  const [prefsLoading, setPrefsLoading] = useState(true)

  // Load preferences from cloud on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setPrefsLoading(true)
        const prefs = await dashboardPreferencesApi.get()
        
        if (prefs) {
          if (prefs.visible_widgets && Array.isArray(prefs.visible_widgets)) {
            setVisibleWidgets(prefs.visible_widgets)
          }
          if (prefs.widget_sizes && typeof prefs.widget_sizes === 'object') {
            setWidgetSizes(prev => ({ ...prev, ...prefs.widget_sizes }))
          }
        } else {
          // Try loading from localStorage as fallback
          try {
            const savedVisible = localStorage.getItem(STORAGE_KEY_VISIBLE)
            const savedSizes = localStorage.getItem(STORAGE_KEY_SIZES)
            
            if (savedVisible) {
              const parsed = JSON.parse(savedVisible)
              if (Array.isArray(parsed)) setVisibleWidgets(parsed)
            }
            if (savedSizes) {
              const parsed = JSON.parse(savedSizes)
              if (parsed && typeof parsed === 'object') {
                setWidgetSizes(prev => ({ ...prev, ...parsed }))
              }
            }
          } catch {
            // Ignore localStorage errors
          }
        }
      } catch (error) {
        console.error('Fel vid laddning av dashboard-inställningar:', error)
      } finally {
        setPrefsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // Persist changes to cloud (debounced)
  useEffect(() => {
    if (prefsLoading) return
    
    const timeoutId = setTimeout(async () => {
      try {
        await dashboardPreferencesApi.update({
          visible_widgets: visibleWidgets,
          widget_sizes: widgetSizes
        })
      } catch (error) {
        console.error('Fel vid sparande av dashboard-inställningar:', error)
        // Fallback to localStorage
        try {
          localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visibleWidgets))
          localStorage.setItem(STORAGE_KEY_SIZES, JSON.stringify(widgetSizes))
        } catch {
          // Ignore localStorage errors
        }
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [visibleWidgets, widgetSizes, prefsLoading])

  // Toggle widget visibility
  const handleToggleWidget = useCallback((widgetId: WidgetType) => {
    setVisibleWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    )
  }, [])

  const handleShowAll = useCallback(() => setVisibleWidgets(defaultVisibleWidgets), [])
  const handleHideAll = useCallback(() => setVisibleWidgets([]), [])

  // Change widget size
  const handleSizeChange = useCallback((widgetId: WidgetType, size: WidgetSize) => {
    setWidgetSizes((prev) => ({ ...prev, [widgetId]: size }))
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

  // Loading state with skeleton
  if (loading || prefsLoading) {
    return (
      <div className="space-y-4 max-w-7xl">
        {/* Compact Welcome - skeleton */}
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Filter skeleton */}
        <div className="h-14 w-full bg-white rounded-xl border border-slate-200 animate-pulse" />

        {/* Widget Grid Skeleton */}
        <DashboardGridSkeleton count={visibleWidgets.length || 4} />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Compact Welcome */}
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-slate-800">
          Hej{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h1>
        <p className="text-sm text-slate-500">Här är din översikt för idag.</p>
      </div>

      {/* Collapsible Filter */}
      <CompactWidgetFilter
        visibleWidgets={visibleWidgets}
        onToggleWidget={handleToggleWidget}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      {/* Widget Grid - 4 columns -->
      <DashboardGrid>
        {visibleWidgets.includes('cv') &&
          renderWidget(
            'cv',
            <CVWidget
              hasCV={data?.cv.hasCV ?? false}
              progress={data?.cv.progress ?? 0}
              atsScore={data?.cv.atsScore ?? 0}
              missingSections={data?.cv.missingSections}
              error={error}
              onRetry={refetch}
              size={widgetSizes['cv']}
            />
          )}

        {visibleWidgets.includes('coverLetter') &&
          renderWidget(
            'coverLetter',
            <CoverLetterWidget
              count={data?.coverLetters.count ?? 0}
              recentLetters={data?.coverLetters.recentLetters}
              applicationsCount={data?.applications.total ?? 0}
              applicationsStatus={data?.applications.statusBreakdown}
              size={widgetSizes['coverLetter']}
            />
          )}

        {visibleWidgets.includes('jobSearch') &&
          renderWidget(
            'jobSearch',
            <JobSearchWidget
              savedCount={data?.jobs.savedCount ?? 0}
              newMatches={data?.jobs.newMatches}
              recentJobs={data?.jobs.recentSavedJobs}
              size={widgetSizes['jobSearch']}
            />
          )}

        {visibleWidgets.includes('career') &&
          renderWidget(
            'career',
            <CareerWidget
              exploredCount={data?.interest.hasResult ? 1 : 0}
              recommendedOccupations={data?.interest.topRecommendations}
              size={widgetSizes['career']}
            />
          )}

        {visibleWidgets.includes('interests') &&
          renderWidget(
            'interests',
            <InterestWidget
              hasResult={data?.interest.hasResult ?? false}
              topRecommendations={data?.interest.topRecommendations}
              completedAt={data?.interest.completedAt}
              size={widgetSizes['interests']}
            />
          )}

        {visibleWidgets.includes('exercises') &&
          renderWidget(
            'exercises',
            <ExercisesWidget
              completedCount={0}
              streakDays={0}
              size={widgetSizes['exercises']}
            />
          )}

        {visibleWidgets.includes('diary') &&
          renderWidget(
            'diary',
            <DiaryWidget
              entriesCount={0}
              streakDays={0}
              hasEntryToday={false}
              size={widgetSizes['diary']}
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

      {/* Empty state */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500 mb-2">Inga moduler synliga</p>
          <p className="text-sm text-slate-400">
            Klicka på "Moduler" ovan för att välja vad du vill se
          </p>
        </div>
      )}
    </div>
  )
}
