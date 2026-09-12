import { type SortDir, type TabId, type Instrument, ASSESSMENT_ITEM_COUNT } from './tableTypes'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AssessmentSignature } from '../components/AssessmentSignature'
import { cn } from '@/lib/utils'
import { resolveParticipantName, type EnrollmentStats } from '../enrollmentDisplay'
import { type StaPart } from '../mockData'
import { Search, ClipboardList } from '@/components/ui/icons'

// ===========================================================================
// ASSESSMENTS TAB
// ===========================================================================

// Instrument och ASSESSMENT_ITEM_COUNT bor i ./tableTypes — en komponentfil får
// bara exportera komponenter (react-refresh/only-export-components).
type AssessmentStatus = 'pending' | 'in_progress' | 'complete'
type AssessmentSortKey = 'name' | 'instrument' | 'part' | 'status'

interface AssessmentRow {
  id: string
  enrollmentId: string
  assessment: import('@/services/staApi').StaAssessment
  participantName: string
  participantInitials: string
  instrument: Instrument
  part: 1 | 2 | 3 | 4
  progress: number
  status: AssessmentStatus
}

function buildAssessmentRows(stats: EnrollmentStats[]): AssessmentRow[] {
  return stats.flatMap((s) =>
    s.assessments.map((a) => {
      const fullName = resolveParticipantName(s.enrollment)
      const initials = fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
      const itemCount = ASSESSMENT_ITEM_COUNT[a.instrument as Instrument] ?? 13
      const progress =
        a.status === 'complete' || a.status === 'submitted_to_af'
          ? 100
          : a.scores
            ? Math.min(100, Math.round((Object.keys(a.scores as object).length / itemCount) * 100))
            : 0
      const status: AssessmentStatus =
        a.status === 'complete' || a.status === 'submitted_to_af'
          ? 'complete'
          : progress > 0
            ? 'in_progress'
            : 'pending'
      return {
        id: a.id,
        enrollmentId: s.enrollment.id,
        assessment: a,
        participantName: fullName,
        participantInitials: initials,
        instrument: a.instrument as Instrument,
        part: a.part as 1 | 2 | 3 | 4,
        progress,
        status,
      }
    }),
  )
}

export function AssessmentsTab({
  stats,
  onOpenParticipantAssessments,
  onChangeTab,
}: {
  stats: EnrollmentStats[]
  onOpenParticipantAssessments: (enrollmentId: string) => void
  onChangeTab: (tab: TabId) => void
}) {
  const allRows = useMemo(() => buildAssessmentRows(stats), [stats])

  const [filterInstrument, setFilterInstrument] = useState<'all' | Instrument>('all')
  const [filterPart, setFilterPart] = useState<'all' | StaPart>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | AssessmentStatus>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<AssessmentSortKey>('status')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo(() => {
    const filtered = allRows.filter((r) => {
      if (filterInstrument !== 'all' && r.instrument !== filterInstrument) return false
      if (filterPart !== 'all' && r.part !== filterPart) return false
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (search && !r.participantName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    const statusOrder: Record<AssessmentStatus, number> = { in_progress: 0, pending: 1, complete: 2 }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return dir * a.participantName.localeCompare(b.participantName, 'sv-SE')
        case 'instrument':
          return dir * a.instrument.localeCompare(b.instrument)
        case 'part':
          return dir * (a.part - b.part)
        case 'status':
          return dir * (statusOrder[a.status] - statusOrder[b.status])
        default:
          return 0
      }
    })
    return filtered
  }, [allRows, filterInstrument, filterPart, filterStatus, search, sortBy, sortDir])

  const handleSort = (key: AssessmentSortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const totalCount = allRows.length
  const visibleCount = rows.length
  const completedCount = allRows.filter((r) => r.status === 'complete').length
  const inProgressCount = allRows.filter((r) => r.status === 'in_progress').length

  return (
    <Card variant="flat" padding="none" className="overflow-hidden">
      {totalCount === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Skattningarna samlas här"
          description="Skattningar startas från deltagarens drawer. DOA, WRI och MOHOST gör du i Del 1; AWP och AWC i Del 2 och Del 3."
          action={{
            label: 'Gå till Deltagare',
            onClick: () => onChangeTab('deltagare'),
            variant: 'primary',
          }}
        />
      ) : (
        <>
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Alla skattningar</h3>
              <p className="text-xs text-stone-500">
                <strong>{completedCount}</strong> klara · <strong>{inProgressCount}</strong> pågående · <strong>{totalCount - completedCount - inProgressCount}</strong> ej startade
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value as 'all' | Instrument)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på instrument"
              >
                <option value="all">Alla instrument</option>
                <option value="DOA">DOA</option>
                <option value="WRI">WRI</option>
                <option value="MOHOST">MOHOST</option>
                <option value="AWP">AWP</option>
                <option value="AWC">AWC</option>
              </select>
              <select
                value={filterPart}
                onChange={(e) => setFilterPart(e.target.value === 'all' ? 'all' : (Number(e.target.value) as StaPart))}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på del"
              >
                <option value="all">Alla delar</option>
                <option value="1">Del 1</option>
                <option value="2">Del 2</option>
                <option value="3">Del 3</option>
                <option value="4">Del 4</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | AssessmentStatus)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på status"
              >
                <option value="all">Alla statusar</option>
                <option value="pending">Ej påbörjade</option>
                <option value="in_progress">Pågående</option>
                <option value="complete">Klara</option>
              </select>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök deltagare…"
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-stone-200"
                />
              </div>
            </div>
          </div>

          {visibleCount === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-stone-600">
              Inga skattningar matchar dina filter.{' '}
              <button
                type="button"
                onClick={() => {
                  setFilterInstrument('all')
                  setFilterPart('all')
                  setFilterStatus('all')
                  setSearch('')
                }}
                className="underline text-stone-700 hover:text-stone-900"
              >
                Rensa filter
              </button>
              .
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <AssessmentsTable
                  rows={rows}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onOpen={onOpenParticipantAssessments}
                />
              </div>
              <div className="md:hidden">
                <AssessmentsCardList
                  rows={rows}
                  onOpen={onOpenParticipantAssessments}
                />
              </div>
            </>
          )}
        </>
      )}
    </Card>
  )
}

function AssessmentsTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onOpen,
}: {
  rows: AssessmentRow[]
  sortBy: AssessmentSortKey
  sortDir: SortDir
  onSort: (key: AssessmentSortKey) => void
  onOpen: (enrollmentId: string) => void
}) {
  const renderSortableTh = (key: AssessmentSortKey, label: string) => {
    const isActive = sortBy === key
    return (
      <th className="border-b border-stone-100 p-0">
        <button
          type="button"
          onClick={() => onSort(key)}
          className={cn(
            'w-full px-4 py-3 text-xs font-medium uppercase tracking-wide text-left',
            'flex items-center gap-1 transition-colors',
            isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700',
          )}
        >
          {label}
          <span aria-hidden="true" className={cn('text-[10px]', !isActive && 'opacity-30')}>
            {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          {renderSortableTh('name', 'Deltagare')}
          {renderSortableTh('instrument', 'Instrument')}
          {renderSortableTh('part', 'Del')}
          {renderSortableTh('status', 'Status')}
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">AT-signatur</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <AssessmentTableRow key={a.id} row={a} onOpen={onOpen} />
        ))}
      </tbody>
    </table>
  )
}

function AssessmentTableRow({
  row: a,
  onOpen,
}: {
  row: AssessmentRow
  onOpen: (enrollmentId: string) => void
}) {
  return (
    <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-medium text-stone-700">
            {a.participantInitials}
          </div>
          <span className="text-sm text-stone-900">{a.participantName}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-sm font-medium text-stone-900">{a.instrument}</span>
      </td>
      <td className="px-4 py-3 align-middle text-sm text-stone-700">Del {a.part}</td>
      <td className="px-4 py-3 align-middle">
        <AssessmentStatusCell row={a} />
      </td>
      <td className="px-4 py-3 align-middle">
        {a.status === 'complete' && <AssessmentSignature assessment={a.assessment} compact />}
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <Button
          variant={a.status === 'pending' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onOpen(a.enrollmentId)}
        >
          {a.status === 'pending' ? 'Starta' : a.status === 'in_progress' ? 'Fortsätt' : 'Visa'}
        </Button>
      </td>
    </tr>
  )
}

function AssessmentStatusCell({ row: a }: { row: AssessmentRow }) {
  if (a.status === 'pending') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-stone-100 text-stone-500">
        Ej påbörjad
      </span>
    )
  }
  if (a.status === 'in_progress') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-700">{a.progress}%</span>
        <div className="h-1.5 rounded-full overflow-hidden bg-stone-100 w-20">
          <div className="h-full" style={{ width: `${a.progress}%`, background: 'var(--c-solid)' }} />
        </div>
      </div>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700">
      Klar
    </span>
  )
}

function AssessmentsCardList({
  rows,
  onOpen,
}: {
  rows: AssessmentRow[]
  onOpen: (enrollmentId: string) => void
}) {
  return (
    <ul className="divide-y divide-stone-100">
      {rows.map((a) => (
        <li key={a.id} className="px-4 py-3 hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[11px] font-medium text-stone-700 flex-shrink-0">
              {a.participantInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-900 truncate">{a.participantName}</div>
              <div className="text-[11px] text-stone-500">
                {a.instrument} · Del {a.part}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-2">
            <AssessmentStatusCell row={a} />
            {a.status === 'complete' && <AssessmentSignature assessment={a.assessment} compact />}
          </div>

          <Button
            variant={a.status === 'pending' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onOpen(a.enrollmentId)}
          >
            {a.status === 'pending' ? 'Starta' : a.status === 'in_progress' ? 'Fortsätt' : 'Visa'}
          </Button>
        </li>
      ))}
    </ul>
  )
}


