/**
 * ForslagFlik — förslagen (vyn employer_proposals). Lista till vänster,
 * detalj till höger; `?id=` väljer. markeraOppnad anropas EN gång per öppning
 * (per förslags-id under komponentens livstid) — visningsräkningen är
 * deltagarens skydd (max_views), inte statistik, så den ska inte tickas av en
 * omrendering. Kastar den ("kan inte visas fler gånger") visas det i detaljen.
 */

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Inbox } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { Organization } from '@/services/orgApi'
import { foretagApi, formateraDatum, fulltNamn, type Forslag } from '@/services/foretagApi'
import { FelRuta, Laddar } from '@/components/foretag/Tillstand'
import { ForslagDetalj } from '@/components/foretag/ForslagDetalj'
import { SvarDialog } from '@/components/foretag/SvarDialog'
import { CHIP_KLASS, PLACERING_TYP_LABEL, SVAR_KLASS, SVAR_LABEL, foretagNycklar } from '@/components/foretag/foretagEtiketter'

interface Props {
  org: Organization
}

export function ForslagFlik({ org }: Props) {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const valtId = params.get('id')
  const [svarDialog, setSvarDialog] = useState<'interested' | 'declined' | null>(null)
  const [oppnadFel, setOppnadFel] = useState<Record<string, unknown>>({})
  const oppnade = useRef<Set<string>>(new Set())

  const forslagQ = useQuery({ queryKey: foretagNycklar.forslag(org.id), queryFn: () => foretagApi.listaForslag(org.id) })
  const valt = (forslagQ.data ?? []).find((f) => f.id === valtId) ?? null

  useEffect(() => {
    if (!valt || oppnade.current.has(valt.id)) return
    oppnade.current.add(valt.id)
    foretagApi.markeraOppnad(valt.id).catch((e: unknown) => {
      setOppnadFel((prev) => ({ ...prev, [valt.id]: e }))
    })
  }, [valt])

  const svara = useMutation({
    mutationFn: ({ id, svar, meddelande }: { id: string; svar: 'interested' | 'declined'; meddelande: string }) =>
      foretagApi.svara(id, svar, meddelande),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foretagNycklar.allt }),
  })

  const valj = (f: Forslag) => {
    const nasta = new URLSearchParams(params)
    nasta.set('id', f.id)
    setParams(nasta)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Förslag</h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mt-1">
          Personer en konsulent föreslagit för en plats hos er — och som själva sagt ja till att ni får se presentationen.
        </p>
      </div>

      {forslagQ.isLoading || (!forslagQ.data && !forslagQ.error) ? (
        <Laddar text="Hämtar förslag…" />
      ) : forslagQ.error ? (
        <FelRuta fel={forslagQ.error} vad="förslagen" onForsokIgen={() => forslagQ.refetch()} />
      ) : forslagQ.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="Här landar förslag från konsulenter"
            description="Ni ser ett förslag först när personen godkänt att just de uppgifterna delas med er. Fler platser ger fler förslag."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,1fr)_2fr] gap-4">
          <ul className="space-y-2" aria-label="Förslag">
            {forslagQ.data.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => valj(f)}
                  aria-current={valt?.id === f.id ? 'true' : undefined}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 transition-colors',
                    valt?.id === f.id
                      ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
                      : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {fulltNamn(f.participant_first_name, f.participant_last_name) || 'Personen'}
                    </p>
                    <span className={`${CHIP_KLASS} ${SVAR_KLASS[f.employer_response]}`}>{SVAR_LABEL[f.employer_response]}</span>
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-200">
                    {f.place_title || f.occupation || PLACERING_TYP_LABEL[f.placement_type]} · av {fulltNamn(f.consultant_first_name, f.consultant_last_name) || 'konsulent'}
                  </p>
                  {f.decided_at && <p className="text-xs text-stone-600 dark:text-stone-300">Godkänt {formateraDatum(f.decided_at)}</p>}
                </button>
              </li>
            ))}
          </ul>

          <div>
            {valt ? (
              <ForslagDetalj forslag={valt} oppnadFel={oppnadFel[valt.id]} onSvara={(svar) => setSvarDialog(svar)} />
            ) : (
              <Card>
                <EmptyState compact icon={Inbox} title="Välj ett förslag i listan" description="Presentationen visas här." />
              </Card>
            )}
          </div>
        </div>
      )}

      <SvarDialog
        open={svarDialog !== null && valt !== null}
        forslag={valt}
        svar={svarDialog ?? 'interested'}
        onSvara={(id, svar, meddelande) => svara.mutateAsync({ id, svar, meddelande })}
        onClose={() => setSvarDialog(null)}
      />
    </div>
  )
}
