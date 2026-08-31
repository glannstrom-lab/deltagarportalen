/**
 * Etiketter och färger för placeringar (spår AG1) — en källa så att
 * PlatserTab, PlaceringCard och PlaceringFormModal aldrig glider isär.
 * Konsulentvyn är medvetet oöversatt (DESIGN.md §2) — svenska strängar rakt av.
 */

import type { EmployerHiringInterest, Niva, PlaceringStatus, PlaceringTyp, Temperaturkrav } from '@/services/placeringarApi'

/**
 * Milstolpar för uppföljning (spår AG1) — INTE en löpande veckoserie.
 * Mikael (arbetskonsulent), uppdragssvar 2026-08-31: "Varje vecka är för
 * tätt. Vanligtvis vecka 1, 5, 12 och 24." Används av
 * `berakMilstolpeUppfoljningar()` i services/placeringarApi.ts för att
 * förbereda fyra PLANERADE uppföljningsrader från platsens startdatum.
 */
export const MILSTOLPE_VECKOR = [1, 5, 12, 24] as const

/**
 * Periodriktvärden per insatstyp (Mikael, arbetskonsulent, uppdragssvar
 * 2026-08-31). Används som FÖRSLAG på slutdatum och som en diskret
 * avvikelsenotering i PlaceringFormModal — blockerar aldrig. Mikael vet när
 * ett undantag är rätt.
 */
export interface PeriodRiktvarde {
  /** Riktvärdets övre gräns i månader. Saknas = ingen bortre gräns. */
  maxManader?: number
  beskrivning: string
}

export const PERIOD_RIKTVARDE: Record<PlaceringTyp, PeriodRiktvarde> = {
  praktik: { maxManader: 1, beskrivning: 'Praktik är normalt max en månad.' },
  arbetstraning: { maxManader: 12, beskrivning: 'Arbetsträning kan pågå upp till ett år.' },
  arbetsprovning: { maxManader: 6, beskrivning: 'Arbetsprövning brukar vara 3–6 månader.' },
  subventionerad_anstallning: { beskrivning: 'Subventionerad anställning har ingen bortre gräns.' },
}

export const EMPLOYER_HIRING_INTEREST_LABEL: Record<EmployerHiringInterest, string> = {
  positiv: 'Positiv',
  avvaktande: 'Avvaktande',
  ej_aktuellt: 'Ej aktuellt',
  okant: 'Okänt än',
}

export const PLACERING_TYP_LABEL: Record<PlaceringTyp, string> = {
  praktik: 'Praktik',
  arbetstraning: 'Arbetsträning',
  arbetsprovning: 'Arbetsprövning',
  subventionerad_anstallning: 'Subventionerad anställning',
}

export const PLACERING_TYP_BESKRIVNING: Record<PlaceringTyp, string> = {
  praktik: 'Deltagaren prövar yrket och meriterar sig — behåller sin ersättning.',
  arbetstraning: 'Lägre krav — rutiner, uthållighet och att bygga arbetsförmåga.',
  arbetsprovning: 'Syftet är att ta reda på vad personen klarar — underlag till en bedömning.',
  subventionerad_anstallning: 'Riktig anställning med stöd (nystartsjobb, introduktionsjobb, lönebidrag, OSA).',
}

export const PLACERING_STATUS_LABEL: Record<PlaceringStatus, string> = {
  planerad: 'Planerad',
  pagaende: 'Pågående',
  avslutad: 'Avslutad',
  avbruten: 'Avbruten',
}

export const PLACERING_STATUS_KLASS: Record<PlaceringStatus, string> = {
  planerad: 'bg-sky-50 text-sky-800',
  pagaende: 'bg-emerald-50 text-emerald-800',
  avslutad: 'bg-stone-100 text-stone-700',
  avbruten: 'bg-rose-50 text-rose-800',
}

export const NIVA_LABEL: Record<Niva, string> = {
  lag: 'Låg',
  mellan: 'Mellan',
  hog: 'Hög',
}

export const TEMPERATUR_LABEL: Record<Temperaturkrav, string> = {
  normal: 'Normal',
  kyla: 'Kyla',
  varme: 'Värme',
}

export const UPPFOLJNING_STATUS_LABEL: Record<'good' | 'concerns' | 'critical', string> = {
  good: 'Går bra',
  concerns: 'Vissa svårigheter',
  critical: 'Behöver omplaneras',
}

export const UPPFOLJNING_STATUS_KLASS: Record<'good' | 'concerns' | 'critical', string> = {
  good: 'bg-emerald-50 text-emerald-800',
  concerns: 'bg-amber-50 text-amber-800',
  critical: 'bg-rose-50 text-rose-800',
}

/** En planerad (ej genomförd) milstolpe har `status: null` — visas som "Planerad", aldrig som "Går bra". */
export const UPPFOLJNING_PLANERAD_LABEL = 'Planerad'
export const UPPFOLJNING_PLANERAD_KLASS = 'bg-sky-50 text-sky-800'
