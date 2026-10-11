/**
 * Statusarna i omtaget "Kvarter" (2026-10-11) — en sanning för färg, ikon och ord.
 *
 * Förslagets regel: färg betyder alltid samma sak, och står aldrig ensam.
 * Varje status har därför en färg (tokens.css, --s-<status>-*), en ikon
 * ur Kvarter-setet och ett ord (i18n-nyckeln nedan). StatusChip,
 * Veckoremsa och NarvaroVal läser härifrån, så de kan inte glida isär.
 *
 * Statusnamnen är portalens egna ord, inte databasens. Närvarovärdena i
 * activity_sessions (present, absent_valid, absent_invalid, sick_certified,
 * external) mappas av den som anropar — se `franNarvarovarde` nedan.
 */
import type { KvarterNamn } from './icons/kvarter/ritningar'

export const STATUSAR = ['narvarande', 'giltig', 'ogiltig', 'sjuk', 'vantar', 'planerat'] as const
export type Status = (typeof STATUSAR)[number]

/** Ikonen som bär statusen, ur förslagets färgtabell (avsnitt 3). */
export const STATUS_IKON: Record<Status, KvarterNamn> = {
  narvarande: 'bock',
  giltig: 'tid',
  ogiltig: 'avvikelse',
  sjuk: 'sjuk',
  vantar: 'uppfoljning',
  planerat: 'kalender',
}

/** i18n-nyckel för statusens ord. Svenskan står som standardvärde i STATUS_ORD_SV. */
export const STATUS_NYCKEL: Record<Status, string> = {
  narvarande: 'kvarter.status.narvarande',
  giltig: 'kvarter.status.giltig',
  ogiltig: 'kvarter.status.ogiltig',
  sjuk: 'kvarter.status.sjuk',
  vantar: 'kvarter.status.vantar',
  planerat: 'kvarter.status.planerat',
}

export const STATUS_ORD_SV: Record<Status, string> = {
  narvarande: 'Närvarande',
  giltig: 'Giltig frånvaro',
  ogiltig: 'Ogiltig frånvaro',
  sjuk: 'Sjuk',
  vantar: 'Väntar på dig',
  planerat: 'Planerat',
}

/** CSS-variablerna för en status — bara tokens, inga Tailwind-färgklasser. */
export function statusFarg(status: Status): { text: string; bg: string; ikon: string } {
  return {
    text: `var(--s-${status}-text)`,
    bg: `var(--s-${status}-bg)`,
    ikon: `var(--s-${status}-ikon)`,
  }
}

/**
 * Databasens närvarovärde → portalens status. `external` ("annan aktivitet")
 * har ingen egen färg i förslaget; den räknas som närvaro, precis som i
 * NARVARANDE_UTFALL (services/aktivitetSchema.ts) som timräkningen använder.
 * `null`/okänt → null: ett tomt fält är inte en status.
 */
export function franNarvarovarde(varde: string | null | undefined): Status | null {
  switch (varde) {
    case 'present':
    case 'external':
      return 'narvarande'
    case 'absent_valid':
      return 'giltig'
    case 'absent_invalid':
      return 'ogiltig'
    case 'sick_certified':
      return 'sjuk'
    default:
      return null
  }
}

/** Fokusring enligt förslaget: Gran, 3 px, utanför elementet. */
export const KVARTER_FOKUS =
  'focus:outline-none focus-visible:outline focus-visible:outline-[3px] ' +
  'focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]'

/** Ett närvaroval i NarvaroVal. Kundtypen styr etiketterna; statusen styr färg och ikon. */
export interface NarvaroAlternativ {
  /** Värdet som skickas till onChange — t.ex. databasens 'present'. */
  varde: string
  /** Ordet på knappen. */
  etikett: string
  status: Status
}

/**
 * Förslagets fyra närvaroval (avsnitt 4, "Närvaro för ett helt pass").
 * Konsulentvyn är inte översatt (DESIGN.md §2), därför svenska här.
 * En kundtyp med andra ord skickar egna alternativ till NarvaroVal.
 */
export const NARVARO_STANDARDVAL: readonly NarvaroAlternativ[] = [
  { varde: 'present', etikett: 'Här', status: 'narvarande' },
  { varde: 'absent_valid', etikett: 'Giltig', status: 'giltig' },
  { varde: 'absent_invalid', etikett: 'Ogiltig', status: 'ogiltig' },
  { varde: 'sick_certified', etikett: 'Sjuk', status: 'sjuk' },
]

/** "Leila Haddad" → "LH". Initialer i stället för bild när deltagaren inte har en egen. */
export function initialerAv(namn: string): string {
  const delar = namn.trim().split(/\s+/).filter(Boolean)
  if (delar.length === 0) return '?'
  const forsta = delar[0][0] ?? ''
  const sista = delar.length > 1 ? (delar[delar.length - 1][0] ?? '') : ''
  return (forsta + sista).toUpperCase()
}
