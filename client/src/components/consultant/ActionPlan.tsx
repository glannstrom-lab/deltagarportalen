/**
 * Action Plan Component with SMART Goals
 * Handlingsplan med SMARTA-mål (Specifika, Mätbara, Accepterade, Realistiska, Tidsbundna)
 */

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { 
  Target, 
  Plus, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  Save,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link as LinkIcon
} from '@/components/ui/icons'

export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'

export interface SmartGoal {
  id: string
  participantId: string
  consultantId: string
  title: string
  description: string
  
  // SMART-komponenter
  specific: string      // Vad exakt ska uppnås?
  measurable: string    // Hur mäter vi framgång?
  achievable: string    // Är det realistiskt?
  relevant: string      // Varför är det viktigt?
  timeBound: string     // När ska det vara klart?
  
  priority: GoalPriority
  status: GoalStatus
  deadline: string
  progress: number      // 0-100
  
  // Kopplingar
  relatedTo?: {
    type: 'CV' | 'INTEREST_GUIDE' | 'JOB_SEARCH' | 'EDUCATION' | 'OTHER'
    description: string
  }
  
  createdAt: string
  updatedAt: string
  completedAt?: string
}

interface ActionPlanProps {
  participantId: string
  participantName: string
  goals: SmartGoal[]
  onAddGoal: (goal: Omit<SmartGoal, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateGoal: (id: string, updates: Partial<SmartGoal>) => void
  onDeleteGoal: (id: string) => void
  className?: string
}

const priorityConfig: Record<GoalPriority, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'Hög', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  MEDIUM: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  LOW: { label: 'Låg', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
}

const statusConfig: Record<GoalStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  NOT_STARTED: { label: 'Inte påbörjad', color: 'text-slate-700 dark:text-stone-300', icon: Clock },
  IN_PROGRESS: { label: 'Pågående', color: 'text-blue-500 dark:text-blue-400', icon: TrendingUp },
  COMPLETED: { label: 'Avklarad', color: 'text-emerald-500 dark:text-emerald-400', icon: CheckCircle2 },
  BLOCKED: { label: 'Blockerad', color: 'text-rose-500 dark:text-rose-400', icon: AlertCircle },
}

// Mallar för SMARTA-mål
const goalTemplates = [
  {
    title: 'Skapa komplett CV',
    specific: 'Färdigställa CV med alla obligatoriska sektioner',
    measurable: 'CV:t ska innehålla personuppgifter, erfarenhet, utbildning och kompetenser',
    achievable: 'Genom att fylla i en sektion per dag',
    relevant: 'Ett komplett CV krävs för att kunna söka jobb effektivt',
    timeBound: 'Inom 2 veckor',
    priority: 'HIGH' as GoalPriority,
    relatedTo: { type: 'CV' as const, description: 'CV-byggaren' }
  },
  {
    title: 'Slutför intresseguiden',
    specific: 'Besvara alla frågor i intresseguiden',
    measurable: 'Samtliga 24 frågor besvarade',
    achievable: 'Genom att göra 5 frågor per session',
    relevant: 'För att förstå vilka yrken som passar bäst',
    timeBound: 'Inom 1 vecka',
    priority: 'HIGH' as GoalPriority,
    relatedTo: { type: 'INTEREST_GUIDE' as const, description: 'Intresseguide' }
  },
  {
    title: 'Spara intressanta jobb',
    specific: 'Hitta och spara jobb som matchar profilen',
    measurable: 'Minst 5 sparade jobb',
    achievable: 'Genom att söka 15 minuter per dag',
    relevant: 'För att ha alternativ redo när det är dags att söka',
    timeBound: 'Inom 2 veckor',
    priority: 'MEDIUM' as GoalPriority,
    relatedTo: { type: 'JOB_SEARCH' as const, description: 'Jobbsökning' }
  },
  {
    title: 'Skriv dagbok regelbundet',
    specific: 'Reflektera över jobbsökarprocessen',
    measurable: 'Minst 3 inlägg per vecka',
    achievable: 'Genom att skriva 10 minuter efter varje aktivitet',
    relevant: 'För att följa utveckling och mående över tid',
    timeBound: 'Pågående varje vecka',
    priority: 'MEDIUM' as GoalPriority,
    relatedTo: { type: 'OTHER' as const, description: 'Dagbok' }
  }
]

export function ActionPlan({
  participantId,
  participantName,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  className,
}: ActionPlanProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [specific, setSpecific] = useState('')
  const [measurable, setMeasurable] = useState('')
  const [achievable, setAchievable] = useState('')
  const [relevant, setRelevant] = useState('')
  const [timeBound, setTimeBound] = useState('')
  const [priority, setPriority] = useState<GoalPriority>('MEDIUM')
  const [deadline, setDeadline] = useState('')
  const [relatedType, setRelatedType] = useState<SmartGoal['relatedTo']['type']>('OTHER')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSpecific('')
    setMeasurable('')
    setAchievable('')
    setRelevant('')
    setTimeBound('')
    setPriority('MEDIUM')
    setDeadline('')
    setRelatedType('OTHER')
  }

  const handleSubmit = () => {
    if (!title.trim() || !deadline) return

    onAddGoal({
      participantId,
      consultantId: 'current-user', // Ska hämtas från auth
      title: title.trim(),
      description: description.trim(),
      specific: specific.trim(),
      measurable: measurable.trim(),
      achievable: achievable.trim(),
      relevant: relevant.trim(),
      timeBound: timeBound.trim(),
      priority,
      status: 'NOT_STARTED',
      deadline,
      progress: 0,
      relatedTo: {
        type: relatedType,
        description: getRelatedDescription(relatedType)
      }
    })

    resetForm()
    setIsAdding(false)
  }

  const handleUpdate = (id: string) => {
    onUpdateGoal(id, {
      title: title.trim(),
      description: description.trim(),
      specific: specific.trim(),
      measurable: measurable.trim(),
      achievable: achievable.trim(),
      relevant: relevant.trim(),
      timeBound: timeBound.trim(),
      priority,
      deadline,
      relatedTo: {
        type: relatedType,
        description: getRelatedDescription(relatedType)
      }
    })

    setEditingId(null)
    resetForm()
  }

  const handleEdit = (goal: SmartGoal) => {
    setEditingId(goal.id)
    setTitle(goal.title)
    setDescription(goal.description)
    setSpecific(goal.specific)
    setMeasurable(goal.measurable)
    setAchievable(goal.achievable)
    setRelevant(goal.relevant)
    setTimeBound(goal.timeBound)
    setPriority(goal.priority)
    setDeadline(goal.deadline)
    setRelatedType(goal.relatedTo?.type || 'OTHER')
    setExpandedId(goal.id)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setShowTemplates(false)
    resetForm()
  }

  const applyTemplate = (template: typeof goalTemplates[0]) => {
    setTitle(template.title)
    setDescription(template.specific)
    setSpecific(template.specific)
    setMeasurable(template.measurable)
    setAchievable(template.achievable)
    setRelevant(template.relevant)
    setTimeBound(template.timeBound)
    setPriority(template.priority)
    setRelatedType(template.relatedTo.type)
    setShowTemplates(false)
    
    // Sätt deadline baserat på timeBound
    const days = template.timeBound.includes('2 veckor') ? 14 : 
                 template.timeBound.includes('1 vecka') ? 7 : 30
    const date = new Date()
    date.setDate(date.getDate() + days)
    setDeadline(date.toISOString().split('T')[0])
  }

  const getRelatedDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      CV: 'CV-byggaren',
      INTEREST_GUIDE: 'Intresseguide',
      JOB_SEARCH: 'Jobbsökning',
      EDUCATION: 'Utbildning',
      OTHER: 'Övrigt'
    }
    return descriptions[type] || 'Övrigt'
  }

  // Statistik
  const stats = useMemo(() => {
    const total = goals.length
    const completed = goals.filter(g => g.status === 'COMPLETED').length
    const inProgress = goals.filter(g => g.status === 'IN_PROGRESS').length
    const blocked = goals.filter(g => g.status === 'BLOCKED').length
    const highPriority = goals.filter(g => g.priority === 'HIGH' && g.status !== 'COMPLETED').length
    return { total, completed, inProgress, blocked, highPriority }
  }, [goals])

  // Sortera mål: Först efter status (inte avklarade först), sedan efter prioritet
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1
      if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1
      
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [goals])

  return (
    <div className={cn('bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-slate-200 dark:border-stone-700', className)}>
      {/* Header med statistik */}
      <div className="p-6 border-b border-slate-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-stone-100">Handlingsplan</h3>
              <p className="text-sm text-slate-700 dark:text-stone-300">SMARTA-mål för {participantName}</p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Nytt mål</span>
          </button>
        </div>

        {/* Statistik-kort */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-stone-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-800 dark:text-stone-100">{stats.total}</p>
            <p className="text-xs text-slate-700 dark:text-stone-300">Totalt</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Avklarade</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Pågående</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.highPriority}</p>
            <p className="text-xs text-rose-600 dark:text-rose-400">Hög prio</p>
          </div>
        </div>
      </div>

      {/* Mallar */}
      {showTemplates && (
        <div className="p-4 bg-slate-50 dark:bg-stone-800 border-b border-slate-100 dark:border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-700 dark:text-stone-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Välj en mall
            </h4>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-sm text-slate-700 dark:text-stone-300 hover:text-slate-900 dark:hover:text-stone-100"
            >
              Stäng
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goalTemplates.map((template, i) => (
              <button
                key={i}
                onClick={() => applyTemplate(template)}
                className="text-left p-4 bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    priorityConfig[template.priority].bg,
                    priorityConfig[template.priority].color
                  )}>
                    {priorityConfig[template.priority].label}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-stone-400">{template.timeBound}</span>
                </div>
                <p className="font-medium text-slate-800 dark:text-stone-100">{template.title}</p>
                <p className="text-sm text-slate-700 dark:text-stone-300 mt-1">{template.specific}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lägg till/Redigera formulär */}
      {(isAdding || editingId) && (
        <div className="p-6 bg-slate-50 dark:bg-stone-800 border-b border-slate-100 dark:border-stone-700">
          {!showTemplates && isAdding && (
            <button
              onClick={() => setShowTemplates(true)}
              className="mb-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Eller välj från mall
            </button>
          )}

          <div className="space-y-4">
            {/* Titel och deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  Mål (Specifikt)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Vad ska uppnås?"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  Deadline (Tidsbundet)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* SMART-komponenter */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  Mätbart - Hur vet vi att det är uppnått?
                </label>
                <input
                  type="text"
                  value={measurable}
                  onChange={(e) => setMeasurable(e.target.value)}
                  placeholder="Ex: Minst 5 sparade jobb, 80% komplett CV..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                    Genomförbart - Hur ska vi göra?
                  </label>
                  <input
                    type="text"
                    value={achievable}
                    onChange={(e) => setAchievable(e.target.value)}
                    placeholder="Ex: Genom att..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                    Relevant - Varför är det viktigt?
                  </label>
                  <input
                    type="text"
                    value={relevant}
                    onChange={(e) => setRelevant(e.target.value)}
                    placeholder="Ex: För att kunna..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Prioritet och koppling */}
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  Prioritet
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as GoalPriority)}
                  className="px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                >
                  <option value="HIGH">Hög</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Låg</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  Kopplad till
                </label>
                <select
                  value={relatedType}
                  onChange={(e) => setRelatedType(e.target.value as SmartGoal['relatedTo']['type'])}
                  className="px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                >
                  <option value="CV">CV</option>
                  <option value="INTEREST_GUIDE">Intresseguide</option>
                  <option value="JOB_SEARCH">Jobbsökning</option>
                  <option value="EDUCATION">Utbildning</option>
                  <option value="OTHER">Övrigt</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleSubmit()}
                disabled={!title.trim() || !deadline}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Uppdatera' : 'Spara mål'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mållista */}
      <div className="max-h-[600px] overflow-y-auto">
        {goals.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="w-12 h-12 text-slate-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-stone-300">Inga mål ännu</p>
            <p className="text-sm text-slate-600 dark:text-stone-400 mt-1">
              Skapa SMARTA-mål för att hjälpa deltagaren framåt
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-stone-700">
            {sortedGoals.map((goal) => {
              const isExpanded = expandedId === goal.id
              const priorityStyle = priorityConfig[goal.priority]
              const statusStyle = statusConfig[goal.status]
              const StatusIcon = statusStyle.icon

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'p-4 transition-colors',
                    goal.status === 'COMPLETED' && 'bg-emerald-50/50 dark:bg-emerald-900/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox för status */}
                    <button
                      onClick={() => onUpdateGoal(goal.id, {
                        status: goal.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED',
                        progress: goal.status === 'COMPLETED' ? 0 : 100,
                        completedAt: goal.status === 'COMPLETED' ? undefined : new Date().toISOString()
                      })}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                        goal.status === 'COMPLETED'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 dark:border-stone-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                      )}
                    >
                      {goal.status === 'COMPLETED' && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className={cn(
                          'font-semibold text-slate-800 dark:text-stone-100',
                          goal.status === 'COMPLETED' && 'line-through text-slate-700 dark:text-stone-400'
                        )}>
                          {goal.title}
                        </h4>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', priorityStyle.bg, priorityStyle.color)}>
                          {priorityStyle.label}
                        </span>
                        <span className={cn('text-xs flex items-center gap-1', statusStyle.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusStyle.label}
                        </span>
                        {goal.relatedTo && (
                          <span className="text-xs text-slate-600 dark:text-stone-400 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {goal.relatedTo.description}
                          </span>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-stone-700 rounded-full max-w-[150px]">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              goal.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'
                            )}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-700 dark:text-stone-300">{goal.progress}%</span>
                        <span className="text-xs text-slate-600 dark:text-stone-400">
                          Deadline: {new Date(goal.deadline).toLocaleDateString('sv-SE')}
                        </span>
                      </div>

                      {/* Expandable details */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-stone-800 rounded-lg space-y-2 animate-in fade-in">
                          <div>
                            <span className="text-xs font-medium text-slate-700 dark:text-stone-300">Mätbart:</span>
                            <p className="text-sm text-slate-700 dark:text-stone-300">{goal.measurable}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs font-medium text-slate-700 dark:text-stone-300">Genomförbart:</span>
                              <p className="text-sm text-slate-700 dark:text-stone-300">{goal.achievable}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-700 dark:text-stone-300">Relevant:</span>
                              <p className="text-sm text-slate-700 dark:text-stone-300">{goal.relevant}</p>
                            </div>
                          </div>

                          {/* Progress update */}
                          {goal.status !== 'COMPLETED' && (
                            <div className="pt-2 border-t border-slate-200 dark:border-stone-700">
                              <label className="text-xs font-medium text-slate-700 dark:text-stone-300 block mb-1">
                                Uppdatera framsteg:
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={goal.progress}
                                onChange={(e) => onUpdateGoal(goal.id, {
                                  progress: parseInt(e.target.value),
                                  status: parseInt(e.target.value) === 100 ? 'COMPLETED' :
                                          parseInt(e.target.value) > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
                                })}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expand button */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Visa mindre
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Visa SMARTA-kriterier
                          </>
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-1.5 text-slate-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Redigera"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1.5 text-slate-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActionPlan
