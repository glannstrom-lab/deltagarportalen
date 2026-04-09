import { useState, useCallback, useEffect, memo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { CompactWidgetFilter, type WidgetType } from './CompactWidgetFilter'
import { cn } from '@/lib/utils'
import { dashboardPreferencesApi } from '@/services/cloudStorage'
import {
  FileText,
  Mail,
  Briefcase,
  Target,
  Compass,
  Dumbbell,
  BookHeart,
  BookOpen,
  TrendingUp,
  Award,
  ArrowRight,
  ChevronRight,
} from '@/components/ui/icons'

// Default visible widgets
const defaultVisibleWidgets: WidgetType[] = [
  'cv', 'coverLetter', 'jobSearch', 'career', 'interests', 'exercises', 'diary', 'knowledge',
]

const STORAGE_KEY_VISIBLE = 'dashboard_visible_widgets'

// Compact stat card
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}

const StatCard = memo(function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs text-slate-700">{label}</p>
      </div>
    </div>
  )
})

// Compact widget row
interface CompactWidgetRowProps {
  to: string
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  badge?: string
  badgeColor?: string
  progress?: number
  trend?: string
}

const CompactWidgetRow = memo(function CompactWidgetRow({
  to,
  icon,
  title,
  subtitle,
  color,
  badge,
  badgeColor,
  progress,
  trend,
}: CompactWidgetRowProps) {
  const bgColors: Record<string, string> = {
    violet: 'bg-violet-50 border-violet-100',
    rose: 'bg-rose-50 border-rose-100',
    blue: 'bg-blue-50 border-blue-100',
    indigo: 'bg-indigo-50 border-indigo-100',
    teal: 'bg-teal-50 border-teal-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
  }

  const iconColors: Record<string, string> = {
    violet: 'text-violet-600',
    rose: 'text-rose-600',
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  }

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md group',
        bgColors[color] || 'bg-slate-50 border-slate-200'
      )}
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm', iconColors[color])}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
            {title}
          </h3>
          {badge && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-700">{subtitle}</p>
      </div>

      {progress !== undefined && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-800">{progress}%</span>
            {trend && <p className="text-xs text-emerald-600">{trend}</p>}
          </div>
        </div>
      )}

      <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-700 transition-colors" />
    </Link>
  )
})

export function CompactDashboard() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(defaultVisibleWidgets)
  const [prefsLoading, setPrefsLoading] = useState(true)

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setPrefsLoading(true)
        const prefs = await dashboardPreferencesApi.get()
        if (prefs?.visible_widgets && Array.isArray(prefs.visible_widgets)) {
          setVisibleWidgets(prefs.visible_widgets)
        } else {
          const saved = localStorage.getItem(STORAGE_KEY_VISIBLE)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed)) setVisibleWidgets(parsed)
          }
        }
      } catch {
        // Ignore errors
      } finally {
        setPrefsLoading(false)
      }
    }
    loadPreferences()
  }, [])

  // Persist changes
  useEffect(() => {
    if (prefsLoading) return
    const timeoutId = setTimeout(async () => {
      try {
        await dashboardPreferencesApi.update({ visible_widgets: visibleWidgets })
      } catch {
        localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visibleWidgets))
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [visibleWidgets, prefsLoading])

  const handleToggleWidget = useCallback((widgetId: WidgetType) => {
    setVisibleWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    )
  }, [])

  const handleShowAll = useCallback(() => setVisibleWidgets(defaultVisibleWidgets), [])
  const handleHideAll = useCallback(() => setVisibleWidgets([]), [])

  if (loading || prefsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-14 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const widgets = [
    {
      id: 'cv' as WidgetType,
      to: '/cv',
      icon: <FileText size={22} />,
      title: 'Ditt CV',
      subtitle: data?.cv.hasCV
        ? data.cv.progress >= 80
          ? 'Profilen är redo för jobbsökning!'
          : `${data.cv.progress}% klart - fortsätt bygga din profil`
        : 'Skapa din profil för att komma igång',
      color: 'violet',
      progress: data?.cv.progress,
      trend: data?.cv.progress ? `+${data.cv.progress}%` : undefined,
      badge: data?.cv.atsScore ? `ATS ${data.cv.atsScore}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'coverLetter' as WidgetType,
      to: '/cover-letter',
      icon: <Mail size={22} />,
      title: 'Personligt brev',
      subtitle: data?.coverLetters.count
        ? `${data.coverLetters.count} sparade brev`
        : 'Skapa ett personligt brev för dina ansökningar',
      color: 'rose',
    },
    {
      id: 'jobSearch' as WidgetType,
      to: '/job-search',
      icon: <Briefcase size={22} />,
      title: 'Sök jobb',
      subtitle: data?.jobs.savedCount
        ? `${data.jobs.savedCount} sparade jobb att söka`
        : 'Hitta och spara intressanta jobb',
      color: 'blue',
    },
    {
      id: 'career' as WidgetType,
      to: '/career',
      icon: <Target size={22} />,
      title: 'Karriärvägar',
      subtitle: 'Utforska olika karriärmöjligheter',
      color: 'indigo',
    },
    {
      id: 'interests' as WidgetType,
      to: '/interest-guide',
      icon: <Compass size={22} />,
      title: 'Intresseguiden',
      subtitle: data?.interest.hasResult
        ? 'Se dina rekommendationer'
        : 'Ta testet för att hitta din väg',
      color: 'teal',
    },
    {
      id: 'exercises' as WidgetType,
      to: '/exercises',
      icon: <Dumbbell size={22} />,
      title: 'Övningar',
      subtitle: 'Förbered dig inför intervjuer',
      color: 'emerald',
    },
    {
      id: 'diary' as WidgetType,
      to: '/diary',
      icon: <BookHeart size={22} />,
      title: 'Dagbok',
      subtitle: 'Din personliga jobbsökningsdagbok',
      color: 'rose',
    },
    {
      id: 'knowledge' as WidgetType,
      to: '/knowledge-base',
      icon: <BookOpen size={22} />,
      title: 'Kunskapsbank',
      subtitle: 'Artiklar, tips och guider',
      color: 'amber',
    },
  ]

  const visibleWidgetItems = widgets.filter((w) => visibleWidgets.includes(w.id))

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header with welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Hej{user?.firstName ? `, ${user.firstName}` : ''}! 👋
          </h1>
          <p className="text-sm text-slate-700">Här är din översikt för idag.</p>
        </div>
      </div>

      {/* Quick stats row */}
      {data && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="CV-profil"
            value={`${data.cv.progress}%`}
            icon={<TrendingUp size={18} />}
            color="violet"
          />
          {data.cv.atsScore > 0 && (
            <StatCard
              label="ATS-score"
              value={data.cv.atsScore}
              icon={<Award size={18} />}
              color="amber"
            />
          )}
          <StatCard
            label="Ansökningar"
            value={data.applications.total}
            icon={<Briefcase size={18} />}
            color="blue"
          />
          <StatCard
            label="Sparade jobb"
            value={data.jobs.savedCount}
            icon={<Target size={18} />}
            color="emerald"
          />
        </div>
      )}

      {/* Collapsible Filter */}
      <CompactWidgetFilter
        visibleWidgets={visibleWidgets}
        onToggleWidget={handleToggleWidget}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      {/* Widget List - Compact rows */}
      <div className="space-y-2">
        {visibleWidgetItems.map((widget) => (
          <CompactWidgetRow key={widget.id} {...widget} />
        ))}
      </div>

      {/* Empty state */}
      {visibleWidgetItems.length === 0 && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-700 mb-1">Inga moduler synliga</p>
          <p className="text-sm text-slate-600">
            Klicka på "Moduler" ovan för att välja vad du vill se
          </p>
        </div>
      )}
    </div>
  )
}
