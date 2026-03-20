/**
 * GoalsTab - Weekly goals and reflections
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, Plus, Check, Circle, Trash2, MessageSquare,
  ChevronRight, Award, TrendingUp, Calendar, Sparkles
} from 'lucide-react'
import { useWeeklyGoals } from '@/hooks/useDiary'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

const CATEGORIES = [
  { id: 'career', label: 'Karriär', emoji: '💼', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'health', label: 'Hälsa', emoji: '🏃', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'personal', label: 'Personligt', emoji: '🌟', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'learning', label: 'Lärande', emoji: '📚', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'general', label: 'Övrigt', emoji: '✨', color: 'bg-slate-100 text-slate-700 border-slate-200' },
]

const PRIORITIES = [
  { value: 1, label: 'Hög', color: 'bg-red-100 text-red-700' },
  { value: 2, label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 3, label: 'Låg', color: 'bg-green-100 text-green-700' },
]

function AddGoalForm({
  onAdd,
  onCancel
}: {
  onAdd: (goal: { goal_text: string; category: string; priority: number }) => void
  onCancel: () => void
}) {
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
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vad vill du uppnå denna vecka?
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="T.ex. Söka 5 jobb, Träna 3 gånger..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kategori
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
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prioritet
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
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Avbryt
          </Button>
          <Button type="submit" disabled={!text.trim() || isSubmitting} className="flex-1">
            {isSubmitting ? 'Lägger till...' : 'Lägg till mål'}
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
      goal.is_completed && "opacity-75 bg-slate-50"
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={cn(
            "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
            goal.is_completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 hover:border-violet-400"
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
              {categoryConfig.emoji} {categoryConfig.label}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              priorityConfig.color
            )}>
              {priorityConfig.label}
            </span>
          </div>

          <p className={cn(
            "text-slate-800 font-medium",
            goal.is_completed && "line-through text-slate-500"
          )}>
            {goal.goal_text}
          </p>

          {goal.reflection && !showReflection && (
            <div className="mt-2 p-3 bg-violet-50 rounded-lg">
              <p className="text-sm text-violet-700">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                {goal.reflection}
              </p>
            </div>
          )}

          {showReflection && (
            <div className="mt-3 space-y-2">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Hur gick det? Vad lärde du dig?"
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowReflection(false)}>
                  Avbryt
                </Button>
                <Button size="sm" onClick={handleSaveReflection}>
                  Spara
                </Button>
              </div>
            </div>
          )}

          {goal.is_completed && goal.completed_at && !showReflection && (
            <p className="text-xs text-slate-400 mt-2">
              Avklarad {new Date(goal.completed_at).toLocaleDateString('sv-SE')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {goal.is_completed && !goal.reflection && !showReflection && (
            <button
              onClick={() => setShowReflection(true)}
              className="p-1.5 hover:bg-violet-50 rounded text-violet-500"
              title="Lägg till reflektion"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Ta bort detta mål?')) {
                onDelete()
              }
            }}
            className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
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
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-violet-900">Veckans framsteg</h3>
          <p className="text-sm text-violet-600">
            {completed} av {total} mål avklarade
          </p>
        </div>
        <div className="w-16 h-16 rounded-full bg-white border-4 border-violet-200 flex items-center justify-center">
          <span className="text-xl font-bold text-violet-600">{progress}%</span>
        </div>
      </div>

      <div className="w-full bg-violet-200 rounded-full h-3">
        <div
          className="bg-violet-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {progress === 100 && total > 0 && (
        <div className="mt-4 flex items-center gap-2 text-violet-700">
          <Award className="w-5 h-5" />
          <span className="font-medium">Fantastiskt! Alla mål avklarade!</span>
        </div>
      )}
    </Card>
  )
}

export function GoalsTab() {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
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
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-violet-600" />
            Veckans mål
          </h2>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {weekRange}
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nytt mål
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
          <Target className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Inga mål satta för denna vecka
          </h3>
          <p className="text-slate-500 mb-6">
            Sätt upp mål för att hålla fokus och spåra dina framsteg
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Sätt ditt första mål
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending goals */}
          {pendingGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Pågående ({pendingGoals.length})
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
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Avklarade ({completedGoals.length})
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
            <h4 className="font-medium text-amber-900 mb-1">Tips för bättre mål</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Var specifik - "Söka 5 jobb" istället för "Söka jobb"</li>
              <li>• Gör dem mätbara så du vet när du är klar</li>
              <li>• Ha max 3-5 mål per vecka för att hålla fokus</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default GoalsTab
