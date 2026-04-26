/**
 * Quests Tab - Daily quests and challenges
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Circle, Zap, Trophy, Flame, ChevronRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface Quest {
  id: string
  title: string
  description: string
  category: 'cv' | 'apply' | 'network' | 'wellness'
  energy_level: 'low' | 'medium' | 'high'
  points: number
  estimated_minutes: number
  is_completed: boolean
}

interface QuestStats {
  current_streak: number
  total_points: number
  quests_completed: number
}

const categoryIcons: Record<string, string> = {
  cv: '📝',
  apply: '📤',
  network: '🤝',
  wellness: '✨',
}

export default function QuestsTab() {
  const { t } = useTranslation()

  // Build translated labels
  const categoryLabels = useMemo(() => ({
    cv: t('quests.categories.cv'),
    apply: t('quests.categories.apply'),
    network: t('quests.categories.network'),
    wellness: t('quests.categories.wellness'),
  }), [t])

  const energyLabels = useMemo(() => ({
    low: { text: t('quests.energy.low'), color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' },
    medium: { text: t('quests.energy.medium'), color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/40' },
    high: { text: t('quests.energy.high'), color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/40' },
  }), [t])
  const { user } = useAuthStore()
  const [quests, setQuests] = useState<Quest[]>([])
  const [stats, setStats] = useState<QuestStats>({ current_streak: 0, total_points: 0, quests_completed: 0 })
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)

  // Fetch daily quests
  useEffect(() => {
    if (!user) return

    const fetchQuests = async () => {
      try {
        setLoading(true)

        // First, ensure user has quests assigned for today
        await supabase.rpc('assign_daily_quests', { p_user_id: user.id })

        // Fetch quests with template info
        const { data: questsData, error: questsError } = await supabase
          .from('user_daily_quests')
          .select(`
            id,
            is_completed,
            quest_templates:quest_template_id (
              title,
              description,
              category,
              energy_level,
              points,
              estimated_minutes
            )
          `)
          .eq('user_id', user.id)
          .eq('assigned_date', new Date().toISOString().split('T')[0])

        if (questsError) throw questsError

        // Transform data
        const formattedQuests: Quest[] = questsData?.map((q: {
          id: string
          is_completed: boolean
          quest_templates: {
            title: string
            description: string
            category: 'cv' | 'apply' | 'network' | 'wellness'
            energy_level: 'low' | 'medium' | 'high'
            points: number
            estimated_minutes: number
          }
        }) => ({
          id: q.id,
          title: q.quest_templates.title,
          description: q.quest_templates.description,
          category: q.quest_templates.category,
          energy_level: q.quest_templates.energy_level,
          points: q.quest_templates.points,
          estimated_minutes: q.quest_templates.estimated_minutes,
          is_completed: q.is_completed,
        })) || []

        setQuests(formattedQuests)

        // Fetch stats
        const { data: statsData, error: statsError } = await supabase
          .from('user_quest_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (statsError) throw statsError

        if (statsData) {
          setStats(statsData)
        }
      } catch (err) {
        console.error('Error fetching quests:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuests()
  }, [user])

  // Complete a quest
  const completeQuest = async (questId: string) => {
    if (!user) return

    setCompletingId(questId)

    try {
      const { error } = await supabase.rpc('complete_quest', {
        p_quest_id: questId,
        p_user_id: user.id,
      })

      if (error) throw error

      // Update local state
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, is_completed: true } : q))
      )

      // Update stats
      const quest = quests.find((q) => q.id === questId)
      if (quest) {
        setStats((prev) => ({
          ...prev,
          total_points: prev.total_points + quest.points,
          quests_completed: prev.quests_completed + 1,
        }))
      }
    } catch (err) {
      console.error('Error completing quest:', err)
    } finally {
      setCompletingId(null)
    }
  }

  const completedCount = quests.filter((q) => q.is_completed).length
  const totalPoints = quests.filter((q) => q.is_completed).reduce((sum, q) => sum + q.points, 0)
  const progress = quests.length > 0 ? Math.round((completedCount / quests.length) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-100 dark:bg-stone-700 rounded-2xl animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-stone-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-2xl border border-yellow-200 dark:border-yellow-700">
          <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center shadow-sm mb-3">
            <Zap size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{totalPoints}</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">{t('quests.pointsToday')}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl border border-orange-200 dark:border-orange-700">
          <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center shadow-sm mb-3">
            <Flame size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{stats.current_streak}</p>
          <p className="text-sm text-orange-600 dark:text-orange-400">{t('quests.daysInRow')}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-700">
          <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center shadow-sm mb-3">
            <Trophy size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{stats.quests_completed}</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('quests.totalCompleted')}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-stone-100">{t('quests.todaysProgress')}</h3>
          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-stone-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-slate-700 dark:text-stone-300 mt-3">
          {t('quests.ofQuestsCompleted', { completed: completedCount, total: quests.length })}
        </p>
      </div>

      {/* Quests List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 dark:text-stone-100 text-lg">{t('quests.todaysQuests')}</h3>

        {quests.length === 0 ? (
          <div className="p-8 bg-slate-50 dark:bg-stone-800 rounded-2xl text-center">
            <p className="text-slate-600 dark:text-stone-400">{t('quests.noQuestsYet')}</p>
            <p className="text-sm text-slate-700 dark:text-stone-300 mt-1">{t('quests.comeBackTomorrow')}</p>
          </div>
        ) : (
          quests.map((quest) => {
            const energy = energyLabels[quest.energy_level]

            return (
              <div
                key={quest.id}
                className={cn(
                  'relative p-5 rounded-2xl border-2 transition-all',
                  quest.is_completed
                    ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                    : 'bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-700 hover:border-yellow-300 dark:hover:border-yellow-600'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => !quest.is_completed && completeQuest(quest.id)}
                    disabled={quest.is_completed || completingId === quest.id}
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                      quest.is_completed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-stone-700 text-slate-600 dark:text-stone-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 hover:text-yellow-600 dark:hover:text-yellow-400'
                    )}
                  >
                    {completingId === quest.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : quest.is_completed ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{categoryIcons[quest.category]}</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-stone-300">
                        {categoryLabels[quest.category]}
                      </span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', energy.color)}>
                        {energy.text}
                      </span>
                    </div>

                    <h4
                      className={cn(
                        'font-semibold text-slate-800 dark:text-stone-100 mt-1',
                        quest.is_completed && 'line-through text-slate-600 dark:text-stone-400'
                      )}
                    >
                      {quest.title}
                    </h4>

                    <p
                      className={cn(
                        'text-sm mt-1',
                        quest.is_completed ? 'text-slate-600 dark:text-stone-400' : 'text-slate-600 dark:text-stone-400'
                      )}
                    >
                      {quest.description}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="text-slate-700 dark:text-stone-300">⏱ {quest.estimated_minutes} {t('quests.min')}</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">+{quest.points} {t('quests.points')}</span>
                    </div>
                  </div>
                </div>

                {/* Completed badge */}
                {quest.is_completed && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-full">
                      {t('quests.completed')}
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* All completed celebration */}
      {completedCount === quests.length && quests.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-700 text-center">
          <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4">
            <Trophy size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">{t('quests.greatJob')}</h3>
          <p className="text-emerald-700 dark:text-emerald-400 mt-2">
            {t('quests.allQuestsComplete')}
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-700">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <ChevronRight size={16} />
          {t('quests.tip')}
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
          {t('quests.tipText')}
        </p>
      </div>
    </div>
  )
}
