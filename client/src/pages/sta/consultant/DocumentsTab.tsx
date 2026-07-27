import { type SortDir, type TabId } from './tableTypes'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { DOC_TYPE_META } from '@/services/staAiApi'
import { cn } from '@/lib/utils'
import { resolveParticipantName, type EnrollmentStats } from '../enrollmentDisplay'
import { FileText, Search, Bot } from '@/components/ui/icons'

// ===========================================================================
// DOCUMENTS TAB
// ===========================================================================

type DocumentSortKey = 'date' | 'participant' | 'type' | 'status'
type DocumentStatusFilter =
  | 'all'
  | 'active'  // draft + consultant_review
  | 'draft'
  | 'consultant_review'
  | 'approved'
  | 'submitted'

interface DocumentRow {
  id: string
  doc_type: import('@/services/staApi').DocumentType
  title: string
  participantName: string
  participantInitials: string
  enrollmentId: string
  status: import('@/services/staApi').DocumentStatus
  aiDrafted: boolean
  updatedAt: string
}

function buildDocumentRows(stats: EnrollmentStats[]): DocumentRow[] {
  return stats.flatMap((s) =>
    s.documents.map((d) => {
      const name = resolveParticipantName(s.enrollment)
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
      return {
        id: d.id,
        doc_type: d.doc_type,
        title: DOC_TYPE_META[d.doc_type]?.title ?? d.doc_type,
        participantName: name,
        participantInitials: initials,
        enrollmentId: s.enrollment.id,
        status: d.status,
        aiDrafted: d.ai_drafted,
        updatedAt: d.updated_at ?? d.created_at ?? new Date(0).toISOString(),
      }
    }),
  )
}

function documentStatusLabel(status: import('@/services/staApi').DocumentStatus): { label: string; tone: 'stone' | 'amber' | 'emerald' | 'sky' } {
  switch (status) {
    case 'draft': return { label: 'Utkast', tone: 'stone' }
    case 'consultant_review': return { label: 'Pågående granskning', tone: 'amber' }
    case 'approved': return { label: 'Godkänd', tone: 'emerald' }
    case 'submitted': return { label: 'Inskickad till AF', tone: 'sky' }
    default: return { label: status, tone: 'stone' }
  }
}

export function DocumentsTab({
  stats,
  onChangeTab,
}: {
  stats: EnrollmentStats[]
  onChangeTab: (tab: TabId) => void
}) {
  const navigate = useNavigate()
  const allRows = useMemo(() => buildDocumentRows(stats), [stats])

  const [filterType, setFilterType] = useState<'all' | import('@/services/staApi').DocumentType>('all')
  const [filterStatus, setFilterStatus] = useState<DocumentStatusFilter>('active')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<DocumentSortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    const filtered = allRows.filter((r) => {
      if (filterType !== 'all' && r.doc_type !== filterType) return false
      if (filterStatus === 'active') {
        if (r.status !== 'draft' && r.status !== 'consultant_review') return false
      } else if (filterStatus !== 'all' && r.status !== filterStatus) {
        return false
      }
      if (search && !r.participantName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    const statusOrder: Record<string, number> = {
      consultant_review: 0,
      draft: 1,
      approved: 2,
      submitted: 3,
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        case 'participant':
          return dir * a.participantName.localeCompare(b.participantName, 'sv-SE')
        case 'type':
          return dir * a.title.localeCompare(b.title, 'sv-SE')
        case 'status':
          return dir * ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99))
        default:
          return 0
      }
    })
    return filtered
  }, [allRows, filterType, filterStatus, search, sortBy, sortDir])

  const handleSort = (key: DocumentSortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const totalCount = allRows.length
  const visibleCount = rows.length
  const draftsCount = allRows.filter((r) => r.status === 'draft' || r.status === 'consultant_review').length
  const submittedCount = allRows.filter((r) => r.status === 'submitted' || r.status === 'approved').length

  const openDocument = (row: DocumentRow) => {
    navigate(`/konsulent/steg-till-arbete/dokument/${row.enrollmentId}/${row.doc_type}`)
  }

  return (
    <div className="space-y-5">
      <Card variant="flat" padding="none" className="overflow-hidden">
        {totalCount === 0 ? (
          <EmptyState
            icon={FileText}
            title="Dokumenten samlas här"
            description="Dokument skapas från deltagarens drawer — öppna en deltagare och välj vilken redovisning eller bilaga som ska skapas."
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
                <h3 className="text-base font-semibold text-stone-900">Dokumentutkast och inskick</h3>
                <p className="text-xs text-stone-500">
                  <strong>{draftsCount}</strong> utkast · <strong>{submittedCount}</strong> inskickade/godkända
                </p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | import('@/services/staApi').DocumentType)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                  aria-label="Filtrera på typ"
                >
                  <option value="all">Alla typer</option>
                  <option value="initial_planering">Initial planering</option>
                  <option value="delredovisning_1">Delredovisning Del 1</option>
                  <option value="delredovisning_2">Delredovisning Del 2</option>
                  <option value="delredovisning_3">Delredovisning Del 3</option>
                  <option value="delredovisning_4">Delredovisning Del 4</option>
                  <option value="anmalan_arbetsprovning">Anmälan arbetsprövning</option>
                  <option value="information_arbetsprovning">Information från arbetsprövning</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as DocumentStatusFilter)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                  aria-label="Filtrera på status"
                >
                  <option value="active">Pågående</option>
                  <option value="draft">Utkast</option>
                  <option value="consultant_review">På granskning</option>
                  <option value="approved">Godkända</option>
                  <option value="submitted">Inskickade</option>
                  <option value="all">Alla statusar</option>
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
                Inga dokument matchar dina filter.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all')
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
                  <DocumentsTable
                    rows={rows}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onOpen={openDocument}
                  />
                </div>
                <div className="md:hidden">
                  <DocumentsCardList rows={rows} onOpen={openDocument} />
                </div>
              </>
            )}
          </>
        )}
      </Card>

      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-1">Mallar</h3>
        <p className="text-xs text-stone-500 mb-3">
          Tillgängliga dokumenttyper. Skapas från deltagar-drawern under fliken
          Dokument.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: 'Initial planering', subtitle: 'Genereras från startsamtal + DOA · Del 1' },
            { title: 'Delredovisning Del 1', subtitle: 'Aktiviteter + DOA/WRI/MOHOST · AF Af 00825' },
            { title: 'Delredovisning Del 2', subtitle: 'Arbetsstationer + AWP/MOHOST · AF Af 00826' },
            { title: 'Delredovisning Del 3', subtitle: 'Arbetsprövning + skattningar · AF Af 00827' },
            { title: 'Slutredovisning Del 4', subtitle: 'Slutbedömning · AF Af 00828' },
            { title: 'Information från arbetsprövningsplats', subtitle: 'Bilaga med AWC/AWP' },
          ].map((t) => (
            <div
              key={t.title}
              className="p-3 rounded-lg border border-stone-200"
            >
              <div className="font-medium text-stone-900 text-sm">{t.title}</div>
              <div className="text-xs text-stone-500">{t.subtitle}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function DocumentsTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onOpen,
}: {
  rows: DocumentRow[]
  sortBy: DocumentSortKey
  sortDir: SortDir
  onSort: (key: DocumentSortKey) => void
  onOpen: (row: DocumentRow) => void
}) {
  const renderTh = (key: DocumentSortKey, label: string) => {
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
          {renderTh('participant', 'Deltagare')}
          {renderTh('type', 'Dokumenttyp')}
          {renderTh('status', 'Status')}
          {renderTh('date', 'Uppdaterat')}
          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <DocumentTableRow key={d.id} row={d} onOpen={() => onOpen(d)} />
        ))}
      </tbody>
    </table>
  )
}

function DocumentTableRow({ row, onOpen }: { row: DocumentRow; onOpen: () => void }) {
  const statusInfo = documentStatusLabel(row.status)
  return (
    <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-medium text-stone-700">
            {row.participantInitials}
          </div>
          <span className="text-sm text-stone-900">{row.participantName}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="text-sm text-stone-900 flex items-center gap-2 flex-wrap">
          {row.title}
          {row.aiDrafted && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ background: 'var(--c-solid)' }}
            >
              <Bot size={10} />
              AI
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <DocumentStatusBadge tone={statusInfo.tone} label={statusInfo.label} />
      </td>
      <td className="px-4 py-3 align-middle text-xs text-stone-600">
        {new Date(row.updatedAt).toLocaleDateString('sv-SE')}
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <Button variant="secondary" size="sm" onClick={onOpen}>
          Öppna
        </Button>
      </td>
    </tr>
  )
}

function DocumentStatusBadge({ tone, label }: { tone: 'stone' | 'amber' | 'emerald' | 'sky'; label: string }) {
  const toneClass: Record<typeof tone, string> = {
    stone: 'bg-stone-100 text-stone-700',
    amber: 'bg-amber-50 text-amber-800',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-800',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', toneClass[tone])}>
      {label}
    </span>
  )
}

function DocumentsCardList({ rows, onOpen }: { rows: DocumentRow[]; onOpen: (row: DocumentRow) => void }) {
  return (
    <ul className="divide-y divide-stone-100">
      {rows.map((d) => {
        const statusInfo = documentStatusLabel(d.status)
        return (
          <li key={d.id} className="px-4 py-3 hover:bg-stone-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[11px] font-medium text-stone-700 flex-shrink-0">
                {d.participantInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-900 truncate">{d.participantName}</div>
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  {d.title}
                  {d.aiDrafted && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium text-white"
                      style={{ background: 'var(--c-solid)' }}
                    >
                      AI
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <DocumentStatusBadge tone={statusInfo.tone} label={statusInfo.label} />
              <span className="text-[11px] text-stone-500">{new Date(d.updatedAt).toLocaleDateString('sv-SE')}</span>
            </div>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => onOpen(d)}>
              Öppna
            </Button>
          </li>
        )
      })}
    </ul>
  )
}


