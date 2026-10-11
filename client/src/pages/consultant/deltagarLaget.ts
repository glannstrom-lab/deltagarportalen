/**
 * deltagarLaget — "läget" i en mening, överst på deltagarsidan (omtaget
 * "Kvarter", steg 5, 2026-10-11).
 *
 * Meningen säger bara det datan bär (förslagets ärlighetsregel):
 *   - Under laddning: `null` — ingenting står där, hellre än en mening som
 *     påstår något om deltagaren innan svaret är inne.
 *   - Vid läsfel: felet i ord, aldrig "allt är klart".
 *   - Kundtypen styr vad som räknas: kommunen mäter aktivitetsplanen och
 *     kontakten, Rusta och matcha mäter mötena mot avtalet.
 *   - En deltagare som har jobb eller studier jagas inte för möten eller
 *     CV (fynd A4 i R&M-slipningen) — då är placeringen läget.
 */
import type { Regelverk } from '@/components/consultant/orgTypVisning'
import type { Kadens } from '@/services/moteskadens'

const MANAD = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

export type LagetPlan =
  | { status: 'laddar' }
  | { status: 'fel' }
  | {
      status: 'klart'
      plan: { start_date: string; weekly_hours_target: number | string; status: 'active' | 'paused' | 'ended' } | null
      /** Pass med ogiltig frånvaro i innevarande vecka. */
      ogiltigaIVeckan: number
    }

export type LagetMoten = { status: 'laddar' } | { status: 'fel' } | { status: 'klart'; kadens: Kadens }

export interface LagetUnderlag {
  /** `null` medan medlemskapen laddar. */
  regelverk: Regelverk | null
  plan: LagetPlan
  moten: LagetMoten
  /** `undefined` medan placeringarna laddar, `null` utan aktuell placering. */
  placeringsrad: string | null | undefined
  /** Senaste kontakt (RK14), `null` = ingen registrerad. */
  kontakt: { at: string } | null
  idag: Date
}

function lokalMidnatt(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function dagarSedan(iso: string, idag: Date): number {
  return Math.round((lokalMidnatt(idag) - lokalMidnatt(new Date(iso))) / 86_400_000)
}

/** 0 → "i dag", 1 → "i går", n → "för n dagar sedan". */
export function alderIOrd(dagar: number): string {
  if (dagar <= 0) return 'i dag'
  if (dagar === 1) return 'i går'
  return `för ${dagar} dagar sedan`
}

/** `2026-09-01` → "1 september" (året bara när det inte är i år). */
function sedanDatum(ymd: string, idag: Date): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return y === idag.getFullYear() ? `${d} ${MANAD[m - 1]}` : `${d} ${MANAD[m - 1]} ${y}`
}

function timmar(v: number | string): string {
  return `${String(Number(v) || 0).replace('.', ',')} h`
}

export function deltagarLaget(u: LagetUnderlag): string | null {
  if (u.regelverk === null || u.plan.status === 'laddar' || u.placeringsrad === undefined) return null
  if (u.regelverk === 'leverantor' && u.moten.status === 'laddar') return null

  const kontakt = u.kontakt
    ? `senaste kontakt ${alderIOrd(dagarSedan(u.kontakt.at, u.idag))}`
    : 'ingen kontakt registrerad'

  if (u.placeringsrad) return `${u.placeringsrad} · ${kontakt}`

  const delar: string[] = []
  const plan = u.plan.status === 'klart' ? u.plan.plan : null

  if (u.regelverk === 'leverantor') {
    delar.push(
      u.plan.status === 'fel'
        ? 'Rusta och matcha · aktivitetsplanen kunde inte hämtas'
        : plan
          ? `Rusta och matcha sedan ${sedanDatum(plan.start_date, u.idag)}`
          : 'Rusta och matcha · ingen aktivitetsplan än',
    )
    if (u.moten.status === 'fel') {
      delar.push('mötena kunde inte hämtas')
    } else if (u.moten.status === 'klart') {
      const k = u.moten.kadens
      if (k.dagarSedanMote === null) {
        delar.push('inget genomfört möte än')
      } else {
        const fysiskt = k.dagarSedanFysiskt === null ? 'inget fysiskt än' : `fysiskt ${alderIOrd(k.dagarSedanFysiskt)}`
        delar.push(`senaste möte ${alderIOrd(k.dagarSedanMote)}, ${fysiskt}`)
      }
    }
  } else {
    delar.push(
      u.plan.status === 'fel'
        ? 'Aktivitetsplanen kunde inte hämtas'
        : plan
          ? `Aktivitetsplan ${timmar(plan.weekly_hours_target)}/vecka sedan ${sedanDatum(plan.start_date, u.idag)}${plan.status === 'paused' ? ', pausad' : ''}`
          : 'Ingen aktivitetsplan än',
    )
    if (u.plan.status === 'klart' && u.plan.ogiltigaIVeckan > 0) {
      delar.push(u.plan.ogiltigaIVeckan === 1 ? 'ogiltig frånvaro den här veckan' : `${u.plan.ogiltigaIVeckan} pass ogiltig frånvaro den här veckan`)
    }
    delar.push(kontakt)
  }
  return delar.join(' · ')
}
