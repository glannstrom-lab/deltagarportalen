/**
 * franvaroFakta — frånvaro som FAKTA hos en Rusta och matcha-leverantör
 * (ROADMAP KSL21, beslut Mikael 2026-10-11).
 *
 * IAF 2024:12 fann att leverantörer som själva bedömer om ett skäl för
 * frånvaro är godtagbart "i viss utsträckning ägnar sig åt otillåten
 * myndighetsutövning". Det är Arbetsförmedlingen som avgör. Leverantören
 * registrerar därför bara vad som hände:
 *
 *   Närvarande / Frånvarande / Sjuk  + orsak (anteckningen)
 *   + om frånvaron var anmäld i förväg
 *
 * Kommunen behåller giltig/ogiltig — där är markeringen socialnämndens
 * beslutsunderlag, och kommunens flöde ändras inte här.
 *
 * Ingen migration. Databasvärdena är desamma; för leverantören betyder de:
 *
 *   absent_valid    Frånvarande, anmäld i förväg
 *   absent_invalid  Frånvarande, inte anmäld
 *
 * "Anmäld" är en faktaregel, inte en bedömning: deltagaren anmälde frånvaron
 * i portalen (`absence_reason` satt) — eller hörde av sig på annat sätt, och
 * då ändrar konsulenten det (`AnmaldIForvagVal`). Ordet "giltig" eller
 * "ogiltig" ska aldrig synas för en leverantör; grinden är
 * `franvaroFakta.test.ts`.
 *
 * Konsulentvyn översätts inte (DESIGN.md §2) — svenska literaler här.
 */
import type { Attendance } from '@/services/aktivitetSchema'
import { NARVARO_STANDARDVAL, type NarvaroAlternativ, type Status } from '@/components/ui/kvarterStatus'
import type { Regelverk } from './orgTypVisning'

export type { Regelverk }

/** Leverantörens ord för varje närvarovärde. Fakta, ingen bedömning. */
export const NARVARO_ETIKETT_LEVERANTOR: Record<Attendance, string> = {
  present: 'Närvarande',
  absent_valid: 'Frånvarande, anmäld i förväg',
  absent_invalid: 'Frånvarande, inte anmäld',
  sick_certified: 'Sjuk',
  external: 'Extern aktivitet',
}

/** Statusordet i chip och veckoremsa, för de två frånvarostatusarna. */
export const STATUS_ORD_LEVERANTOR: Partial<Record<Status, string>> = {
  giltig: NARVARO_ETIKETT_LEVERANTOR.absent_valid,
  ogiltig: NARVARO_ETIKETT_LEVERANTOR.absent_invalid,
}

export function arLeverantor(r: Regelverk | null | undefined): boolean {
  return r === 'leverantor'
}

export function arFranvaro(a: Attendance | null | undefined): a is 'absent_valid' | 'absent_invalid' {
  return a === 'absent_valid' || a === 'absent_invalid'
}

/**
 * Närvarovärdets ord för regelverket. `kommunOrd` är den vy som anropar —
 * kommunens etiketter skiljer sig något mellan vyerna och lämnas som de var.
 */
export function narvaroOrd(a: Attendance, r: Regelverk | null | undefined, kommunOrd: Record<Attendance, string>): string {
  return arLeverantor(r) ? NARVARO_ETIKETT_LEVERANTOR[a] : kommunOrd[a]
}

/** Ordet i ett statuschip: leverantörens fakta, annars `undefined` (= chippets eget ord). */
export function statusOrd(status: Status | null | undefined, r: Regelverk | null | undefined): string | undefined {
  if (!status || !arLeverantor(r)) return undefined
  return STATUS_ORD_LEVERANTOR[status]
}

/** Har deltagaren anmält frånvaron i förväg i portalen? */
export function anmaldIPortalen(p: { absence_reason?: string | null; absence_reported_at?: string | null }): boolean {
  return !!p.absence_reason || !!p.absence_reported_at
}

/** "Frånvarande" lagras som giltig när den var anmäld i förväg, annars som ogiltig. */
export function franvaroVarde(anmald: boolean): 'absent_valid' | 'absent_invalid' {
  return anmald ? 'absent_valid' : 'absent_invalid'
}

/**
 * Närvarovalen för ett pass.
 *   - Kommun (och okänt regelverk): Här / Giltig / Ogiltig / Sjuk — som förut.
 *   - Leverantör: Närvarande / Frånvarande / Sjuk. "Frånvarande" har det
 *     värde som ska sparas: passets nuvarande frånvaro om den finns, annars
 *     anmäld (giltig) om deltagaren anmält i förväg och inte anmäld (ogiltig)
 *     annars. Färgen följer värdet — den inte anmälda är den som ska till
 *     Arbetsförmedlingen och sticker ut.
 */
export function narvaroValFor(
  r: Regelverk | null | undefined,
  pass: { attendance?: Attendance | null; absence_reason?: string | null; absence_reported_at?: string | null },
): readonly NarvaroAlternativ[] {
  if (!arLeverantor(r)) return NARVARO_STANDARDVAL
  const franvaro = arFranvaro(pass.attendance) ? pass.attendance : franvaroVarde(anmaldIPortalen(pass))
  return [
    { varde: 'present', etikett: 'Närvarande', status: 'narvarande' },
    { varde: franvaro, etikett: 'Frånvarande', status: franvaro === 'absent_valid' ? 'giltig' : 'ogiltig' },
    { varde: 'sick_certified', etikett: 'Sjuk', status: 'sjuk' },
  ]
}

/** Hjälptexten under kryssrutan "Anmäld i förväg". */
export const ANMALD_HJALP = 'Kryssa i om deltagaren hörde av sig före passet, i portalen eller på annat sätt (t.ex. ringde). Det är fakta — Arbetsförmedlingen avgör om skälet godtas.'
