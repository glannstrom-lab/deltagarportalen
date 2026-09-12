/**
 * OversiktFlik — vad som väntar på företaget just nu. Tre kort: förslag att
 * svara på, våra platser, pågående placeringar. Tomma listor är inviter via
 * <EmptyState>, aldrig "0" (CLAUDE.md, DESIGN.md §7). Tre lägen per kort.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Building2, Handshake, Inbox } from '@/components/ui/icons'
import type { Organization } from '@/services/orgApi'
import { foretagApi, dagarSedan, formateraDatum, fulltNamn, veckaAvTotal, type Forslag } from '@/services/foretagApi'
import { FelRuta, Laddar } from '@/components/foretag/Tillstand'
import { SvarDialog } from '@/components/foretag/SvarDialog'
import { CHIP_KLASS, PLACERING_TYP_LABEL, PLATS_STATUS_KLASS, PLATS_STATUS_LABEL, foretagNycklar, kravSammanfattning } from '@/components/foretag/foretagEtiketter'

interface Props {
  org: Organization
}

function Kortrubrik({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{children}</h3>
}

export function OversiktFlik({ org }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [avboj, setAvboj] = useState<Forslag | null>(null)

  const forslagQ = useQuery({ queryKey: foretagNycklar.forslag(org.id), queryFn: () => foretagApi.listaForslag(org.id) })
  const platserQ = useQuery({ queryKey: foretagNycklar.platser(org.id), queryFn: () => foretagApi.listaPlatser(org.id) })
  const pagaendeQ = useQuery({ queryKey: foretagNycklar.pagaende(org.id), queryFn: () => foretagApi.listaPagaende(org.id) })

  const svara = useMutation({
    mutationFn: ({ id, svar, meddelande }: { id: string; svar: 'interested' | 'declined'; meddelande: string }) =>
      foretagApi.svara(id, svar, meddelande),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foretagNycklar.allt }),
  })

  const obesvarade = (forslagQ.data ?? []).filter((f) => f.employer_response === 'pending')
  const aldst = obesvarade.reduce<number | null>((acc, f) => {
    const d = dagarSedan(f.decided_at ?? f.created_at)
    return d === null ? acc : acc === null ? d : Math.max(acc, d)
  }, null)

  const vantar = !forslagQ.data
    ? null
    : obesvarade.length === 0
      ? 'Inget väntar på svar just nu.'
      : `${obesvarade.length === 1 ? 'Ett förslag' : `${obesvarade.length} förslag`} väntar på ert svar${aldst !== null && aldst > 0 ? `, det äldsta sedan ${aldst === 1 ? 'en dag' : `${aldst} dagar`}` : ''}.`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Hej {org.name}</h2>
        {vantar && <p className="text-stone-700 dark:text-stone-200 mt-1">{vantar}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Förslag att svara på */}
        <Card className="space-y-3">
          <Kortrubrik>Förslag att svara på</Kortrubrik>
          {forslagQ.isLoading || (!forslagQ.data && !forslagQ.error) ? (
            <Laddar text="Hämtar förslag…" />
          ) : forslagQ.error ? (
            <FelRuta fel={forslagQ.error} vad="förslagen" onForsokIgen={() => forslagQ.refetch()} />
          ) : obesvarade.length === 0 ? (
            <EmptyState
              compact
              icon={Inbox}
              title="Här landar förslag från konsulenter"
              description="När en person godkänt att presenteras för er ser ni det här."
              action={{ label: 'Se alla förslag', onClick: () => navigate('/foretag/forslag') }}
            />
          ) : (
            <ul className="divide-y divide-stone-200 dark:divide-stone-700">
              {obesvarade.map((f) => (
                <li key={f.id} className="py-3 space-y-1">
                  <p className="font-medium text-stone-900 dark:text-stone-100">{f.place_title || f.occupation || 'Plats hos er'}</p>
                  <p className="text-sm text-stone-700 dark:text-stone-200">
                    {PLACERING_TYP_LABEL[f.placement_type]} · Föreslagen av {fulltNamn(f.consultant_first_name, f.consultant_last_name) || 'konsulent'}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    {fulltNamn(f.participant_first_name, f.participant_last_name) || 'Personen'} har godkänt att presenteras för er
                    {f.expires_at ? ` · visas till ${formateraDatum(f.expires_at)}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => navigate(`/foretag/forslag?id=${f.id}`)}>Läs presentationen</Button>
                    <Button size="sm" variant="outline" onClick={() => setAvboj(f)}>Tacka nej</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Våra platser */}
        <Card className="space-y-3">
          <Kortrubrik>Våra platser</Kortrubrik>
          {platserQ.isLoading || (!platserQ.data && !platserQ.error) ? (
            <Laddar text="Hämtar platser…" />
          ) : platserQ.error ? (
            <FelRuta fel={platserQ.error} vad="platserna" onForsokIgen={() => platserQ.refetch()} />
          ) : platserQ.data.length === 0 ? (
            <EmptyState
              compact
              icon={Building2}
              title="Berätta vad ni kan erbjuda"
              description="En plats är vad ni kräver och vad ni kan ge — inte vem ni söker."
              action={{ label: 'Lägg till en plats', onClick: () => navigate('/foretag/platser?ny=1') }}
            />
          ) : (
            <>
              <ul className="divide-y divide-stone-200 dark:divide-stone-700">
                {platserQ.data.slice(0, 5).map((p) => {
                  const krav = kravSammanfattning(p)
                  return (
                    <li key={p.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-stone-900 dark:text-stone-100">{p.title}</p>
                        <span className={`${CHIP_KLASS} ${PLATS_STATUS_KLASS[p.status]}`}>{PLATS_STATUS_LABEL[p.status]}</span>
                      </div>
                      <p className="text-sm text-stone-700 dark:text-stone-200">
                        {PLACERING_TYP_LABEL[p.placement_type]}
                        {krav.length > 0 ? ` · ${krav.join(', ')}` : ''}
                      </p>
                    </li>
                  )
                })}
              </ul>
              <Link to="/foretag/platser?ny=1" className="block text-sm font-medium text-[var(--c-text)] underline">
                Lägg till en plats
              </Link>
            </>
          )}
        </Card>

        {/* Pågående placeringar */}
        <Card className="space-y-3">
          <Kortrubrik>Pågående placeringar</Kortrubrik>
          {pagaendeQ.isLoading || (!pagaendeQ.data && !pagaendeQ.error) ? (
            <Laddar text="Hämtar placeringar…" />
          ) : pagaendeQ.error ? (
            <FelRuta fel={pagaendeQ.error} vad="placeringarna" onForsokIgen={() => pagaendeQ.refetch()} />
          ) : pagaendeQ.data.length === 0 ? (
            <EmptyState
              compact
              icon={Handshake}
              title="Här följer ni dem som är hos er"
              description="När ni sagt ja till ett förslag och placeringen börjat visas den här."
            />
          ) : (
            <ul className="divide-y divide-stone-200 dark:divide-stone-700">
              {pagaendeQ.data.map((p) => {
                const v = veckaAvTotal(p.start_date, p.end_date)
                const konsulent = fulltNamn(p.consultant_first_name, p.consultant_last_name)
                return (
                  <li key={p.id} className="py-3 space-y-1">
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {fulltNamn(p.participant_first_name, p.participant_last_name) || 'Personen'}
                    </p>
                    <p className="text-sm text-stone-700 dark:text-stone-200">
                      {p.place_title || p.occupation || PLACERING_TYP_LABEL[p.placement_type]}
                      {v ? ` · vecka ${v.vecka}${v.totalt ? ` av ${v.totalt}` : ''}` : ''}
                    </p>
                    {konsulent && <p className="text-xs text-stone-600 dark:text-stone-300">Konsulent: {konsulent}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/foretag/meddelanden?forslag=${p.proposal_id}`)}>
                        Skriv till {konsulent || 'konsulenten'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/foretag/pagaende?avstamning=${p.id}`)}>
                        Avstämning
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <SvarDialog
        open={avboj !== null}
        forslag={avboj}
        svar="declined"
        onSvara={(id, svar, meddelande) => svara.mutateAsync({ id, svar, meddelande })}
        onClose={() => setAvboj(null)}
      />
    </div>
  )
}
