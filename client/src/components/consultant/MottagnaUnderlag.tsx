/**
 * MottagnaUnderlag — handläggarens vy över underlag som lämnats till henne (KH11,
 * rollspelet 2026-09-28; RK34-rest).
 *
 * Före: handläggaren (org-roll 'handlaggare') såg "0 deltagare" på varje flik, och
 * underlaget var en fritextrad hos konsulenten. Nu väljer konsulenten henne som
 * mottagare, hon får en notis och ser underlaget här — deltagare, konsulent,
 * period, närvaro, ogiltig frånvaro och om deltagaren förklarat den. Beslutet om
 * försörjningsstöd fattas och dokumenteras i kommunens verksamhetssystem; portalen
 * ersätter inte det, och säger det.
 *
 * Data: rpc `mina_mottagna_underlag` (definer, bara recipient_user_id = jag). Ingen
 * läsrätt på deltagarens konto i övrigt.
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { FORSORJNINGSHINDER_ETIKETT, underlagApi, type MottagetUnderlag } from '@/services/aktivitetApi'
import { langtDatum } from './aktivitetEtiketter'
import { notifications } from '@/lib/toast'

export const MOTTAGNA_UNDERLAG_KEY = ['mottagna-underlag'] as const

function namn(f: string | null, e: string | null): string {
  return [f, e].filter(Boolean).join(' ') || 'Namn saknas'
}

function Rad({ u, onKvittera, kvitterar }: { u: MottagetUnderlag; onKvittera: () => void; kvitterar: boolean }) {
  const s = u.summary ?? {}
  const hinder = u.forsorjningshinder
    ? (FORSORJNINGSHINDER_ETIKETT as Record<string, string>)[u.forsorjningshinder] ?? u.forsorjningshinder
    : null
  return (
    <li className="py-4 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold text-stone-900 dark:text-stone-100">
          {namn(u.participant_first_name, u.participant_last_name)}
        </h4>
        <span className="text-sm text-stone-600 dark:text-stone-300">
          {langtDatum(u.period_from)} – {langtDatum(u.period_to)}
        </span>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-300">
        Lämnat {langtDatum(u.handed_over_at.slice(0, 10))} av {namn(u.consultant_first_name, u.consultant_last_name)}
        {u.consultant_email ? ` (${u.consultant_email})` : ''}
        {hinder ? ` · ${hinder}` : ''}
      </p>
      {u.withdrawn_at ? (
        <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
          Ångrat av konsulenten{u.withdrawn_reason ? `: ${u.withdrawn_reason}` : ''}. Använd inte det här underlaget.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div><dt className="text-stone-500 dark:text-stone-400">Pass</dt><dd className="tabular-nums">{s.pass ?? '—'}</dd></div>
            <div><dt className="text-stone-500 dark:text-stone-400">Närvarande</dt><dd className="tabular-nums">{s.present ?? '—'}</dd></div>
            <div><dt className="text-stone-500 dark:text-stone-400">Ogiltig frånvaro</dt><dd className="tabular-nums">{u.ogiltig_franvaro}</dd></div>
            <div><dt className="text-stone-500 dark:text-stone-400">Sjuk utan intyg</dt><dd className="tabular-nums">{s.sjuk_utan_intyg ?? '—'}</dd></div>
          </dl>
          {u.ogiltig_franvaro > 0 && (
            <p className="text-sm text-stone-700 dark:text-stone-200">
              Deltagaren har förklarat {u.ogiltig_franvaro_forklarad} av {u.ogiltig_franvaro} tillfällen med ogiltig frånvaro i portalen.
              {u.ogiltig_franvaro_forklarad < u.ogiltig_franvaro && ' Fråga konsulenten om deltagaren fått möjlighet att förklara resten.'}
            </p>
          )}
          {u.note && <p className="text-sm text-stone-700 dark:text-stone-200">Konsulentens anteckning: {u.note}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {u.received_at ? (
              <span className="text-sm text-stone-600 dark:text-stone-300" role="status">
                Du kvitterade {langtDatum(u.received_at.slice(0, 10))}.
              </span>
            ) : (
              <Button size="sm" onClick={onKvittera} disabled={kvitterar}>
                {kvitterar ? 'Kvitterar…' : 'Kvittera mottaget'}
              </Button>
            )}
          </div>
        </>
      )}
    </li>
  )
}

export function MottagnaUnderlag({ visaTomt }: { visaTomt: boolean }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: MOTTAGNA_UNDERLAG_KEY, queryFn: () => underlagApi.mottagna(), staleTime: 30_000 })
  const kvittera = useMutation({
    mutationFn: (id: string) => underlagApi.kvittera(id),
    onSuccess: () => {
      notifications.success('Kvitterat — konsulenten ser att du tagit emot underlaget.')
      qc.invalidateQueries({ queryKey: MOTTAGNA_UNDERLAG_KEY })
    },
    onError: (err) => notifications.error(err instanceof Error ? err.message : 'Kvitteringen gick inte att spara.'),
  })

  if (q.isLoading) return <LoadingState message="Hämtar underlag…" size="sm" />
  if (q.isError) return <ErrorState title="Underlagen kunde inte hämtas" message={q.error instanceof Error ? q.error.message : ''} onRetry={() => q.refetch()} />
  const rader = q.data ?? []
  if (rader.length === 0 && !visaTomt) return null
  const okvitterade = rader.filter((u) => !u.received_at && !u.withdrawn_at).length

  return (
    <Card className="p-5 space-y-3" data-testid="mottagna-underlag">
      <div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">Underlag till dig</h3>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {rader.length === 0
            ? 'Inga underlag har lämnats till dig än. När en konsulent väljer dig som mottagare får du en notis och underlaget syns här.'
            : okvitterade > 0
              ? `${okvitterade} ${okvitterade === 1 ? 'underlag väntar' : 'underlag väntar'} på att du kvitterar dem.`
              : 'Alla underlag är kvitterade.'}
          {' '}Beslutet dokumenterar du i kommunens verksamhetssystem.
        </p>
      </div>
      {rader.length > 0 && (
        <ul className="divide-y divide-stone-200 dark:divide-stone-700">
          {rader.map((u) => (
            <Rad key={u.id} u={u} onKvittera={() => kvittera.mutate(u.id)} kvitterar={kvittera.isPending && kvittera.variables === u.id} />
          ))}
        </ul>
      )}
    </Card>
  )
}
