/**
 * KF2 (2026-10-18): resultatersättningen i Rusta och matcha 2, räknad ur
 * förfrågningsunderlaget — inte ur minnet.
 *
 * Källa: FFU Af-2025/0017 5396, version 3 (2025-03-27), §5.1 och §5.1.2.1–5.1.2.3
 * (arbetsformedlingen.se/download/18.34d34fa5193d7fc2e88286/…/ffu-rusta-och-matcha.pdf).
 * Beloppen exkl. moms. Ändras avtalet ska talen här ändras — och KÄLLA med dem.
 *
 * Det här räknar ut vad som KAN begäras, inte vad AF betalar. AF verifierar
 * resultatet i sina egna system (eller mot intyg) och skickar en inköpsorder;
 * Jobin skickar ingenting till Arbetsförmedlingen.
 *
 * Regler, förenklade till det placeringen faktiskt bär:
 *  - Arbete i önskad omfattning/heltid → 100 % av maxbeloppet: RE1 50 % (3 mån), RE2 50 % (6 mån).
 *  - Arbete minst 50 % av arbetsutbudet → 50 %: RE1 25 %, RE2 25 %.
 *  - Under 50 % → ingen ersättning, OM INTE deltagaren arbetar i önskad omfattning —
 *    det vet portalen inte, därför ett "kontrollera" i stället för en nolla.
 *  - Studier → 100 %: 50 % efter 3 mån, 50 % efter 6 mån.
 *  - Inte längre i arbete/studier vid punkten → inget för den punkten.
 *  - RE2 får begäras först när tjänsten (placeringen hos leverantören) är avslutad.
 */
import type { Niva, PlaceringTyp, UppfoljningUtfall } from './placeringUtfall'
import type { Uppfoljning } from '@/pages/consultant/placeringsmatt'

export const ROM2_KALLA = 'FFU Rusta och matcha 2 (Af-2025/0017, v3 2025-03-27) §5.1'

export const RESULTAT_MAX: Record<Niva, number> = { A: 20_300, B: 27_700, C: 38_000 }
export const TILLAGG: Record<Niva, number> = { A: 3_630, B: 4_620, C: 5_940 }
export const GRUND_PER_DAG: Record<Niva, number> = { A: 55, B: 70, C: 90 }

export type Resultatberakning =
  | { typ: 'belopp'; belopp: number; andel: number; grund: string }
  | { typ: 'inget'; grund: string }
  | { typ: 'okant'; grund: string }

export function resultatersattning(p: {
  niva: Niva | null | undefined
  placeringstyp: PlaceringTyp | null | undefined
  omfattningProcent: number | null | undefined
  utfall: UppfoljningUtfall | null | undefined
}, steg: Uppfoljning): Resultatberakning {
  if (!p.niva) return { typ: 'okant', grund: 'Nivå (A/B/C) saknas på placeringen' }
  if (p.utfall === 'slutat') return { typ: 'inget', grund: 'Inte i arbete eller studier vid uppföljningen' }
  if (p.utfall === 'ej_nadd') return { typ: 'okant', grund: 'Deltagaren gick inte att nå — resultatet är inte belagt' }

  const max = RESULTAT_MAX[p.niva]
  const studier = p.utfall === 'studier' || (p.placeringstyp === 'studies' && p.utfall !== 'kvar_annan')
  if (studier) return { typ: 'belopp', belopp: max * 0.5, andel: 0.5, grund: `Studier: 50 % av ${kr(max)} vid ${steg === '3m' ? '3' : '6'} månader` }

  const omf = p.omfattningProcent
  if (omf == null) return { typ: 'okant', grund: 'Omfattningen saknas — heltid ger 50 % per steg, minst 50 % ger 25 %' }
  if (omf >= 100) return { typ: 'belopp', belopp: max * 0.5, andel: 0.5, grund: `Heltid: 50 % av ${kr(max)} per steg` }
  if (omf >= 50) return { typ: 'belopp', belopp: max * 0.25, andel: 0.25, grund: `Deltid ${omf} %: 25 % av ${kr(max)} per steg (100 % om det är önskad omfattning — kontrollera)` }
  return { typ: 'okant', grund: `Deltid ${omf} %: ingen ersättning under 50 %, utom om det är deltagarens önskade omfattning` }
}

export function kr(n: number): string {
  return `${Math.round(n).toLocaleString('sv-SE')} kr`
}
