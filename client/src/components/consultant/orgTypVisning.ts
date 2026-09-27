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

// ---------------------------------------------------------------------------
// Kommunens juridik (RR2/RR9, rollspelet 2026-09-27)
// ---------------------------------------------------------------------------

/**
 * Vilket regelverk en text eller ett dokument ska tala om.
 *   - `kommun`     — aktivitetskravet enligt socialtjänstlagen 12 kap.,
 *                    socialnämnden, handläggare för ekonomiskt bistånd.
 *   - `leverantor` — Arbetsförmedlingens tjänst Rusta och matcha.
 *
 * Samma regel som `orgTypVisning`, uttryckt för texter: kommunens juridik
 * väljs bort BARA när alla relevanta organisationer är leverantörer. Utan
 * organisation, med `annan` eller med både kommun och leverantör blir det
 * `kommun` — som före ändringen.
 */
export type Regelverk = 'kommun' | 'leverantor'

export function regelverk(kinds: readonly OrgKind[]): Regelverk {
  return orgTypVisning(kinds).visaIvoUnderlag ? 'kommun' : 'leverantor'
}

/**
 * Regelverket för EN plan. Planens egen organisation avgör när konsulenten är
 * medlem i den (en konsulent kan tillhöra både en kommun och en leverantör);
 * annars gäller konsulentens alla organisationer, som i `regelverk`.
 */
export function regelverkForPlan(
  medlemskap: ReadonlyArray<{ org_id: string; organization?: { kind: OrgKind } | null }>,
  planOrgId: string | null | undefined,
): Regelverk {
  const planens = planOrgId ? medlemskap.find((m) => m.org_id === planOrgId)?.organization?.kind : undefined
  if (planens) return regelverk([planens])
  return regelverk(medlemskap.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k))
}

/**
 * Rollerna som går att ge en kollega i en organisation av slaget `kind`.
 * "Handläggare (ekonomiskt bistånd)" finns bara hos kommunen — en leverantör
 * inom Rusta och matcha har ingen sådan. En kollega som redan HAR rollen
 * behåller den i väljaren (`nuvarande`), annars skulle väljaren visa fel värde.
 */
export function rollerForOrg<R extends string>(
  kind: OrgKind,
  roller: readonly R[],
  nuvarande?: R,
): R[] {
  if (kind !== 'leverantor') return [...roller]
  return roller.filter((r) => r !== 'handlaggare' || r === nuvarande)
}

/** Platshållaren i e-postfältet — `@kommun.se` är fel hos en leverantör. */
export function epostPlatshallare(kind: OrgKind): string {
  return kind === 'leverantor' ? 'fornamn.efternamn@foretaget.se' : 'fornamn.efternamn@kommun.se'
}
