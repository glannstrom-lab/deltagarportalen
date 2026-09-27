/**
 * aktivitetEtiketter — svenska etiketter och färger för aktivitetstyper och
 * närvarostatus (KM3/KM4). Konsulentvyn översätts inte (DESIGN.md §2), så
 * strängarna bor här och inte i sv.json.
 *
 * Färgerna är tre intensiteter av en tone per status — ingen gradient, och
 * ogiltig frånvaro är den enda röda: den raden är beslutsunderlag för
 * biståndshandläggaren och ska sticka ut.
 */

import { isoVeckonummer, addDays, formatLocalDate, type ActivityType, type Attendance, type PassTyp } from '@/services/aktivitetSchema'

export const AKTIVITETSTYP_ETIKETT: Record<PassTyp, string> = {
  motivation: 'Motivation och förmåga',
  language: 'Språk',
  jobsearch: 'Jobbsökande',
  workplace: 'Arbetsplatsförlagd',
  jobsearch_own: 'Eget jobbsökande',
  // RK28 — visas först när UTOKADE_AKTIVITETSTYPER_PA är på (aktivitetSchema.ts).
  sfi: 'SFI',
  studier: 'Studier',
  vagledning: 'Studie- och yrkesvägledning',
  halsa: 'Hälsa',
}

export const AKTIVITETSTYP_HJALP: Record<PassTyp, string> = {
  motivation: 'Aktivitet som motiverar eller ökar förmågan att ta arbete eller påbörja utbildning (12 kap. 6 a § p. 1).',
  language: 'Aktivitet som förbättrar de språkliga förutsättningarna (p. 2).',
  jobsearch: 'Aktivitet som förbättrar förutsättningarna att söka arbete, t.ex. jobbsökarverkstad (p. 3).',
  workplace: 'Arbetsplatsförlagd aktivitet hos kommun, civilsamhälle, region eller företag (p. 4).',
  jobsearch_own: 'Eget jobbsökande får tid i planen men räknas inte som anvisad aktivitet.',
  sfi: 'Svenska för invandrare (p. 2). Hålls av skolan och räknas därför inte i avtalsloggen mot Arbetsförmedlingen.',
  studier: 'Studier som ökar förmågan att ta arbete (p. 1). Hålls av skolan och räknas därför inte i avtalsloggen mot Arbetsförmedlingen.',
  vagledning: 'Studie- och yrkesvägledning (p. 1).',
  halsa: 'Aktivitet som stärker hälsan och förmågan att ta arbete (p. 1).',
}

export const AKTIVITETSTYP_CHIP: Record<PassTyp, string> = {
  motivation: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  language: 'bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
  jobsearch: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
  workplace: 'bg-violet-50 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200',
  jobsearch_own: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  sfi: 'bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
  studier: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  vagledning: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  halsa: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
}

export const AKTIVITETSTYP_ORDNING: readonly ActivityType[] = ['jobsearch', 'motivation', 'language', 'workplace', 'jobsearch_own']

export const NARVARO_ETIKETT: Record<Attendance, string> = {
  present: 'Närvarande',
  absent_valid: 'Giltig frånvaro',
  absent_invalid: 'Ogiltig frånvaro',
  sick_certified: 'Sjuk',
  external: 'Extern aktivitet',
}

export const NARVARO_CHIP: Record<Attendance, string> = {
  present: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
  absent_valid: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  absent_invalid: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 font-semibold',
  sick_certified: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  external: 'bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
}

export const NARVARO_ORDNING: readonly Attendance[] = ['present', 'absent_valid', 'absent_invalid', 'sick_certified', 'external']

export const VECKODAG_KORT = ['', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'] as const
export const VECKODAG_LANG = ['', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'] as const

/** `2026-10-05` → `5 okt`. Inga tidszonsfällor: läser strängen direkt. */
export function kortDatum(s: string): string {
  const [, m, d] = s.split('-').map(Number)
  const man = ['', 'jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${d} ${man[m]}`
}

/** `2026-10-05` → `5 oktober 2026`. */
export function langtDatum(s: string): string {
  const [y, m, d] = s.split('-').map(Number)
  const man = ['', 'januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
  return `${d} ${man[m]} ${y}`
}

/** ISO-tidsstämpel → `08:52` i lokal tid. */
export function klockslag(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * RK27: veckans rubrik med ISO-veckonummer, som kommunen planerar i.
 * `Vecka 39 · 21–27 sep`, över månadsskifte `Vecka 40 · 28 sep – 4 okt`.
 */
export function veckoRubrik(mandag: string): string {
  const sondag = addDays(mandag, 6)
  const [, m1, d1] = mandag.split('-').map(Number)
  const [, m2] = sondag.split('-').map(Number)
  const spann = m1 === m2 ? `${d1}–${kortDatum(sondag)}` : `${kortDatum(mandag)} – ${kortDatum(sondag)}`
  return `Vecka ${isoVeckonummer(mandag)} · ${spann}`
}

/** RK26: "1 pass i veckan är inte markerade" — böjning efter antal. */
export function omarkeradeText(antal: number): string {
  return `${antal} pass i veckan är inte ${antal === 1 ? 'markerat' : 'markerade'} än.`
}

/**
 * RK30: "Lagen kräver intyg vid sjukfrånvaro" hade ingen källa och stämmer
 * inte generellt — om och från vilken dag intyg krävs är verksamhetens
 * riktlinje (kommunens eller avtalets), inte en lagregel.
 */
export const INTYG_HJALP = 'Om och från vilken dag intyg krävs följer er riktlinje. Kryssa i när intyget har kommit in — det sparas när du markerar Sjuk.'

/**
 * RK26/RR16: `toLocaleDateString('sv-SE', { month: 'short' })` ger "27 sep."
 * med punkt, och meningen fick en till: "CV uppdaterat 27 sep..". Samma
 * kortform som resten av Aktivitet-fliken ("27 sep"), i lokal tid.
 */
export function cvRad(harCv: boolean, cvUppdaterad: string | null): string {
  return harCv && cvUppdaterad ? `CV uppdaterat ${kortDatum(formatLocalDate(new Date(cvUppdaterad)))}.` : 'Inget CV skapat än.'
}

export function formatTimmar(h: number): string {
  return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1).replace('.', ',')} h`
}
