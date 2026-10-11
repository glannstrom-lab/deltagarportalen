/**
 * forvantasRegler — vad deltagaren gör NU, härlett ur hennes riktiga data
 * (beställning Mikael 2026-10-11: "så att de enkelt kan förstå vad som
 * förväntas av dom och vad de behöver göra i portalen").
 *
 * Ren logik, inga anrop. Bara pass och möten används:
 *   - Olästa meddelanden används INTE. Deltagarens vy markerar aldrig ett
 *     meddelande som läst (consultant_messages.is_read skrivs bara av
 *     konsulentens vy, mätt 2026-10-11) — "du har ett oläst meddelande" hade
 *     stått kvar för alltid.
 *   - Ett pass hon anmält frånvaro till, eller som redan är markerat, är inte
 *     längre något hon ska göra.
 */

import type { ActivitySession } from '@/services/aktivitetApi'
import type { KonsulentMote } from './konsulentMoten'
import { motesDatum, motesStart } from './konsulentMoten'

export type PassMedAnmalan = ActivitySession & { absence_reported_at?: string | null }

export type NuSteg =
  /** Ett pass i dag som hon inte checkat in på än. */
  | { typ: 'passIdag'; pass: PassMedAnmalan }
  /** Nästa pass senare i veckan (eller senare i dag efter incheckning på ett annat). */
  | { typ: 'nastaPass'; pass: PassMedAnmalan }
  /** Nästa möte med konsulenten, när det kommer före nästa pass. */
  | { typ: 'mote'; mote: KonsulentMote }
  /** Inget mer i veckan. */
  | { typ: 'inget' }

const hhmm = (tid: string) => tid.slice(0, 5)

/** Tidpunkt att jämföra pass och möten med: `YYYY-MM-DD HH:MM`. */
const passNar = (p: Pick<ActivitySession, 'date' | 'start_time'>) => `${p.date} ${hhmm(p.start_time)}`
const moteNar = (m: KonsulentMote) => `${motesDatum(m)} ${motesStart(m)}`

export function nuSteg({
  pass,
  moten,
  idag,
  nuTid,
}: {
  pass: readonly PassMedAnmalan[]
  moten: readonly KonsulentMote[]
  /** `YYYY-MM-DD` i lokal tid. */
  idag: string
  /** `HH:MM` i lokal tid. */
  nuTid: string
}): NuSteg {
  const nu = `${idag} ${nuTid}`
  const kvar = pass
    .filter((p) => !p.attendance && !p.absence_reported_at)
    // Ett pass i dag räknas tills det är slut — hon kan checka in under passet.
    .filter((p) => p.date > idag || (p.date === idag && hhmm(p.end_time) > nuTid))
    .filter((p) => !(p.date === idag && p.self_checkin_at))
    .sort((a, b) => passNar(a).localeCompare(passNar(b)))
  const forstaPass = kvar[0] ?? null
  const forstaMote = [...moten]
    .filter((m) => moteNar(m) >= nu)
    .sort((a, b) => moteNar(a).localeCompare(moteNar(b)))[0] ?? null

  if (forstaMote && (!forstaPass || moteNar(forstaMote) < passNar(forstaPass))) {
    return { typ: 'mote', mote: forstaMote }
  }
  if (forstaPass) {
    return forstaPass.date === idag ? { typ: 'passIdag', pass: forstaPass } : { typ: 'nastaPass', pass: forstaPass }
  }
  return { typ: 'inget' }
}

/** Starttid utan sekunder, för visning. */
export function visaTid(tid: string): string {
  return hhmm(tid)
}
