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
  Grid3X3,
  List,
  ChevronRight,
  FileText,
  Briefcase,
  MessageSquare,
  Mail,
  Download,
  Tag,
  UserPlus,
  SortAsc,
  SortDesc,
  X,
  Check,
  UserCheck,
  Clock,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { BulkActionsDialog } from '@/components/consultant/BulkActionsDialog'
import { InviteParticipantDialog } from '@/components/consultant/InviteParticipantDialog'
import { getTagLabel, getTagColorClasses } from '@/components/consultant/participantTags'

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
  tags: string[] | null
}

type SortField = 'name' | 'status' | 'ats_score' | 'last_contact' | 'priority'
type SortOrder = 'asc' | 'desc'

export function ParticipantsTab() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  // KA2 (2026-08-31): sök, sortering, vy och filter lever i URL:en (q/sort/dir/view/filter)
  // så att de överlever navigering till en deltagare och tillbaka. OBS: `ParticipantDetailPage`
  // (annan agents fil) har en HÅRDKODAD "tillbaka"-länk till `/consultant/participants` — den
  // bär i dag INTE med sig den här querysträngen. Ska tillbaka-navigeringen återställa
  // sök/filter/sortering måste den länken bytas mot en dynamisk länk som inkluderar
  // `location.search`, eller så måste den här sidan läsa `location.state`/`document.referrer`.
  const [loading, setLoading] = useState(true)
  // KS7: ett misslyckat anrop ska visa ett eget felläge — aldrig samma tomma
  // lista som en konsulent utan deltagare (se EmptyState-grenarna nedan).
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchQuery, setSearchQueryState] = useState(() => searchParams.get('q') || '')
  const [filterStatus, setFilterStatusState] = useState<string>(() => searchParams.get('filter') || 'all')
  const [view, setViewState] = useState<'grid' | 'list'>(() => (searchParams.get('view') === 'list' ? 'list' : 'grid'))
  const [sortField, setSortFieldState] = useState<SortField>(() => (searchParams.get('sort') as SortField) || 'priority')
  const [sortOrder, setSortOrderState] = useState<SortOrder>(() => (searchParams.get('dir') as SortOrder) || 'desc')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<'message' | 'tag' | 'export' | 'status' | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  /** Uppdaterar en eller flera URL-parametrar utan att tappa de andra (replace, ingen historik-spam). */
  const updateSearchParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
      }
      return next
    }, { replace: true })
  }

  const setSearchQuery = (value: string) => {
    setSearchQueryState(value)
    updateSearchParams({ q: value || null })
  }
  const setFilterStatus = (value: string) => {
    setFilterStatusState(value)
    updateSearchParams({ filter: value !== 'all' ? value : null })
  }
  const setView = (value: 'grid' | 'list') => {
    setViewState(value)
    updateSearchParams({ view: value !== 'grid' ? value : null })
  }
  const setSortField = (value: SortField) => {
    setSortFieldState(value)
    updateSearchParams({ sort: value !== 'priority' ? value : null })
  }
  const setSortOrder = (value: SortOrder) => {
    setSortOrderState(value)
    updateSearchParams({ dir: value !== 'desc' ? value : null })
  }

  useEffect(() => {
    fetchParticipants()
  }, [])

  useEffect(() => {
    setShowBulkActions(selectedParticipants.length > 0)
  }, [selectedParticipants])

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)

      if (fetchError) throw fetchError
      setParticipants(data || [])
    } catch (err) {
      console.error('Error fetching participants:', err)
      // KS7: utan den här raden ser ett trasigt anrop EXAKT ut som "inga
      // deltagare" — samma EmptyState, samma CTA, ingen antydan om fel.
      setError('Deltagarlistan kunde inte hämtas. Kontrollera anslutningen och försök igen.')
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

  const allSelected = filteredParticipants.length > 0 && selectedParticipants.length === filteredParticipants.length
  const someSelected = selectedParticipants.length > 0 && !allSelected

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
      ACTIVE: { label: t('consultant.participants.status.active'), color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
      INACTIVE: { label: t('consultant.participants.status.inactive'), color: 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300' },
      COMPLETED: { label: t('consultant.participants.status.completed'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
      ON_HOLD: { label: t('consultant.participants.status.onHold'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    }
    return badges[status as keyof typeof badges] || badges.INACTIVE
  }

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) return { label: t('consultant.participants.priority.critical'), color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' }
    if (priority === 1) return { label: t('consultant.participants.priority.high'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }
    return null
  }

  const getLastContactText = (date: string | null) => {
    if (!date) return t('consultant.participants.neverContacted')
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return t('common.today')
    if (days === 1) return t('consultant.participants.yesterday')
    if (days < 7) return t('consultant.participants.daysAgo', { count: days })
    return t('consultant.participants.weeksAgo', { count: Math.floor(days / 7) })
  }

  const isOverdue = (date: string | null) => {
    if (!date) return true
    return new Date(date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }

  if (loading) {
    return <LoadingState type="list" />
  }

  // KS7: eget felläge — skiljer sig i UTSEENDE, inte bara i text, från de
  // två EmptyState-grenarna längre ned ("inga deltagare" / "inga sökträffar").
  if (error) {
    return (
      <Card className="p-8">
        <ErrorState
          title="Deltagarna kunde inte hämtas"
          message={error}
          onRetry={fetchParticipants}
        />
      </Card>
    )
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
              placeholder={t('consultant.participants.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent',
                'focus:border-[var(--c-solid)] focus:bg-white dark:focus:bg-stone-900',
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
              onChange={e => setFilterStatus(e.target.value)}
              className={cn(
                'px-4 py-2.5 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent',
                'focus:border-[var(--c-solid)]',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="all">{t('consultant.participants.filter.all')}</option>
              <option value="ACTIVE">{t('consultant.participants.filter.active')}</option>
              <option value="INACTIVE">{t('consultant.participants.filter.inactive')}</option>
              <option value="ON_HOLD">{t('consultant.participants.filter.onHold')}</option>
              <option value="COMPLETED">{t('consultant.participants.filter.completed')}</option>
              <option value="attention">{t('consultant.participants.filter.needsAttention')}</option>
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
                <option value="priority">{t('consultant.participants.sort.priority')}</option>
                <option value="name">{t('consultant.participants.sort.name')}</option>
                <option value="ats_score">{t('consultant.participants.sort.cvScore')}</option>
                <option value="last_contact">{t('consultant.participants.sort.lastContact')}</option>
                <option value="status">{t('consultant.participants.sort.status')}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                aria-label={sortOrder === 'asc'
                  ? t('consultant.participants.sort.setDescending', 'Sortera fallande')
                  : t('consultant.participants.sort.setAscending', 'Sortera stigande')}
                className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                ) : (
                  <SortDesc className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                )}
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-700 pl-2">
              <button
                onClick={() => setView('grid')}
                aria-label={t('consultant.participants.view.grid', 'Rutnätsvy')}
                aria-pressed={view === 'grid'}
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  view === 'grid'
                    ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label={t('consultant.participants.view.list', 'Listvy')}
                aria-pressed={view === 'list'}
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  view === 'list'
                    ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Add Participant Button */}
            <Button className="ml-2" onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              {t('consultant.participants.invite')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)] dark:border-[var(--c-accent)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedParticipants([])}
                className="p-1.5 hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/40 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
              </button>
              <span className="font-medium text-[var(--c-text)] dark:text-[var(--c-solid)]">
                {t('consultant.participants.selectedCount', { count: selectedParticipants.length })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('message')}
              >
                <Mail className="w-4 h-4 mr-1.5" />
                {t('consultant.participants.bulk.sendMessage')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('tag')}
              >
                <Tag className="w-4 h-4 mr-1.5" />
                {t('consultant.participants.bulk.addTag')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('status')}
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                {t('consultant.participants.bulk.changeStatus')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="w-4 h-4 mr-1.5" />
                {t('consultant.participants.bulk.export')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('consultant.participants.showingCount', { shown: filteredParticipants.length, total: participants.length })}
        </p>
        {filteredParticipants.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-solid)] dark:hover:text-[var(--c-text)] font-medium"
          >
            {selectedParticipants.length === filteredParticipants.length
              ? t('consultant.participants.deselectAll')
              : t('consultant.participants.selectAll')}
          </button>
        )}
      </div>

      {/* Participant List */}
      {filteredParticipants.length === 0 ? (
        participants.length === 0 ? (
          // Inga deltagare alls — helt annan situation än "inga sökträffar" (KA1).
          <Card className="p-0 overflow-hidden">
            <EmptyState
              icon={Users}
              title={t('consultant.participants.noParticipants', 'Inga deltagare ännu')}
              description={t(
                'consultant.participants.noParticipantsDesc',
                'Du har inte tilldelat några deltagare ännu.'
              )}
              action={{
                label: t('consultant.participants.inviteFirst', 'Bjud in din första deltagare'),
                onClick: () => setShowInviteDialog(true),
              }}
            />
          </Card>
        ) : (
          // Sökning/filter gav noll träffar — annan CTA än ovan.
          <Card className="p-0 overflow-hidden">
            <EmptyState
              icon={Search}
              title={t('consultant.participants.noResults')}
              description={t('consultant.participants.tryDifferentFilters')}
              action={{
                label: t('consultant.participants.clearFilters'),
                variant: 'outline',
                onClick: () => {
                  setSearchQuery('')
                  setFilterStatus('all')
                },
              }}
            />
          </Card>
        )
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
                  isSelected && 'ring-2 ring-[var(--c-solid)]'
                )}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleSelect(p.participant_id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={t('consultant.participants.selectParticipant', {
                    firstName: p.first_name,
                    lastName: p.last_name,
                  })}
                  className={cn(
                    'absolute top-4 left-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-[var(--c-solid)] border-[var(--c-solid)] text-[var(--c-on-solid)]'
                      : 'border-stone-300 dark:border-stone-600 hover:border-[var(--c-solid)]/60'
                  )}
                >
                  {isSelected && <Check className="w-4 h-4" aria-hidden="true" />}
                </button>

                <Link
                  to={`/consultant/participants/${p.participant_id}`}
                  className="block p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 pl-8">
                      <div className="w-12 h-12 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center text-[var(--c-text)] dark:text-[var(--c-solid)] font-semibold">
                        {getInitials(p)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                          {p.first_name} {p.last_name}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
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
                    {(p.tags || []).slice(0, 3).map(tagId => (
                      <span key={tagId} className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getTagColorClasses(tagId))}>
                        {getTagLabel(tagId)}
                      </span>
                    ))}
                    {(p.tags?.length || 0) > 3 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                        +{(p.tags?.length || 0) - 3}
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <FileText className="w-5 h-5 text-stone-500 dark:text-stone-400 mx-auto mb-1" />
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {p.has_cv ? (p.ats_score ? `${p.ats_score}%` : t('common.yes')) : '—'}
                      </p>
                      <p className="text-xs text-stone-500">CV</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <Briefcase className="w-5 h-5 text-stone-500 dark:text-stone-400 mx-auto mb-1" />
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {p.saved_jobs_count}
                      </p>
                      <p className="text-xs text-stone-500">{t('consultant.participants.jobs')}</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <MessageSquare className="w-5 h-5 text-stone-500 dark:text-stone-400 mx-auto mb-1" />
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {p.notes_count}
                      </p>
                      <p className="text-xs text-stone-500">{t('consultant.participants.notes')}</p>
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
                    <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
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
                <tr className="bg-stone-50 dark:bg-stone-700 border-b border-stone-200 dark:border-stone-600">
                  <th className="px-4 py-3 text-left" scope="col">
                    <button
                      onClick={toggleSelectAll}
                      role="checkbox"
                      aria-checked={allSelected ? true : someSelected ? 'mixed' : false}
                      aria-label={allSelected
                        ? t('consultant.participants.deselectAll')
                        : t('consultant.participants.selectAll')}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        allSelected
                          ? 'bg-[var(--c-solid)] border-[var(--c-solid)] text-[var(--c-on-solid)]'
                          : 'border-stone-300 dark:border-stone-600'
                      )}
                    >
                      {allSelected && <Check className="w-3 h-3" aria-hidden="true" />}
                    </button>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                    scope="col"
                    aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {t('consultant.participants.table.name')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                    scope="col"
                    aria-sort={sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {t('consultant.participants.table.status')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                    scope="col"
                    aria-sort={sortField === 'ats_score' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {t('consultant.participants.table.cv')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider" scope="col">
                    {t('consultant.participants.table.savedJobs')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                    scope="col"
                    aria-sort={sortField === 'last_contact' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {t('consultant.participants.table.lastContact')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider" scope="col">
                    {t('consultant.participants.table.actions')}
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
                        isSelected && 'bg-[var(--c-bg)]/40 dark:bg-[var(--c-bg)]/15'
                      )}
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleSelect(p.participant_id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={t('consultant.participants.selectParticipant', {
                            firstName: p.first_name,
                            lastName: p.last_name,
                          })}
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-[var(--c-solid)] border-[var(--c-solid)] text-white'
                              : 'border-stone-300 dark:border-stone-600 hover:border-[var(--c-solid)]/60'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" aria-hidden="true" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/consultant/participants/${p.participant_id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center text-[var(--c-text)] dark:text-[var(--c-solid)] font-medium">
                            {getInitials(p)}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900 dark:text-stone-100">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                              {p.email}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusBadge.color)}>
                            {statusBadge.label}
                          </span>
                          {priorityBadge && (
                            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', priorityBadge.color)}>
                              {priorityBadge.label}
                            </span>
                          )}
                          {(p.tags || []).slice(0, 2).map(tagId => (
                            <span key={tagId} className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getTagColorClasses(tagId))}>
                              {getTagLabel(tagId)}
                            </span>
                          ))}
                          {(p.tags?.length || 0) > 2 && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                              +{(p.tags?.length || 0) - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-600 dark:text-stone-400">
                        {p.has_cv ? (
                          <span className={cn(
                            'font-medium',
                            (p.ats_score || 0) >= 70 ? 'text-emerald-600' :
                            (p.ats_score || 0) >= 50 ? 'text-amber-600' : 'text-stone-600'
                          )}>
                            {p.ats_score ? `${p.ats_score}/100` : t('common.yes')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-600 dark:text-stone-400">
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
                          className="text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-solid)] dark:hover:text-[var(--c-text)] text-sm font-medium"
                        >
                          {t('common.view')}
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

      {/* Invite Participant Dialog (KA1) */}
      <InviteParticipantDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={() => {
          setShowInviteDialog(false)
          fetchParticipants()
        }}
      />
    </div>
  )
}
