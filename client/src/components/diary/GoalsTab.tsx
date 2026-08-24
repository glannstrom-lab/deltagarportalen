/**
 * GoalsTab - Weekly goals and reflections
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, Plus, Check, Trash2, MessageSquare,
  Award, Calendar, Sparkles
} from '@/components/ui/icons'
import { useWeeklyGoals } from '@/hooks/useDiary'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

const CATEGORIES = [
  { id: 'career', labelKey: 'diary.goals.categories.career', emoji: '💼', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'health', labelKey: 'diary.goals.categories.health', emoji: '🏃', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'personal', labelKey: 'diary.goals.categories.personal', emoji: '🌟', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'learning', labelKey: 'diary.goals.categories.learning', emoji: '📚', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'general', labelKey: 'diary.goals.categories.general', emoji: '✨', color: 'bg-stone-100 text-stone-700 border-stone-200' },
]

const PRIORITIES = [
  { value: 1, labelKey: 'diary.goals.priorities.high', color: 'bg-red-100 text-red-700' },
  { value: 2, labelKey: 'diary.goals.priorities.medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 3, labelKey: 'diary.goals.priorities.low', color: 'bg-green-100 text-green-700' },
]

function AddGoalForm({
  onAdd,
  onCancel
}: {
  onAdd: (goal: { goal_text: string; category: string; priority: number }) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState(2)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsSubmitting(true)
    try {
      await onAdd({ goal_text: text.trim(), category, priority })
      setText('')
      setCategory('general')
      setPriority(2)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="goalstab-f1" className="block text-sm font-medium text-stone-700 mb-2">
            {t('diary.goals.form.questionLabel')}
          </label>
          <input
            id="goalstab-f1"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('diary.goals.form.placeholder')}
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {t('diary.goals.form.category')}
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                    category === cat.id
                      ? cat.color
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  )}
                >
                  {cat.emoji} {t(cat.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {t('diary.goals.form.priority')}
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    priority === p.value
                      ? p.color
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!text.trim() || isSubmitting} className="flex-1">
            {isSubmitting ? t('diary.goals.form.adding') : t('diary.goals.form.add')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

interface Goal {
  id: string
  goal_text: string
  category: string
  priority: number
  is_completed: boolean
  completed_at?: string
  reflection?: string
}

function GoalCard({
  goal,
  onToggle,
  onDelete,
  onReflect
}: {
  goal: Goal
  onToggle: () => void
  onDelete: () => void
  onReflect: (reflection: string) => void
}) {
  const { t } = useTranslation()
  const [showReflection, setShowReflection] = useState(false)
  const [reflection, setReflection] = useState(goal.reflection || '')

  const categoryConfig = CATEGORIES.find(c => c.id === goal.category) || CATEGORIES[4]
  const priorityConfig = PRIORITIES.find(p => p.value === goal.priority) || PRIORITIES[1]

  const handleSaveReflection = () => {
    onReflect(reflection)
    setShowReflection(false)
  }

  return (
    <Card className={cn(
      "p-4 transition-all",
      goal.is_completed && "opacity-75 bg-stone-50"
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={cn(
            "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
            goal.is_completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-stone-300 hover:border-[var(--c-solid)]/60"
          )}
        >
          {goal.is_completed && <Check className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium border",
              categoryConfig.color
            )}>
              {categoryConfig.emoji} {t(categoryConfig.labelKey)}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              priorityConfig.color
            )}>
              {t(priorityConfig.labelKey)}
            </span>
          </div>

          <p className={cn(
            "text-stone-800 font-medium",
            goal.is_completed && "line-through text-stone-700"
          )}>
            {goal.goal_text}
          </p>

          {goal.reflection && !showReflection && (
            <div className="mt-2 p-3 bg-[var(--c-bg)] rounded-lg">
              <p className="text-sm text-[var(--c-text)]">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                {goal.reflection}
              </p>
            </div>
          )}

          {showReflection && (
            <div className="mt-3 space-y-2">
              <textarea
                aria-label={t('diary.goals.card.reflectionLabel')}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={t('diary.goals.card.reflectionPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowReflection(false)}>
                  {t('common.cancel')}
                </Button>
                <Button size="sm" onClick={handleSaveReflection}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          )}

          {goal.is_completed && goal.completed_at && !showReflection && (
            <p className="text-xs text-stone-600 mt-2">
              {t('diary.goals.card.completedOn', { date: new Date(goal.completed_at).toLocaleDateString('sv-SE') })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {goal.is_completed && !goal.reflection && !showReflection && (
            <button
              onClick={() => setShowReflection(true)}
              className="p-1.5 hover:bg-[var(--c-bg)] rounded text-[var(--c-solid)]"
              title={t('diary.goals.card.addReflection')}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(t('diary.goals.card.confirmDelete'))) {
                onDelete()
              }
            }}
            className="p-1.5 hover:bg-red-50 rounded text-stone-600 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}

function WeekProgress({
  completed,
  total
}: {
  completed: number
  total: number
}) {
  const { t } = useTranslation()
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card className="p-5 bg-[var(--c-bg)] border-[var(--c-accent)]/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[var(--c-text)]">{t('diary.goals.progress.title')}</h3>
          <p className="text-sm text-[var(--c-text)]">
            {t('diary.goals.progress.completedOfTotal', { completed, total })}
          </p>
        </div>
        <div className="w-16 h-16 rounded-full bg-white border-4 border-[var(--c-accent)]/60 flex items-center justify-center">
          <span className="text-xl font-bold text-[var(--c-text)]">{progress}%</span>
        </div>
      </div>

      <div className="w-full bg-[var(--c-accent)]/60 rounded-full h-3">
        <div
          className="bg-[var(--c-solid)] h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {progress === 100 && total > 0 && (
        <div className="mt-4 flex items-center gap-2 text-[var(--c-text)]">
          <Award className="w-5 h-5" />
          <span className="font-medium">{t('diary.goals.progress.allDone')}</span>
        </div>
      )}
    </Card>
  )
}

export function GoalsTab() {
  const { t } = useTranslation()
  const { goals, isLoading, createGoal, toggleComplete, addReflection, deleteGoal, completedCount, totalCount } = useWeeklyGoals()
  const [showAddForm, setShowAddForm] = useState(false)

  // Get current week range
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const weekRange = `${monday.getDate()} ${monday.toLocaleDateString('sv-SE', { month: 'short' })} - ${sunday.getDate()} ${sunday.toLocaleDateString('sv-SE', { month: 'short' })}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-solid)]" />
      </div>
    )
  }

  const handleAddGoal = async (goalData: { goal_text: string; category: string; priority: number }) => {
    await createGoal(goalData)
    setShowAddForm(false)
  }

  const pendingGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-[var(--c-text)]" />
            {t('diary.goals.header.title')}
          </h2>
          <p className="text-sm text-stone-700 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {weekRange}
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('diary.goals.header.newGoal')}
          </Button>
        )}
      </div>

      {/* Progress */}
      <WeekProgress completed={completedCount} total={totalCount} />

      {/* Add form */}
      {showAddForm && (
        <AddGoalForm
          onAdd={handleAddGoal}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Goals */}
      {goals.length === 0 && !showAddForm ? (
        <Card className="p-12 text-center">
          <img
            src="/illustrations/empty-vardag.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-28 h-28 mx-auto mb-4 select-none"
          />
          <h3 className="text-lg font-semibold text-stone-700 mb-2">
            {t('diary.goals.empty.title')}
          </h3>
          <p className="text-stone-700 mb-6">
            {t('diary.goals.empty.description')}
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('diary.goals.empty.cta')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending goals */}
          {pendingGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                {t('diary.goals.list.pending', { count: pendingGoals.length })}
              </h3>
              {pendingGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggle={() => toggleComplete(goal.id)}
                  onDelete={() => deleteGoal(goal.id)}
                  onReflect={(reflection) => addReflection(goal.id, reflection)}
                />
              ))}
            </div>
          )}

          {/* Completed goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t('diary.goals.list.completed', { count: completedGoals.length })}
              </h3>
              {completedGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggle={() => toggleComplete(goal.id)}
                  onDelete={() => deleteGoal(goal.id)}
                  onReflect={(reflection) => addReflection(goal.id, reflection)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">{t('diary.goals.tips.title')}</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• {t('diary.goals.tips.tip1')}</li>
              <li>• {t('diary.goals.tips.tip2')}</li>
              <li>• {t('diary.goals.tips.tip3')}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default GoalsTab
