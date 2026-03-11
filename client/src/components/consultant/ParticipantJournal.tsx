/**
 * Participant Journal Component
 * Allows consultants to take structured notes about participants
 */

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  User, 
  Target, 
  AlertCircle, 
  TrendingUp,
  X,
  Save,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export type NoteCategory = 'GENERAL' | 'PROGRESS' | 'CONCERN' | 'GOAL'

export interface JournalEntry {
  id: string
  participantId: string
  consultantId: string
  content: string
  category: NoteCategory
  createdAt: string
  updatedAt: string
  isGoal?: boolean
  goalDeadline?: string
  isCompleted?: boolean
}

interface ParticipantJournalProps {
  participantId: string
  participantName: string
  entries: JournalEntry[]
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateEntry: (id: string, updates: Partial<JournalEntry>) => void
  onDeleteEntry: (id: string) => void
  className?: string
}

const categoryConfig: Record<NoteCategory, { label: string; color: string; icon: typeof BookOpen }> = {
  GENERAL: { label: 'Anteckning', color: 'bg-slate-100 text-slate-700', icon: BookOpen },
  PROGRESS: { label: 'Framsteg', color: 'bg-green-100 text-green-700', icon: TrendingUp },
  CONCERN: { label: 'Oro', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  GOAL: { label: 'Mål', color: 'bg-indigo-100 text-indigo-700', icon: Target },
}

export function ParticipantJournal({
  participantId,
  participantName,
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  className,
}: ParticipantJournalProps) {
  const { user } = useAuthStore()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Form state
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<NoteCategory>('GENERAL')
  const [isGoal, setIsGoal] = useState(false)
  const [goalDeadline, setGoalDeadline] = useState('')

  const handleSubmit = () => {
    if (!content.trim() || !user) return

    onAddEntry({
      participantId,
      consultantId: user.id,
      content: content.trim(),
      category,
      isGoal: category === 'GOAL' || isGoal,
      goalDeadline: goalDeadline || undefined,
      isCompleted: false,
    })

    // Reset form
    setContent('')
    setCategory('GENERAL')
    setIsGoal(false)
    setGoalDeadline('')
    setIsAdding(false)
  }

  const handleUpdate = (id: string) => {
    if (!content.trim()) return

    onUpdateEntry(id, {
      content: content.trim(),
      category,
      isGoal: category === 'GOAL' || isGoal,
      goalDeadline: goalDeadline || undefined,
    })

    setEditingId(null)
    setContent('')
    setCategory('GENERAL')
    setIsGoal(false)
    setGoalDeadline('')
  }

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setContent(entry.content)
    setCategory(entry.category)
    setIsGoal(entry.isGoal || false)
    setGoalDeadline(entry.goalDeadline || '')
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setContent('')
    setCategory('GENERAL')
    setIsGoal(false)
    setGoalDeadline('')
  }

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Group entries by date
  const groupedEntries = sortedEntries.reduce((groups, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {} as Record<string, JournalEntry[]>)

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-slate-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Deltagarjournal</h3>
              <p className="text-sm text-slate-500">{participantName}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Ny anteckning</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="space-y-4">
            {/* Category Selection */}
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(categoryConfig) as NoteCategory[]).map((cat) => {
                const config = categoryConfig[cat]
                const Icon = config.icon
                
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      category === cat
                        ? config.color
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv din anteckning här..."
              className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
            />

            {/* Goal Options */}
            {(category === 'GOAL' || isGoal) && (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline:</span>
                  <input
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleSubmit()}
                disabled={!content.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Uppdatera' : 'Spara'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Inga anteckningar ännu</p>
            <p className="text-sm text-slate-400 mt-1">
              Börja dokumentera deltagarens framsteg här
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">{date}</span>
                </div>
                
                <div className="space-y-3">
                  {dateEntries.map((entry) => {
                    const config = categoryConfig[entry.category]
                    const Icon = config.icon
                    const isExpanded = expandedId === entry.id
                    
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          'p-4 rounded-xl border transition-all',
                          entry.category === 'GOAL' && entry.isCompleted
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-slate-200'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.color)}>
                                {config.label}
                              </span>
                              {entry.isGoal && entry.goalDeadline && (
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  new Date(entry.goalDeadline) < new Date()
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-100 text-slate-600'
                                )}>
                                  Deadline: {new Date(entry.goalDeadline).toLocaleDateString('sv-SE')}
                                </span>
                              )}
                            </div>
                            
                            <p className={cn(
                              'text-slate-700',
                              !isExpanded && 'line-clamp-2'
                            )}>
                              {entry.content}
                            </p>
                            
                            {entry.content.length > 150 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Visa mindre
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Visa mer
                                  </>
                                )}
                              </button>
                            )}
                            
                            {/* Goal Actions */}
                            {entry.isGoal && (
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  onClick={() => onUpdateEntry(entry.id, { isCompleted: !entry.isCompleted })}
                                  className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                    entry.isCompleted
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  )}
                                >
                                  {entry.isCompleted ? (
                                    <>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Uppnått
                                    </>
                                  ) : (
                                    'Markera som uppnått'
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Redigera"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ParticipantJournal
