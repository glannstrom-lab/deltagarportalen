/**
 * Jobin-staden (spår JS, beslut Mikael 2026-10-09).
 *
 * Portalen är en liten stad. Översikt är torget, och varje hubb är en plats
 * man går till: Söka jobb är Stationen, Karriär är Utsikten, Resurser är
 * Biblioteket och Din vardag är Hemma. Samma stad syns överallt — stor på
 * Översikt, som platsens scen på hubben, som ett band överst på verktygssidorna.
 *
 * Scenerna finns i två tider (morgon/kväll, efter klockan) och två grafikstilar
 * (mjuk/action, användarens val). Varje kombination måste finnas på disk —
 * `varld.test.ts` fäller annars.
 *
 * Spelkänslan kommer från platsen, föremålen och rådgivaren som pratar —
 * aldrig från mätning. Inga poäng, nivåer eller streaks.
 */

import type { Grafikstil } from '@/stores/settingsStore'

export type Tid = 'morgon' | 'kvall'
export type PlatsId = 'stad' | 'jobb' | 'karriar' | 'resurser' | 'vardag'
export type HubbPlatsId = Exclude<PlatsId, 'stad'>
export type Domain = 'action' | 'activity' | 'coaching' | 'info' | 'wellbeing'

export const TIDER: Tid[] = ['morgon', 'kvall']
export const STILAR: Grafikstil[] = ['mjuk', 'action']

export interface Plats {
  id: PlatsId
  domain: Domain
  /** i18n-nyckel för platsens namn ("Stationen"). */
  namnNyckel: string
  namnSv: string
  /** Hubbens rutt — dit platsskylten leder. */
  till: string
  /** Föremålet som står för platsen (public/illustrations/foremal-<x>.webp). */
  foremal: string
}

export const PLATSER: Record<PlatsId, Plats> = {
  stad: { id: 'stad', domain: 'action', namnNyckel: 'varld.plats.stad', namnSv: 'Torget', till: '/oversikt', foremal: 'karta' },
  jobb: { id: 'jobb', domain: 'activity', namnNyckel: 'varld.plats.jobb', namnSv: 'Stationen', till: '/jobb', foremal: 'kuvert' },
  karriar: { id: 'karriar', domain: 'coaching', namnNyckel: 'varld.plats.karriar', namnSv: 'Utsikten', till: '/karriar', foremal: 'kompass' },
  resurser: { id: 'resurser', domain: 'info', namnNyckel: 'varld.plats.resurser', namnSv: 'Biblioteket', till: '/resurser', foremal: 'bok' },
  vardag: { id: 'vardag', domain: 'wellbeing', namnNyckel: 'varld.plats.vardag', namnSv: 'Hemma', till: '/min-vardag', foremal: 'kopp' },
}

export const HUBBPLATSER: HubbPlatsId[] = ['jobb', 'karriar', 'resurser', 'vardag']

const DOMAN_TILL_PLATS: Record<string, PlatsId> = {
  action: 'stad',
  activity: 'jobb',
  outbound: 'jobb',
  coaching: 'karriar',
  info: 'resurser',
  wellbeing: 'vardag',
  reflection: 'vardag',
}

export function platsForDomain(domain: string | undefined): Plats {
  return PLATSER[DOMAN_TILL_PLATS[domain ?? 'action'] ?? 'stad']
}

export function foremalSrc(namn: string): string {
  return `/illustrations/foremal-${namn}.webp`
}

/** Scenen för en plats. Torget = hela staden. */
export function scenSrc(plats: PlatsId, tid: Tid, stil: Grafikstil): string {
  return plats === 'stad'
    ? `/illustrations/stad-${tid}-${stil}.webp`
    : `/illustrations/plats-${plats}-${tid}-${stil}.webp`
}

/**
 * Var platsmarkörerna står i stadsbilden (procent av bildens bredd/höjd,
 * markörens spets). Mätt per bild — byts en bild måste raden mätas om.
 */
export const MARKORER: Record<`${Tid}-${Grafikstil}`, Record<HubbPlatsId, [number, number]>> = {
  'morgon-mjuk': { jobb: [30, 37], karriar: [66, 23], resurser: [86, 21], vardag: [85, 54] },
  'kvall-mjuk': { jobb: [30, 41], karriar: [68, 24], resurser: [80, 32], vardag: [88, 55] },
  'morgon-action': { jobb: [29, 31], karriar: [63, 22], resurser: [86, 20], vardag: [88, 44] },
  'kvall-action': { jobb: [40, 29], karriar: [61, 16], resurser: [82, 21], vardag: [88, 47] },
}

/**
 * Var platsens huvudmotiv står i dess egen scen (object-position), så att ett
 * smalt band beskär rätt. Mätt per bild 2026-10-09.
 */
const SCENFOKUS: Record<string, string> = {
  stad: '55% 40%',
  jobb: '75% 35%',
  karriar: '82% 25%',
  resurser: '62% 30%',
  'vardag-morgon-mjuk': '80% 35%',
  'vardag-kvall-mjuk': '76% 50%',
  'vardag-morgon-action': '88% 20%',
  'vardag-kvall-action': '86% 20%',
}

export function scenFokus(plats: PlatsId, tid: Tid, stil: Grafikstil): string {
  return SCENFOKUS[`${plats}-${tid}-${stil}`] ?? SCENFOKUS[plats]
}

/** Kväll från 17 till 6 — svenska vinterkvällar är mörka tidigt. */
export function tidFor(d: Date): Tid {
  const h = d.getHours()
  return h >= 17 || h < 6 ? 'kvall' : 'morgon'
}
