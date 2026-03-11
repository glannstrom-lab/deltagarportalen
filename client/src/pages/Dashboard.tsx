import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useMobileOptimization } from '@/components/MobileOptimizer'
import { DashboardGrid, getWidgetGridClasses } from '@/components/dashboard/DashboardGrid'
import { CompactWidgetFilter, type WidgetType } from '@/components/dashboard/CompactWidgetFilter'
import { WidgetSizeSelector, type WidgetSize } from '@/components/dashboard/WidgetSizeSelector'
import { MobileDashboard } from '@/components/dashboard/MobileDashboard'
import { DashboardGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState, EmptyWidget } from '@/components/ui'
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
import { PageLayout } from '@/components/layout/index'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'
import { 
  Compass,
  X,
  Check,
  Target,
  FileText,
  Briefcase,
  BookHeart,
  Sparkles,
  ArrowRight
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

// GuideStep komponent
interface GuideStepProps {
  number: number
  icon: React.ElementType
  title: string
  description: string
  done: boolean
  href: string
  optional?: boolean
}

function GuideStep({ icon: Icon, title, description, done, href, optional }: GuideStepProps) {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all',
        done 
          ? 'bg-green-50 hover:bg-green-100' 
          : 'bg-slate-50 hover:bg-slate-100'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        done ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'
      )}>
        {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium text-sm',
            done ? 'text-green-800 line-through' : 'text-slate-800'
          )}>
            {title}
          </span>
          {optional && (
            <span className="text-xs text-slate-400">(valfritt)</span>
          )}
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {!done && <ArrowRight className="w-4 h-4 text-slate-400" />}
    </a>
  )
}

function DesktopDashboard() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()
  const { hasCompletedOnboarding } = useSettingsStore()

  // Ladda sparade widget-val från localStorage
  const loadSavedWidgets = (): WidgetType[] => {
    try {
      const saved = localStorage.getItem('dashboard-visible-widgets')
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetType[]
        // Validera att alla sparade widgets är giltiga
        return parsed.filter(w => allWidgets.includes(w))
      }
    } catch {
      // Ignorera fel, använd default
    }
    return defaultVisibleWidgets
  }

  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(loadSavedWidgets)
  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetType, WidgetSize>>(defaultWidgetSizes)
  const [showGuide, setShowGuide] = useState(false)

  // Spara widget-val till localStorage när de ändras
  useEffect(() => {
    localStorage.setItem('dashboard-visible-widgets', JSON.stringify(visibleWidgets))
  }, [visibleWidgets])

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

  if (loading) {
    return (
      <PageLayout
        title="Laddar..."
        showTabs={false}
        className="space-y-5"
      >
        <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-48 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
        <DashboardGridSkeleton count={8} />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout
        title={`Hej${user?.firstName ? `, ${user.firstName}` : ''}!`}
        showTabs={false}
        className="space-y-5"
      >
        <ErrorState
          title="Kunde inte ladda dashboard"
          message="Något gick fel när vi hämtade din data. Försök igen."
          onRetry={refetch}
        />
      </PageLayout>
    )
  }

  const widgetsToShow = visibleWidgets.length > 0 ? visibleWidgets : defaultVisibleWidgets

  return (
    <PageLayout
      title={`Hej${user?.firstName ? `, ${user.firstName}` : ''}!`}
      showTabs={false}
      className="space-y-5"
      actions={
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
          title="Visa guide för nästa steg"
        >
          <Compass className="w-4 h-4" />
          <span className="hidden sm:inline">Guide</span>
        </button>
      }
    >
      {/* Guide Modal - Compact */}
      {showGuide && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-in slide-in-from-top-2 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Din väg framåt</h3>
            </div>
            <button 
              onClick={() => setShowGuide(false)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <GuideStep 
              number={1}
              icon={Target}
              title="Komplett profil"
              description="Fyll i dina grunduppgifter"
              done={hasCompletedOnboarding}
              href="/profile"
            />
            <GuideStep 
              number={2}
              icon={FileText}
              title="Bygg ditt CV"
              description="Samla dina erfarenheter på ett ställe"
              done={data?.cv.progress ? data.cv.progress > 50 : false}
              href="/dashboard/cv"
            />
            <GuideStep 
              number={3}
              icon={Sparkles}
              title="Upptäck intressen"
              description="Se vilka yrken som kan passa dig"
              done={data?.interest.hasResult ?? false}
              href="/dashboard/interest-guide"
            />
            <GuideStep 
              number={4}
              icon={Briefcase}
              title="Utforska jobb"
              description="Hitta lediga jobb att spara"
              done={(data?.jobs.savedCount ?? 0) > 0}
              href="/dashboard/job-search"
            />
            <GuideStep 
              number={5}
              icon={BookHeart}
              title="Dagboken"
              description="Skriv ner dina tankar när du vill (valfritt)"
              done={false}
              href="/dashboard/diary"
              optional
            />
          </div>
          
          <p className="text-xs text-slate-500 mt-4 text-center">
            Ta det i din egen takt - varje litet steg räknas!
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <CompactWidgetFilter
          visibleWidgets={widgetsToShow}
          onToggleWidget={handleToggleWidget}
          onShowAll={handleShowAll}
          onHideAll={handleHideAll}
        />
      </div>

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
        <EmptyWidget
          title="Inga moduler synliga"
          description="Välj vilka moduler du vill visa på din dashboard"
          action={{
            label: "Visa alla moduler",
            onClick: handleShowAll
          }}
        />
      )}
    </PageLayout>
  )
}
