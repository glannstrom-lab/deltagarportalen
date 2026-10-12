/**
 * caseloadKapacitet — RR29 (rollspelet 2026-09-27): deltagare per handledare
 * mot taket i Rusta och matcha.
 *
 * FFU §4.5.2: högst 50 deltagare per handledare på heltid, proportionellt
 * lägre vid deltid. Jobin vet inte handledarens tjänstgöringsgrad — därför
 * visas taket för heltid och regeln för deltid står i klartext, i stället för
 * att en gissad grad räknas in. Kommunen har inget motsvarande tak i lag; där
 * visas bara antalet (det finns redan i tabellen).
 *
 * Talet är `antal_deltagare − antal_uppfoljning` ur vyn organization_caseload
 * (deltagarStatus.antalMotTaket): deltagare i läget Uppföljning efter en placering
 * räknas inte (beslut Mikael 2026-10-11). Ren logik.
 */
import type { OrgKind } from '@/services/orgApi'
import { antalMotTaket } from './deltagarStatus'

export const FFU_TAK_HELTID = 50
/** Från 90 % av taket markeras mätaren som nära. */
export const NARA_TAKET_ANDEL = 0.9

export type KapacitetsLage = 'ok' | 'nara' | 'over'

export type Kapacitet =
  | { visas: false }
  | { visas: true; antal: number; tak: number; andel: number; lage: KapacitetsLage; text: string }

export function kapacitet(antal: number, kind: OrgKind | null | undefined): Kapacitet {
  if (kind !== 'leverantor') return { visas: false }
  const andel = antal / FFU_TAK_HELTID
  const lage: KapacitetsLage = antal > FFU_TAK_HELTID ? 'over' : andel >= NARA_TAKET_ANDEL ? 'nara' : 'ok'
  const text = antal > FFU_TAK_HELTID
    ? `${antal} av ${FFU_TAK_HELTID} — ${antal - FFU_TAK_HELTID} över taket för heltid`
    : `${antal} av ${FFU_TAK_HELTID} (heltid)`
  return { visas: true, antal, tak: FFU_TAK_HELTID, andel, lage, text }
}

export const KAPACITET_REGEL = `Taket i Rusta och matcha (FFU §4.5.2) är ${FFU_TAK_HELTID} deltagare per handledare på heltid och sänks i proportion vid deltid — för en handledare på 50 % är det ${FFU_TAK_HELTID / 2}. Jobin vet inte tjänstgöringsgraden, så mätaren visar taket för heltid. Deltagare i uppföljning efter en placering räknas inte.`

// ---------------------------------------------------------------------------
// CH8 — chefsvyn på Översikt delar beräkningen med Inställningar: samma
// antalMotTaket → kapacitet(), så siffran är densamma på båda ställena.
// ---------------------------------------------------------------------------

export interface ChefRad {
  consultant_id: string
  first_name: string | null
  last_name: string | null
  antal_deltagare: number
  antal_uppfoljning?: number | null
  ogiltig_franvaro_30d: number
}

export type UppmarksamhetsSlag = 'over' | 'nara' | 'franvaro'

export interface Uppmarksamhet {
  slag: UppmarksamhetsSlag
  text: string
}

export interface ChefKonsulent {
  id: string
  namn: string
  /** Räknas mot taket (utan dem i uppföljning). */
  antal: number
  kapacitet: Kapacitet
  uppmarksamhet: Uppmarksamhet[]
}

/**
 * Per konsulent: antal mot tak och det som kräver chefens uppmärksamhet.
 * Mest brådskande först (över taket, nära taket, frånvaro), därefter namn.
 * Taket finns bara hos leverantör; kommunen får antalet och frånvaron.
 */
export function chefOversikt(rader: readonly ChefRad[], kind: OrgKind | null | undefined): ChefKonsulent[] {
  const franvaroOrd = kind === 'leverantor' ? 'frånvaro utan anmälan' : 'ogiltig frånvaro'
  const ut = rader.map((r): ChefKonsulent => {
    const antal = antalMotTaket(r)
    const k = kapacitet(antal, kind)
    const u: Uppmarksamhet[] = []
    if (k.visas && k.lage === 'over') u.push({ slag: 'over', text: `${antal - k.tak} över taket (${antal} av ${k.tak})` })
    else if (k.visas && k.lage === 'nara') u.push({ slag: 'nara', text: `nära taket (${antal} av ${k.tak})` })
    if (r.ogiltig_franvaro_30d > 0) u.push({ slag: 'franvaro', text: `${r.ogiltig_franvaro_30d} pass med ${franvaroOrd} senaste 30 dagarna` })
    const namn = [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Namn saknas'
    return { id: r.consultant_id, namn, antal, kapacitet: k, uppmarksamhet: u }
  })
  const vikt = (c: ChefKonsulent) => (
    c.uppmarksamhet.some((x) => x.slag === 'over') ? 0
      : c.uppmarksamhet.some((x) => x.slag === 'nara') ? 1
        : c.uppmarksamhet.length ? 2 : 3
  )
  return ut.sort((a, b) => vikt(a) - vikt(b) || a.namn.localeCompare(b.namn, 'sv'))
}
