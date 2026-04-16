/**
 * Action Plan Component with SMART Goals
 * Handlingsplan med SMARTA-mål (Specifika, Mätbara, Accepterade, Realistiska, Tidsbundna)
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

const priorityStyles: Record<GoalPriority, { color: string; bg: string }> = {
  HIGH: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  MEDIUM: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  LOW: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
}

const statusStyles: Record<GoalStatus, { color: string; icon: typeof CheckCircle2 }> = {
  NOT_STARTED: { color: 'text-slate-700 dark:text-stone-300', icon: Clock },
  IN_PROGRESS: { color: 'text-blue-500 dark:text-blue-400', icon: TrendingUp },
  COMPLETED: { color: 'text-emerald-500 dark:text-emerald-400', icon: CheckCircle2 },
  BLOCKED: { color: 'text-rose-500 dark:text-rose-400', icon: AlertCircle },
}

export function ActionPlan({
  participantId,
  participantName,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  className,
}: ActionPlanProps) {
  const { t, i18n } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // Dynamic config objects with translations
  const priorityConfig = useMemo(() => ({
    HIGH: { label: t('consultant.actionPlan.priority.high'), ...priorityStyles.HIGH },
    MEDIUM: { label: t('consultant.actionPlan.priority.medium'), ...priorityStyles.MEDIUM },
    LOW: { label: t('consultant.actionPlan.priority.low'), ...priorityStyles.LOW },
  }), [t])

  const statusConfig = useMemo(() => ({
    NOT_STARTED: { label: t('consultant.actionPlan.status.notStarted'), ...statusStyles.NOT_STARTED },
    IN_PROGRESS: { label: t('consultant.actionPlan.status.inProgress'), ...statusStyles.IN_PROGRESS },
    COMPLETED: { label: t('consultant.actionPlan.status.completed'), ...statusStyles.COMPLETED },
    BLOCKED: { label: t('consultant.actionPlan.status.blocked'), ...statusStyles.BLOCKED },
  }), [t])

  const goalTemplates = useMemo(() => [
    {
      title: t('consultant.actionPlan.templates.createCV.title'),
      specific: t('consultant.actionPlan.templates.createCV.specific'),
      measurable: t('consultant.actionPlan.templates.createCV.measurable'),
      achievable: t('consultant.actionPlan.templates.createCV.achievable'),
      relevant: t('consultant.actionPlan.templates.createCV.relevant'),
      timeBound: t('consultant.actionPlan.templates.createCV.timeBound'),
      priority: 'HIGH' as GoalPriority,
      relatedTo: { type: 'CV' as const, description: t('consultant.actionPlan.relatedTo.cv') }
    },
    {
      title: t('consultant.actionPlan.templates.interestGuide.title'),
      specific: t('consultant.actionPlan.templates.interestGuide.specific'),
      measurable: t('consultant.actionPlan.templates.interestGuide.measurable'),
      achievable: t('consultant.actionPlan.templates.interestGuide.achievable'),
      relevant: t('consultant.actionPlan.templates.interestGuide.relevant'),
      timeBound: t('consultant.actionPlan.templates.interestGuide.timeBound'),
      priority: 'HIGH' as GoalPriority,
      relatedTo: { type: 'INTEREST_GUIDE' as const, description: t('consultant.actionPlan.relatedTo.interestGuide') }
    },
    {
      title: t('consultant.actionPlan.templates.saveJobs.title'),
      specific: t('consultant.actionPlan.templates.saveJobs.specific'),
      measurable: t('consultant.actionPlan.templates.saveJobs.measurable'),
      achievable: t('consultant.actionPlan.templates.saveJobs.achievable'),
      relevant: t('consultant.actionPlan.templates.saveJobs.relevant'),
      timeBound: t('consultant.actionPlan.templates.saveJobs.timeBound'),
      priority: 'MEDIUM' as GoalPriority,
      relatedTo: { type: 'JOB_SEARCH' as const, description: t('consultant.actionPlan.relatedTo.jobSearch') }
    },
    {
      title: t('consultant.actionPlan.templates.writeDiary.title'),
      specific: t('consultant.actionPlan.templates.writeDiary.specific'),
      measurable: t('consultant.actionPlan.templates.writeDiary.measurable'),
      achievable: t('consultant.actionPlan.templates.writeDiary.achievable'),
      relevant: t('consultant.actionPlan.templates.writeDiary.relevant'),
      timeBound: t('consultant.actionPlan.templates.writeDiary.timeBound'),
      priority: 'MEDIUM' as GoalPriority,
      relatedTo: { type: 'OTHER' as const, description: t('consultant.actionPlan.relatedTo.diary') }
    }
  ], [t])

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
      CV: t('consultant.actionPlan.relatedTo.cv'),
      INTEREST_GUIDE: t('consultant.actionPlan.relatedTo.interestGuide'),
      JOB_SEARCH: t('consultant.actionPlan.relatedTo.jobSearch'),
      EDUCATION: t('consultant.actionPlan.relatedTo.education'),
      OTHER: t('consultant.actionPlan.relatedTo.other')
    }
    return descriptions[type] || t('consultant.actionPlan.relatedTo.other')
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
              <h3 className="font-semibold text-slate-800 dark:text-stone-100">{t('consultant.actionPlan.title')}</h3>
              <p className="text-sm text-slate-700 dark:text-stone-300">{t('consultant.actionPlan.subtitle', { name: participantName })}</p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{t('consultant.actionPlan.newGoal')}</span>
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-stone-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-800 dark:text-stone-100">{stats.total}</p>
            <p className="text-xs text-slate-700 dark:text-stone-300">{t('consultant.actionPlan.stats.total')}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('consultant.actionPlan.stats.completed')}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{t('consultant.actionPlan.stats.inProgress')}</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.highPriority}</p>
            <p className="text-xs text-rose-600 dark:text-rose-400">{t('consultant.actionPlan.stats.highPriority')}</p>
          </div>
        </div>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="p-4 bg-slate-50 dark:bg-stone-800 border-b border-slate-100 dark:border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-700 dark:text-stone-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              {t('consultant.actionPlan.selectTemplate')}
            </h4>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-sm text-slate-700 dark:text-stone-300 hover:text-slate-900 dark:hover:text-stone-100"
            >
              {t('common.close')}
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

      {/* Add/Edit form */}
      {(isAdding || editingId) && (
        <div className="p-6 bg-slate-50 dark:bg-stone-800 border-b border-slate-100 dark:border-stone-700">
          {!showTemplates && isAdding && (
            <button
              onClick={() => setShowTemplates(true)}
              className="mb-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              {t('consultant.actionPlan.orSelectTemplate')}
            </button>
          )}

          <div className="space-y-4">
            {/* Title and deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  {t('consultant.actionPlan.form.goalSpecific')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('consultant.actionPlan.form.goalPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  {t('consultant.actionPlan.form.deadlineTimeBound')}
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* SMART components */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  {t('consultant.actionPlan.form.measurable')}
                </label>
                <input
                  type="text"
                  value={measurable}
                  onChange={(e) => setMeasurable(e.target.value)}
                  placeholder={t('consultant.actionPlan.form.measurablePlaceholder')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                    {t('consultant.actionPlan.form.achievable')}
                  </label>
                  <input
                    type="text"
                    value={achievable}
                    onChange={(e) => setAchievable(e.target.value)}
                    placeholder={t('consultant.actionPlan.form.achievablePlaceholder')}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                    {t('consultant.actionPlan.form.relevant')}
                  </label>
                  <input
                    type="text"
                    value={relevant}
                    onChange={(e) => setRelevant(e.target.value)}
                    placeholder={t('consultant.actionPlan.form.relevantPlaceholder')}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Priority and relation */}
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  {t('consultant.actionPlan.form.priority')}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as GoalPriority)}
                  className="px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                >
                  <option value="HIGH">{t('consultant.actionPlan.priority.high')}</option>
                  <option value="MEDIUM">{t('consultant.actionPlan.priority.medium')}</option>
                  <option value="LOW">{t('consultant.actionPlan.priority.low')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-200 mb-1">
                  {t('consultant.actionPlan.form.relatedTo')}
                </label>
                <select
                  value={relatedType}
                  onChange={(e) => setRelatedType(e.target.value as SmartGoal['relatedTo']['type'])}
                  className="px-3 py-2 border border-slate-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-100"
                >
                  <option value="CV">{t('nav.cv')}</option>
                  <option value="INTEREST_GUIDE">{t('consultant.actionPlan.relatedTo.interestGuide')}</option>
                  <option value="JOB_SEARCH">{t('consultant.actionPlan.relatedTo.jobSearch')}</option>
                  <option value="EDUCATION">{t('consultant.actionPlan.relatedTo.education')}</option>
                  <option value="OTHER">{t('consultant.actionPlan.relatedTo.other')}</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleSubmit()}
                disabled={!title.trim() || !deadline}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? t('common.update') : t('consultant.actionPlan.saveGoal')}</span>
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
            <p className="text-slate-700 dark:text-stone-300">{t('consultant.actionPlan.noGoals')}</p>
            <p className="text-sm text-slate-600 dark:text-stone-400 mt-1">
              {t('consultant.actionPlan.noGoalsDesc')}
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
                          {t('consultant.actionPlan.deadline')}: {new Date(goal.deadline).toLocaleDateString(i18n.language === 'sv' ? 'sv-SE' : 'en-US')}
                        </span>
                      </div>

                      {/* Expandable details */}
                      {isExpanded && (
                        <div id={`goal-${goal.id}-details`} role="region" aria-label={t('consultant.actionPlan.smartCriteriaFor', { title: goal.title })} className="mt-3 p-3 bg-slate-50 dark:bg-stone-800 rounded-lg space-y-2 animate-in fade-in">
                          <div>
                            <span className="text-xs font-medium text-slate-700 dark:text-stone-300">{t('consultant.actionPlan.details.measurable')}:</span>
                            <p className="text-sm text-slate-700 dark:text-stone-300">{goal.measurable}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs font-medium text-slate-700 dark:text-stone-300">{t('consultant.actionPlan.details.achievable')}:</span>
                              <p className="text-sm text-slate-700 dark:text-stone-300">{goal.achievable}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-700 dark:text-stone-300">{t('consultant.actionPlan.details.relevant')}:</span>
                              <p className="text-sm text-slate-700 dark:text-stone-300">{goal.relevant}</p>
                            </div>
                          </div>

                          {/* Progress update */}
                          {goal.status !== 'COMPLETED' && (
                            <div className="pt-2 border-t border-slate-200 dark:border-stone-700">
                              <label className="text-xs font-medium text-slate-700 dark:text-stone-300 block mb-1">
                                {t('consultant.actionPlan.updateProgress')}:
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
                        aria-expanded={isExpanded}
                        aria-controls={`goal-${goal.id}-details`}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" aria-hidden="true" />
                            {t('consultant.actionPlan.showLess')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" aria-hidden="true" />
                            {t('consultant.actionPlan.showSmartCriteria')}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-1.5 text-slate-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1.5 text-slate-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title={t('common.delete')}
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
