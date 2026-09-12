/**
 * PlatserFlik — företagets platser (employer_places): lista + skapa/ändra i
 * PlatsFormDialog + ta bort via bekräftelsedialog. `?ny=1` öppnar formuläret
 * direkt (länken från översikten).
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Building2, Plus } from '@/components/ui/icons'
import type { Organization } from '@/services/orgApi'
import { foretagApi, formateraDatum, type Plats, type PlatsInput } from '@/services/foretagApi'
import { FelRuta, FelText, Laddar } from '@/components/foretag/Tillstand'
import { PlatsFormDialog } from '@/components/foretag/PlatsFormDialog'
import { CHIP_KLASS, NIVA_LABEL, PLACERING_TYP_LABEL, PLATS_STATUS_KLASS, PLATS_STATUS_LABEL, foretagNycklar, kravSammanfattning } from '@/components/foretag/foretagEtiketter'

interface Props {
  org: Organization
}

export function PlatserFlik({ org }: Props) {
  const queryClient = useQueryClient()
  const { confirm } = useConfirmDialog()
  const [params, setParams] = useSearchParams()
  const [dialog, setDialog] = useState<{ open: boolean; existing: Plats | null }>({ open: false, existing: null })
  const [raderaFel, setRaderaFel] = useState<unknown>(null)

  // `?ny=1` (länken från översikten) öppnar formuläret — härlett ur URL:en, inte
  // satt i en effekt. Stängning tar bort parametern så en omladdning inte öppnar igen.
  const nyViaUrl = params.get('ny') === '1'
  const dialogOppen = dialog.open || nyViaUrl
  const stangDialog = () => {
    setDialog({ open: false, existing: null })
    if (nyViaUrl) {
      const nasta = new URLSearchParams(params)
      nasta.delete('ny')
      setParams(nasta, { replace: true })
    }
  }

  const platserQ = useQuery({ queryKey: foretagNycklar.platser(org.id), queryFn: () => foretagApi.listaPlatser(org.id) })
  const invalidera = () => queryClient.invalidateQueries({ queryKey: foretagNycklar.platser(org.id) })

  const skapa = useMutation({ mutationFn: (input: PlatsInput) => foretagApi.skapaPlats(org.id, input), onSuccess: invalidera })
  const uppdatera = useMutation({ mutationFn: ({ id, patch }: { id: string; patch: PlatsInput }) => foretagApi.uppdateraPlats(id, patch), onSuccess: invalidera })
  const radera = useMutation({ mutationFn: (id: string) => foretagApi.raderaPlats(id), onSuccess: invalidera })

  const taBort = async (p: Plats) => {
    const ok = await confirm({
      title: `Ta bort "${p.title}"?`,
      message: 'Platsen försvinner för konsulenterna. Pågående placeringar på platsen påverkas inte.',
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    setRaderaFel(null)
    try {
      await radera.mutateAsync(p.id)
    } catch (e) {
      setRaderaFel(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Våra platser</h2>
          <p className="text-sm text-stone-700 dark:text-stone-200 mt-1">
            Det ni kan erbjuda — vad platsen kräver och vad ni kan ge. Konsulenterna matchar mot det; ni ser aldrig en lista över personer.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setDialog({ open: true, existing: null })}>
          Lägg till en plats
        </Button>
      </div>

      <FelText fel={raderaFel} />

      {platserQ.isLoading || (!platserQ.data && !platserQ.error) ? (
        <Laddar text="Hämtar platser…" />
      ) : platserQ.error ? (
        <FelRuta fel={platserQ.error} vad="platserna" onForsokIgen={() => platserQ.refetch()} />
      ) : platserQ.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Berätta vad ni kan erbjuda"
            description="Beskriv en plats: arbetsuppgifter, tider, fysiska krav och hur mycket handledning ni kan ge."
            action={{ label: 'Lägg till första platsen', onClick: () => setDialog({ open: true, existing: null }) }}
          />
        </Card>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {platserQ.data.map((p) => {
            const krav = kravSammanfattning(p)
            return (
              <li key={p.id}>
                <Card className="h-full space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100">{p.title}</h3>
                      <p className="text-sm text-stone-700 dark:text-stone-200">{PLACERING_TYP_LABEL[p.placement_type]}</p>
                    </div>
                    <span className={`${CHIP_KLASS} ${PLATS_STATUS_KLASS[p.status]}`}>{PLATS_STATUS_LABEL[p.status]}</span>
                  </div>
                  {p.description && <p className="text-sm text-stone-800 dark:text-stone-100 whitespace-pre-line">{p.description}</p>}
                  <dl className="text-sm text-stone-700 dark:text-stone-200 space-y-1">
                    {krav.length > 0 && (
                      <div className="flex gap-2"><dt className="text-stone-500 dark:text-stone-400 shrink-0">Krav</dt><dd>{krav.join(', ')}</dd></div>
                    )}
                    {p.workplace_supervision_capacity && (
                      <div className="flex gap-2"><dt className="text-stone-500 dark:text-stone-400 shrink-0">Handledning</dt><dd>{NIVA_LABEL[p.workplace_supervision_capacity]}{p.supervision_notes ? ` — ${p.supervision_notes}` : ''}</dd></div>
                    )}
                    {p.schedule_days && (
                      <div className="flex gap-2"><dt className="text-stone-500 dark:text-stone-400 shrink-0">Tider</dt><dd>{p.schedule_days}</dd></div>
                    )}
                    {p.start_from && (
                      <div className="flex gap-2"><dt className="text-stone-500 dark:text-stone-400 shrink-0">Från</dt><dd>{formateraDatum(p.start_from)}</dd></div>
                    )}
                    {p.contact_name && (
                      <div className="flex gap-2"><dt className="text-stone-500 dark:text-stone-400 shrink-0">Kontakt</dt><dd>{[p.contact_name, p.contact_phone, p.contact_email].filter(Boolean).join(' · ')}</dd></div>
                    )}
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, existing: p })}>Ändra</Button>
                    <Button size="sm" variant="ghost" onClick={() => taBort(p)}>Ta bort</Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <PlatsFormDialog
        open={dialogOppen}
        existing={dialog.existing}
        onSave={(input) => (dialog.existing ? uppdatera.mutateAsync({ id: dialog.existing.id, patch: input }) : skapa.mutateAsync(input))}
        onClose={stangDialog}
      />
    </div>
  )
}
