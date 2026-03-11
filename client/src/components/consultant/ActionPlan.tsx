/**
 * Action Plan Component
 * Individual action plans with milestones and deadlines
 */

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import {
  Target,
  Plus,
  Calendar,
  Check,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Flag
} from 'lucide-react'

export interface ActionItem {
  id: string
  participantId: string
  consultantId: string
  title: string
  description?: string
  deadline?: string
  completedAt?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  linkedTo?: 'CV' | 'INTEREST_GUIDE' | 'JOB_SEARCH' | 'COVER_LETTER' | 'OTHER'
  createdAt: string
}

interface ActionPlanProps {
  participantId: string
  participantName: string
  actions: ActionItem[]
  onAddAction: (action: Omit<ActionItem, 'id' | 'createdAt'>) => void
  onUpdateAction: (id: string, updates: Partial<ActionItem>) => void
  onDeleteAction: (id: string) => void
  className?: string
}

const priorityConfig = {
  HIGH: { label: 'Hög', color: 'bg-red-100 text-red-700 border-red-200' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  LOW: { label: 'Låg', color: 'bg-blue-100 text-blue-700 border-blue-200' },
}

const statusConfig = {
  PENDING: { label: 'Väntar', color: 'bg-slate-100 text-slate-600' },
  IN_PROGRESS: { label: 'Pågår', color: 'bg-indigo-100 text-indigo-700' },
  COMPLETED: { label: 'Klar', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Avbruten', color: 'bg-gray-100 text-gray-500' },
}

const linkConfig = {
  CV: { label: 'CV', path: '/dashboard/cv' },
  INTEREST_GUIDE: { label: 'Intresseguide', path: '/dashboard/interest-guide' },
  JOB_SEARCH: { label: 'Jobbsökning', path: '/dashboard/job-search' },
  COVER_LETTER: { label: 'Personligt brev', path: '/dashboard/cover-letter' },
  OTHER: { label: 'Annat', path: null },
}

export function ActionPlan({
  participantId,
  participantName,
  actions,
  onAddAction,
  onUpdateAction,
  onDeleteAction,
  className,
}: ActionPlanProps) {
  const { user } = useAuthStore()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<ActionItem['priority']>('MEDIUM')
  const [linkedTo, setLinkedTo] = useState<ActionItem['linkedTo']>('OTHER')

  const handleSubmit = () => {
    if (!title.trim() || !user) return

    onAddAction({
      participantId,
      consultantId: user.id,
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      status: 'PENDING',
      priority,
      linkedTo,
    })

    resetForm()
    setIsAdding(false)
  }

  const handleUpdate = (id: string) => {
    if (!title.trim()) return

    onUpdateAction(id, {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      priority,
      linkedTo,
    })

    setEditingId(null)
    resetForm()
  }

  const handleStatusChange = (id: string, newStatus: ActionItem['status']) => {
    onUpdateAction(id, {
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
    })
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDeadline('')
    setPriority('MEDIUM')
    setLinkedTo('OTHER')
  }

  const handleEdit = (action: ActionItem) => {
    setEditingId(action.id)
    setTitle(action.title)
    setDescription(action.description || '')
    setDeadline(action.deadline || '')
    setPriority(action.priority)
    setLinkedTo(action.linkedTo)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }

  const sortedActions = [...actions].sort((a, b) => {
    // Sort by status (pending first), then priority, then deadline
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1
    
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const stats = {
    total: actions.length,
    completed: actions.filter(a => a.status === 'COMPLETED').length,
    pending: actions.filter(a => a.status === 'PENDING').length,
    inProgress: actions.filter(a => a.status === 'IN_PROGRESS').length,
    overdue: actions.filter(a => 
      a.deadline && 
      new Date(a.deadline) < new Date() && 
      a.status !== 'COMPLETED' && 
      a.status !== 'CANCELLED'
    ).length,
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-slate-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Handlingsplan</h3>
              <p className="text-sm text-slate-500">{participantName}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Ny aktivitet</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
            <div className="text-xs text-slate-500">Totalt</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            <div className="text-xs text-green-600">Klara</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-xl">
            <div className="text-2xl font-bold text-indigo-700">{stats.inProgress}</div>
            <div className="text-xs text-indigo-600">Pågår</div>
          </div>
          {stats.overdue > 0 && (
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
              <div className="text-xs text-red-600">Försenade</div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vad ska deltagaren göra?"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning (valfritt)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mer information om aktiviteten..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioritet</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ActionItem['priority'])}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="HIGH">Hög</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Låg</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline (valfritt)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Koppla till</label>
                <select
                  value={linkedTo}
                  onChange={(e) => setLinkedTo(e.target.value as ActionItem['linkedTo'])}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CV">CV</option>
                  <option value="INTEREST_GUIDE">Intresseguide</option>
                  <option value="JOB_SEARCH">Jobbsökning</option>
                  <option value="COVER_LETTER">Personligt brev</option>
                  <option value="OTHER">Annat</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleSubmit()}
                disabled={!title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Uppdatera' : 'Spara'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="max-h-96 overflow-y-auto">
        {actions.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Inga aktiviteter ännu</p>
            <p className="text-sm text-slate-400 mt-1">
              Skapa en handlingsplan med delmål och deadlines
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedActions.map((action) => {
              const isExpanded = expandedId === action.id
              const isOverdue = action.deadline && 
                new Date(action.deadline) < new Date() && 
                action.status !== 'COMPLETED' && 
                action.status !== 'CANCELLED'

              return (
                <div
                  key={action.id}
                  className={cn(
                    'p-4 hover:bg-slate-50 transition-colors',
                    action.status === 'COMPLETED' && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Checkbox */}
                    <button
                      onClick={() => handleStatusChange(
                        action.id,
                        action.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                      )}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                        action.status === 'COMPLETED'
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300 hover:border-indigo-400'
                      )}
                    >
                      {action.status === 'COMPLETED' && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          'font-medium',
                          action.status === 'COMPLETED' && 'line-through text-slate-500'
                        )}>
                          {action.title}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityConfig[action.priority].color)}>
                          {priorityConfig[action.priority].label}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', statusConfig[action.status].color)}>
                          {statusConfig[action.status].label}
                        </span>
                      </div>

                      {action.description && (
                        <p className={cn(
                          'text-sm text-slate-600 mt-1',
                          !isExpanded && 'line-clamp-1'
                        )}>
                          {action.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {action.deadline && (
                          <span className={cn(
                            'flex items-center gap-1',
                            isOverdue ? 'text-red-600' : 'text-slate-500'
                          )}>
                            <Calendar className="w-4 h-4" />
                            {isOverdue ? 'Försenad: ' : ''}
                            {new Date(action.deadline).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                        
                        {action.linkedTo && linkConfig[action.linkedTo] && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Flag className="w-4 h-4" />
                            {linkConfig[action.linkedTo].label}
                          </span>
                        )}

                        {action.status === 'COMPLETED' && action.completedAt && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            Klar: {new Date(action.completedAt).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {action.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(action.id, 'IN_PROGRESS')}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            action.status === 'IN_PROGRESS'
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          )}
                          title="Markera som pågående"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(action)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Redigera"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteAction(action.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
