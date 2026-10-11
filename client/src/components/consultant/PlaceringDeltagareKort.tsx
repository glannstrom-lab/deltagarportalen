/**
 * PlaceringDeltagareKort — deltagarens placeringar på deltagarsidan (RR6,
 * rollspelet 2026-09-27).
 *
 * Amina var anställd sedan 9/7 men hennes sida sa "Aktiv" och "CV saknas";
 * placeringar fanns bara som en lista längst ned i Rapporter. Här visas varje
 * placering med utfall, omfattning och uppföljningarna — och det är härifrån
 * 3- och 6-månadersuppföljningen registreras (RR5).
 *
 * RR25 (resultatklockan): per uppföljningspunkt också status för
 * resultatersättningen — väntar → verifierad → fakturerad
 * (PENDING_20260927d_resultat_och_msfa, services/resultatklocka.ts). Belopp
 * visas inte: portalen har inte avtalets prislista.
 *
 * Tre lägen: laddar / fel / klart. Ingen placering = ingen ruta (tom yta
 * fyller ingen funktion på översikten; "Registrera placering" finns i rubriken).
 */
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import type { Status } from '@/components/ui/kvarterStatus'
import { SpaltYta } from './SpaltYta'
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
import { BETALSTATUS_ETIKETT, RESULTAT_MSFA_FINNS, betalstatus, betalstatusDatum, nastaBetalsteg, resultatApi, type BetalPlacering } from '@/services/resultatklocka'

export type PlaceringarLage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; placeringar: Placement[] }

const LAGE_TEXT = { kommande: 'Kommande', pagaende: 'Pågående', avslutad: 'Avslutad' } as const
const LAGE_STATUS: Record<keyof typeof LAGE_TEXT, Status> = { kommande: 'planerat', pagaende: 'narvarande', avslutad: 'planerat' }

/** RR25: ersättningens status för en gjord uppföljning, med nästa steg. */
function Betalrad({ p, vilken, onAndrad }: { p: Placement; vilken: Uppfoljning; onAndrad: () => void }) {
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const bp = p as unknown as BetalPlacering
  const status = betalstatus(bp, vilken)
  if (status === null) return null
  const datum = betalstatusDatum(bp, vilken)
  const nasta = nastaBetalsteg(bp, vilken)
  const ta = async () => {
    if (nasta.steg === null) return
    setSparar(true)
    setFel(null)
    try { await resultatApi.sattBetalstatus(p.id, vilken, nasta.steg); onAndrad() } catch (err) { setFel(err instanceof Error ? err.message : 'Statusen kunde inte sparas') } finally { setSparar(false) }
  }
  return (
    <span className="block text-xs mt-1" data-testid={`betalstatus-${vilken}`}>
      <span className="text-[var(--j-blak-2)]">Ersättning: {BETALSTATUS_ETIKETT[status]}{datum && status !== 'vantar' ? ` ${langtDatum(new Date(datum).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }))}` : ''}</span>
      {nasta.steg !== null && (
        <button type="button" className="ml-2 font-semibold underline underline-offset-2 text-[var(--j-gran-text)] disabled:opacity-60" disabled={sparar} onClick={() => void ta()}>{nasta.knapp}</button>
      )}
      {nasta.steg === null && nasta.skal && <span className="block text-[var(--j-blak-3)]">{nasta.skal}</span>}
      {fel && <span role="alert" className="block text-[var(--s-ogiltig-text)]">{fel}</span>}
    </span>
  )
}

function UppfoljningRad({ p, vilken, idag, onRegistrera, onBetalstatusAndrad }: { p: Placement; vilken: Uppfoljning; idag: string; onRegistrera: (p: Placement, v: Uppfoljning) => void; onBetalstatusAndrad?: () => void }) {
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
    <li className="grid gap-2 py-2.5 border-t border-[var(--j-linje)] first:border-t-0">
      <p className="m-0 text-sm text-[var(--j-blak-2)]">
        <span className="font-semibold text-[var(--j-blak)]">{rubrik}:</span> {text}
        {RESULTAT_MSFA_FINNS && onBetalstatusAndrad && <Betalrad p={p} vilken={vilken} onAndrad={onBetalstatusAndrad} />}
      </p>
      {!gjord && besked.tillaten && (
        <div>
          <Button ton="kvarter" variant="secondary" size="sm" onClick={() => onRegistrera(p, vilken)}>
            Registrera {vilken === '3m' ? '3-mån' : '6-mån'}
          </Button>
        </div>
      )}
    </li>
  )
}

export function PlaceringDeltagareKort({ lage, onForsokIgen, onRegistrera, onBetalstatusAndrad }: {
  lage: PlaceringarLage
  onForsokIgen: () => void
  onRegistrera: (p: Placement, vilken: Uppfoljning) => void
  /** RR25: statusen ändrad — ladda om placeringarna. */
  onBetalstatusAndrad?: () => void
}) {
  const idag = formatLocalDate(new Date())
  if (lage.status === 'laddar') return null
  if (lage.status === 'fel') {
    return (
      <SpaltYta ikon="jobb" rubrik="Placering och uppföljning">
        <p role="alert" className="m-0 text-sm text-[var(--s-ogiltig-text)]">
          Placeringarna kunde inte hämtas. <button type="button" className="font-semibold underline underline-offset-2" onClick={onForsokIgen}>Försök igen</button>
        </p>
      </SpaltYta>
    )
  }
  if (lage.placeringar.length === 0) return null

  return (
    <SpaltYta ikon="jobb" rubrik="Placering och uppföljning" testId="placering-kort">
      <ul className="m-0 p-0 list-none grid gap-4">
        {lage.placeringar.map((p) => {
          const pl = placeringLage(p, idag)
          const omf = omfattningText(p)
          return (
            <li key={p.id} className="grid gap-1 border-t border-[var(--j-linje)] pt-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="m-0 font-semibold text-[var(--j-blak)]">
                  {p.employer_name}{p.job_title ? ` · ${p.job_title}` : ''}
                </p>
                <StatusChip status={LAGE_STATUS[pl]}>{LAGE_TEXT[pl]}</StatusChip>
              </div>
              <p className="m-0 text-sm text-[var(--j-blak-2)]">
                {PLACERINGSTYP_ETIKETT[(p.placement_type ?? 'permanent') as PlaceringTyp] ?? p.placement_type}
                {p.start_date ? ` · start ${langtDatum(p.start_date)}` : ' · startdatum saknas'}
                {p.end_date ? ` · slut ${langtDatum(p.end_date)}` : ''}
                {omf ? ` · ${omf}` : ''}
                {p.outcome_level ? ` · nivå ${p.outcome_level}` : ''}
              </p>
              {p.notes && <p className="m-0 text-xs text-[var(--j-blak-3)] whitespace-pre-wrap">{p.notes}</p>}
              <ul className="m-0 mt-2 p-0 list-none" aria-label={`Uppföljning av placeringen hos ${p.employer_name}`}>
                <UppfoljningRad p={p} vilken="3m" idag={idag} onRegistrera={onRegistrera} onBetalstatusAndrad={onBetalstatusAndrad} />
                <UppfoljningRad p={p} vilken="6m" idag={idag} onRegistrera={onRegistrera} onBetalstatusAndrad={onBetalstatusAndrad} />
              </ul>
            </li>
          )
        })}
      </ul>
    </SpaltYta>
  )
}
