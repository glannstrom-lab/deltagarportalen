/**
 * JourneyGoals - Personal goal setting and tracking
 */

import { useState } from 'react'
import {
  Target, Plus, Check, Trash2, Calendar,
  Send, BookOpen, Edit3, TrendingUp, X
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import type { UserGoal } from '@/services/journeyService'

interface JourneyGoalsProps {
  goals: UserGoal[]
  onCreateGoal: (goal: {
    type: 'weekly' | 'monthly' | 'custom'
    title: string
    description?: string
    target_value: number
    metric: string
    deadline?: string
  }) => Promise<unknown>
  onUpdateProgress: (goalId: string, value: number) => Promise<void>
  onDeleteGoal: (goalId: string) => Promise<void>
}

const GOAL_TEMPLATES = [
  { metric: 'applications', title: 'Skicka jobbansökningar', icon: Send, suggested: 5 },
  { metric: 'articles', title: 'Läs artiklar', icon: BookOpen, suggested: 3 },
  { metric: 'diary_entries', title: 'Skriv dagboksinlägg', icon: Edit3, suggested: 3 },
  { metric: 'xp', title: 'Tjäna XP-poäng', icon: TrendingUp, suggested: 100 }
]

export function JourneyGoals({
  goals,
  onCreateGoal,
  onUpdateProgress,
  onDeleteGoal
}: JourneyGoalsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    type: 'weekly' as const,
    title: '',
    target_value: 5,
    metric: 'applications'
  })
  const [isCreating, setIsCreating] = useState(false)

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  const handleCreate = async () => {
    if (!newGoal.title.trim()) return

    setIsCreating(true)
    try {
      await onCreateGoal({
        ...newGoal,
        deadline: newGoal.type === 'weekly'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : newGoal.type === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : undefined
      })
      setShowCreateForm(false)
      setNewGoal({ type: 'weekly', title: '', target_value: 5, metric: 'applications' })
    } finally {
      setIsCreating(false)
    }
  }

  const handleQuickCreate = async (template: typeof GOAL_TEMPLATES[0]) => {
    setIsCreating(true)
    try {
      await onCreateGoal({
        type: 'weekly',
        title: template.title,
        target_value: template.suggested,
        metric: template.metric,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    } finally {
      setIsCreating(false)
    }
  }

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null
    const date = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Förfallen'
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Imorgon'
    if (diffDays < 7) return `${diffDays} dagar kvar`
    return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-stone-900">Mina mål</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nytt mål
        </Button>
      </div>

      {/* Quick create templates */}
      {activeGoals.length === 0 && !showCreateForm && (
        <div className="mb-6">
          <p className="text-sm text-stone-700 mb-3">Snabbskapa veckomål:</p>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_TEMPLATES.map(template => {
              const Icon = template.icon
              return (
                <button
                  key={template.metric}
                  onClick={() => handleQuickCreate(template)}
                  disabled={isCreating}
                  className="flex items-center gap-2 p-3 rounded-lg border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-stone-700" />
                  <span className="text-sm text-stone-700">{template.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-stone-900">Skapa nytt mål</h4>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-stone-600 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Mål
              </label>
              <input
                type="text"
                value={newGoal.title}
                onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="T.ex. Skicka 5 ansökningar"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Antal
                </label>
                <input
                  type="number"
                  min={1}
                  value={newGoal.target_value}
                  onChange={e => setNewGoal(prev => ({ ...prev, target_value: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Tidsram
                </label>
                <select
                  value={newGoal.type}
                  onChange={e => setNewGoal(prev => ({ ...prev, type: e.target.value as 'weekly' | 'monthly' | 'custom' }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="weekly">Vecka</option>
                  <option value="monthly">Månad</option>
                  <option value="custom">Egen</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!newGoal.title.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? 'Skapar...' : 'Skapa mål'}
            </Button>
          </div>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          {activeGoals.map(goal => {
            const progressPercent = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
            const deadline = formatDeadline(goal.deadline)

            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl border border-stone-200 bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-stone-900">{goal.title}</h4>
                    {deadline && (
                      <div className="flex items-center gap-1 text-xs text-stone-700 mt-1">
                        <Calendar className="w-3 h-3" />
                        {deadline}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-stone-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-stone-700">
                    {goal.current_value}/{goal.target_value}
                  </span>
                </div>

                {/* Quick increment buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onUpdateProgress(goal.id, goal.current_value + 1)}
                    className="flex-1"
                  >
                    +1
                  </Button>
                  {goal.current_value < goal.target_value && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onUpdateProgress(goal.id, goal.target_value)}
                      className="flex-1"
                    >
                      Klart!
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {activeGoals.length === 0 && !showCreateForm && goals.length === 0 && (
        <div className="text-center py-6 text-stone-700">
          <Target className="w-10 h-10 mx-auto mb-2 text-stone-300" />
          <p>Du har inga aktiva mål.</p>
          <p className="text-sm">Sätt upp ett mål för att hålla dig motiverad!</p>
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-stone-200">
          <h4 className="text-sm font-medium text-stone-700 mb-3">
            Avklarade mål ({completedGoals.length})
          </h4>
          <div className="space-y-2">
            {completedGoals.slice(0, 3).map(goal => (
              <div
                key={goal.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50"
              >
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-700 flex-1">{goal.title}</span>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="text-emerald-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default JourneyGoals
