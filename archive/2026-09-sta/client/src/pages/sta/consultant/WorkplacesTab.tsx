import { type TabId } from './tableTypes'
import { PartChip } from './PartChip'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkplaceCard } from '../components/WorkplaceCard'
import { WorkplaceFormModal } from '../components/WorkplaceFormModal'
import { staWorkplacesApi, type StaWorkplace } from '@/services/staApi'
import { resolveParticipantName, deriveCurrentPart, type EnrollmentStats } from '../enrollmentDisplay'
import { type StaPart } from '../mockData'
import { Plus, Search, Building2 } from '@/components/ui/icons'

// ===========================================================================
// WORKPLACES TAB
// ===========================================================================

type AfFilter = 'all' | 'pending' | 'submitted' | 'approved' | 'rejected'

export function WorkplacesTab({
  stats,
  onReload,
  onChangeTab,
}: {
  stats: EnrollmentStats[]
  onReload: () => void
  onChangeTab: (tab: TabId) => void
}) {
  const [editing, setEditing] = useState<{ workplace: StaWorkplace | null; enrollmentId: string } | null>(null)
  const [filterPart, setFilterPart] = useState<'all' | 'del-3-4' | StaPart>('del-3-4')
  const [filterAf, setFilterAf] = useState<AfFilter>('all')
  const [search, setSearch] = useState('')

  // Räkna stats över ALLA deltagare och arbetsplatser
  const overview = useMemo(() => {
    let totalWorkplaces = 0
    const afStatusCount: Record<AfFilter, number> = { all: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 }
    for (const s of stats) {
      totalWorkplaces += s.workplaces.length
      for (const w of s.workplaces) {
        const key = (w.af_submission_status ?? 'pending') as AfFilter
        afStatusCount[key] = (afStatusCount[key] ?? 0) + 1
      }
    }
    return { totalWorkplaces, afStatusCount }
  }, [stats])

  // Filtrera per kriterier
  const filteredStats = useMemo(() => {
    const out: EnrollmentStats[] = []
    for (const s of stats) {
      // Del-filter — använd härlett part (current_part i DB kan vara stale)
      const derivedPart = deriveCurrentPart(s.enrollment)
      if (filterPart === 'del-3-4') {
        if (derivedPart < 3) continue
      } else if (filterPart !== 'all') {
        if (derivedPart !== filterPart) continue
      }

      // Sök på deltagar-namn ELLER företagsnamn
      if (search) {
        const q = search.toLowerCase()
        const matchesName = resolveParticipantName(s.enrollment, '').toLowerCase().includes(q)
        const matchesCompany = s.workplaces.some((w) => (w.company_name ?? '').toLowerCase().includes(q))
        if (!matchesName && !matchesCompany) continue
      }

      // AF-filter — när filtret är satt, filtrera arbetsplatser per deltagare
      let workplaces = s.workplaces
      if (filterAf !== 'all') {
        workplaces = workplaces.filter((w) => (w.af_submission_status ?? 'pending') === filterAf)
        if (workplaces.length === 0) continue
      }

      out.push({ ...s, workplaces })
    }
    return out
  }, [stats, filterPart, filterAf, search])

  const handleSave = async (input: Partial<StaWorkplace> & { company_name: string }) => {
    if (!editing) return
    if (editing.workplace) {
      await staWorkplacesApi.update(editing.workplace.id, input)
    } else {
      await staWorkplacesApi.create({
        ...input,
        enrollment_id: editing.enrollmentId,
      })
    }
    onReload()
  }

  const handleSubmitToAf = async (workplaceId: string) => {
    await staWorkplacesApi.update(workplaceId, {
      af_submission_status: 'submitted',
      af_submitted_at: new Date().toISOString(),
    })
    onReload()
  }

  const handleDelete = async (workplaceId: string) => {
    if (!confirm('Ta bort arbetsplatsen? Alla uppföljningar raderas också.')) return
    await staWorkplacesApi.delete(workplaceId)
    onReload()
  }

  // Tom-state: inga deltagare överhuvudtaget
  if (stats.length === 0) {
    return (
      <Card variant="flat" padding="lg">
        <EmptyState
          icon={Building2}
          title="Arbetsplatserna samlas här"
          description="Arbetsprövningsplatser registreras per deltagare. Lägg först till deltagare."
          action={{
            label: 'Gå till Deltagare',
            onClick: () => onChangeTab('deltagare'),
            variant: 'primary',
          }}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Översikts-card med räknare */}
      <Card variant="flat" padding="lg">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Arbetsprövningsplatser</h3>
            <p className="text-xs text-stone-500">
              <strong>{overview.totalWorkplaces}</strong> totalt ·{' '}
              <strong>{overview.afStatusCount.submitted ?? 0}</strong> inskickade till AF ·{' '}
              <strong>{overview.afStatusCount.approved ?? 0}</strong> godkända
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={filterPart === 'del-3-4' ? 'del-3-4' : String(filterPart)}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'all' || v === 'del-3-4') setFilterPart(v)
                else setFilterPart(Number(v) as StaPart)
              }}
              className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
              aria-label="Filtrera på del"
            >
              <option value="del-3-4">Del 3 & 4 (default)</option>
              <option value="all">Alla delar</option>
              <option value="1">Del 1</option>
              <option value="2">Del 2</option>
              <option value="3">Del 3</option>
              <option value="4">Del 4</option>
            </select>
            <select
              value={filterAf}
              onChange={(e) => setFilterAf(e.target.value as AfFilter)}
              className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
              aria-label="Filtrera på AF-status"
            >
              <option value="all">Alla AF-statusar</option>
              <option value="pending">Ej inskickade</option>
              <option value="submitted">Inskickade</option>
              <option value="approved">Godkända</option>
              <option value="rejected">Avslagna</option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök deltagare/företag…"
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
          </div>
        </div>
      </Card>

      {filteredStats.length === 0 ? (
        <Card variant="flat" padding="lg">
          <div className="text-sm text-stone-600">
            {filterPart === 'del-3-4' && overview.totalWorkplaces === 0
              ? <>Inga arbetsprövningsplatser i Del 3 eller Del 4 än. Lägg till en arbetsplats för en deltagare som är i Del 3 eller 4.</>
              : <>
                  Inga arbetsplatser matchar dina filter.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPart('del-3-4')
                      setFilterAf('all')
                      setSearch('')
                    }}
                    className="underline text-stone-700 hover:text-stone-900"
                  >
                    Rensa filter
                  </button>
                  .
                </>
            }
          </div>
        </Card>
      ) : (
        filteredStats.map((s) => {
          const derivedPart = deriveCurrentPart(s.enrollment)
          return (
          <Card key={s.enrollment.id} variant="flat" padding="lg">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2 flex-wrap">
                  {resolveParticipantName(s.enrollment)}
                  <PartChip part={derivedPart} size="sm" />
                </h3>
                <p className="text-xs text-stone-500">
                  {s.workplaces.length} arbetsplats
                  {s.workplaces.length === 1 ? '' : 'er'}
                  {derivedPart < 3 && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800">
                      För tidigt — arbetsprövning börjar i Del 3
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setEditing({ workplace: null, enrollmentId: s.enrollment.id })}
              >
                Lägg till arbetsplats
              </Button>
            </div>

            {s.workplaces.length === 0 ? (
              <p className="text-sm text-stone-500">
                Inga arbetsplatser registrerade än.
                {derivedPart >= 3 && (
                  <> Klicka på &quot;Lägg till arbetsplats&quot; för att börja.</>
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {s.workplaces.map((w) => (
                  <WorkplaceCard
                    key={w.id}
                    workplace={w}
                    consultantView
                    onEdit={() => setEditing({ workplace: w, enrollmentId: s.enrollment.id })}
                    onDelete={() => handleDelete(w.id)}
                    onSubmitToAf={() => handleSubmitToAf(w.id)}
                  />
                ))}
              </div>
            )}
          </Card>
          )
        })
      )}

      <WorkplaceFormModal
        open={!!editing}
        existing={editing?.workplace ?? null}
        onSave={handleSave}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

