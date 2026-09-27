/**
 * PlaceringDeltagareKort — deltagarens placeringar på deltagarsidan (RR6,
 * rollspelet 2026-09-27).
 *
 * Amina var anställd sedan 9/7 men hennes sida sa "Aktiv" och "CV saknas";
 * placeringar fanns bara som en lista längst ned i Rapporter. Här visas varje
 * placering med utfall, omfattning och uppföljningarna — och det är härifrån
 * 3- och 6-månadersuppföljningen registreras (RR5).
 *
 * Tre lägen: laddar / fel / klart. Ingen placering = ingen ruta (tom yta
 * fyller ingen funktion på översikten; "Registrera placering" finns i rubriken).
 */
import { Briefcase } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Placement } from '@/services/consultantService'
import {
  PLACERINGSTYP_ETIKETT,
  UNDERLAG_ETIKETT,
  UTFALL_ETIKETT,
  omfattningText,
  placeringLage,
  type PlaceringTyp,
  type UppfoljningUnderlag,
  type UppfoljningUtfall,
} from '@/services/placeringUtfall'
import { followupStatus, kanRegistreraUppfoljning, uppfoljningspunkt, type Uppfoljning } from '@/pages/consultant/placeringsmatt'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { langtDatum } from './aktivitetEtiketter'

export type PlaceringarLage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; placeringar: Placement[] }

const LAGE_TEXT = { kommande: 'Kommande', pagaende: 'Pågående', avslutad: 'Avslutad' } as const

function UppfoljningRad({ p, vilken, idag, onRegistrera }: { p: Placement; vilken: Uppfoljning; idag: string; onRegistrera: (p: Placement, v: Uppfoljning) => void }) {
  const gjord = vilken === '3m' ? p.followup_3m : p.followup_6m
  const rubrik = vilken === '3m' ? '3 månader' : '6 månader'
  const punkt = uppfoljningspunkt(p.start_date ?? null, vilken)
  const datum = vilken === '3m' ? p.followup_3m_date : p.followup_6m_date
  const utfall = (vilken === '3m' ? p.followup_3m_outcome : p.followup_6m_outcome) as UppfoljningUtfall | null | undefined
  const underlag = (vilken === '3m' ? p.followup_3m_evidence : p.followup_6m_evidence) as UppfoljningUnderlag | null | undefined
  const besked = kanRegistreraUppfoljning({ startDate: p.start_date ?? null, followup3m: p.followup_3m, followup6m: p.followup_6m }, vilken, idag)

  let text: string
  if (gjord) {
    text = datum
      ? `Gjord ${langtDatum(datum)}${utfall ? ` — ${UTFALL_ETIKETT[utfall]}` : ''}${underlag ? ` · underlag: ${UNDERLAG_ETIKETT[underlag].toLowerCase()}` : ''}`
      : 'Markerad som gjord — datum, utfall och underlag står i journalen'
  } else if (!punkt) {
    text = 'Startdatum saknas — punkten kan inte beräknas'
  } else if (vilken === '6m' && !p.followup_3m) {
    text = `Punkt ${langtDatum(punkt)} · görs efter 3-månadersuppföljningen`
  } else {
    text = `${followupStatus({ startDate: p.start_date ?? null, followup3m: p.followup_3m, followup6m: p.followup_6m }).text} · punkt ${langtDatum(punkt)}`
  }

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-t border-stone-100 dark:border-stone-800 first:border-t-0">
      <p className="text-sm text-stone-700 dark:text-stone-200">
        <span className="font-medium">{rubrik}:</span> {text}
      </p>
      {!gjord && besked.tillaten && (
        <Button size="sm" variant="outline" onClick={() => onRegistrera(p, vilken)}>
          Registrera {vilken === '3m' ? '3-mån' : '6-mån'}
        </Button>
      )}
    </li>
  )
}

export function PlaceringDeltagareKort({ lage, onForsokIgen, onRegistrera }: {
  lage: PlaceringarLage
  onForsokIgen: () => void
  onRegistrera: (p: Placement, vilken: Uppfoljning) => void
}) {
  const idag = formatLocalDate(new Date())
  if (lage.status === 'laddar') return null
  if (lage.status === 'fel') {
    return (
      <Card className="p-5 lg:col-span-2">
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          Placeringarna kunde inte hämtas. <button type="button" className="underline" onClick={onForsokIgen}>Försök igen</button>
        </p>
      </Card>
    )
  }
  if (lage.placeringar.length === 0) return null

  return (
    <Card className="p-5 lg:col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-5 h-5 text-stone-500" aria-hidden="true" />
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">Placering och uppföljning</h3>
      </div>
      <ul className="space-y-4">
        {lage.placeringar.map((p) => {
          const pl = placeringLage(p, idag)
          const omf = omfattningText(p)
          return (
            <li key={p.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {p.employer_name}{p.job_title ? ` · ${p.job_title}` : ''}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  {LAGE_TEXT[pl]}
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
                {PLACERINGSTYP_ETIKETT[(p.placement_type ?? 'permanent') as PlaceringTyp] ?? p.placement_type}
                {p.start_date ? ` · start ${langtDatum(p.start_date)}` : ' · startdatum saknas'}
                {p.end_date ? ` · slut ${langtDatum(p.end_date)}` : ''}
                {omf ? ` · ${omf}` : ''}
                {p.outcome_level ? ` · nivå ${p.outcome_level}` : ''}
              </p>
              {p.notes && <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 whitespace-pre-wrap">{p.notes}</p>}
              <ul className="mt-3" aria-label={`Uppföljning av placeringen hos ${p.employer_name}`}>
                <UppfoljningRad p={p} vilken="3m" idag={idag} onRegistrera={onRegistrera} />
                <UppfoljningRad p={p} vilken="6m" idag={idag} onRegistrera={onRegistrera} />
              </ul>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
