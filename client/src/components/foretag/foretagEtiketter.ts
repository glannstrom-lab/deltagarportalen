/**
 * Etiketter, klasser och små hjälpare för företagsvyn (AG6) — en källa så att
 * flikarna och dialogerna aldrig glider isär. Företagsvyn är på svenska utan
 * i18n (samma beslut som konsulentvyn, DESIGN.md §2).
 *
 * Insatstypernas etiketter återanvänds från konsulentvyn (placeringLabels.ts)
 * så företaget och konsulenten kallar samma sak samma sak.
 */

import type { Niva, Temperaturkrav } from '@/services/placeringarApi'
import type { FortsattIntresse, ForetagsSvar, Plats, PlatsStatus } from '@/services/foretagApi'
import { NIVA_LABEL, TEMPERATUR_LABEL } from '@/components/consultant/placeringLabels'

export { PLACERING_TYP_LABEL, PLACERING_STATUS_LABEL, NIVA_LABEL, TEMPERATUR_LABEL } from '@/components/consultant/placeringLabels'

export const PLATS_STATUS_LABEL: Record<PlatsStatus, string> = {
  oppen: 'Öppen',
  pausad: 'Pausad',
  tillsatt: 'Tillsatt',
  stangd: 'Stängd',
}

export const PLATS_STATUS_KLASS: Record<PlatsStatus, string> = {
  oppen: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  pausad: 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  tillsatt: 'bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  stangd: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200',
}

export const PLATS_STATUSAR: PlatsStatus[] = ['oppen', 'pausad', 'tillsatt', 'stangd']

export const SVAR_LABEL: Record<ForetagsSvar, string> = {
  pending: 'Väntar på ert svar',
  interested: 'Ni vill gå vidare',
  declined: 'Ni tackade nej',
}

export const SVAR_KLASS: Record<ForetagsSvar, string> = {
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  interested: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  declined: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200',
}

export const FORTSATT_INTRESSE_LABEL: Record<FortsattIntresse, string> = {
  ja: 'Ja, vi vill fortsätta',
  kanske: 'Kanske — vi behöver prata mer',
  nej: 'Nej, inte i nuläget',
}

export const HANDLEDNING_LABEL: Record<Niva, string> = {
  lag: 'Låg — personen behöver klara sig mycket själv',
  mellan: 'Mellan — någon finns i närheten och kan svara',
  hog: 'Hög — en handledare kan gå bredvid den första tiden',
}

export const NIVAER: Niva[] = ['lag', 'mellan', 'hog']
export const TEMPERATURER: Temperaturkrav[] = ['normal', 'kyla', 'varme']

/** Kort kravsammanfattning för en platsrad — bara det som är ifyllt, aldrig en påhittad rad. */
export function kravSammanfattning(p: Plats): string[] {
  const delar: string[] = []
  if (p.hours_per_week != null) delar.push(`${p.hours_per_week} h/vecka`)
  if (p.lifting_required) delar.push('lyft')
  if (p.standing_required) delar.push('stående')
  if (p.temperature_demands && p.temperature_demands !== 'normal') delar.push(TEMPERATUR_LABEL[p.temperature_demands].toLowerCase())
  if (p.noise_level === 'hog') delar.push('bullrigt')
  if (p.pace_level === 'hog') delar.push('högt tempo')
  if (p.shift_work) delar.push('skift')
  if (p.drivers_license_required) delar.push('körkort')
  if (p.workplace_supervision_capacity) delar.push(`handledning: ${NIVA_LABEL[p.workplace_supervision_capacity].toLowerCase()}`)
  if (p.language_requirements) delar.push(p.language_requirements)
  return delar
}

/** Samma fältutseende som konsulentvyns dialoger (PlacementDialog.tsx). */
export const FALT_KLASS =
  'w-full px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-2 border-transparent focus:border-[var(--c-solid)] text-stone-900 dark:text-stone-100'
export const ETIKETT_KLASS = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1'
export const CHIP_KLASS = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

/** React Query-nycklar — allt under prefixet ['foretag', …] så en flik kan invalidera en annan. */
export const foretagNycklar = {
  allt: ['foretag'] as const,
  profil: (orgId: string) => ['foretag', 'profil', orgId] as const,
  platser: (orgId: string) => ['foretag', 'platser', orgId] as const,
  forslag: (orgId: string) => ['foretag', 'forslag', orgId] as const,
  pagaende: (orgId: string) => ['foretag', 'pagaende', orgId] as const,
  avstamningar: (orgId: string) => ['foretag', 'avstamningar', orgId] as const,
  kollegor: (orgId: string) => ['foretag', 'kollegor', orgId] as const,
  trad: (proposalId: string) => ['foretag', 'trad', proposalId] as const,
}
