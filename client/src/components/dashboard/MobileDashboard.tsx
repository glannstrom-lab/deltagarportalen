import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { MobileWidgetFilter, type WidgetType } from './MobileWidgetFilter'
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
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
} from '@/components/ui/icons'
import { Link } from 'react-router-dom'

// Kompakta widget-kort för mobil
interface MobileWidgetCardProps {
  to: string
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  badge?: string
  badgeColor?: string
  progress?: number
}

function MobileWidgetCard({ to, icon, title, subtitle, color, badge, badgeColor, progress }: MobileWidgetCardProps) {
  const bgColorClass = {
    teal: 'bg-teal-50 dark:bg-teal-900/30 border-teal-100 dark:border-teal-800',
    rose: 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800',
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
    sky: 'bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800',
  }[color] || 'bg-slate-50 dark:bg-stone-800 border-slate-200 dark:border-stone-700'

  const iconColorClass = {
    teal: 'text-teal-600 dark:text-teal-400',
    rose: 'text-rose-600 dark:text-rose-400',
    blue: 'text-blue-600 dark:text-blue-400',
    sky: 'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }[color] || 'text-slate-600 dark:text-stone-400'

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98]',
        bgColorClass
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-stone-800', iconColorClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-800 dark:text-stone-100 text-sm truncate">{title}</h3>
          {badge && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-700 dark:text-stone-300 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {progress !== undefined && (
          <span className="text-sm font-semibold text-slate-700 dark:text-stone-300">{progress}%</span>
        )}
        <ChevronRight size={16} className="text-slate-600 dark:text-stone-400" />
      </div>
    </Link>
  )
}

// Default visible widgets
const defaultVisibleWidgets: WidgetType[] = [
  'cv', 'coverLetter', 'jobSearch', 'career', 'interests', 'exercises', 'diary', 'wellness', 'knowledge',
]

const STORAGE_KEY_VISIBLE = 'dashboard_visible_widgets'

export function MobileDashboard() {
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
      <div className="space-y-3">
        <div className="h-12 bg-slate-200 dark:bg-stone-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-stone-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const widgets = [
    {
      id: 'cv' as WidgetType,
      to: '/cv',
      icon: <FileText size={20} />,
      title: 'Ditt CV',
      subtitle: data?.cv.hasCV
        ? data.cv.progress >= 80
          ? 'Profilen är redo!'
          : `${data.cv.progress}% klart - fortsätt bygga`
        : 'Skapa din profil',
      color: 'teal',
      progress: data?.cv.progress,
      badge: data?.cv.atsScore ? `ATS ${data.cv.atsScore}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'coverLetter' as WidgetType,
      to: '/cover-letter',
      icon: <Mail size={20} />,
      title: 'Personligt brev',
      subtitle: data?.coverLetters.count
        ? `${data.coverLetters.count} sparade brev`
        : 'Skapa ett personligt brev',
      color: 'rose',
    },
    {
      id: 'jobSearch' as WidgetType,
      to: '/job-search',
      icon: <Briefcase size={20} />,
      title: 'Sök jobb',
      subtitle: data?.jobs.savedCount
        ? `${data.jobs.savedCount} sparade jobb`
        : 'Hitta ditt nästa jobb',
      color: 'blue',
    },
    {
      id: 'career' as WidgetType,
      to: '/career',
      icon: <Target size={20} />,
      title: 'Karriär',
      subtitle: 'Utforska karriärvägar',
      color: 'sky',
    },
    {
      id: 'interests' as WidgetType,
      to: '/interest-guide',
      icon: <Compass size={20} />,
      title: 'Intresseguiden',
      subtitle: data?.interest.hasResult
        ? 'Se dina rekommendationer'
        : 'Ta testet och hitta din väg',
      color: 'teal',
    },
    {
      id: 'exercises' as WidgetType,
      to: '/exercises',
      icon: <Dumbbell size={20} />,
      title: 'Övningar',
      subtitle: 'Träna inför intervjuer',
      color: 'emerald',
    },
    {
      id: 'diary' as WidgetType,
      to: '/diary',
      icon: <BookHeart size={20} />,
      title: 'Dagbok',
      subtitle: 'Din jobbsökningsdagbok',
      color: 'rose',
    },
    {
      id: 'wellness' as WidgetType,
      to: '/wellness',
      icon: <Sparkles size={20} />,
      title: 'Hälsa',
      subtitle: 'Ditt välmående',
      color: 'emerald',
    },
    {
      id: 'knowledge' as WidgetType,
      to: '/knowledge-base',
      icon: <BookOpen size={20} />,
      title: 'Kunskapsbank',
      subtitle: 'Tips och guider',
      color: 'amber',
    },
  ]

  const visibleWidgetItems = widgets.filter((w) => visibleWidgets.includes(w.id))

  return (
    <div className="space-y-3 pb-4">
      {/* Compact Welcome */}
      <div className="px-1">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-stone-100">
          Hej{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-sm text-slate-700 dark:text-stone-300">Vad vill du göra idag?</p>
      </div>

      {/* Collapsible Filter */}
      <MobileWidgetFilter
        visibleWidgets={visibleWidgets}
        onToggleWidget={handleToggleWidget}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      {/* Widget List */}
      <div className="space-y-2">
        {visibleWidgetItems.map((widget) => (
          <MobileWidgetCard key={widget.id} {...widget} />
        ))}
      </div>

      {/* Empty state */}
      {visibleWidgetItems.length === 0 && (
        <div className="text-center py-8 bg-slate-50 dark:bg-stone-800 rounded-xl border border-dashed border-slate-200 dark:border-stone-700">
          <p className="text-slate-700 dark:text-stone-300 text-sm mb-1">Inga moduler synliga</p>
          <p className="text-xs text-slate-600 dark:text-stone-400">
            Öppna filtret ovan för att välja moduler
          </p>
        </div>
      )}

      {/* Quick stats summary */}
      {data && (
        <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-900/30 rounded-xl border border-sky-100 dark:border-sky-800">
          <h3 className="text-xs font-medium text-sky-700 dark:text-sky-400 mb-2 uppercase tracking-wide">
            Din oversikt
          </h3>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sky-700 dark:text-sky-400">
                <TrendingUp size={14} />
                <span className="font-semibold">{data.cv.progress}%</span>
              </div>
              <span className="text-xs text-sky-600 dark:text-sky-500">CV</span>
            </div>
            {data.cv.atsScore > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                  <Award size={14} />
                  <span className="font-semibold">{data.cv.atsScore}</span>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-500">ATS</span>
              </div>
            )}
            <div className="text-center">
              <span className="font-semibold text-sky-700 dark:text-sky-400">{data.applications.total}</span>
              <span className="text-xs text-sky-600 dark:text-sky-500 block">Ansokningar</span>
            </div>
            <div className="text-center">
              <span className="font-semibold text-sky-700 dark:text-sky-400">{data.jobs.savedCount}</span>
              <span className="text-xs text-sky-600 dark:text-sky-500 block">Sparade</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
