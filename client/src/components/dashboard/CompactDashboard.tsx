import { useState, useCallback, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
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
    teal: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-solid)]',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-stone-800 dark:text-stone-100 leading-tight">{value}</p>
        <p className="text-xs text-stone-700 dark:text-stone-300">{label}</p>
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
    teal: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50',
    rose: 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800',
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
    sky: 'bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800',
  }

  const iconColors: Record<string, string> = {
    teal: 'text-[var(--c-text)] dark:text-[var(--c-solid)]',
    rose: 'text-rose-600 dark:text-rose-400',
    blue: 'text-blue-600 dark:text-blue-400',
    sky: 'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md group',
        bgColors[color] || 'bg-stone-50 border-stone-200'
      )}
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-stone-800 shadow-sm', iconColors[color])}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-solid)] transition-colors">
            {title}
          </h3>
          {badge && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-stone-700 dark:text-stone-300">{subtitle}</p>
      </div>

      {progress !== undefined && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-bold text-stone-800 dark:text-stone-100">{progress}%</span>
            {trend && <p className="text-xs text-emerald-600 dark:text-emerald-400">{trend}</p>}
          </div>
        </div>
      )}

      <ChevronRight size={20} className="text-stone-300 dark:text-stone-600 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors" />
    </Link>
  )
})

export function CompactDashboard() {
  const { t } = useTranslation()
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
        <div className="h-14 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
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
      title: t('dashboard.compact.cv.title'),
      subtitle: data?.cv.hasCV
        ? data.cv.progress >= 80
          ? t('dashboard.compact.cv.ready')
          : t('dashboard.compact.cv.inProgress', { progress: data.cv.progress })
        : t('dashboard.compact.cv.createProfile'),
      color: 'teal',
      progress: data?.cv.progress,
      trend: data?.cv.progress ? `+${data.cv.progress}%` : undefined,
      badge: data?.cv.atsScore ? `ATS ${data.cv.atsScore}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'coverLetter' as WidgetType,
      to: '/cover-letter',
      icon: <Mail size={22} />,
      title: t('dashboard.compact.coverLetter.title'),
      subtitle: data?.coverLetters.count
        ? t('dashboard.compact.coverLetter.savedCount', { count: data.coverLetters.count })
        : t('dashboard.compact.coverLetter.create'),
      color: 'rose',
    },
    {
      id: 'jobSearch' as WidgetType,
      to: '/job-search',
      icon: <Briefcase size={22} />,
      title: t('dashboard.compact.jobSearch.title'),
      subtitle: data?.jobs.savedCount
        ? t('dashboard.compact.jobSearch.savedCount', { count: data.jobs.savedCount })
        : t('dashboard.compact.jobSearch.findJobs'),
      color: 'blue',
    },
    {
      id: 'career' as WidgetType,
      to: '/career',
      icon: <Target size={22} />,
      title: t('dashboard.compact.career.title'),
      subtitle: t('dashboard.compact.career.explore'),
      color: 'sky',
    },
    {
      id: 'interests' as WidgetType,
      to: '/interest-guide',
      icon: <Compass size={22} />,
      title: t('dashboard.compact.interests.title'),
      subtitle: data?.interest.hasResult
        ? t('dashboard.compact.interests.seeResults')
        : t('dashboard.compact.interests.takeTest'),
      color: 'teal',
    },
    {
      id: 'exercises' as WidgetType,
      to: '/exercises',
      icon: <Dumbbell size={22} />,
      title: t('dashboard.compact.exercises.title'),
      subtitle: t('dashboard.compact.exercises.prepare'),
      color: 'emerald',
    },
    {
      id: 'diary' as WidgetType,
      to: '/diary',
      icon: <BookHeart size={22} />,
      title: t('dashboard.compact.diary.title'),
      subtitle: t('dashboard.compact.diary.personal'),
      color: 'rose',
    },
    {
      id: 'knowledge' as WidgetType,
      to: '/knowledge-base',
      icon: <BookOpen size={22} />,
      title: t('dashboard.compact.knowledge.title'),
      subtitle: t('dashboard.compact.knowledge.articles'),
      color: 'amber',
    },
  ]

  const visibleWidgetItems = widgets.filter((w) => visibleWidgets.includes(w.id))

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header with welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">
            {t('dashboard.greeting', { name: user?.firstName || t('dashboard.greetingDefault') })}
          </h1>
          <p className="text-sm text-stone-700 dark:text-stone-300">{t('dashboard.compact.todaysOverview')}</p>
        </div>
      </div>

      {/* Quick stats row */}
      {data && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label={t('dashboard.compact.stats.cvProfile')}
            value={`${data.cv.progress}%`}
            icon={<TrendingUp size={18} />}
            color="teal"
          />
          {data.cv.atsScore > 0 && (
            <StatCard
              label={t('dashboard.compact.stats.atsScore')}
              value={data.cv.atsScore}
              icon={<Award size={18} />}
              color="amber"
            />
          )}
          <StatCard
            label={t('dashboard.compact.stats.applications')}
            value={data.applications.total}
            icon={<Briefcase size={18} />}
            color="blue"
          />
          <StatCard
            label={t('dashboard.compact.stats.savedJobs')}
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
        <div className="text-center py-10 bg-stone-50 dark:bg-stone-800 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
          <p className="text-stone-700 dark:text-stone-300 mb-1">{t('dashboard.compact.noModules')}</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('dashboard.compact.selectModules')}
          </p>
        </div>
      )}
    </div>
  )
}
