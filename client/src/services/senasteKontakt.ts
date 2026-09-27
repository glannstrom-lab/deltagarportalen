/**
 * senasteKontakt — RK14 (rollspelet 2026-09-27).
 *
 * "Senaste kontakt: 3" var ett tal utan enhet som inte rörde sig: det räknades
 * bara ur `consultant_participants.last_contact_at`, som enbart massåtgärden
 * "Logga kontakt" skriver. En journalanteckning, ett hållet möte eller ett
 * meddelande flyttade det inte.
 *
 * Senaste kontakt = det senaste av
 *   · en uttryckligen loggad kontakt (`last_contact_at`)
 *   · en journalanteckning (`last_note_date` i vyn / nyss sparad)
 *   · ett GENOMFÖRT möte vars tid passerat (samma regel som möteskadensen —
 *     ett inbokat möte är en avsikt, inte en kontakt)
 *   · ett meddelande mellan konsulenten och deltagaren, åt något håll.
 *
 * Ren logik, ingen databas. Inget underlag → `null`, som visas som "—" med en
 * rad om varför (CLAUDE.md), aldrig 0.
 */

export type KontaktKalla = 'loggad' | 'journal' | 'mote' | 'meddelande'

export interface KontaktUnderlag {
  last_contact_at?: string | null
  last_note_date?: string | null
  moten?: ReadonlyArray<{ scheduled_at: string; status: string }>
  senasteMeddelande?: string | null
}

export interface SenasteKontakt {
  at: string
  kalla: KontaktKalla
}

export const KONTAKT_KALLA_TEXT: Record<KontaktKalla, string> = {
  loggad: 'loggad kontakt',
  journal: 'journalanteckning',
  mote: 'genomfört möte',
  meddelande: 'meddelande',
}

export function senasteKontakt(u: KontaktUnderlag, nu: Date = new Date()): SenasteKontakt | null {
  const kandidater: SenasteKontakt[] = []
  if (u.last_contact_at) kandidater.push({ at: u.last_contact_at, kalla: 'loggad' })
  if (u.last_note_date) kandidater.push({ at: u.last_note_date, kalla: 'journal' })
  if (u.senasteMeddelande) kandidater.push({ at: u.senasteMeddelande, kalla: 'meddelande' })
  for (const m of u.moten ?? []) {
    if (m.status === 'completed' && new Date(m.scheduled_at).getTime() <= nu.getTime()) {
      kandidater.push({ at: m.scheduled_at, kalla: 'mote' })
    }
  }
  let basta: SenasteKontakt | null = null
  for (const k of kandidater) {
    const t = new Date(k.at).getTime()
    if (Number.isNaN(t)) continue
    if (basta === null || t > new Date(basta.at).getTime()) basta = k
  }
  return basta
}

/** Hela kalenderdagar i lokal tid mellan `iso` och `nu` (aldrig negativt). */
export function kalenderdagarSedan(iso: string, nu: Date = new Date()): number {
  const a = new Date(nu); a.setHours(0, 0, 0, 0)
  const b = new Date(iso); b.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((a.getTime() - b.getTime()) / 86_400_000))
}

/** "i dag" / "i går" / "3 dagar sedan" — ett tal har alltid en enhet. */
export function kontaktAlderText(iso: string, nu: Date = new Date()): string {
  const d = kalenderdagarSedan(iso, nu)
  if (d === 0) return 'i dag'
  if (d === 1) return 'i går'
  return `${d} dagar sedan`
}
