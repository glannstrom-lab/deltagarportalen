/**
 * PagaendeFlik — placeringar hos företaget (vyn employer_placements): vecka X
 * av Y, konsulentkontakt, vad platsen ska göra (employer_instructions),
 * sjukanmälan, upptrappning; avstämning vid vecka 12/24 + tidigare
 * avstämningar (employer_checkins). `?avstamning=<placeringsid>` öppnar
 * formuläret direkt (länken från översikten).
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Handshake, Mail, Phone } from '@/components/ui/icons'
import type { Organization } from '@/services/orgApi'
import { foretagApi, formateraDatum, fulltNamn, veckaAvTotal, type AvstamningInput, type AvstamningVecka, type PagaendePlacering } from '@/services/foretagApi'
import { FelRuta, Laddar } from '@/components/foretag/Tillstand'
import { AvstamningDialog } from '@/components/foretag/AvstamningDialog'
import { CHIP_KLASS, FORTSATT_INTRESSE_LABEL, PLACERING_STATUS_LABEL, PLACERING_TYP_LABEL, foretagNycklar } from '@/components/foretag/foretagEtiketter'

interface Props {
  org: Organization
}

const STATUS_KLASS: Record<PagaendePlacering['status'], string> = {
  planerad: 'bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  pagaende: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  avslutad: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200',
  avbruten: 'bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
}

/** Närmaste milstolpe som inte passerats med råge — vecka 12 tills vecka 18, sedan 24. */
function foreslagenVecka(vecka: number | null): AvstamningVecka {
  return vecka !== null && vecka >= 18 ? 24 : 12
}

export function PagaendeFlik({ org }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [avstamningVald, setAvstamningVald] = useState<PagaendePlacering | null>(null)

  const pagaendeQ = useQuery({ queryKey: foretagNycklar.pagaende(org.id), queryFn: () => foretagApi.listaPagaende(org.id) })
  const avstamningarQ = useQuery({ queryKey: foretagNycklar.avstamningar(org.id), queryFn: () => foretagApi.listaAvstamningar(org.id) })

  // `?avstamning=<id>` (länken från översikten) öppnar formuläret — härlett ur
  // URL:en, inte satt i en effekt. Stängning tar bort parametern.
  const avstamningViaUrl = params.get('avstamning')
  const avstamningFor = avstamningVald ?? (pagaendeQ.data ?? []).find((x) => x.id === avstamningViaUrl) ?? null
  const stangAvstamning = () => {
    setAvstamningVald(null)
    if (avstamningViaUrl) {
      const nasta = new URLSearchParams(params)
      nasta.delete('avstamning')
      setParams(nasta, { replace: true })
    }
  }

  const skapaAvstamning = useMutation({
    mutationFn: (input: AvstamningInput) => foretagApi.skapaAvstamning(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foretagNycklar.avstamningar(org.id) }),
  })

  const avstamningarFor = (placeringId: string) => (avstamningarQ.data ?? []).filter((a) => a.placement_id === placeringId)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Pågående</h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mt-1">
          De som är hos er nu, och de ni sagt ja till. Avstämningen vid vecka 12 och 24 går till konsulenten.
        </p>
      </div>

      {pagaendeQ.isLoading || (!pagaendeQ.data && !pagaendeQ.error) ? (
        <Laddar text="Hämtar placeringar…" />
      ) : pagaendeQ.error ? (
        <FelRuta fel={pagaendeQ.error} vad="placeringarna" onForsokIgen={() => pagaendeQ.refetch()} />
      ) : pagaendeQ.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Här följer ni dem som är hos er"
            description="När ni svarat 'vi vill gå vidare' på ett förslag och konsulenten startat placeringen visas den här."
            action={{ label: 'Se förslagen', onClick: () => navigate('/foretag/forslag') }}
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {pagaendeQ.data.map((p) => {
            const v = veckaAvTotal(p.start_date, p.end_date)
            const konsulent = fulltNamn(p.consultant_first_name, p.consultant_last_name) || 'Konsulenten'
            const tidigare = avstamningarFor(p.id)
            return (
              <li key={p.id}>
                <Card className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                        {fulltNamn(p.participant_first_name, p.participant_last_name) || 'Personen'}
                      </h3>
                      <p className="text-sm text-stone-700 dark:text-stone-200">
                        {p.place_title || p.occupation || 'Plats hos er'} · {PLACERING_TYP_LABEL[p.placement_type]}
                        {v ? ` · vecka ${v.vecka}${v.totalt ? ` av ${v.totalt}` : ''}` : ''}
                      </p>
                      {(p.start_date || p.end_date) && (
                        <p className="text-xs text-stone-600 dark:text-stone-300">
                          {p.start_date ? formateraDatum(p.start_date) : 'start ej satt'} – {p.end_date ? formateraDatum(p.end_date) : 'slut ej satt'}
                        </p>
                      )}
                    </div>
                    <span className={`${CHIP_KLASS} ${STATUS_KLASS[p.status]}`}>{PLACERING_STATUS_LABEL[p.status]}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-stone-900 dark:text-stone-100">Konsulent</p>
                      <p className="text-stone-800 dark:text-stone-100">{konsulent}</p>
                      {p.consultant_email && (
                        <p className="flex items-center gap-2 text-stone-800 dark:text-stone-100"><Mail className="h-4 w-4 text-stone-500" aria-hidden="true" /><a className="underline" href={`mailto:${p.consultant_email}`}>{p.consultant_email}</a></p>
                      )}
                      {p.consultant_phone && (
                        <p className="flex items-center gap-2 text-stone-800 dark:text-stone-100"><Phone className="h-4 w-4 text-stone-500" aria-hidden="true" /><a className="underline" href={`tel:${p.consultant_phone}`}>{p.consultant_phone}</a></p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-stone-900 dark:text-stone-100">Sjukanmälan</p>
                      {p.sick_call_phone || p.sick_call_instructions ? (
                        <p className="text-stone-800 dark:text-stone-100">{[p.sick_call_phone, p.sick_call_instructions].filter(Boolean).join(' · ')}</p>
                      ) : (
                        <p className="text-stone-600 dark:text-stone-300">Inte överenskommet än — ta upp det med {konsulent}.</p>
                      )}
                    </div>
                    {p.employer_instructions && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="font-medium text-stone-900 dark:text-stone-100">Vad platsen ska göra</p>
                        <p className="whitespace-pre-line text-stone-800 dark:text-stone-100">{p.employer_instructions}</p>
                      </div>
                    )}
                    {(p.can_ramp_up || p.ramp_up_plan) && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="font-medium text-stone-900 dark:text-stone-100">Upptrappning</p>
                        <p className="whitespace-pre-line text-stone-800 dark:text-stone-100">{p.ramp_up_plan || 'Tiden kan trappas upp — planen görs tillsammans med konsulenten.'}</p>
                      </div>
                    )}
                    {p.work_environment_responsibility && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="font-medium text-stone-900 dark:text-stone-100">Arbetsmiljöansvar</p>
                        <p className="whitespace-pre-line text-stone-800 dark:text-stone-100">{p.work_environment_responsibility}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-stone-200 dark:border-stone-700 pt-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-stone-900 dark:text-stone-100">Avstämningar</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/foretag/meddelanden?forslag=${p.proposal_id}`)}>
                          Skriv till {konsulent}
                        </Button>
                        <Button size="sm" onClick={() => setAvstamningVald(p)}>Gör en avstämning</Button>
                      </div>
                    </div>
                    {avstamningarQ.error ? (
                      <FelRuta fel={avstamningarQ.error} vad="avstämningarna" onForsokIgen={() => avstamningarQ.refetch()} />
                    ) : !avstamningarQ.data ? (
                      <Laddar text="Hämtar avstämningar…" />
                    ) : tidigare.length === 0 ? (
                      <p className="text-sm text-stone-600 dark:text-stone-300">Ingen avstämning inlämnad än.</p>
                    ) : (
                      <ul className="space-y-2">
                        {tidigare.map((a) => (
                          <li key={a.id} className="rounded-xl bg-stone-50 dark:bg-stone-800 p-3 text-sm space-y-1">
                            <p className="font-medium text-stone-900 dark:text-stone-100">
                              Vecka {a.milestone_week} · {formateraDatum(a.created_at)}
                            </p>
                            {a.going_well && <p className="text-stone-800 dark:text-stone-100"><span className="text-stone-500 dark:text-stone-400">Går bra: </span>{a.going_well}</p>}
                            {a.concerns && <p className="text-stone-800 dark:text-stone-100"><span className="text-stone-500 dark:text-stone-400">Oroar: </span>{a.concerns}</p>}
                            {a.continue_interest && <p className="text-stone-800 dark:text-stone-100"><span className="text-stone-500 dark:text-stone-400">Fortsätta: </span>{FORTSATT_INTRESSE_LABEL[a.continue_interest]}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <AvstamningDialog
        open={avstamningFor !== null}
        placering={avstamningFor}
        vecka={foreslagenVecka(avstamningFor ? veckaAvTotal(avstamningFor.start_date, avstamningFor.end_date)?.vecka ?? null : null)}
        onSpara={(input) => skapaAvstamning.mutateAsync(input)}
        onClose={stangAvstamning}
      />
    </div>
  )
}
