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
 * Talet är `antal_deltagare` ur vyn organization_caseload: alla rader i
 * consultant_participants för konsulenten. Ren logik.
 */
import type { OrgKind } from '@/services/orgApi'

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

export const KAPACITET_REGEL = `Taket i Rusta och matcha (FFU §4.5.2) är ${FFU_TAK_HELTID} deltagare per handledare på heltid och sänks i proportion vid deltid — för en handledare på 50 % är det ${FFU_TAK_HELTID / 2}. Jobin vet inte tjänstgöringsgraden, så mätaren visar taket för heltid.`
