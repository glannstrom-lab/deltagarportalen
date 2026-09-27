/**
 * Vilka kundtypsspecifika delar konsulentvyn ska visa (2026-09-27).
 *
 * Portalen har EN konsulentvy för både kommuner och Rusta och matcha-
 * leverantörer. Två delar gäller bara den ena kundtypen:
 *   - AvtalskravKort (FFU §4.1.1) — Arbetsförmedlingens avtal med leverantörer
 *   - IvoUnderlagSektion — kommunens kvartalsunderlag till IVO
 *
 * Regeln: organisationer av slaget `arbetsgivare` räknas inte (det är
 * företagskontot, inte konsulentens arbetsgivare). Utan någon organisation
 * alls visas båda, som före ändringen — en fristående konsulent har inget
 * underlag för att välja bort något. `annan` visar båda av samma skäl.
 */

import type { OrgKind } from '@/services/orgApi'

export interface OrgTypVisning {
  visaAvtalskrav: boolean
  visaIvoUnderlag: boolean
}

export function orgTypVisning(kinds: readonly OrgKind[]): OrgTypVisning {
  const relevanta = new Set(kinds.filter((k) => k !== 'arbetsgivare'))
  if (relevanta.size === 0 || relevanta.has('annan')) {
    return { visaAvtalskrav: true, visaIvoUnderlag: true }
  }
  return {
    visaAvtalskrav: relevanta.has('leverantor'),
    visaIvoUnderlag: relevanta.has('kommun'),
  }
}
