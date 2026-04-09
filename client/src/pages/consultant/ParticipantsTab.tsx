/**
 * ParticipantsTab - Enhanced Participant List with Bulk Actions
 * Full participant management with filtering, search, and bulk operations
 */

import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  FileText,
  Briefcase,
  MessageSquare,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Mail,
  Download,
  Tag,
  UserPlus,
  SortAsc,
  SortDesc,
  X,
  Check,
  UserCheck,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { BulkActionsDialog } from '@/components/consultant/BulkActionsDialog'

interface Participant {
  participant_id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD'
  priority: number
  has_cv: boolean
  ats_score: number | null
  completed_interest_test: boolean
  holland_code: string | null
  saved_jobs_count: number
  notes_count: number
  last_contact_at: string | null
  next_meeting_scheduled: string | null
  last_login: string | null
}

type SortField = 'name' | 'status' | 'ats_score' | 'last_contact' | 'priority'
type SortOrder = 'asc' | 'desc'

export function ParticipantsTab() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('filter') || 'all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<'message' | 'tag' | 'export' | 'status' | null>(null)

  useEffect(() => {
    fetchParticipants()
  }, [])

  useEffect(() => {
    setShowBulkActions(selectedParticipants.length > 0)
  }, [selectedParticipants])

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort participants
  const filteredParticipants = useMemo(() => {
    let result = [...participants]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.first_name?.toLowerCase().includes(query) ||
        p.last_name?.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filterStatus === 'attention') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(p =>
        !p.last_contact_at || new Date(p.last_contact_at) < sevenDaysAgo
      )
    } else if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'ats_score':
          comparison = (a.ats_score || 0) - (b.ats_score || 0)
          break
        case 'last_contact':
          comparison = new Date(a.last_contact_at || 0).getTime() - new Date(b.last_contact_at || 0).getTime()
          break
        case 'priority':
          comparison = a.priority - b.priority
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [participants, searchQuery, filterStatus, sortField, sortOrder])

  const toggleSelectAll = () => {
    if (selectedParticipants.length === filteredParticipants.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(filteredParticipants.map(p => p.participant_id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleBulkAction = (action: 'message' | 'export' | 'tag' | 'status') => {
    setBulkActionType(action)
  }

  const handleBulkActionComplete = () => {
    setSelectedParticipants([])
    fetchParticipants() // Refresh data
  }

  // Get selected participant data for the dialog
  const selectedParticipantData = participants.filter(p =>
    selectedParticipants.includes(p.participant_id)
  )

  const getInitials = (p: Participant) => {
    return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase() || p.email[0].toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
      INACTIVE: { label: 'Inaktiv', color: 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300' },
      COMPLETED: { label: 'Avslutad', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
      ON_HOLD: { label: 'Pausad', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    }
    return badges[status as keyof typeof badges] || badges.INACTIVE
  }

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) return { label: 'Kritisk', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' }
    if (priority === 1) return { label: 'Hög', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }
    return null
  }

  const getLastContactText = (date: string | null) => {
    if (!date) return 'Aldrig kontaktad'
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Idag'
    if (days === 1) return 'Igår'
    if (days < 7) return `${days} dagar sedan`
    return `${Math.floor(days / 7)} veckor sedan`
  }

  const isOverdue = (date: string | null) => {
    if (!date) return true
    return new Date(date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }

  if (loading) {
    return <LoadingState type="list" />
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
            <input
              type="text"
              placeholder="Sök efter namn eller email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent',
                'focus:border-violet-500 focus:bg-white dark:focus:bg-stone-900',
                'text-stone-900 dark:text-stone-100',
                'placeholder:text-stone-600',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value)
                setSearchParams(e.target.value !== 'all' ? { filter: e.target.value } : {})
              }}
              className={cn(
                'px-4 py-2.5 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent',
                'focus:border-violet-500',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="all">Alla statusar</option>
              <option value="ACTIVE">Aktiva</option>
              <option value="INACTIVE">Inaktiva</option>
              <option value="ON_HOLD">Pausade</option>
              <option value="COMPLETED">Avslutade</option>
              <option value="attention">Kräver uppmärksamhet</option>
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-700 pl-2">
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as SortField)}
                className={cn(
                  'px-3 py-2.5 rounded-xl',
                  'bg-stone-100 dark:bg-stone-800',
                  'border-2 border-transparent',
                  'text-stone-900 dark:text-stone-100',
                  'text-sm'
                )}
              >
                <option value="priority">Prioritet</option>
                <option value="name">Namn</option>
                <option value="ats_score">CV-poäng</option>
                <option value="last_contact">Senast kontakt</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-5 h-5 text-stone-600 dark:text-stone-600" />
                ) : (
                  <SortDesc className="w-5 h-5 text-stone-600 dark:text-stone-600" />
                )}
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-700 pl-2">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  view === 'grid'
                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 hover:text-stone-600'
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  view === 'list'
                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 hover:text-stone-600'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Add Participant Button */}
            <Button className="ml-2">
              <UserPlus className="w-4 h-4 mr-2" />
              Bjud in
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="p-3 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedParticipants([])}
                className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-violet-600" />
              </button>
              <span className="font-medium text-violet-900 dark:text-violet-100">
                {selectedParticipants.length} valda
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('message')}
              >
                <Mail className="w-4 h-4 mr-1.5" />
                Skicka meddelande
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('tag')}
              >
                <Tag className="w-4 h-4 mr-1.5" />
                Lägg till tagg
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('status')}
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                Ändra status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Exportera
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-stone-500 dark:text-stone-600">
          Visar {filteredParticipants.length} av {participants.length} deltagare
        </p>
        {filteredParticipants.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            {selectedParticipants.length === filteredParticipants.length
              ? 'Avmarkera alla'
              : 'Markera alla'}
          </button>
        )}
      </div>

      {/* Participant List */}
      {filteredParticipants.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
            Inga deltagare hittades
          </h3>
          <p className="text-stone-500 dark:text-stone-600 mb-6">
            {searchQuery || filterStatus !== 'all'
              ? 'Prova att ändra dina filter eller sökord.'
              : 'Du har inte tilldelats några deltagare ännu.'}
          </p>
          {(searchQuery || filterStatus !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setFilterStatus('all')
                setSearchParams({})
              }}
            >
              Rensa filter
            </Button>
          )}
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredParticipants.map(p => {
            const statusBadge = getStatusBadge(p.status)
            const priorityBadge = getPriorityBadge(p.priority)
            const isSelected = selectedParticipants.includes(p.participant_id)

            return (
              <Card
                key={p.participant_id}
                className={cn(
                  'relative overflow-hidden transition-all duration-200',
                  isSelected && 'ring-2 ring-violet-500'
                )}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleSelect(p.participant_id)}
                  className={cn(
                    'absolute top-4 left-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-stone-300 dark:border-stone-600 hover:border-violet-400'
                  )}
                >
                  {isSelected && <Check className="w-4 h-4" />}
                </button>

                <Link
                  to={`/consultant/participants/${p.participant_id}`}
                  className="block p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 pl-8">
                      <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold">
                        {getInitials(p)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                          {p.first_name} {p.last_name}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-600">
                          {p.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusBadge.color)}>
                      {statusBadge.label}
                    </span>
                    {priorityBadge && (
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', priorityBadge.color)}>
                        {priorityBadge.label}
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <FileText className="w-5 h-5 text-stone-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {p.has_cv ? (p.ats_score ? `${p.ats_score}%` : 'Ja') : '—'}
                      </p>
                      <p className="text-xs text-stone-500">CV</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <Briefcase className="w-5 h-5 text-stone-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {p.saved_jobs_count}
                      </p>
                      <p className="text-xs text-stone-500">Jobb</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <MessageSquare className="w-5 h-5 text-stone-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {p.notes_count}
                      </p>
                      <p className="text-xs text-stone-500">Notat</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className={cn(
                      'flex items-center gap-1.5 text-sm',
                      isOverdue(p.last_contact_at) ? 'text-amber-600' : 'text-stone-500'
                    )}>
                      <Clock className="w-4 h-4" />
                      {getLastContactText(p.last_contact_at)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-stone-600" />
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        selectedParticipants.length === filteredParticipants.length
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'border-stone-300 dark:border-stone-600'
                      )}
                    >
                      {selectedParticipants.length === filteredParticipants.length && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-600 uppercase tracking-wider">
                    Namn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-600 uppercase tracking-wider">
                    CV
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-600 uppercase tracking-wider">
                    Sparade jobb
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-600 uppercase tracking-wider">
                    Senast kontakt
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-stone-600 dark:text-stone-600 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredParticipants.map(p => {
                  const statusBadge = getStatusBadge(p.status)
                  const priorityBadge = getPriorityBadge(p.priority)
                  const isSelected = selectedParticipants.includes(p.participant_id)

                  return (
                    <tr
                      key={p.participant_id}
                      className={cn(
                        'hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors',
                        isSelected && 'bg-violet-50 dark:bg-violet-900/10'
                      )}
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleSelect(p.participant_id)}
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'border-stone-300 dark:border-stone-600 hover:border-violet-400'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/consultant/participants/${p.participant_id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-medium">
                            {getInitials(p)}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900 dark:text-stone-100">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-sm text-stone-500 dark:text-stone-600">
                              {p.email}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusBadge.color)}>
                            {statusBadge.label}
                          </span>
                          {priorityBadge && (
                            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', priorityBadge.color)}>
                              {priorityBadge.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-600 dark:text-stone-600">
                        {p.has_cv ? (
                          <span className={cn(
                            'font-medium',
                            (p.ats_score || 0) >= 70 ? 'text-emerald-600' :
                            (p.ats_score || 0) >= 50 ? 'text-amber-600' : 'text-stone-600'
                          )}>
                            {p.ats_score ? `${p.ats_score}/100` : 'Ja'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-600 dark:text-stone-600">
                        {p.saved_jobs_count}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'text-sm',
                          isOverdue(p.last_contact_at) ? 'text-amber-600' : 'text-stone-500'
                        )}>
                          {getLastContactText(p.last_contact_at)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/consultant/participants/${p.participant_id}`}
                          className="text-violet-600 hover:text-violet-700 text-sm font-medium"
                        >
                          Visa
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk Actions Dialog */}
      {bulkActionType && (
        <BulkActionsDialog
          isOpen={!!bulkActionType}
          onClose={() => setBulkActionType(null)}
          actionType={bulkActionType}
          selectedParticipants={selectedParticipantData}
          onComplete={handleBulkActionComplete}
        />
      )}
    </div>
  )
}
