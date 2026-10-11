/**
 * meddelandeLast — "Läst 14:32" under konsulentens egna meddelanden (beslut 2026-10-11).
 *
 * Deltagaren markerar meddelanden lästa när de syns på Min konsulent. Lästiden
 * (`consultant_messages.read_at`) sätts av servern, av triggern i
 * `20261011b_meddelanden_last.sql`. Före den migrationen finns ingen kolumn: då
 * står bara "Läst" — det är sant (is_read), och tiden påstås inte.
 *
 * Ett oläst meddelande får ingen rad alls. "Inte läst" vore ett påstående om
 * deltagaren som kan vara fel (hon kan ha läst notisen, eller mejlet) — och det
 * är inte konsulentens uppgift att hålla koll på det.
 *
 * Konsulentvyn är svensk med literaler (DESIGN.md §2). Ren logik.
 */

export interface Lasbart {
  is_read?: boolean | null
  /** Saknas helt före migrationen (select('*') ger bara de kolumner som finns). */
  read_at?: string | null
}

const TZ = 'Europe/Stockholm'

function dagnyckel(d: Date): string {
  return d.toLocaleDateString('sv-SE', { timeZone: TZ })
}

export function lastText(m: Lasbart, nu: Date = new Date()): string | null {
  if (!m.is_read) return null
  if (!m.read_at) return 'Läst'
  const d = new Date(m.read_at)
  if (Number.isNaN(d.getTime())) return 'Läst'
  const klocka = d.toLocaleTimeString('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
  if (dagnyckel(d) === dagnyckel(nu)) return `Läst ${klocka}`
  const dag = d.toLocaleDateString('sv-SE', { timeZone: TZ, day: 'numeric', month: 'short' }).replace('.', '')
  return `Läst ${dag} ${klocka}`
}
