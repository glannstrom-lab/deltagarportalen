import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, ChevronRight, Plus, Flame, Sparkles } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface WellnessWidgetProps {
  completedActivities?: number
  streakDays?: number
  moodToday?: string | null
  size?: 'mini' | 'medium' | 'large'
}

// Mood config - labels are resolved at render time using translation keys
const moodConfig: Record<string, { icon: string; color: string; bgColor: string; labelKey: string }> = {
  great: { icon: '😄', color: 'text-emerald-600', bgColor: 'bg-emerald-100', labelKey: 'wellnessWidget.mood.great' },
  good: { icon: '🙂', color: 'text-blue-600', bgColor: 'bg-blue-100', labelKey: 'wellnessWidget.mood.good' },
  okay: { icon: '😐', color: 'text-amber-600', bgColor: 'bg-amber-100', labelKey: 'wellnessWidget.mood.okay' },
  bad: { icon: '😔', color: 'text-orange-600', bgColor: 'bg-orange-100', labelKey: 'wellnessWidget.mood.bad' },
  terrible: { icon: '😢', color: 'text-rose-600', bgColor: 'bg-rose-100', labelKey: 'wellnessWidget.mood.terrible' }
}

export const WellnessWidget = memo(function WellnessWidget({
  completedActivities = 0,
  streakDays = 0,
  moodToday = null,
  size = 'medium'
}: WellnessWidgetProps) {
  const { t } = useTranslation()
  const moodInfo = moodToday ? moodConfig[moodToday] : null
  const hasMood = !!moodToday

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/wellness"
        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 hover: transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
          {moodInfo ? <span className="text-lg">{moodInfo.icon}</span> : <Heart size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('wellnessWidget.wellness')}</p>
          <p className={cn("text-xs", moodInfo ? moodInfo.color : "text-slate-500 dark:text-slate-400")}>
            {moodInfo ? t(moodInfo.labelKey) : t('wellnessWidget.logMood')}
          </p>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
            <Flame size={12} />
            <span className="text-xs font-medium">{streakDays}</span>
          </div>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/wellness"
        className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 hover: hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('wellnessWidget.wellness')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('wellnessWidget.howAreYou')}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          {moodInfo ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodInfo.icon}</span>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                moodInfo.bgColor,
                moodInfo.color
              )}>
                {t(moodInfo.labelKey)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Plus size={16} />
              <span className="text-sm font-medium">{t('wellnessWidget.logMood')}</span>
            </div>
          )}
          {streakDays > 0 && (
            <span className="ml-auto flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
              <Flame size={12} />
              {streakDays}
            </span>
          )}
        </div>
      </Link>
    )
  }

  // LARGE
  const moodOptions = ['great', 'good', 'okay', 'bad', 'terrible']

  return (
    <Link
      to="/wellness"
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 hover: transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Heart size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('wellnessWidget.yourWellness')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('wellnessWidget.activitiesThisWeek', { count: completedActivities })}</p>
          </div>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/40 rounded-lg text-orange-600 dark:text-orange-400">
            <Flame size={16} />
            <span className="text-sm font-bold">{t('wellnessWidget.daysCount', { count: streakDays })}</span>
          </div>
        )}
      </div>

      {/* Mood Card */}
      {moodInfo ? (
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border mb-4",
          moodInfo.bgColor,
          moodInfo.color.replace('text-', 'border-').replace('600', '200')
        )}>
          <span className="text-4xl">{moodInfo.icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('wellnessWidget.todaysMood')}</p>
            <p className={cn("text-lg font-bold", moodInfo.color)}>{t(moodInfo.labelKey)}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 mb-4">
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-300 mb-2">{t('wellnessWidget.howAreYou')}</p>
          <div className="flex gap-2">
            {moodOptions.map(mood => (
              <span
                key={mood}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg border border-rose-200 dark:border-rose-700 text-xl hover:scale-110 transition-transform"
              >
                {moodConfig[mood].icon}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500 dark:text-rose-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{completedActivities}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('wellnessWidget.activities')}</p>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500 dark:text-orange-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{streakDays}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('wellnessWidget.daysStreak')}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium group-hover:bg-rose-200 dark:group-hover:bg-rose-900/60 transition-colors">
          <Heart size={12} />
          {hasMood ? t('wellnessWidget.seeHistory') : t('wellnessWidget.logMood')}
        </span>
      </div>
    </Link>
  )
})

export default WellnessWidget
