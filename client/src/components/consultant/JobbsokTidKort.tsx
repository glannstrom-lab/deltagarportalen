/**
 * JobbsokTidKort — deltagarens eget jobbsökande i konsulentens veckovy (KM9).
 *
 * Visar det konsulenten faktiskt får läsa: planens mål i timmar, sparade jobb
 * och ansökningar för veckan ur saved_jobs (RLS: profiles.consultant_id =
 * auth.uid()), och CV-datumet ur vyn consultant_dashboard_participants.
 * CV-innehåll, brev och intervjuträning ser bara deltagaren själv — det
 * sägs rakt ut i stället för att visa 0.
 *
 * Deltagarens egen redovisning, inte kontroll: inga procent, inga
 * jämförelser mot målet, ingen röd färg. Konsulentvyn översätts inte.
 */

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Briefcase } from '@/components/ui/icons'
import { jobbsokAktivitetApi, type KonsulentVeckojobbsok } from '@/services/jobbsokAktivitet'
import { fetchCachedConsultantParticipants } from '@/pages/consultant/consultantParticipantsQuery'
import type { ActivityPlan } from '@/services/aktivitetApi'

interface Props {
  participantId: string
  plan: ActivityPlan
  /** Måndag i veckan, `YYYY-MM-DD` */
  vecka: string
}

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; vecka: KonsulentVeckojobbsok | null; cvUppdaterad: string | null; harCv: boolean }

function kortDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export function JobbsokTidKort({ participantId, plan, vecka }: Props) {
  const queryClient = useQueryClient()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const [veckans, deltagare] = await Promise.all([
          jobbsokAktivitetApi.deltagarensJobbsok(participantId, vecka),
          fetchCachedConsultantParticipants(queryClient),
        ])
        const rad = deltagare.find((r) => r.participant_id === participantId)
        if (aktiv) {
          setLage({
            status: 'klart',
            vecka: veckans,
            cvUppdaterad: (rad?.cv_updated_at as string | null | undefined) ?? null,
            harCv: Boolean(rad?.has_cv),
          })
        }
      } catch (err) {
        if (aktiv) setLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Kunde inte hämtas' })
      }
    })()
    return () => { aktiv = false }
  }, [participantId, vecka, queryClient])

  const mal = Number(plan.jobsearch_hours_per_week)

  return (
    <section aria-labelledby="jobbsok-kort-rubrik" className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-3 space-y-1.5">
      <h4 id="jobbsok-kort-rubrik" className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
        <Briefcase className="w-4 h-4" aria-hidden="true" />
        Eget jobbsökande
        <span className="font-normal text-stone-500 dark:text-stone-400">(deltagarens egen redovisning)</span>
      </h4>
      <p className="text-sm text-stone-600 dark:text-stone-300">
        {mal > 0 ? `${mal} h/vecka avsatt i planen.` : 'Ingen tid avsatt i planen.'}
      </p>
      {lage.status === 'laddar' && <p className="text-sm text-stone-500">Hämtar …</p>}
      {lage.status === 'fel' && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">Jobbsökandet kunde inte hämtas: {lage.fel}</p>}
      {lage.status === 'klart' && (
        <>
          {lage.vecka === null ? (
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Inga sparade jobb eller ansökningar går att läsa för den här deltagaren. Veckans siffror ser deltagaren själv under Min vecka.
            </p>
          ) : lage.vecka.sparadeJobb === 0 && lage.vecka.ansokningar === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-300">Inget sparat jobb och ingen ansökan registrerad den här veckan.</p>
          ) : (
            <p className="text-sm text-stone-900 dark:text-stone-100">
              {[
                lage.vecka.sparadeJobb > 0 && `${lage.vecka.sparadeJobb} ${lage.vecka.sparadeJobb === 1 ? 'jobb sparat' : 'jobb sparade'}`,
                lage.vecka.ansokningar > 0 && `${lage.vecka.ansokningar} ${lage.vecka.ansokningar === 1 ? 'ansökan skickad' : 'ansökningar skickade'}`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {lage.harCv && lage.cvUppdaterad ? `CV uppdaterat ${kortDatum(lage.cvUppdaterad)}.` : 'Inget CV skapat än.'}{' '}
            Personligt brev och intervjuträning ser bara deltagaren själv.
          </p>
        </>
      )}
    </section>
  )
}
