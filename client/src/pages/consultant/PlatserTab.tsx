/**
 * PlatserTab — praktikplatser och arbetsträning (spår AG1).
 *
 * Lista, filtrera (insatstyp + status), lägg till en plats, koppla en
 * deltagare, och registrera veckouppföljning. Se
 * client/src/services/placeringarApi.ts för datalagret och
 * supabase/migrations/20260831130000_ag1_work_placements.sql för schemat
 * (INTE körd ännu — se migrationens huvud).
 *
 * Tre lägen krävs (CLAUDE.md): laddar / fel / klart. `isLoading === false`
 * räcker inte som klart — båda huvudfrågorna (platser + deltagare) måste
 * ha svarat innan listan renderas som "klar men tom".
 */

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Building2, Plus, Search } from '@/components/ui/icons'
import {
  placeringarApi,
  type Placering,
  type PlaceringInput,
  type PlaceringStatus,
  type PlaceringTyp,
  type PlaceringUppfoljningInput,
} from '@/services/placeringarApi'
import { PlaceringCard } from '@/components/consultant/PlaceringCard'
import { PlaceringFormModal } from '@/components/consultant/PlaceringFormModal'
import { PlaceringUppfoljningModal } from '@/components/consultant/PlaceringUppfoljningModal'
import { PLACERING_STATUS_LABEL, PLACERING_TYP_LABEL } from '@/components/consultant/placeringLabels'

const QK_PLACERINGAR = ['placeringar'] as const
const QK_DELTAGARE = ['placeringar-deltagare'] as const
const QK_UPPFOLJNINGAR = (placementId: string) => ['placeringar-uppfoljningar', placementId] as const

type TypFilter = 'alla' | PlaceringTyp
type StatusFilter = 'alla' | PlaceringStatus

export function PlatserTab() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()

  const [typFilter, setTypFilter] = useState<TypFilter>('alla')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alla')
  const [sok, setSok] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Placering | null>(null)
  const [uppfoljningFor, setUppfoljningFor] = useState<Placering | null>(null)

  const {
    data: placeringar,
    isLoading: placeringarLoading,
    error: placeringarError,
    refetch: refetchPlaceringar,
  } = useQuery({
    queryKey: QK_PLACERINGAR,
    queryFn: () => placeringarApi.getPlaceringar(),
  })

  const {
    data: deltagare,
    isLoading: deltagareLoading,
    error: deltagareError,
    refetch: refetchDeltagare,
  } = useQuery({
    queryKey: QK_DELTAGARE,
    queryFn: () => placeringarApi.getKopplingsbaraDeltagare(),
  })

  const { data: uppfoljningarForAktiv } = useQuery({
    queryKey: uppfoljningFor ? QK_UPPFOLJNINGAR(uppfoljningFor.id) : ['placeringar-uppfoljningar', 'none'],
    queryFn: () => placeringarApi.getUppfoljningar(uppfoljningFor!.id),
    enabled: !!uppfoljningFor,
  })

  const createMutation = useMutation({
    mutationFn: (input: PlaceringInput) => placeringarApi.createPlacering(input),
    onSuccess: async (skapad) => {
      queryClient.invalidateQueries({ queryKey: QK_PLACERINGAR })
      // Förbered de fyra milstolpeuppföljningarna (vecka 1/5/12/24) som
      // PLANERADE rader så fort platsen har ett startdatum — Mikaels
      // riktvärde, se placeringarApi.berakMilstolpeUppfoljningar(). Utan
      // startdatum går det inte att räkna fram datum, så inget skapas än.
      if (skapad.start_date) {
        const milstolpar = placeringarApi.berakMilstolpeUppfoljningar(skapad.id, skapad.start_date)
        await Promise.all(milstolpar.map((m) => placeringarApi.createUppfoljning(m)))
      }
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PlaceringInput> }) =>
      placeringarApi.updatePlacering(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK_PLACERINGAR }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => placeringarApi.deletePlacering(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK_PLACERINGAR }),
  })
  const createUppfoljningMutation = useMutation({
    mutationFn: (input: PlaceringUppfoljningInput) => placeringarApi.createUppfoljning(input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: QK_UPPFOLJNINGAR(variables.placement_id) }),
  })

  const deltagarNamn = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of deltagare ?? []) {
      map.set(d.participant_id, [d.first_name, d.last_name].filter(Boolean).join(' ') || d.email)
    }
    return map
  }, [deltagare])

  const filtrerade = useMemo(() => {
    let list = placeringar ?? []
    if (typFilter !== 'alla') list = list.filter((p) => p.placement_type === typFilter)
    if (statusFilter !== 'alla') list = list.filter((p) => p.status === statusFilter)
    if (sok.trim()) {
      const q = sok.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.company_name.toLowerCase().includes(q) ||
          (deltagarNamn.get(p.participant_id) ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [placeringar, typFilter, statusFilter, sok, deltagarNamn])

  const isLoading = placeringarLoading || deltagareLoading || !placeringar || !deltagare
  const error = placeringarError || deltagareError

  const handleSave = async (input: PlaceringInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, updates: input })
    } else {
      await createMutation.mutateAsync(input)
    }
  }

  const handleDelete = async (p: Placering) => {
    const ok = await confirm({
      title: 'Ta bort platsen?',
      message: `${p.company_name} tas bort tillsammans med alla veckouppföljningar. Det går inte att ångra.`,
      confirmText: 'Ta bort',
      variant: 'danger',
    })
    if (!ok) return
    await deleteMutation.mutateAsync(p.id)
  }

  const nextWeekNumber = useMemo(() => {
    if (!uppfoljningarForAktiv || uppfoljningarForAktiv.length === 0) return 1
    return Math.max(...uppfoljningarForAktiv.map((u) => u.week_number)) + 1
  }, [uppfoljningarForAktiv])

  // ---- Läge: laddar ----
  if (isLoading && !error) {
    return (
      <Card variant="flat" padding="lg">
        <LoadingState title="Hämtar platser" message="Ett ögonblick…" />
      </Card>
    )
  }

  // ---- Läge: fel (aldrig samma vy som "tomt") ----
  if (error) {
    return (
      <Card variant="flat" padding="lg">
        <ErrorState
          title="Platserna kunde inte hämtas"
          message={error instanceof Error ? error.message : 'Ett okänt fel inträffade.'}
          onRetry={() => {
            refetchPlaceringar()
            refetchDeltagare()
          }}
        />
      </Card>
    )
  }

  // ---- Läge: klart, men ingen deltagare att koppla platser till ----
  if ((deltagare ?? []).length === 0) {
    return (
      <Card variant="flat" padding="lg">
        <EmptyState
          icon={Building2}
          title="Platserna samlas här"
          description="Praktik, arbetsträning, arbetsprövning och subventionerad anställning registreras per deltagare. Lägg först till en deltagare."
          action={{
            label: 'Gå till Deltagare',
            onClick: () => navigate('/consultant/participants'),
          }}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card variant="flat" padding="lg">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Platser</h3>
            <p className="text-xs text-stone-500">
              <strong>{(placeringar ?? []).length}</strong> totalt ·{' '}
              <strong>{(placeringar ?? []).filter((p) => p.status === 'pagaende').length}</strong> pågående
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Lägg till plats
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={typFilter}
            onChange={(e) => setTypFilter(e.target.value as TypFilter)}
            className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
            aria-label="Filtrera på insatstyp"
          >
            <option value="alla">Alla insatstyper</option>
            {(Object.keys(PLACERING_TYP_LABEL) as PlaceringTyp[]).map((t) => (
              <option key={t} value={t}>
                {PLACERING_TYP_LABEL[t]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
            aria-label="Filtrera på status"
          >
            <option value="alla">Alla statusar</option>
            {(Object.keys(PLACERING_STATUS_LABEL) as PlaceringStatus[]).map((s) => (
              <option key={s} value={s}>
                {PLACERING_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={sok}
              onChange={(e) => setSok(e.target.value)}
              placeholder="Sök deltagare/företag…"
              className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>
        </div>
      </Card>

      {(placeringar ?? []).length === 0 ? (
        <Card variant="flat" padding="lg">
          <EmptyState
            icon={Building2}
            title="Inga platser registrerade än"
            description="Praktik, arbetsträning, arbetsprövning eller subventionerad anställning — lägg till den första platsen för en deltagare."
            action={{
              label: 'Lägg till plats',
              onClick: () => {
                setEditing(null)
                setFormOpen(true)
              },
            }}
          />
        </Card>
      ) : filtrerade.length === 0 ? (
        <Card variant="flat" padding="lg">
          <p className="text-sm text-stone-600">
            Inga platser matchar dina filter.{' '}
            <button
              type="button"
              onClick={() => {
                setTypFilter('alla')
                setStatusFilter('alla')
                setSok('')
              }}
              className="underline text-stone-700 hover:text-stone-900"
            >
              Rensa filter
            </button>
            .
          </p>
        </Card>
      ) : (
        <Card variant="flat" padding="lg" className="space-y-3">
          {filtrerade.map((p) => (
            <PlaceringCard
              key={p.id}
              placering={p}
              deltagarNamn={deltagarNamn.get(p.participant_id) ?? '—'}
              onEdit={() => {
                setEditing(p)
                setFormOpen(true)
              }}
              onUppfoljning={() => setUppfoljningFor(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </Card>
      )}

      <PlaceringFormModal
        open={formOpen}
        existing={editing}
        deltagare={deltagare ?? []}
        onSave={handleSave}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      />

      {uppfoljningFor && (
        <PlaceringUppfoljningModal
          open={!!uppfoljningFor}
          placementId={uppfoljningFor.id}
          nextWeekNumber={nextWeekNumber}
          onSave={(input) => createUppfoljningMutation.mutateAsync(input)}
          onClose={() => setUppfoljningFor(null)}
        />
      )}
    </div>
  )
}
