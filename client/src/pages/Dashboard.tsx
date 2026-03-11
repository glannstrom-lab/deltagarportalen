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
import { EnergyLevelSelector, useEnergyAdaptedContent } from '@/components/energy/EnergyLevelSelector'
import { QuickWinButton } from '@/components/energy/QuickWinButton'
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist'
import { PageLayout } from '@/components/layout'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'
import { 
  Zap, 
  BatteryLow, 
  BatteryMedium, 
  BatteryFull,
  ChevronDown,
  LayoutGrid,
  TrendingUp
} from 'lucide-react'

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

const allWidgets: WidgetType[] = [
  'cv', 'coverLetter', 'jobSearch', 'career', 'interests', 'exercises', 'diary', 'knowledge',
]

const defaultVisibleWidgets: WidgetType[] = allWidgets

export default function Dashboard() {
  const { isMobile } = useMobileOptimization()
  
  if (isMobile) {
    return <MobileDashboard />
  }

  return <DesktopDashboard />
}

function DesktopDashboard() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()
  const { energyLevel, hasCompletedOnboarding } = useSettingsStore()
  const { getVisibleWidgets, getEncouragingMessage, isLowEnergy } = useEnergyAdaptedContent()

  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(
    getVisibleWidgets(allWidgets)
  )
  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetType, WidgetSize>>(defaultWidgetSizes)
  const [showEnergySelector, setShowEnergySelector] = useState(false)
  const [checklistDismissed, setChecklistDismissed] = useState(false)

  useEffect(() => {
    setVisibleWidgets(getVisibleWidgets(allWidgets))
  }, [energyLevel])

  const handleToggleWidget = useCallback((widgetId: WidgetType) => {
    setVisibleWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    )
  }, [])

  const handleShowAll = useCallback(() => setVisibleWidgets(defaultVisibleWidgets), [])
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

  const EnergyIcon = energyLevel === 'low' ? BatteryLow : energyLevel === 'medium' ? BatteryMedium : BatteryFull

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-14 w-full bg-white rounded-xl border border-slate-200 animate-pulse" />
        <DashboardGridSkeleton count={8} />
      </div>
    )
  }

  const widgetsToShow = visibleWidgets.length > 0 ? visibleWidgets : getVisibleWidgets(allWidgets)

  return (
    <PageLayout
      title={`Hej${user?.firstName ? `, ${user.firstName}` : ''}!`}
      description={getEncouragingMessage()}
      showTabs={false}
      className="space-y-5"
    >
      {/* Professional Header Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{widgetsToShow.length}</p>
            <p className="text-xs text-slate-500">Aktiva moduler</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{data?.cv.progress ?? 0}%</p>
            <p className="text-xs text-slate-500">CV färdigt</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{data?.jobs.savedCount ?? 0}</p>
            <p className="text-xs text-slate-500">Sparade jobb</p>
          </div>
        </div>
        
        {/* Energy Level Compact Selector */}
        <button
          onClick={() => setShowEnergySelector(!showEnergySelector)}
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3 transition-all text-left',
            isLowEnergy
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isLowEnergy ? 'bg-blue-100' : 'bg-amber-100'
          )}>
            <EnergyIcon className={cn('w-5 h-5', isLowEnergy ? 'text-blue-600' : 'text-amber-600')} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 capitalize">
              {energyLevel === 'low' && 'Låg energi'}
              {energyLevel === 'medium' && 'Medium energi'}
              {energyLevel === 'high' && 'Hög energi'}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              Ändra <ChevronDown className={cn('w-3 h-3 transition-transform', showEnergySelector && 'rotate-180')} />
            </p>
          </div>
        </button>
      </div>

      {/* Energy Level Selector (Collapsible) */}
      {showEnergySelector && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-in slide-in-from-top-2">
          <EnergyLevelSelector 
            onSelect={() => setShowEnergySelector(false)}
            showDescription={true}
          />
        </div>
      )}

      {/* Getting Started Checklist for new users */}
      {!hasCompletedOnboarding && !checklistDismissed && (
        <GettingStartedChecklist 
          onClose={() => setChecklistDismissed(true)}
        />
      )}

      {/* Filter */}
      <CompactWidgetFilter
        visibleWidgets={widgetsToShow}
        onToggleWidget={handleToggleWidget}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      {/* Widget Grid */}
      <DashboardGrid>
        {widgetsToShow.includes('cv') &&
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

        {widgetsToShow.includes('coverLetter') &&
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

        {widgetsToShow.includes('jobSearch') &&
          renderWidget(
            'jobSearch',
            <JobSearchWidget
              savedCount={data?.jobs.savedCount ?? 0}
              newMatches={data?.jobs.newMatches}
              recentJobs={data?.jobs.recentSavedJobs}
              size={widgetSizes['jobSearch']}
            />
          )}

        {widgetsToShow.includes('career') &&
          renderWidget(
            'career',
            <CareerWidget
              exploredCount={data?.interest.hasResult ? 1 : 0}
              recommendedOccupations={data?.interest.topRecommendations}
              size={widgetSizes['career']}
            />
          )}

        {widgetsToShow.includes('interests') &&
          renderWidget(
            'interests',
            <InterestWidget
              hasResult={data?.interest.hasResult ?? false}
              topRecommendations={data?.interest.topRecommendations}
              completedAt={data?.interest.completedAt}
              size={widgetSizes['interests']}
            />
          )}

        {widgetsToShow.includes('exercises') &&
          renderWidget(
            'exercises',
            <ExercisesWidget
              completedCount={0}
              streakDays={0}
              size={widgetSizes['exercises']}
            />
          )}

        {widgetsToShow.includes('diary') &&
          renderWidget(
            'diary',
            <DiaryWidget
              entriesCount={0}
              streakDays={0}
              hasEntryToday={false}
              size={widgetSizes['diary']}
            />
          )}

        {widgetsToShow.includes('knowledge') &&
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
      {widgetsToShow.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500 mb-2">Inga moduler synliga</p>
          <p className="text-sm text-slate-400">
            Klicka på "Moduler" ovan för att välja vad du vill se
          </p>
        </div>
      )}

      {/* Quick Win Floating Button */}
      <QuickWinButton variant="floating" />
    </PageLayout>
  )
}
